# Phase 8: Appointment Monitoring — Implementation Plan

## Overview

Build a lightweight appointment availability monitoring system that periodically checks visa appointment provider websites and notifies subscribed users via email when slots open up.

**Core loop:** Cron trigger → Cloudflare Browser Rendering API → Parse results → Compare with last snapshot → Email subscribers if new slots found.

**Key constraint:** Fully managed, no self-hosting. Everything runs as serverless API calls.

---

## Hosting & Scheduling (No Self-Hosting)

Nothing in this architecture requires a server. The entire system is serverless:

- **Next.js app** → Vercel (or any serverless host)
- **Scraping** → Cloudflare Browser Rendering REST API (HTTP calls, no infra)
- **Database** → Prisma with hosted PostgreSQL (Neon, Supabase, PlanetScale)
- **Email** → Resend (API calls)
- **Scheduling** → see below

### Recommended: Upstash QStash

[QStash](https://upstash.com/docs/qstash) is a serverless HTTP-based message queue with built-in cron scheduling. It hits your API endpoint on a schedule — no server required.

**Why QStash over alternatives:**
- Free tier: 500 messages/day (more than enough for 50+ routes)
- Built-in retry with exponential backoff (if your endpoint fails)
- Dead-letter queue (failed jobs don't disappear silently)
- Works with any serverless platform (Vercel, Cloudflare, Netlify)
- Callback/webhook pattern — no long-running processes
- Dashboard for monitoring job health

**Setup:**
```typescript
// 1. Create schedule via QStash dashboard or API:
//    POST https://qstash.upstash.io/v2/schedules
//    Destination: https://yourapp.com/api/cron/check-appointments?tier=high
//    Cron: */15 * * * *

// 2. Your API route receives the call:
// src/app/api/cron/check-appointments/route.ts
export async function POST(request: Request) {
  // Verify QStash signature (prevents unauthorized calls)
  const signature = request.headers.get("upstash-signature");
  if (!verifyQStashSignature(signature, process.env.QSTASH_SIGNING_KEY)) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const tier = searchParams.get("tier") ?? "all";

  const service = new ScraperService();
  const results = await service.runScheduledChecks(tier);
  return Response.json({ ran: results.length });
}
```

**npm package:** `@upstash/qstash` (includes signature verification helper)

**Alternative scheduling options (if QStash doesn't suit):**

| Service | Setup | Free Tier | Drawback |
|---------|-------|-----------|----------|
| **Vercel Cron** | `vercel.json` config | 1 job on Hobby | $20/mo Pro for multiple schedules |
| **cron-job.org** | Web dashboard | 3 jobs, 1-min interval | No retry logic, less reliable |
| **GitHub Actions** | `.github/workflows/` | 2,000 min/mo | 5-min minimum, can be delayed up to 15 min |

---

## Check Intervals by Demand Tier

Visa appointment slots get booked within **5-15 minutes** on high-demand routes. Checking too frequently wastes money and risks blocks; too infrequently means users miss slots.

### Recommended Intervals

| Tier | Interval | Routes (examples) | Rationale |
|------|----------|-------------------|-----------|
| **High demand** | Every 15 min | France/UK, Germany/UK, Italy/UK | Slots disappear in minutes during peak season |
| **Medium demand** | Every 30 min | Spain/UK, Netherlands/UK, Belgium/UK | Moderate competition, 30 min is fast enough |
| **Low demand** | Every 60 min | Other countries, non-UK origins | Slots stay available for hours |
| **Off-peak hours** (11pm-6am) | Pause or every 2 hrs | All routes | Very few bookings happen overnight |

### Why Not Check Every 5 Minutes?

1. **Provider blocks** — TLScontact rate-limits at ~300s (5 min). Faster than that triggers bot detection.
2. **Cost** — 5 min intervals on 20 routes = 5,760 checks/day = ~19 hrs browser time/day = **$51/mo** in CF overage alone.
3. **Diminishing returns** — If a slot stays open for 10+ minutes, 15-min checks catch it. If it's gone in under 5 min, even 5-min checks may miss it.
4. **15 min is the sweet spot** — catches ~80% of available slots while staying under provider radar.

### Smart Scheduling Strategy

Instead of fixed intervals, use adaptive checking:

```
1. Default: check every 30 minutes
2. If slots were found in the last check → increase to every 15 minutes
   (more slots likely to appear around the same time)
3. If last 6 checks found nothing → decrease to every 60 minutes
   (provider likely has no availability right now)
4. Between 11pm-6am local time → pause or check every 2 hours
5. During peak season (Mar-Jul) → use tighter intervals
```

This reduces checks by ~40% without meaningfully impacting detection rate.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Next.js App                                             │
│                                                          │
│  /api/cron/check-appointments (GET, cron-triggered)      │
│      │                                                   │
│      ├─ For each active provider+country:                │
│      │   │                                               │
│      │   ├─ Cloudflare Browser Rendering REST API        │
│      │   │   /scrape or /json endpoint                   │
│      │   │   (renders JS, extracts appointment data)     │
│      │   │                                               │
│      │   ├─ Parse → ScraperResult                        │
│      │   │                                               │
│      │   ├─ Compare with last AvailabilitySnapshot       │
│      │   │                                               │
│      │   ├─ Save new snapshot to DB                      │
│      │   │                                               │
│      │   └─ If new slots found:                          │
│      │       └─ Find matching AlertSubscriptions         │
│      │           └─ Send email via Resend                │
│      │                                                   │
│      └─ Log scraper run (ScraperRun model)               │
│                                                          │
│  /api/appointments/subscribe (POST)                      │
│  /api/appointments/unsubscribe (POST)                    │
│  /api/appointments/availability (GET)                    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## Provider Landscape

### TLScontact
- **Handles:** Schengen appointments for France, Germany, Belgium, Switzerland, others
- **URL pattern:** `https://{lang}.tlscontact.com/`
- **Authentication:** Session-based, requires login
- **Anti-bot:** Bot-detection landing page, daily auth limits, rate limiting (~300s minimum between checks)
- **Approach:** CF Browser Rendering `/scrape` with careful rate limiting. Parse appointment calendar from `/myapp.php`. If blocked, fall back to ScrapingBee stealth proxy.

### VFS Global
- **Handles:** Schengen appointments for dozens of countries (largest provider)
- **URL pattern:** `https://visa.vfsglobal.com/{residence_country}/en/{destination_country}/`
- **Authentication:** JWT-based (requires browser automation for login)
- **Anti-bot:** Cloudflare Turnstile, reCAPTCHA, IP rate limiting, browser fingerprinting, account bans
- **Approach:** Most aggressive anti-bot. Start with CF `/json` AI endpoint (resilient to DOM changes). If blocked, use ScrapingBee with `stealth_proxy=true` as fallback. Rate limit to 1 check per 30 minutes minimum.

### BLS International
- **Handles:** Spain and several other Schengen countries
- **URL patterns:** Country-specific (e.g., `https://software.blsgermanyvisa.com/`)
- **Anti-bot:** Gateway errors, basic rate limiting
- **Approach:** CF Browser Rendering `/scrape` should work. Lightest protection of the four providers.

### iDATA
- **Handles:** German and Italian appointments in Turkey
- **URL pattern:** `https://www.idata.com.tr/{country_code}/en/`
- **Model:** Waitlist-based (not slot selection) — track waitlist status, not calendar
- **Anti-bot:** Basic
- **Approach:** CF `/content` endpoint or even HTMLRewriter if server-rendered. Monitor waitlist status changes.

---

## Scraping Strategy

### Primary: Cloudflare Browser Rendering REST API

Call from Next.js API routes. No infrastructure to manage.

```typescript
// Example: scrape TLScontact appointment page
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/browser-rendering/scrape`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: "https://fr.tlscontact.com/gb/LON/page.php?pid=appointment",
      elements: [
        { selector: ".dispo" },          // available slots
        { selector: ".calendar-day" },    // calendar dates
      ],
      gotoOptions: { waitUntil: "networkidle0" },
      waitForSelector: ".calendar-container",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    }),
  },
);
```

### AI-Powered: `/json` endpoint for resilient extraction

Use when CSS selectors are fragile or unknown:

```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/browser-rendering/json`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      url: targetUrl,
      prompt: "Extract all available visa appointment dates, times, and cities from this page",
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "appointments",
          schema: {
            type: "object",
            properties: {
              available: { type: "boolean" },
              slots: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    date: { type: "string" },
                    time: { type: "string" },
                    city: { type: "string" },
                    category: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    }),
  },
);
```

