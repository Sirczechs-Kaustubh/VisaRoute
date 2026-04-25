# VisaRoute.

## Project Status - fix 

VisaRoute started as a frontend-only Next.js 14 prototype for Schengen visa discovery and application guidance.

It now has a Phase 1 backend foundation implemented inside the same Next.js app:

- Prisma ORM
- local SQLite database for development
- seeded backend data for countries, visa types, requirements, process steps, and rejection reasons
- API routes for countries, rules, alerts, and application drafts
- frontend connected to backend for country discovery, country detail data, alert subscriptions, and application draft persistence

Auth is intentionally not implemented yet. RBAC is deferred to a later phase.

## Architecture

The project currently uses a modular monolith approach inside the existing Next.js codebase.

### Stack

- Next.js 14 App Router
- React 18
- TypeScript
- Prisma 6.6
- SQLite for local development

### Backend Structure

- API routes: [src/app/api](C:\Users\HP\Desktop\VisaRoute\src\app\api)
- domain/services: [src/server](C:\Users\HP\Desktop\VisaRoute\src\server)
- Prisma client: [src/db/client.ts](C:\Users\HP\Desktop\VisaRoute\src\db\client.ts)
- schema and seed: [prisma](C:\Users\HP\Desktop\VisaRoute\prisma)
- local DB bootstrap workaround: [scripts/bootstrap-sqlite.mjs](C:\Users\HP\Desktop\VisaRoute\scripts\bootstrap-sqlite.mjs)

### Planning Docs

- PRD: [docs/backend-prd.md](C:\Users\HP\Desktop\VisaRoute\docs\backend-prd.md)
- TRD: [docs/backend-trd.md](C:\Users\HP\Desktop\VisaRoute\docs\backend-trd.md)

## Decisions Already Made

- ORM: Prisma
- local development DB: SQLite
- future migration path: PostgreSQL/Supabase later
- alerts in phase 1: email only
- no auth yet
- draft recovery before auth: public high-entropy draft token in URL
- backend remains inside the current Next.js app for now

## What Is Already Completed

## 1. Backend Foundation

Implemented:

- Prisma schema for:
  - countries
  - country visa profiles
  - visa types
  - document requirements
  - process steps
  - rejection reasons
  - applications
  - applicant profile
  - travel plan
  - companion group
  - employment profile
  - visa history
  - refusal history
  - appointment alert subscriptions
  - appointment availability snapshots
- Prisma client integration
- seed script for local development

Files:

- [schema.prisma](C:\Users\HP\Desktop\VisaRoute\prisma\schema.prisma)
- [seed.js](C:\Users\HP\Desktop\VisaRoute\prisma\seed.js)
- [client.ts](C:\Users\HP\Desktop\VisaRoute\src\db\client.ts)

## 2. Local Database Bootstrapping

Implemented:

- repeatable local DB init script
- SQL bootstrap generated from Prisma schema and executed against SQLite
- automatic seed execution

Reason:

- `prisma db push` fails in this Windows environment with a schema engine error even though the schema is valid
- workaround is implemented and working

Files:

- [bootstrap-sqlite.mjs](C:\Users\HP\Desktop\VisaRoute\scripts\bootstrap-sqlite.mjs)
- [package.json](C:\Users\HP\Desktop\VisaRoute\package.json)

Commands:

```bash
npm run db:generate
npm run db:init
```

## 3. Phase 1 API Routes

Implemented:

- `GET /api/countries`
- `GET /api/countries/[slug]`
- `GET /api/reference/visa-types`
- `GET /api/countries/[slug]/document-requirements`
- `POST /api/countries/[slug]/appointment-alerts`
- `POST /api/applications`
- `GET /api/applications/[draftToken]`
- `PATCH /api/applications/[draftToken]`

Files:

- [src/app/api/countries/route.ts](C:\Users\HP\Desktop\VisaRoute\src\app\api\countries\route.ts)
- [src/app/api/countries/[slug]/route.ts](C:\Users\HP\Desktop\VisaRoute\src\app\api\countries\[slug]\route.ts)
- [src/app/api/countries/[slug]/document-requirements/route.ts](C:\Users\HP\Desktop\VisaRoute\src\app\api\countries\[slug]\document-requirements\route.ts)
- [src/app/api/countries/[slug]/appointment-alerts/route.ts](C:\Users\HP\Desktop\VisaRoute\src\app\api\countries\[slug]\appointment-alerts\route.ts)
- [src/app/api/reference/visa-types/route.ts](C:\Users\HP\Desktop\VisaRoute\src\app\api\reference\visa-types\route.ts)
- [src/app/api/applications/route.ts](C:\Users\HP\Desktop\VisaRoute\src\app\api\applications\route.ts)
- [src/app/api/applications/[draftToken]/route.ts](C:\Users\HP\Desktop\VisaRoute\src\app\api\applications\[draftToken]\route.ts)

## 4. Service / Repository Layer

Implemented:

- countries service/repository
- rules service/repository
- appointments service/repository
- applications service/repository
- shared API error and response helpers
- draft token generator

Files:

- [src/server/countries](C:\Users\HP\Desktop\VisaRoute\src\server\countries)
- [src/server/rules](C:\Users\HP\Desktop\VisaRoute\src\server\rules)
- [src/server/appointments](C:\Users\HP\Desktop\VisaRoute\src\server\appointments)
- [src/server/applications](C:\Users\HP\Desktop\VisaRoute\src\server\applications)
- [src/server/shared](C:\Users\HP\Desktop\VisaRoute\src\server\shared)

## 5. Frontend-Backend Integration

Implemented:

### Home page

