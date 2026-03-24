# VisaRoute Backend TRD

## 1. Document Purpose

This TRD defines the recommended technical architecture for delivering the backend described in `docs/backend-prd.md` while staying aligned with the current repository architecture.

The current codebase is a single Next.js 14 application using the App Router. The recommended path is to keep backend delivery inside this application first, using route handlers plus layered domain modules, then split services later only if scale or provider integrations justify it.

## 2. Current Technical Baseline

### 2.1 Existing Stack

- Next.js 14
- React 18
- TypeScript
- App Router
- Static data files under `src/data`
- Client-only stateful application flow

### 2.2 Current Architectural Observations

- No route handlers currently exist
- No database integration exists
- No shared server domain layer exists
- Country pages are statically generated from local arrays
- Application state is centralized in a client component and lost on refresh
- Later-step intelligence is mocked in UI

## 3. Recommended Architecture

## 3.1 Top-Level Approach

Use a modular monolith inside the existing Next.js app.

### Why

- Matches current repository structure
- Minimizes deployment complexity
- Keeps frontend and backend iteration tightly coupled
- Allows incremental migration from static data to API-backed data
- Delays premature microservice splits

## 3.2 Runtime Choice

- Use Node.js runtime for all backend route handlers
- Do not target Edge runtime for application, upload, or job-trigger endpoints

## 3.3 Delivery Pattern

- `src/app/api/...` for route handlers
- `src/server/...` for domain code
- `src/lib/...` for shared utilities
- `src/db/...` for database client, schema, migrations, seeders

## 4. Proposed Project Structure

```text
src/
  app/
    api/
      countries/
      reference/
      applications/
      appointments/
      internal/
  server/
    countries/
      countries.service.ts
      countries.repository.ts
      countries.schemas.ts
    rules/
      rules.service.ts
      rules.repository.ts
      rules.schemas.ts
    applications/
      applications.service.ts
      applications.repository.ts
      applications.schemas.ts
    documents/
      documents.service.ts
      documents.repository.ts
      documents.schemas.ts
    appointments/
      appointments.service.ts
      appointments.repository.ts
      appointments.schemas.ts
    packs/
      packs.service.ts
    internal/
      cases.service.ts
    shared/
      errors.ts
      responses.ts
      pagination.ts
      ids.ts
      tokens.ts
  db/
    client.ts
    schema/
    migrations/
    seed/
```

## 5. Technology Recommendations

## 5.1 Database

Recommended default:

- Local development: SQLite
- ORM: Prisma
- Later production target: PostgreSQL-compatible infrastructure such as Supabase

### Why

- SQLite keeps local setup minimal and fast
- Prisma gives a clean migration path to PostgreSQL/Supabase later
- The current product stage does not justify heavier local infrastructure yet
- The data model is relational, so Prisma migrations keep the transition manageable

## 5.2 ORM / Database Layer

Recommended default: Prisma

Use Prisma as the standard ORM and migration tool for phase 1 onward.

The architecture should still isolate repositories so ORM choice does not leak through route handlers.

## 5.3 Validation

Recommended default: Zod

Use Zod for:

- request validation
- response typing where useful
- domain DTO schemas
- environment validation

## 5.4 File Storage

Recommended initial abstraction:

- storage adapter interface
- local/dev storage implementation
- cloud object storage implementation later

Expected future production target:

- S3-compatible object storage

## 5.5 Jobs and Scheduling

Initial recommendation:

- database-backed job records
- cron/scheduled functions for polling and retries
- async service layer methods for pack generation/check execution

Later options:

- queue system such as BullMQ or managed queue

## 5.6 Notifications

Abstract channel dispatch behind a notification service with phase-based implementations:

- Phase 1: email only
- Phase 3: actual delivery integration
- Later: WhatsApp support

## 6. Domain Model

## 6.1 Core Entities

### Country

- `id`
- `slug`
- `name`
- `code`
- `region`
- `isActive`
- `displayOrder`
- `heroImageUrl`
- `visaFeeEur`
- `serviceFeeEur`
- `processingDaysMin`
- `processingDaysMax`
- `appointmentLeadWeeks`
- `createdAt`
- `updatedAt`

### CountryVisaProfile

- `id`
- `countryId`
- `visaStayLimitDays`
- `entryTypeDefault`
- `approvalRatePercent`
- `overviewText`
- `importantNotes`
- `disclaimerText`
- `sourceMode`
- `updatedAt`

### VisaType

- `id`
- `code`
- `label`
- `category`
- `isActive`

### TravelPurposeMapping

- `id`
- `frontendPurposeCode`
- `visaTypeId`
- `notes`

### DocumentRequirement

- `id`
- `code`
- `name`
- `description`
- `required`
- `nationalityCategory`
- `residenceCountryCode`
- `countryId`
- `visaTypeId`
- `purposeCode`
- `employmentStatus`
- `sortOrder`
- `isActive`

### Application

