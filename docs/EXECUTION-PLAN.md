# VisaRoute Backend Execution Plan

## Status Summary

**Phase 1 (DONE):** Countries API, visa types, document requirements, application drafts, alert subscriptions, DB schema, seed data, frontend partially migrated.

**Phase 2 (DONE):** "Applying from" country selection, file upload infrastructure (storage adapter, document API, Steps 2/3/9 wired), passport front/back support for images, server-side file validation.

**Phase 3 (DONE):** MRZ passport extraction, residence document text extraction, sharecode verification API, extraction data returned on upload, Step 2 shows extracted data with "Apply to application" button, Step 3 has sharecode verifier for UK applicants.

**Phase 4 (DONE):** Check engine with 8 modular rules (personal info, travel dates, trip duration, passport presence, passport expiry, required documents, travel plan, employment), check results API (run + get), Step 10 wired to real checks with run/re-run, summary dashboard.

**Phase 5 (DONE):** Application review summary API + Step 11, cover letter + checklist pack generation + Step 12, service tier selection + orders + payment + Step 13, application submission with reference number.

**Phase 6 (DONE):** CountryGroup model (5 groups: Schengen/UK/US/Canada/Australia), 33 countries seeded, configurable check rules per group via CheckRule DB model, country-group-aware cover letter/addressee/subject, admin API for groups and rules.

**AI & Word Docs (DONE):** OpenRouter integration (google/gemini-2.0-flash-001) for AI-personalised cover letters with template fallback, AI-powered advisory checks (non-blocking), editable Word document (.docx) generation for cover letter + checklist + application summary using `docx` npm package, download buttons in Step 10.

**Phase 7 partial (DONE) — Email Notifications:** Resend integration for transactional emails with console fallback when API key missing. 3 notification triggers: submission confirmed (reference number), payment confirmed (receipt), pack ready (download links). EmailLog model for audit trail. Non-blocking — email failures never block the main flow.

**UX Consolidation (DONE):** Reduced from 13 steps to 11 by merging Travel+Companions→"Trip Details" (step 4) and VisaHistory+Refusals→"Travel History" (step 6). Enhanced StepFooter with dot progress indicator. Mobile-responsive step indicator bar. Improved sidebar with dynamic success probability, purpose labels, and polished UI. Tab-based sub-sections in merged steps.

**What's done:** 23 API routes, 12 service modules (+ EmailService), Prisma schema with 24 models (+ EmailLog), 11-step consolidated user flow with email notifications.

**What's remaining:** Admin operations panel (case queue + status management), auth/RBAC, real Stripe payments, appointment monitoring (Phase 8).

---

## Current Architecture

### Tech Stack
- **Framework:** Next.js 14 App Router (modular monolith)
- **ORM:** Prisma with SQLite (dev) / PostgreSQL (prod target)
- **Validation:** Zod on all API inputs
- **AI:** OpenRouter API (OpenAI-compatible) → google/gemini-2.0-flash-001
- **Documents:** `docx` npm package for Word file generation
- **Storage:** Local filesystem adapter (uploads/), S3-compatible interface for prod
- **Architecture:** Route handlers → Service → Repository (three-tier)

### Key Environment Variables
```
DATABASE_URL="file:./dev.db"
OPENROUTER_API_KEY=""   # Optional — enables AI features, falls back to templates if missing
```

### API Routes (23 total)

**Applications:**
- `POST /api/applications` — create new draft
- `GET/PATCH /api/applications/[draftToken]` — get/update draft
- `GET/POST /api/applications/[draftToken]/documents` — list/upload documents
- `GET/DELETE /api/applications/[draftToken]/documents/[docId]` — get/remove document
- `POST /api/applications/[draftToken]/documents/[docId]/extract` — re-trigger extraction
- `GET /api/applications/[draftToken]/extractions` — all extractions
- `POST /api/applications/[draftToken]/sharecode` — UK sharecode verification
- `GET/POST /api/applications/[draftToken]/checks` — get/run checks
- `GET /api/applications/[draftToken]/review` — review summary
- `GET/POST /api/applications/[draftToken]/pack` — get/generate pack (Word docs)
- `GET/POST /api/applications/[draftToken]/orders` — list/create orders + confirm payment
- `POST /api/applications/[draftToken]/submit` — finalize application

