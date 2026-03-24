# VisaRoute Backend PRD

## 1. Document Purpose

This PRD defines the backend product requirements for VisaRoute based on the current frontend implementation in this repository. The current app is a Next.js 14 frontend prototype with static country content, a client-only application wizard, and placeholder appointment alerts. This document converts that frontend surface area into a phased backend product plan.

This PRD is intentionally structured so future implementation requests can target a phase directly, for example: "complete phase 1".

## 2. Current Product State

### 2.1 Implemented Today

- Landing page with searchable/filterable Schengen country catalog
- Country detail pages for all countries in `src/data/countries.ts`
- Visa document guidance by visa type and nationality category
- Country process summaries and rejection reason content
- 13-step application wizard under `/apply`
- Placeholder appointment alert subscription UI
- Placeholder appointment availability UI
- Placeholder save progress, document checks, visa pack generation, and completion flow

### 2.2 Not Implemented Today

- No persistent backend storage
- No API layer
- No application draft save/resume
- No file upload persistence
- No OCR or structured extraction
- No dynamic document requirement engine
- No real appointment availability ingestion
- No alert persistence or notifications
- No generated visa pack backend
- No payment backend
- No auth or RBAC
- No internal operations workflow tooling

## 3. Product Vision

VisaRoute should evolve from a static visa guidance frontend into a full application operations platform that:

- Helps users discover the correct Schengen destination and requirements
- Collects and persists visa application data across a multi-step flow
- Accepts, validates, and analyzes supporting documents
- Generates application-ready artifacts
- Tracks appointment availability and subscriptions
- Supports internal operations workflows
- Later adds auth and RBAC without redesigning core data models

## 4. Product Principles

- Keep the existing Next.js application as the delivery shell
- Implement backend routes within the current app architecture first
- Treat the current static files as seed/reference data, not the long-term source of truth
- Design all APIs auth-less for now, but make entities RBAC-ready
- Prefer explicit workflow states over hidden UI assumptions
- Separate raw inputs, uploaded files, extracted data, verified facts, and generated outputs
- Make phase boundaries real so each phase ships usable capability

## 5. Users and Actors

### 5.1 Phase 1-4 Actors

- Applicant: anonymous user completing an application or subscribing to alerts
- Operations agent: internal staff reviewing applications and appointment requests
- Admin/editor: internal user managing country data, rules, and configurations
- System worker: scheduled jobs for checks, alerts, pack generation, and appointment monitoring

### 5.2 Future Actor Model

Auth is deferred until the end. RBAC will be introduced later for:

- Applicant
- Reviewer
- Ops agent
- Content admin
- Super admin

The backend must therefore store stable entity ownership and audit metadata even before auth is added.

## 6. Product Scope

### 6.1 In Scope

- Country catalog and country detail APIs
- Dynamic visa rules and document requirement APIs
- Application draft lifecycle
- File upload and document metadata
- Automated checks pipeline framework
- Visa pack generation workflow
- Appointment availability and alert subscriptions
- Internal case workflow states
- Phase-based delivery plan

### 6.2 Out of Scope for Initial Delivery

- Full consulate scraping coverage across every country/center
- Real-time third-party payment integrations
- Native mobile applications
- Applicant self-service dashboards with login
- Advanced CRM, billing, and analytics beyond what phase plan defines

## 7. Core Product Domains

### 7.1 Country Knowledge

The frontend already depends on country-level commercial and operational data. The backend must own:

- Country metadata
- Pricing
- Processing timelines
- Appointment lead estimates
- Country visa content blocks
- Country-specific process content
- Country-specific rejection guidance

### 7.2 Application Lifecycle

The `/apply` wizard implies a single root aggregate: `Application`.

An application must support:

- Draft creation
- Incremental updates by step
- Completion tracking
- Document uploads
- Review summary generation
- Final submission
- Downstream case progression

### 7.3 Document Intelligence

The UI promises smart features not yet implemented:

- Passport extraction
- Residence permit extraction
- Checklist personalization
- Document sufficiency checks
- Visa pack generation

This requires a backend document pipeline even if phase 1 begins with manual/static logic.

### 7.4 Appointment Intelligence

The product also implies:

- Country-level appointment availability visibility
- Alert subscriptions
- Monitoring jobs
- Concierge booking workflow

## 8. User Journeys

### 8.1 Country Discovery Journey

1. User lands on `/`
2. User filters/searches countries
3. User opens `/country/[slug]`
4. User sees dynamic country overview, pricing, timelines, and requirements
5. User either subscribes for slot alerts or starts an application