### Fallback: ScrapingBee (for heavily protected sites)

Only needed if CF Browser Rendering gets blocked by VFS Global or TLScontact:

```typescript
const url = `https://app.scrapingbee.com/api/v1/?` +
  `api_key=${SCRAPINGBEE_KEY}` +
  `&url=${encodeURIComponent(targetUrl)}` +
  `&render_js=true` +
  `&stealth_proxy=true` +
  `&wait_for=.appointment-slot`;
```

---

## Cost Breakdown

### Per-Component Pricing

| Component | Free Tier | Paid Tier | Unit Cost |
|-----------|-----------|-----------|-----------|
| **Cloudflare Workers Paid** | 100K req/day | $5/mo base (10M req) | $0.50 per additional 1M req |
| **CF Browser Rendering** | 10 min/day (6 req/min) | 10 hrs/mo included in $5 plan | $0.09/hr overage |
| **CF Browser Rendering — concurrent** | 3 browsers | 10 browsers | $2.00/extra concurrent browser |
| **Resend (email)** | 100 emails/day, 3,000/mo | $20/mo for 50K emails | — |
| **ScrapingBee (optional fallback)** | 1,000 credits (one-time) | $49/mo Starter (150K credits) | 75 credits/req with stealth+JS |
| **Vercel Cron** | 1 cron job (Hobby) | Unlimited (Pro $20/mo) | — |
| **cron-job.org (alternative)** | 3 jobs, 1-min interval | Free | — |

### How the Math Works

**Each scrape check** = 1 Cloudflare Browser Rendering request ≈ 10-15 seconds of browser time.

```
Browser time per check:     ~12 seconds (avg)
Checks per route per day:   48 (every 30 minutes)
Browser time per route/day: 48 × 12s = 576s = 9.6 minutes
```

### Scenario 1: MVP (5 routes, UK applicants only)

2 high-demand (15 min) + 2 medium (30 min) + 1 low (60 min), with overnight pause (11pm-6am):

| Item | Calculation | Cost |
|------|-------------|------|
| CF Workers Paid base | — | $5.00/mo |
| Browser time | (2×68 + 2×34 + 1×17) checks/day × 12s × 30 days = **18.4 hrs/mo** | 10 hrs free → 8.4 hrs overage × $0.09 = **$0.76** |
| Resend emails | ~50-200 alerts/mo | **$0.00** (free tier) |
| Upstash QStash | ~221 checks/day = ~6,630/mo | **$0.00** (free: 500/day) |
| **Monthly Total** | | **~$5.76/mo** |
| **Annual Total** | | **~$69/yr** |

### Scenario 2: Growth (20 routes, multiple countries)

6 high + 8 medium + 6 low, with overnight pause and adaptive scheduling (~40% reduction):

| Item | Calculation | Cost |
|------|-------------|------|
| CF Workers Paid base | — | $5.00/mo |
| Browser time | ~620 checks/day × 12s × 30 days = **62 hrs/mo** | 10 hrs free → 52 hrs × $0.09 = **$4.68** |
| Resend emails | ~500-1,000 alerts/mo | **$0.00** (free tier) |
| Upstash QStash | ~620/day | **$0.00** (free: 500/day — just over, may need $1 plan) |
| ScrapingBee (VFS fallback) | Only if CF blocked on ~5 VFS routes | **$0-49/mo** |
| **Monthly Total** | | **$10-59/mo** |
| **Annual Total** | | **$120-708/yr** |

### Scenario 3: Scale (50 routes, 15-minute intervals)

15 high + 20 medium + 15 low, with overnight pause and adaptive scheduling:

| Item | Calculation | Cost |
|------|-------------|------|
| CF Workers Paid base | — | $5.00/mo |
| Browser time | ~1,500 checks/day × 12s × 30 days = **150 hrs/mo** | 10 hrs free → 140 hrs × $0.09 = **$12.60** |
| Concurrent browsers | May need 5+ concurrent | **$4-8/mo** |
| Resend emails | ~2,000-5,000 alerts/mo | **$0-20/mo** |
| Upstash QStash | ~1,500/day | **$1/mo** (Pro: 100K msgs/day) |
| ScrapingBee (VFS fallback) | ~10 VFS routes | **$49-99/mo** |
| **Monthly Total** | | **$72-145/mo** |
| **Annual Total** | | **$864-1,740/yr** |

### Cost Comparison: CF Browser Rendering vs Alternatives

If we built this without Cloudflare:

| Approach | Monthly Cost (20 routes) | Maintenance |
|----------|------------------------|-------------|
| **CF Browser Rendering (recommended)** | $12-62/mo | Zero — HTTP API calls |
| Self-hosted Playwright (VPS) | $20-40/mo (DigitalOcean) | High — manage server, crashes, updates |
| Browserless.io | $50-200/mo | Low — API calls |
| ScrapingBee only | $49-99/mo | Low — API calls |
| Bright Data | $500+/mo | Low — but expensive |

### Free Tier Viability

For **prototyping and very low volume** (1-2 routes), the CF free tier works:

```
Free tier: 10 min/day = ~50 checks/day
2 routes × 48 checks/day = 96 checks (exceeds free tier)
2 routes × 24 checks/day (hourly) = 48 checks (fits free tier)
```

You can run 2 routes at hourly intervals on the free tier indefinitely at **$0/month**.

### Hidden Costs to Consider

| Item | Cost | When |
|------|------|------|
| 2Captcha (VFS Global CAPTCHA solving) | $2-3 per 1,000 solves | Only if VFS requires CAPTCHA for availability page |
| Domain for email (Resend) | $10-15/yr | Needed for branded sender address |
| Monitoring/alerting (e.g., Uptime Robot) | $0 | Free tier to monitor the cron is running |
| SSL certificate | $0 | Cloudflare provides free SSL |

### Cost Optimization Tips

1. **Start with CF only** — don't add ScrapingBee until you confirm CF gets blocked
2. **Use `/json` AI endpoint sparingly** — it's slower (~15-20s) and counts as more browser time
3. **Batch by provider** — check all TLScontact routes in one browser session (reuse page)
4. **Reduce frequency for low-demand routes** — check popular routes every 15 min, others hourly
5. **Cache results** — if a provider site is down, don't retry for 5 min (saves browser time)
6. **HTMLRewriter first** — try static fetch before using Browser Rendering; some pages may server-render enough data

---

## Schema Extensions

Add to `prisma/schema.prisma`:

```prisma
enum ScraperProvider {
  TLSCONTACT
  VFS_GLOBAL
  BLS
  IDATA
}