**Reference:**
- `GET /api/countries` — list countries (filterable)
- `GET /api/countries/[slug]` — country detail
- `GET /api/countries/[slug]/appointment-alerts` — alert subscriptions
- `GET /api/countries/[slug]/document-requirements` — doc requirements
- `GET /api/reference/service-tiers` — list service tiers
- `GET /api/reference/visa-types` — list visa types

**Admin (internal):**
- `GET /api/internal/country-groups` — list country groups
- `GET/PATCH /api/internal/country-groups/[code]` — view/update group
- `GET/POST /api/internal/rules` — list/upsert check rules
- `GET/DELETE /api/internal/rules/[id]` — view/delete rule

### Service Modules (11)

| Module | Path | Purpose |
|--------|------|---------|
| CountriesService | `src/server/countries/` | Country listing, detail, filters |
| RulesService | `src/server/rules/` | Document requirements, visa types |
| ApplicationsService | `src/server/applications/applications.service.ts` | Draft CRUD, hydration |
| DocumentsService | `src/server/documents/documents.service.ts` | Upload, list, delete, extraction trigger |
| Storage | `src/server/documents/storage.ts` | File storage adapter (local/S3) |
| Extraction | `src/server/documents/extraction.ts` | MRZ parsing, residence text extraction |
| Sharecode | `src/server/documents/sharecode.ts` | UK Home Office sharecode verification |
| ChecksService | `src/server/checks/checks.service.ts` | Deterministic + AI checks, rule loading |
| PackService | `src/server/packs/pack.service.ts` | AI/template cover letter, Word doc generation |
| ReviewService | `src/server/packs/review.service.ts` | Application review summary |
| OrdersService | `src/server/orders/orders.service.ts` | Service tiers, orders, payment |
| SubmitService | `src/server/applications/submit.service.ts` | Application submission |
| AdminService | `src/server/admin/admin.service.ts` | Country groups, check rules CRUD |
| OpenRouter | `src/server/ai/openrouter.ts` | AI client (chat completions) |
| DocxBuilder | `src/server/ai/docx-builder.ts` | Word document construction |
| Prompts | `src/server/ai/prompts.ts` | AI prompt templates |
| EmailService | `src/server/notifications/email.service.ts` | Resend email notifications |
| EmailTemplates | `src/server/notifications/email.templates.ts` | HTML/text email templates |

### Prisma Models (24)

CountryGroup, Country, CountryVisaProfile, VisaType, DocumentRequirement, VisaProcessStep, RejectionReason, Application, ApplicantProfile, TravelPlan, CompanionGroup, EmploymentProfile, VisaHistoryEntry, RefusalHistoryEntry, AppointmentAlertSubscription, AppointmentAvailabilitySnapshot, ApplicationDocument, DocumentExtraction, CheckResult, CheckRule, GeneratedPack, ServiceTier, Order, EmailLog

### Frontend Steps (11 steps, all wired to backend)

| Step | Component | Backend Integration |
|------|-----------|-------------------|
| 1 | Step1Intro | Personal info, applying-from country |
| 2 | Step2Passport | Document upload API, MRZ extraction preview |
| 3 | Step3Residence | Document upload, sharecode verification |
| 4 | Step4TripDetails | Travel plan + companions (merged), draft persistence |
| 5 | Step6Employment | Employment status, draft persistence |
| 6 | Step6TravelHistory | Visa history + refusals (merged), draft persistence |
| 7 | Step9Documents | Document upload API, smart checklist |
| 8 | Step10Checks | Checks API (deterministic + AI) |
| 9 | Step11Review | Review API |
| 10 | Step12Pack | Pack API — Word doc download links |
| 11 | Step13Appointment | Service tiers, orders, payment, submit |

### AI Integration Details

**OpenRouter client** (`src/server/ai/openrouter.ts`):
- Uses `google/gemini-2.0-flash-001` (~$0.10/1M input, ~$0.40/1M output)
- `isAIEnabled()` checks for `OPENROUTER_API_KEY` env var
- `generateText(systemPrompt, userPrompt, options)` — convenience wrapper
- All AI features gracefully fall back when API key is missing