- homepage now loads country data from backend service instead of static country arrays
- destination search uses backend-backed country objects

Files:

- [page.tsx](C:\Users\HP\Desktop\VisaRoute\src\app\page.tsx)
- [DestinationSearch.tsx](C:\Users\HP\Desktop\VisaRoute\src\components\DestinationSearch.tsx)

### Country detail page

- country detail page now loads backend country data
- visa type options come from backend
- document requirements are loaded from backend
- process steps and rejection reasons come from backend
- appointment alert subscription form writes to backend

Files:

- [page.tsx](C:\Users\HP\Desktop\VisaRoute\src\app\country\[slug]\page.tsx)
- [CountryPageClient.tsx](C:\Users\HP\Desktop\VisaRoute\src\app\country\[slug]\CountryPageClient.tsx)

### Apply flow

- apply page supports:
  - `?country=<slug>`
  - `?country=<slug>&draft=<token>`
- first visit creates an application draft through backend
- draft token is pushed into URL
- refresh/resume works using draft token
- manual save writes to backend
- next/back also persist draft state
- applicant profile, travel plan, companions, employment, visa history, and refusal history hydrate from backend

Files:

- [page.tsx](C:\Users\HP\Desktop\VisaRoute\src\app\apply\page.tsx)
- [ApplyFlow.tsx](C:\Users\HP\Desktop\VisaRoute\src\app\apply\ApplyFlow.tsx)

## Important Fixes Already Made

- fixed country detail process/rejection loading bug
- fixed document requirement filtering so `ALL` requirements are included correctly
- fixed invalid query validation for `region` and `visaType`
- fixed partial draft update semantics so omitted fields are not nulled out
- fixed array merge behavior for visa history and refusal history so step saves do not drop existing rows
- marked API routes as dynamic where needed

## Current Verified State

Verified successfully:

- `npm run lint`
- `npm run build`
- `npm run db:init`

Seed sanity check completed:

- 29 countries
- 4 visa types
- 27 document requirements
- 5 process steps

## What Is Not Done Yet

These are still pending and should be treated as the next meaningful implementation work.

## Phase 2: Documents and Uploads

Not implemented yet:

- backend file upload endpoints
- persistent document storage
- document metadata persistence beyond schema placeholders
- passport upload persistence
- residence permit upload persistence
- supporting document upload persistence
- server-side file validation
- document extraction pipeline

Frontend impact:

- steps 2, 3, and 9 still keep files in client memory only

## Phase 2: Checks

Not implemented yet:

- real backend-driven checks for uploaded documents
- check execution API
- check result persistence

Frontend impact:

- step 10 is still placeholder UI

## Phase 3: Review and Pack Generation

Not implemented yet:

- review API
- pack generation API
- generated artifacts
- stored application outputs

Frontend impact:

- step 11 and step 12 are still presentation-only

## Phase 3: Appointment Availability

Not implemented yet:

- real appointment availability ingestion
- provider/center-level availability
- appointment summary API
- appointment monitor jobs

Frontend impact:

- country page shows seeded assumptions only
- step 13 still uses placeholder appointment details

## Phase 4: Internal Ops Workflow

Not implemented yet:

- internal case views
- reviewer workflows
- notes
- manual overrides
- concierge handling

## Phase 5: Auth / RBAC / Payments

Not implemented yet:

- authentication
- RBAC
- payments
- audit logs
- abuse/rate-limiting layer

## Recommended Next Step

The next best implementation target is:

## Complete Phase 2 document persistence

That means:

1. Add upload endpoints for passport, residence permit, and supporting documents
2. Store files locally first behind a storage adapter
3. Add `ApplicationDocument` and upload metadata persistence
4. Wire steps 2, 3, and 9 to backend uploads
5. Return persisted document state when draft is reloaded
6. Add basic server-side validations for file size, MIME type, and required presence

After that, the next logical slice is:

- checks API for step 10
- review API for step 11
- pack generation workflow for step 12

## Handover Prompt

Use this prompt to continue work in a new session:

```text
Continue VisaRoute from the current Phase 1 backend state.

Context:
- The app is a Next.js 14 modular monolith with Prisma + local SQLite.
- Backend foundation is already implemented for countries, visa types, document requirements, appointment alert subscriptions, and application drafts.
- Frontend is already hooked to backend for:
  - homepage country data
  - country detail data
  - document requirement loading
  - appointment alert subscription
  - application draft creation, hydration, save, and resume
- Auth is intentionally not implemented yet.
- Draft access is based on public high-entropy draft tokens in the URL.
- Local DB setup uses `npm run db:init` because Prisma `db push` is unreliable in this Windows environment.

Important files:
- README.md
- docs/backend-prd.md
- docs/backend-trd.md
- prisma/schema.prisma
- prisma/seed.js
- scripts/bootstrap-sqlite.mjs
- src/app/api/*
- src/server/*
- src/app/apply/ApplyFlow.tsx
- src/app/country/[slug]/CountryPageClient.tsx

What is done:
- Phase 1 backend is implemented and build-clean
- `npm run lint` passes
- `npm run build` passes
- frontend is partially migrated to backend

What is next:
- Complete Phase 2
- Add document upload/storage/persistence
- Wire steps 2, 3, and 9 to backend uploads
- Persist uploaded document metadata to the draft
- Add basic file validation and document retrieval

Constraints:
- Keep the same architecture
- Keep code quality high
- Keep route handlers thin
- Put business logic in services/repositories
- Do not add auth yet
- Do not break existing Phase 1 flows
```

## Local Setup

```bash
npm install
npm run db:generate
npm run db:init
npm run dev
```

## Verification

```bash
npm run lint
npm run build
```