enum ScraperRunStatus {
  SUCCESS
  PARTIAL
  FAILED
  BLOCKED
}

model ScraperConfig {
  id                String          @id @default(cuid())
  provider          ScraperProvider
  countrySlug       String          // destination country (e.g. "france")
  residenceCountry  String          // where applicant is applying from (e.g. "gb")
  city              String          // appointment city (e.g. "London")
  targetUrl         String          // URL to scrape
  selectors         String?         // JSON: CSS selectors for appointment elements
  useAIExtraction   Boolean         @default(false) // use /json endpoint instead of /scrape
  isActive          Boolean         @default(true)
  checkIntervalMin  Int             @default(30)    // minutes between checks
  lastCheckedAt     DateTime?
  createdAt         DateTime        @default(now())
  updatedAt         DateTime        @updatedAt

  scraperRuns       ScraperRun[]

  @@unique([provider, countrySlug, residenceCountry, city])
  @@index([isActive])
}

model ScraperRun {
  id              String           @id @default(cuid())
  configId        String
  status          ScraperRunStatus
  slotsFound      Int              @default(0)
  rawPayload      String?          // raw API response (truncated)
  errorMessage    String?
  durationMs      Int?
  createdAt       DateTime         @default(now())

  config          ScraperConfig    @relation(fields: [configId], references: [id], onDelete: Cascade)

  @@index([configId, createdAt])
}
```

Update existing models:

```prisma
// Add to AppointmentAvailabilitySnapshot:
model AppointmentAvailabilitySnapshot {
  // ... existing fields ...
  provider          String?       // "tlscontact", "vfs_global", "bls", "idata"
  city              String?       // appointment city
  scraperConfigId   String?       // link to ScraperConfig
}