- `id`
- `draftToken`
- `countryId`
- `status`
- `operationalStatus`
- `currentStep`
- `completionPercent`
- `submittedAt`
- `createdAt`
- `updatedAt`

### ApplicantProfile

- `id`
- `applicationId`
- `firstName`
- `lastName`
- `email`
- `phoneNumber`
- `countryOfResidence`
- `purposeOfTravel`
- `travelStartDate`
- `travelEndDate`

### TravelPlan

- `id`
- `applicationId`
- `accommodationType`
- `entryCity`
- `multiCountryMode`
- `tripLengthDays`

### CompanionGroup

- `id`
- `applicationId`
- `travellingWithCompanions`
- `companionsCount`

### EmploymentProfile

- `id`
- `applicationId`
- `employmentStatus`

### VisaHistoryEntry

- `id`
- `applicationId`
- `countryName`
- `yearLabel`

### RefusalHistoryEntry

- `id`
- `applicationId`
- `countryName`
- `yearLabel`
- `visaTypeLabel`
- `reason`

### ApplicationDocument

- `id`
- `applicationId`
- `documentType`
- `storageKey`
- `originalFileName`
- `mimeType`
- `fileSizeBytes`
- `uploadStatus`
- `extractionStatus`
- `reviewStatus`
- `createdAt`
- `updatedAt`

### DocumentExtraction

- `id`
- `documentId`
- `extractorVersion`
- `rawPayload`
- `normalizedPayload`
- `confidence`
- `createdAt`

### DocumentCheckResult

- `id`
- `applicationId`
- `documentType`
- `status`
- `detail`
- `subDetail`
- `score`
- `createdAt`

### GeneratedPack

- `id`
- `applicationId`
- `status`
- `applicationFormStorageKey`
- `coverLetterStorageKey`
- `itineraryStorageKey`
- `checklistStorageKey`
- `generatedAt`

### AppointmentProvider

- `id`
- `code`
- `name`
- `websiteUrl`
- `isActive`

### AppointmentCenter

- `id`
- `countryId`
- `providerId`
- `name`
- `city`
- `jurisdictionCountryCode`
- `isActive`

### AppointmentAvailabilitySnapshot

- `id`
- `countryId`
- `centerId`
- `visaTypeId`
- `status`
- `nextAvailableDate`
- `checkedAt`
- `confidence`
- `rawPayload`

### AppointmentAlertSubscription

- `id`
- `countryId`
- `centerId`
- `visaTypeId`
- `email`
- `channel`
- `status`
- `createdAt`
- `updatedAt`

## 6.2 Status Enums

### ApplicationStatus

- `draft`
- `in_progress`
- `documents_pending`
- `checks_pending`
- `checks_reviewed`
- `pack_pending`
- `pack_generated`
- `appointment_pending`
- `completed`
- `submitted`

### OperationalStatus

- `not_started`
- `initiated`
- `under_review`
- `appointment_pending`
- `biometric_pending`
- `decision_pending`
- `closed`

### DocumentUploadStatus

- `uploaded`
- `processing`
- `failed`
- `deleted`

### ExtractionStatus

- `not_started`
- `processing`
- `completed`
- `failed`

### ReviewStatus

- `unreviewed`
- `ok`
- `warn`
- `rejected`

## 7. API Design

## 7.1 General API Conventions

- JSON request/response bodies
- Structured error responses with stable codes
- Resource-oriented URLs
- No auth middleware in early phases
- Public draft token used as application access key before auth exists