### 8.2 Application Journey

1. User starts `/apply?country=<slug>`
2. Backend creates an application draft
3. User progresses step-by-step, saving data
4. User uploads documents
5. Backend runs checks
6. Backend generates review summary and visa pack
7. User chooses appointment mode
8. Application moves into operations workflow

### 8.3 Appointment Alert Journey

1. User selects country and optionally center/visa type
2. User submits contact details
3. Backend stores a subscription
4. Appointment monitoring jobs detect slot changes
5. Notification is issued

## 9. Functional Requirements

### 9.1 Country Catalog

- Provide paginated/filterable country listing
- Provide country detail by slug
- Support region filtering
- Support pricing and processing metadata
- Support editorial country-specific content
- Support country-specific appointment provider mappings

### 9.2 Visa Rules and Documents

- Support visa type lookup
- Support travel-purpose to visa-type mapping
- Support nationality category logic
- Support applying-from country logic
- Return dynamic document checklist for a selected journey context
- Support per-country overrides to global requirements

### 9.3 Application Drafts

- Create draft application
- Save step data incrementally
- Resume application by public draft token
- Track current step and completion percentage
- Track workflow status and operational status separately

### 9.4 File Uploads and Documents

- Accept uploads for passport, residence permit, bank statements, insurance, flights, accommodation, and employment proof
- Persist upload metadata and storage references
- Associate documents to application and document type
- Track upload, extraction, review, and validation statuses

### 9.5 Validation and Checks

- Validate required fields server-side
- Validate travel dates and document validity dates
- Validate required document presence
- Produce machine-readable check results
- Allow partial completion and resubmission

### 9.6 Review and Pack Generation

- Produce a normalized application summary
- Generate output artifacts:
  - application form payload
  - cover letter
  - itinerary
  - document checklist
- Store generation status and artifact references

### 9.7 Appointment Availability

- Expose current availability summary per country
- Expose provider/center level availability where configured
- Store check time, confidence, and next slot date
- Support a scheduled refresh pipeline

### 9.8 Alert Subscriptions

- Accept subscriptions without auth
- Deduplicate by contact + scope
- Support unsubscribe lifecycle later
- Support future email and WhatsApp channels

### 9.9 Internal Workflow

- Track downstream operational statuses:
  - initiated
  - under_review
  - appointment_pending
  - biometric_pending
  - decision_pending
  - completed
- Track internal notes and action history in later phases

## 10. Non-Functional Requirements

- Node.js runtime within existing Next.js app
- Type-safe service and validation layers
- API responses stable enough for frontend migration from static data
- Idempotent write operations where applicable
- Async job support for checks and monitoring
- Basic audit metadata on mutable entities
- Easy migration path to auth and RBAC

## 11. Phase Plan

## Phase 1: Backend Foundation and Frontend Data Replacement

### Goal

Replace static country/detail/rules assumptions with real backend resources and make the application flow persistable.

### User Value

- Country pages stop depending on hardcoded data
- Appointment alert forms become real
- Application flow can create and save drafts
- Phase 1 establishes the stable backend contract the rest of the system builds on

### Features

- Country catalog API
- Country detail API
- Visa type/reference API
- Dynamic document requirement API
- Appointment alert subscription API
- Application draft create/get/update APIs
- Step progress tracking
- Public draft token model without auth
- Seed migration from current `src/data/*.ts`

### Backend Capabilities

- Persistent database schema for countries, visa profiles, document rules, applications, and alert subscriptions
- Route handlers in `src/app/api`
- Service/repository layers
- Server-side validation for draft payloads

### Explicit Deliverables

- `GET /api/countries`
- `GET /api/countries/:slug`
- `GET /api/reference/visa-types`
- `GET /api/countries/:slug/document-requirements`
- `POST /api/countries/:slug/appointment-alerts`
- `POST /api/applications`
- `GET /api/applications/:draftToken`
- `PATCH /api/applications/:draftToken`

### Acceptance Criteria

- Homepage and country page can be migrated to API-backed data
- Appointment alert subscription persists successfully
- Application draft survives refresh/resume
- Static country/rules data can be seeded into DB
- All phase 1 APIs have schema validation and consistent error responses

## Phase 2: Documents, Uploads, and Validation

### Goal

Turn the wizard from a local form into a backend-backed document collection workflow.

### Features

- File upload endpoints
- Document metadata persistence
- Document type mapping
- Server-side required document validation
- Basic extraction placeholders for passport and residence
- Application completeness evaluation
- Check result model and APIs