// Add to AppointmentAlertSubscription:
model AppointmentAlertSubscription {
  // ... existing fields ...
  residenceCountry  String?       // where user is applying from
  city              String?       // preferred appointment city (optional)
  provider          String?       // preferred provider (optional)
}
```

---

## Service Modules

### File Structure

```
src/server/scrapers/
  scraper.service.ts       — orchestrates scrape runs, cron logic
  scraper.repository.ts    — DB queries for configs, runs, snapshots
  providers/
    base.ts                — shared types and utilities
    tlscontact.ts          — TLScontact-specific URL builder and parser
    vfs-global.ts          — VFS Global-specific URL builder and parser
    bls.ts                 — BLS-specific URL builder and parser
    idata.ts               — iDATA-specific URL builder and parser
  cloudflare-browser.ts    — CF Browser Rendering API client
  notification.ts          — match subscribers + send emails

src/app/api/
  cron/
    check-appointments/
      route.ts             — GET endpoint triggered by cron
  appointments/
    subscribe/route.ts     — POST: create alert subscription
    unsubscribe/route.ts   — POST: unsubscribe
    availability/route.ts  — GET: current availability for a country
```

### ScraperService pseudocode

```typescript
class ScraperService {
  async runScheduledChecks() {
    // 1. Get all active configs where lastCheckedAt + interval < now
    const configs = await this.repo.getDueConfigs();

    for (const config of configs) {
      const startTime = Date.now();
      try {
        // 2. Call CF Browser Rendering API
        const result = config.useAIExtraction
          ? await this.cfClient.jsonExtract(config.targetUrl, APPOINTMENT_PROMPT)
          : await this.cfClient.scrape(config.targetUrl, JSON.parse(config.selectors));

        // 3. Parse provider-specific response
        const slots = this.getProvider(config.provider).parseSlots(result);

        // 4. Get last snapshot for comparison
        const lastSnapshot = await this.repo.getLatestSnapshot(config);

        // 5. Save new snapshot
        await this.repo.saveSnapshot(config, slots);

        // 6. Check if new slots appeared
        const newSlots = this.diffSlots(lastSnapshot, slots);
        if (newSlots.length > 0) {
          await this.notifySubscribers(config, newSlots);
        }

        // 7. Log success
        await this.repo.logRun(config.id, "SUCCESS", slots.length, Date.now() - startTime);
      } catch (err) {
        const status = isBlockedError(err) ? "BLOCKED" : "FAILED";
        await this.repo.logRun(config.id, status, 0, Date.now() - startTime, err.message);
      }
    }
  }
}
```

---

## API Routes

### `GET /api/cron/check-appointments`

Triggered by Vercel Cron, cron-job.org, or Upstash QStash.

```typescript
export async function GET(request: Request) {
  // Verify cron auth (Bearer token or secret header)
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response("Unauthorized", { status: 401 });
  }

  const service = new ScraperService();
  const results = await service.runScheduledChecks();
  return Response.json({ ran: results.length });
}
```

Cron schedule (vercel.json):
```json
{ "crons": [{ "path": "/api/cron/check-appointments", "schedule": "*/30 * * * *" }] }
```

### `POST /api/appointments/subscribe`

```typescript
// Body: { email, countrySlug, residenceCountry?, city?, provider? }
// Creates an AppointmentAlertSubscription
```

### `GET /api/appointments/availability`

```typescript
// Query: ?country=france&city=London
// Returns latest snapshots and historical trend
```

---

## Email Notification Template

When slots are found, send via the existing Resend email system:

```
Subject: Visa Appointment Available — France (London)