### Error Shape

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request payload",
    "details": []
  }
}
```

## 7.2 Phase 1 APIs

### Countries

- `GET /api/countries`
  - query: `region`, `search`, `popularOnly`, `appointmentLead`
- `GET /api/countries/[slug]`

### Reference

- `GET /api/reference/visa-types`

### Rules

- `GET /api/countries/[slug]/document-requirements`
  - query: `visaType`, `nationalityCategory`, `countryOfResidence`, `purposeOfTravel`

### Appointment Alerts

- `POST /api/countries/[slug]/appointment-alerts`

Request:

```json
{
  "email": "user@example.com",
  "visaType": "short-stay-tourism",
  "centerId": null,
  "channel": "email"
}
```

### Applications

- `POST /api/applications`
- `GET /api/applications/[draftToken]`
- `PATCH /api/applications/[draftToken]`

Create request:

```json
{
  "countrySlug": "france"
}
```

Patch request shape:

```json
{
  "currentStep": 4,
  "applicantProfile": {},
  "travelPlan": {},
  "companions": {},
  "employmentProfile": {},
  "visaHistory": [],
  "refusalHistory": []
}
```

## 7.3 Phase 2 APIs

- `POST /api/applications/[draftToken]/documents`
- `GET /api/applications/[draftToken]/documents`
- `DELETE /api/applications/[draftToken]/documents/[documentId]`
- `POST /api/applications/[draftToken]/checks/run`
- `GET /api/applications/[draftToken]/checks`

## 7.4 Phase 3 APIs

- `GET /api/applications/[draftToken]/review`
- `POST /api/applications/[draftToken]/pack/generate`
- `GET /api/applications/[draftToken]/pack`
- `GET /api/countries/[slug]/appointments/summary`
- `GET /api/countries/[slug]/appointments/availability`
- `POST /api/applications/[draftToken]/appointment-preference`

## 7.5 Later Internal APIs

- `GET /api/internal/cases`
- `GET /api/internal/cases/[id]`
- `POST /api/internal/cases/[id]/status-transitions`
- `POST /api/internal/cases/[id]/notes`

## 8. Data Flow Design

## 8.1 Country Page Data Flow

1. Frontend requests country detail by slug
2. Backend resolves country, visa profile, summary content, pricing, and appointment metadata
3. Frontend requests document requirements for selected context
4. Frontend posts appointment alert subscription when user submits email

## 8.2 Application Draft Data Flow

1. Frontend creates application when user enters `/apply`
2. Backend returns `draftToken`
3. Frontend saves step payloads incrementally
4. Backend recalculates `completionPercent` and `currentStep`
5. Frontend resumes by `draftToken`

## 8.3 Document Pipeline Data Flow

1. Frontend uploads document
2. Backend stores file and metadata
3. Extraction job runs
4. Normalized data stored separately from raw payload
5. Check engine evaluates document sufficiency
6. Review summary and pack generation read normalized facts

## 8.4 Appointment Monitoring Data Flow

1. Scheduled job fetches availability from provider integrations or seeded/manual data
2. Backend stores availability snapshots
3. Summary endpoints read latest snapshot
4. Alert matcher compares new availability against active subscriptions
5. Notification service dispatches messages

## 9. Persistence and Migration Strategy

## 9.1 Initial Seed Sources

Seed the database from:

- `src/data/countries.ts`
- `src/data/documents.ts`
- `src/data/processSteps.ts`
- `src/data/rejectionReasons.ts`

## 9.2 Migration Principle

The frontend should progressively stop importing `src/data/*` directly and instead consume APIs. Those files may remain temporarily as seed/reference sources until replaced by admin-managed data.

## 10. Security and Access Strategy

## 10.1 Before Auth

- Use high-entropy public draft tokens for application access
- Avoid exposing sequential application IDs publicly
- Validate file type and size server-side
- Add basic rate limiting later in phase 5, earlier if abuse appears
- Record IP/user-agent metadata only if product/legal requirements support it

## 10.2 Auth Readiness

Every mutable entity should support future fields:

- `createdByUserId`
- `updatedByUserId`
- `assignedToUserId`

These can remain nullable until auth is introduced.

## 11. Observability

Recommended baseline:

- request logging
- structured service error logging
- job execution logs
- audit/event records for state transitions

Minimum events to capture:

- application created
- application updated
- document uploaded
- checks executed
- pack generated
- alert subscription created
- appointment snapshot refreshed

## 12. Phase-by-Phase Technical Deliverables

## Phase 1

- DB bootstrap
- schema and migrations for countries, visa profiles, visa types, document requirements, applications, alert subscriptions
- seed scripts from static data
- route handlers for countries, rules, alerts, applications
- shared validation and error utilities

## Phase 2

- storage adapter
- document tables and upload routes
- extraction placeholders
- check engine service

## Phase 3

- pack generation service
- appointment providers, centers, snapshot schema
- monitoring jobs and summary endpoints

## Phase 4

- internal cases API
- note and transition model
- manual overrides

## Phase 5

- auth integration
- RBAC middleware
- payment/order services
- rate limiting and hardening

## 13. Recommended Implementation Order Inside Phase 1

1. Set up DB, schema, and seed path
2. Implement `countries` and `country detail` APIs
3. Implement `visa types` and `document requirements` APIs
4. Implement `application draft` create/get/update APIs
5. Implement `appointment alert subscription` API
6. Migrate frontend screens from static imports to API consumption

## 14. Known Technical Gaps Requiring Product Confirmation

- Final storage provider is still open
- Notification provider is still open
- Whether appointment availability will begin as manually maintained data or integrated/scraped data is still open

## 15. Locked Technical Decisions

- Local database for development: SQLite
- ORM and migrations: Prisma
- Future migration path: PostgreSQL/Supabase
- Phase 1 alert channel: email only
- Pre-auth application recovery: public draft token URL

### Draft token implementation notes

- Generate a random opaque token separate from the application primary key
- Store a unique index on `draftToken`
- Use the token in public APIs instead of internal IDs
- Keep room for future token expiry or email-claim flow if needed

## 16. Recommendation

Build phase 1 inside the current Next.js codebase, not as a separate Node service. The current application is still early enough that a modular monolith is the lowest-risk path. If appointment integrations, notifications, and heavy document processing outgrow the app later, those workloads can be extracted behind the same domain boundaries defined here.
