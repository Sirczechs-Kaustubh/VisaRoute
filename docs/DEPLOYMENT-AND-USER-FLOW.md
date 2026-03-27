# VisaRoute — Deployment Guide & User Flow

> Last updated: 2026-03-25

---

## Table of Contents

1. [Stack Overview](#1-stack-overview)
2. [Cost-Effective Deployment Architecture](#2-cost-effective-deployment-architecture)
3. [Step-by-Step Deployment](#3-step-by-step-deployment)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Database Migration (SQLite → Postgres)](#5-database-migration-sqlite--postgres)
6. [User Flow](#6-user-flow)
7. [Monthly Cost Summary](#7-monthly-cost-summary)
8. [Post-Deploy Checklist](#8-post-deploy-checklist)

---

## 1. Stack Overview

| Layer | Technology | Notes |
|-------|-----------|-------|
| Frontend + API | Next.js 14 (App Router) | Single codebase, no separate backend |
| Database | Prisma ORM | SQLite (dev) → Neon PostgreSQL (prod) |
| File storage | Vercel Blob / local | `.docx` pack generation |
| Email | Resend | Transactional + appointment alerts |
| Scraping | Cloudflare Browser Rendering REST API | No infra, pure HTTP calls |
| Scheduling | Vercel Cron | Built-in, free on Hobby plan (1 job) |
| Hosting | Vercel | Free Hobby tier covers MVP |
| Document generation | `docx` npm package | Runs server-side in API routes |

---

## 2. Cost-Effective Deployment Architecture

### Recommended Setup (MVP — ~$0–7/month)

```
┌─────────────────────────────────────────────────────────────────┐
│                        VERCEL (FREE HOBBY)                      │
│                                                                 │
│  Next.js App ──► API Routes ──► Prisma Client                   │
│       │               │                │                        │
│       │          Cron Job              ▼                        │
│       │         (every 30m)    ┌───────────────┐               │
│       │               │        │  Neon Postgres │ FREE 0.5GB   │
│       │               │        └───────────────┘               │
│       │               ▼                                         │
│       │    Cloudflare Browser Rendering  ◄── $5/mo base        │
│       │               │                                         │
│       │               ▼                                         │
│       │          Resend Email            ◄── FREE (3K/mo)      │
│       ▼                                                         │
│  Static Assets (Vercel CDN)                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Why this is the cheapest viable setup

- **Vercel Hobby** — free, supports 1 cron job, 100GB bandwidth, serverless functions. No credit card needed.
- **Neon** — free tier: 0.5 GB storage, 1 project, auto-suspend (pauses after 5 min idle = $0 compute when nobody is using the app). Perfect for early-stage.
- **Resend** — 3,000 emails/month free. More than enough until you have hundreds of active users.
- **Cloudflare Workers Paid ($5/mo)** — only needed once you enable appointment monitoring. Includes 10 hrs/month browser time. Can defer this until you have real users.
- **No Redis, no message queue, no VPS** — everything is serverless HTTP.

### When to upgrade

| Trigger | Upgrade |
|---------|---------|
| > 1 cron schedule needed | Vercel Pro ($20/mo) or switch scheduler to QStash (free 500 msgs/day) |
| > 0.5 GB data | Neon free → Neon Launch ($19/mo, 10 GB) |
| > 3,000 emails/month | Resend free → Resend Pro ($20/mo, 50K emails) |
| > 20 scraper routes active | CF $5 plan comfortably covers it (see Phase 8 cost breakdown) |

---

## 3. Step-by-Step Deployment

### Prerequisites

- GitHub account (repo pushed)
- Vercel account (free)
- Neon account (free) — [neon.tech](https://neon.tech)
- Resend account (free) — [resend.com](https://resend.com)
- Cloudflare account (for Phase 8 scraping) — [cloudflare.com](https://cloudflare.com)

---

### Step 1 — Set up Neon PostgreSQL

1. Create a new project at [neon.tech](https://neon.tech)
2. Copy the connection string — looks like:
   ```
   postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
3. Keep this for Step 3.

---

### Step 2 — Update Prisma for PostgreSQL

In `prisma/schema.prisma`, change the datasource block:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

> **Note:** SQLite enums map cleanly to PostgreSQL enums — no data type changes needed.

Then regenerate the client locally:
```bash
DATABASE_URL="your-neon-url" npx prisma db push
DATABASE_URL="your-neon-url" node prisma/seed.js
```

---

### Step 3 — Set up Resend

1. Sign up at [resend.com](https://resend.com)
2. Add your domain (or use `onboarding@resend.dev` for testing)
3. Create an API key → copy it

---

### Step 4 — Deploy to Vercel

```bash
# Install Vercel CLI (one-time)
npm i -g vercel

# From your project root:
vercel

# Follow prompts:
# - Link to your GitHub repo
# - Framework: Next.js (auto-detected)
# - Root directory: ./  (default)
```

Or connect directly via the Vercel dashboard → New Project → Import from GitHub.

---

### Step 5 — Set Environment Variables in Vercel

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

```env
# Database
DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require

# Email (Resend)
RESEND_API_KEY=re_xxxxxxxxxxxx
EMAIL_FROM=VisaRoute <hello@yourdomain.com>

# App
NEXT_PUBLIC_APP_URL=https://your-vercel-url.vercel.app

# Cron security (generate any random string)
CRON_SECRET=some-long-random-string-here

# Cloudflare Browser Rendering (Phase 8 — add when ready)
CF_ACCOUNT_ID=your-cf-account-id
CF_API_TOKEN=your-cf-api-token
```

---

### Step 6 — Run Database Migration on Neon

After deploying, trigger a one-time migration via Vercel CLI or locally:

```bash
# Locally, pointing at Neon:
DATABASE_URL="your-neon-url" npx prisma db push
DATABASE_URL="your-neon-url" node prisma/seed.js
```

---

### Step 7 — Seed Scraper Configs (Phase 8)

Once CF credentials are set:

```bash
DATABASE_URL="your-neon-url" node scripts/seed-scrapers.js
```

This adds the 5 default scraper configs (TLScontact France/Germany, VFS Italy/Spain, BLS Spain).

---

### Step 8 — Verify Cron

The `vercel.json` cron is already configured:
```json
{ "crons": [{ "path": "/api/cron/check-appointments", "schedule": "*/30 * * * *" }] }
```

Vercel will send a GET request to `/api/cron/check-appointments` every 30 minutes with:
```
Authorization: Bearer <CRON_SECRET>
```

Test it manually:
```bash
curl -X GET https://your-app.vercel.app/api/cron/check-appointments \
  -H "Authorization: Bearer your-cron-secret"
```

---

## 4. Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `RESEND_API_KEY` | Yes | Resend API key for sending emails |
| `EMAIL_FROM` | No | Sender address (default: `noreply@visaroute.com`) |
| `NEXT_PUBLIC_APP_URL` | Yes | Your public app URL (used in email links) |
| `CRON_SECRET` | Yes | Secures the cron endpoint from unauthorized calls |
| `CF_ACCOUNT_ID` | Phase 8 | Cloudflare account ID |
| `CF_API_TOKEN` | Phase 8 | CF API token with Browser Rendering - Edit permission |
| `SCRAPINGBEE_KEY` | Optional | Fallback scraper for heavily protected sites |

---

## 5. Database Migration (SQLite → Postgres)

The only change needed is the `datasource` block in `schema.prisma`. The rest of the schema is compatible.

SQLite-to-Postgres gotchas already avoided in this codebase:
- No raw SQL queries — all queries go through Prisma
- All IDs use `cuid()` — compatible with both
- Enums are defined in Prisma — work identically in both databases
- No JSON columns — complex objects stored as serialized strings (`rawPayload`, `selectors`)

> **Recommendation:** Do not migrate existing SQLite data. Start with a clean Neon DB and re-run the seed scripts. The dev.db is local development only.

---

## 6. User Flow

### Overview

```
Landing Page
     │
     ▼
Pick Destination Country ──────────────────────────────────────┐
     │                                                          │
     ▼                                                          │
Country Info Page                                               │
(fees, processing time, requirements overview)                  │
     │                                                          │
     ├─── Subscribe to Appointment Alerts ◄────────────────────┘
     │         (email + country → AlertSubscription)
     │
     ▼
Start Application (/apply?draft=...)
     │
     ▼
┌────────────────────────────────────────┐
│          Application Flow (steps)      │
│                                        │
│  Step 1 — Applicant Details            │
│    (name, email, travel dates)         │
│            │                           │
│  Step 2 — Travel Plan                  │
│    (accommodation, entry city)         │
│            │                           │
│  Step 3 — Companions                   │
│    (travelling alone or with others?)  │
│            │                           │
│  Step 4 — Employment                   │
│    (employed / self-employed / student)│
│            │                           │
│  Step 5 — Visa History                 │
│    (previous Schengen visas)           │
│            │                           │
│  Step 6 — Refusal History              │
│    (any prior refusals?)               │
│            │                           │
│  Step 7 — Document Upload              │
│    (passport, bank statements, etc.)   │
│    → AI extraction runs in background  │
│            │                           │
│  Step 8 — Eligibility Checks           │
│    (rule engine validates documents)   │
│    → Pass / Warning / Fail per check   │
│            │                           │
│  Step 9 — Review & Order               │
│    (choose service tier, pay)          │
│            │                           │
│  Step 10 — Pack Generation             │
│    (cover letter, checklist, summary)  │
│    → Email: "Your pack is ready"       │
└────────────────────────────────────────┘
     │
     ▼
Download Documents (.docx)
     │
     ▼
Book Appointment
(user goes to TLScontact / VFS / BLS directly)
     │
     ▼
     ┌──────── Meanwhile (background) ──────────────────────┐
     │                                                       │
     │  Vercel Cron (every 30 min)                           │
     │       │                                               │
     │       ▼                                               │
     │  ScraperService.runScheduledChecks()                  │
     │       │                                               │
     │       ├─ CF Browser Rendering → scrape provider site  │
     │       ├─ Parse slots                                  │
     │       ├─ Diff against last snapshot                   │
     │       └─ If new slots → email all matching subscribers│
     │                                                       │
     └───────────────────────────────────────────────────────┘
     │
     ▼
User receives alert email:
"Visa Appointment Available — France (London)"
     │
     ▼
User clicks "Book Now" → lands on provider booking page
```

---

### Appointment Alert Subscription Flow (detail)

```
User on Country Page
        │
        ▼
   Enter email address
        │
        ▼
POST /api/appointments/subscribe
{ email, countrySlug, residenceCountry?, city?, provider? }
        │
        ├─ Already subscribed? → return { created: false }
        └─ New subscriber? → create AlertSubscription → { created: true }


Unsubscribe (from email link):
POST /api/appointments/unsubscribe
{ id: "subscription-id" }   ← passed as query param in email link
        │
        ▼
AlertSubscription.status = "UNSUBSCRIBED"


Check availability (frontend widget):
GET /api/appointments/availability?country=france&city=London
        │
        ▼
Returns: { available, slotsCount, nextAvailableDate, lastChecked, history[] }
```

---

### Admin / Ops Flow

```
Admin (internal)
        │
        ├─ View scraper health:
        │    GET /api/internal/...  (to be built)
        │    or: query ScraperRun table directly in Neon console
        │
        ├─ Add new scraper config:
        │    INSERT into ScraperConfig via seed script or Neon SQL editor
        │    No code changes needed — config-driven
        │
        ├─ Pause a route:
        │    UPDATE ScraperConfig SET isActive = false WHERE ...
        │
        └─ Monitor cron health:
             Vercel Dashboard → Functions → check /api/cron/check-appointments logs
             Or add Uptime Robot (free) to ping the endpoint and alert on failure
```

---

## 7. Monthly Cost Summary

### MVP Launch (0–100 users)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby | **$0** |
| Neon PostgreSQL | Free (0.5 GB, auto-suspend) | **$0** |
| Resend | Free (3K emails/mo) | **$0** |
| Cloudflare Workers | Paid (required for Browser Rendering) | **$5** |
| CF Browser Rendering | ~18 hrs/mo for 5 routes | **$0.76** (over 10 hr free) |
| Domain (optional) | Any registrar | **~$10/yr** |
| **Total** | | **~$5.76/mo** |

### Growth (100–1,000 users, 20 routes)

| Service | Plan | Cost |
|---------|------|------|
| Vercel | Hobby or Pro | **$0–20** |
| Neon | Launch ($19/mo) | **$19** |
| Resend | Free or Pro | **$0–20** |
| CF Browser Rendering | ~62 hrs/mo | **$9.68** |
| **Total** | | **~$29–68/mo** |

### Cost Optimisation Tips

1. **Keep SQLite in dev** — never pay for a DB while developing locally
2. **Neon auto-suspend** — the free tier pauses compute after 5 min of inactivity; zero charge overnight
3. **Only activate scraper routes on demand** — set `isActive = false` for low-interest routes
4. **Use `/scrape` (CSS) before `/json` (AI)** — AI endpoint uses ~40% more browser time
5. **Overnight pause** — scraper already skips checks between 11pm–6am (configured in service logic)
6. **Don't upgrade Vercel until you need multiple crons** — QStash (free 500 msgs/day) can replace Vercel Cron at no cost even on the free tier

---

## 8. Post-Deploy Checklist

- [ ] `DATABASE_URL` points to Neon (not local dev.db)
- [ ] `npx prisma db push` run against Neon
- [ ] `node prisma/seed.js` run — country and visa type data populated
- [ ] `RESEND_API_KEY` set — send a test email via `/api/notifications/test` (or Resend dashboard)
- [ ] `CRON_SECRET` set in Vercel env vars
- [ ] `CF_ACCOUNT_ID` + `CF_API_TOKEN` set (Phase 8)
- [ ] `node scripts/seed-scrapers.js` run — 5 scraper configs live in DB
- [ ] Test cron endpoint manually with curl (see Step 8 above)
- [ ] Verify Vercel Cron appears in Vercel Dashboard → Project → Cron Jobs
- [ ] Set up Uptime Robot (free) to monitor `GET /api/cron/check-appointments` and alert if it returns non-200
- [ ] (Optional) Add custom domain in Vercel → update `NEXT_PUBLIC_APP_URL`
- [ ] (Optional) Add Vercel Analytics (free) to track page views

---

*This document covers the full deployment picture for VisaRoute as of Phase 8. For Phase 8-specific cost analysis and scraper architecture, see `docs/PHASE-8-APPOINTMENT-MONITORING.md`.*