Hi [Name],

New visa appointment slots have been detected:

┌──────────────┬──────────┬──────────────┐
│ Date         │ Time     │ Location     │
├──────────────┼──────────┼──────────────┤
│ 15 Apr 2026  │ 09:30    │ TLScontact   │
│ 17 Apr 2026  │ 14:00    │ TLScontact   │
└──────────────┴──────────┴──────────────┘

Book now before these slots are taken:
[Link to provider booking page]

— VisaRoute
```

Add `appointment_alert` email type to the existing email.service.ts and email.templates.ts.

---

## Environment Variables

```env
# Cloudflare Browser Rendering
CF_ACCOUNT_ID=""
CF_API_TOKEN=""              # needs "Browser Rendering - Edit" permission

# Upstash QStash (scheduling + signature verification)
QSTASH_TOKEN=""
QSTASH_CURRENT_SIGNING_KEY=""
QSTASH_NEXT_SIGNING_KEY=""

# Optional: ScrapingBee fallback for heavily protected sites
SCRAPINGBEE_KEY=""
```

---

## Seed Data (Initial Scraper Configs)

For MVP, seed configs for the most common routes:

| Provider | Destination | From | City | Interval |
|----------|------------|------|------|----------|
| TLScontact | France | GB | London | 30 min |
| TLScontact | Germany | GB | London | 30 min |
| VFS Global | Italy | GB | London | 30 min |
| VFS Global | Spain | GB | London | 30 min |
| BLS | Spain | GB | London | 30 min |

Expand based on user demand — the config-driven approach means adding a new provider/route is just a DB row.

---

## Implementation Order

1. **Schema changes** — Add ScraperConfig, ScraperRun models; extend AppointmentAlertSubscription and AppointmentAvailabilitySnapshot
2. **CF Browser Rendering client** — `cloudflare-browser.ts` with `/scrape`, `/json`, `/content` wrappers
3. **Provider parsers** — One file per provider with URL builder and slot parser
4. **Scraper service** — Orchestration, diffing, notification dispatch
5. **Cron route** — `/api/cron/check-appointments` with auth
6. **Subscription API** — Subscribe/unsubscribe endpoints
7. **Availability API** — Public endpoint for current slot data
8. **Email template** — `appointment_alert` in existing email system
9. **Seed configs** — Initial provider configs for UK-based applicants
10. **Frontend** — Wire existing appointment alert UI to real endpoints

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Provider blocks CF IP range | No data for that provider | Fall back to ScrapingBee stealth proxy |
| DOM structure changes | Parsing breaks | Use `/json` AI endpoint for resilient extraction |
| Rate limiting triggers account ban | Temporary or permanent data loss | Respect intervals (30min+), rotate configs, monitor ScraperRun failures |
| CAPTCHA requirement (VFS) | Cannot automate | Accept manual fallback, notify ops team, or integrate 2Captcha ($2-3/1K solves) |
| Legal pushback | Provider sends C&D | Only scrape public availability (no PII), implement kill switch, respect robots.txt |
| High provider count overwhelms free tier | Cost spike | Prioritize high-demand routes, batch requests, use HTMLRewriter for static pages |

---

## Success Metrics

- **Availability detection rate:** % of real appointments caught vs missed
- **Notification latency:** Time from slot appearing to email sent (target: < 5 min)
- **False positive rate:** % of alerts where slot was already gone (target: < 20%)
- **Uptime:** % of scheduled scrapes that succeed (target: > 90%)
- **Subscriber engagement:** % of users who click the booking link in the email

---

## Summary

Phase 8 uses **Cloudflare Browser Rendering REST API** as the primary scraping engine — cheap ($5-7/mo), lightweight (HTTP calls from Next.js), and capable of rendering JS-heavy visa booking sites. Provider-specific parsers handle the differences between TLScontact, VFS Global, BLS, and iDATA. The existing Resend email system sends appointment alerts. Configuration is database-driven so new routes can be added without code changes.

**Say "complete phase 8" to begin implementation.**