**AI-powered cover letter** (in PackService):
- System prompt instructs the AI to write a 300-400 word first-person cover letter
- User prompt includes all applicant data, travel details, visa history, refusals
- Temperature 0.3 for consistency
- Falls back to template-based generation on AI failure or missing key

**AI-powered advisory checks** (in ChecksService):
- System prompt asks for JSON array of observations (max 5)
- Analyses: purpose consistency, financial adequacy, date alignment, employment ties, refusal risk
- Results are prefixed with `ai_` check codes and treated as advisory (warnings/info, never blocking)
- Non-blocking: AI check failure doesn't affect deterministic check results

**Word document generation** (`src/server/ai/docx-builder.ts`):
- `buildCoverLetterDoc()` — professional letter layout with date, addressee, subject, body, signature
- `buildChecklistDoc()` — table with status markers (✓/✗/~), document names, file names
- `buildSummaryDoc()` — full application summary with sections (personal, travel, companions, employment, history)
- All documents use Calibri font, 1-inch margins, proper heading hierarchy
- `docToBuffer()` wraps `Packer.toBuffer()` for storage

### Check Rules Configuration

Rules are stored in `CheckRule` table, keyed by `(ruleCode, countryGroupCode)`:

| Rule Code | Schengen | UK | US | Canada | Australia |
|-----------|----------|----|----|--------|-----------|
| passport_expiry | 90 days | 0 days | 180 days | 30 days | 180 days |
| trip_duration | 90 days | 180 days | 180 days | 180 days | 365 days |
| required_documents | Residence req'd | No | No | No | No |

Check functions read these via `ctx.ruleParams[ruleCode]` and use defaults if no rule found.

### Country Groups & Seeded Data

| Group | Countries | Currency | Visa Types |
|-------|-----------|----------|------------|
| schengen | 29 (AT, BE, FR, DE, ...) | EUR | short-stay-tourism, short-stay-business, airport-transit, long-stay |
| uk | 1 (GB) | GBP | uk-visitor |
| us | 1 (US) | USD | us-b1b2 |
| canada | 1 (CA) | CAD | canada-visitor |
| australia | 1 (AU) | AUD | australia-visitor |

---

## Remaining Phases

### Phase 7: Auth, RBAC & Production Hardening

1. Authentication (NextAuth.js or Clerk)
2. RBAC (applicant, reviewer, ops_agent, admin)
3. Rate limiting on public endpoints
4. Audit logging for state transitions
5. Real Stripe payment integration (replace placeholder)
6. Email notifications (status updates, alerts)

### Phase 8: Appointment Monitoring (Post-Launch)

**Full plan:** See `docs/PHASE-8-APPOINTMENT-MONITORING.md`

**Summary:** Cloudflare Browser Rendering REST API (primary) + ScrapingBee (fallback) for scraping TLScontact, VFS Global, BLS, iDATA. Config-driven scraper with cron triggers. Email notifications via existing Resend system. New models: ScraperConfig, ScraperRun. Schema extensions to AppointmentAlertSubscription and AppointmentAvailabilitySnapshot.

**Implementation order:**
1. Schema changes (ScraperConfig, ScraperRun, subscription extensions)
2. CF Browser Rendering client (`/scrape`, `/json`, `/content` wrappers)
3. Provider-specific parsers (URL builders + slot parsers)
4. Scraper service (orchestration, diffing, notification dispatch)
5. Cron route + subscription API + availability API
6. Email template for appointment alerts
7. Seed configs for UK-based applicants
8. Wire frontend appointment alert UI to real endpoints

### Admin Operations Panel (can be done independently)

1. `GET /api/internal/cases` — list completed applications
2. `GET /api/internal/cases/[id]` — full application detail
3. `POST /api/internal/cases/[id]/status` — update operational status
4. `POST /api/internal/cases/[id]/notes` — internal notes
5. Basic admin UI: case queue, detail view, status transitions

---

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run db:init      # Push schema + seed (resets data)
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma studio    # Browse database
```

**Say "complete phase N" to execute any phase.**