### Explicit Deliverables

- `POST /api/applications/:draftToken/documents`
- `GET /api/applications/:draftToken/documents`
- `DELETE /api/applications/:draftToken/documents/:documentId`
- `POST /api/applications/:draftToken/checks/run`
- `GET /api/applications/:draftToken/checks`

### Acceptance Criteria

- Uploaded files are persisted and associated to the application
- Step 9 and Step 10 can be driven from backend responses
- Required document gaps are returned by API
- Check results are structured, not hardcoded UI values

## Phase 3: Review, Pack Generation, and Appointment Intelligence

### Goal

Make the later wizard steps real and connect them to generated outputs plus appointment availability.

### Features

- Review summary API
- Generated visa pack workflow
- Artifact storage references
- Appointment provider/center model
- Availability snapshot model
- Country availability summary API
- Monitor appointment mode setup

### Explicit Deliverables

- `GET /api/applications/:draftToken/review`
- `POST /api/applications/:draftToken/pack/generate`
- `GET /api/applications/:draftToken/pack`
- `GET /api/countries/:slug/appointments/summary`
- `GET /api/countries/:slug/appointments/availability`
- `POST /api/applications/:draftToken/appointment-preference`

### Acceptance Criteria

- Step 11, Step 12, and Step 13 can read real backend state
- Visa pack generation is represented as a real async workflow
- Country page appointment widgets read stored availability data

## Phase 4: Operations and Concierge Workflow

### Goal

Support internal staff operations after applicant completion.

### Features

- Case queue
- Internal application status transitions
- Internal notes and timeline
- Concierge booking request workflow
- Alert and task history
- Manual review overrides for checks

### Explicit Deliverables

- Internal case APIs
- Internal status transition APIs
- Internal notes APIs
- Ops views data contracts

### Acceptance Criteria

- Internal team can manage cases without relying on frontend-only assumptions
- Concierge and review workflows are represented in backend state

## Phase 5: Auth, RBAC, Payments, and Production Hardening

### Goal

Add access control and commercial completion without redesigning earlier domains.

### Features

- Authentication
- RBAC
- Audit logs
- Payment/order model
- Notification preferences and consent management
- Rate limiting and abuse prevention

### Acceptance Criteria

- Roles can be attached cleanly to pre-existing entities
- Staff-only endpoints are protected
- Paid services can be transacted and tracked

## 12. Completed vs Missing Task Inventory

### Completed in Frontend

- Country browse UI
- Country detail UI shell
- Visa document display UI
- 13-step application UI
- Upload interaction UI
- Review/check/pack/appointment screens as placeholders

### Missing and Required for Backend Completion

- Persistent domain model
- API routes
- Database
- file storage integration
- validation layer
- async jobs
- monitoring pipelines
- notification pipeline
- internal workflow support

## 13. Key Product Risks

- Current frontend uses hardcoded data and copy that may not match actual visa rules
- Travel purpose values in the wizard do not currently map cleanly to visa types in static rules
- Country pages imply real-time appointment data that may require provider-specific integrations
- The application flow claims OCR and document analysis that are not yet defined technically
- No auth means public draft tokens must be designed carefully to avoid accidental exposure

## 14. Open Questions for Product Clarification

- Should phase 1 support only the currently modeled countries and visa types, or prepare for non-Schengen expansion?
- Is the internal ops interface expected to live in this same Next.js app, or as a separate surface later?

## 15. Locked Decisions

- ORM: Prisma
- Local development database: SQLite for simplest local setup
- Production migration target: PostgreSQL-compatible deployment later, with an easy path to Supabase through Prisma
- Alert channels in phase 1: email only
- Unauthenticated application access model: high-entropy public draft token link

### Why the draft token approach is the best fit now

- It avoids adding email OTP or verification flow before auth exists
- It keeps the applicant experience fast and low-friction
- It matches the current frontend, which has no identity system yet
- It can later be upgraded to authenticated ownership without changing the application aggregate

### Required safeguards for draft tokens

- Use non-sequential high-entropy tokens
- Never expose internal numeric IDs to the client
- Rotate token format only with backward compatibility planning
- Add optional email verification later if product abuse appears before auth ships

## 16. Recommended Immediate Next Build Target

Implement Phase 1 first. It is the minimum backend slice that unlocks:

- replacing static country/detail data
- making slot alerts real
- persisting application drafts
- establishing the data contracts required by all later document, pack, and operations work
