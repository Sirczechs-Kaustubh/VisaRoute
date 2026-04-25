# VisaRoute Appointment Tracker - Oracle Ampere A1 Setup Guide

## Overview

This guide covers deploying the VisaRoute Schengen visa appointment tracker on Oracle Cloud Infrastructure Ampere A1 instance.

### Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                 ORACLE AMPERE A1 (4 OCPU, 24GB)                │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Next.js App (PM2, port 3000)                           │  │
│  │  - Playwright scraper (self-hosted)                     │  │
│  │  - node-cron scheduler (every 30 min)                  │  │
│  │  - Public UI: /appointments                             │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              │                                  │
│                              ▼                                  │
│  ┌──────────────────┐    ┌──────────────────┐                 │
│  │  Supabase DB     │    │  Resend Email    │                 │
│  └──────────────────┘    └──────────────────┘                 │
└─────────────────────────────────────────────────────────────────┘
```

### Features

- Self-hosted Playwright scraper (no external API costs)
- Real-time availability dashboard
- Email alerts via Resend
- 12 pre-configured UK → Schengen routes
- PM2 + systemd for auto-restart on reboot

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| Oracle Ampere A1 instance | 4 OCPU, 24GB (free tier) |
| Supabase account | PostgreSQL database |
| Provider accounts | TLScontact, VFS, BLS (for scraping) |
| Resend account | For email alerts (free 3K/mo) |

---

## Part 1: Oracle Cloud Setup

### 1.1 Create Oracle Ampere A1 Instance

1. Log into Oracle Cloud Console
2. Go to **Compute** → **Instances**
3. Click **Create Instance**
4. Select **Ampere** shape (4 OCPU, 24GB)
5. Add SSH key (save the private key)
6. Ensure "Assign a public IP address" is checked

### 1.2 Configure Firewall Rules

1. Go to **Networking** → **Virtual Cloud Networks**
2. Click your VCN (e.g., `vcn-20260407-1245`)
3. Click **Security Lists** → **Default Security List**
4. Add **Ingress Rule**:
   - **Source CIDR**: `0.0.0.0/0`
   - **IP Protocol**: TCP
   - **Destination Port Range**: `3000`
   - **Description**: VisaRoute App

### 1.3 SSH into Instance

```bash
ssh -i /path/to/private-key ubuntu@YOUR_PUBLIC_IP
```

Example:
```bash
ssh -i ~/.ssh/ssh-key-2026-04-07.key ubuntu@130.162.169.242
```

---

## Part 2: Server Setup

### 2.1 Install System Dependencies

```bash
# Update package list
sudo apt-get update

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
sudo apt-get install -y nodejs

# Install Playwright system dependencies
sudo apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libpango-1.0-0 libcairo2 libasound2 \
    libatspi2.0-0 libxshmfence1 fonts-liberation xdg-utils wget gnupg

# Install Playwright Chromium
cd /opt
sudo npm install -g playwright
sudo npx playwright install chromium

# Install PM2
sudo npm install -g pm2
```

### 2.2 Configure Firewall (iptables)

```bash
# Allow port 3000
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT

# Make persistent
sudo apt-get install iptables-persistent
sudo netfilter-persistent save
```

---

## Part 3: Application Deployment

### 3.1 Clone Repository

```bash
cd ~
git clone https://github.com/Sirczechs-Kaustubh/VisaRoute.git visaroute
cd visaroute
```

### 3.2 Install Dependencies

```bash
npm install
```

### 3.3 Configure Environment

Copy the template and fill in values:

```bash
cp .env.oracle.template .env.production
nano .env.production
```

Required variables:

```env
# Supabase Database
DATABASE_URL="postgresql://postgres.xxxx:password@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:password@db.xxxx.supabase.co:5432/postgres"

# Supabase Keys
NEXT_PUBLIC_SUPABASE_URL="https://xxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_SERVICE_KEY="your-service-key"

# Email (Resend)
RESEND_API_KEY="re_xxxx"
EMAIL_FROM="VisaRoute <noreply@yourdomain.com>"

# Scraper Credentials (create accounts on provider portals)
TLSCONTACT_EMAIL="your-email@example.com"
TLSCONTACT_PASSWORD="your-password"
VFS_EMAIL="your-email@example.com"
VFS_PASSWORD="your-password"
BLS_EMAIL="your-email@example.com"
BLS_PASSWORD="your-password"

# App Config
NODE_ENV="production"
PORT=3000
NEXT_PUBLIC_APP_URL="http://130.162.169.242:3000"

# Scheduler (every 30 minutes)
SCRAPER_CRON_SCHEDULE="*/30 * * * *"

# Security
CRON_SECRET="random-secret-string-min-32-chars"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="your-admin-password"
```

### 3.4 Generate Prisma Client & Build

```bash
npx prisma generate
npm run build
```

### 3.5 Seed Database

```bash
# Run main seed (countries, visa types, etc.)
npm run db:seed

# Run scraper configs seed
npm run db:seed-scraper
```

### 3.6 Start with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
```

### 3.7 Verify Running

```bash
# Check status
pm2 status

# Check logs
pm2 logs visaroute --lines 20

# Test locally
curl http://localhost:3000/appointments
```

---

## Part 4: Provider Accounts Setup

To scrape appointment availability, create accounts on each provider portal:

| Provider | URL | Purpose |
|----------|-----|---------|
| TLScontact France | `fr.tlscontact.com/gb/LON/` | France visa appointments |
| TLScontact Germany | `de.tlscontact.com/gb/LON/` | Germany visa appointments |
| VFS Italy | `visa.vfsglobal.com/gbr/en/ita/` | Italy visa appointments |
| VFS Spain | `visa.vfsglobal.com/gbr/en/esp/` | Spain visa appointments |
| BLS Spain | `blsspainvisa.com/uk/` | Spain visa appointments |

Add credentials to `.env.production`:
```
TLSCONTACT_EMAIL=...
TLSCONTACT_PASSWORD=...
VFS_EMAIL=...
VFS_PASSWORD=...
BLS_EMAIL=...
BLS_PASSWORD=...
```

---

## Part 5: Available Routes

The system comes pre-configured with 12 routes:

| Provider | Destination | Residence | City | Interval |
|----------|-------------|-----------|------|----------|
| TLScontact | France | GB | London | 15 min |
| TLScontact | France | GB | Manchester | 15 min |
| TLScontact | France | GB | Edinburgh | 15 min |
| TLScontact | Germany | GB | London | 15 min |
| TLScontact | Belgium | GB | London | 30 min |
| TLScontact | Switzerland | GB | London | 30 min |
| VFS Global | Italy | GB | London | 15 min |
| VFS Global | Italy | GB | Manchester | 15 min |
| VFS Global | Spain | GB | London | 30 min |
| VFS Global | Germany | GB | London | 15 min |
| VFS Global | Netherlands | GB | London | 30 min |
| BLS | Spain | GB | London | 30 min |

---

## Part 6: Usage

### Public Dashboard

Visit: `http://130.162.169.242:3000/appointments`

Shows all tracked routes with availability status.

### Subscribe for Alerts

Visit: `http://130.162.169.242:3000/appointments/subscribe`

Enter email to receive notifications when slots become available.

### Manual Scraper Trigger

```bash
curl -X POST http://localhost:3000/api/cron/check-appointments
```

---

## Part 7: Maintenance

### View Logs

```bash
pm2 logs visaroute
```

### Restart App

```bash
pm2 restart visaroute
```

### Rebuild After Code Changes

```bash
git pull origin main
npm install
npm run build
pm2 restart visaroute
```

### Database Reseed

```bash
npm run db:seed-scraper
```

---

## Part 8: Troubleshooting

### Port Not Accessible

1. Check Oracle Security List (ingress rule for port 3000)
2. Check server iptables: `sudo iptables -L INPUT -n`
3. If blocked: `sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT`

### Scraper Not Working

1. Verify credentials in `.env.production`
2. Check logs: `pm2 logs visaroute`
3. Test manually: `curl -X POST http://localhost:3000/api/cron/check-appointments`

### App Not Starting

1. Check if build exists: `ls -la .next/`
2. Rebuild: `npm run build`
3. Check logs for errors

---

## Cost Estimate

| Component | Cost |
|-----------|------|
| Oracle Ampere A1 (4 OCPU, 24GB) | **FREE** (always free tier) |
| Supabase | $0 (free tier) |
| Resend | $0 (3K free/mo) |
| **Total** | **$0/mo** |

---

## Files Created/Modified

| File | Purpose |
|------|---------|
| `src/server/scrapers/playwright-stealth.ts` | Self-hosted Playwright scraper |
| `src/server/scrapers/scraper.service.ts` | Updated to use Playwright |
| `src/lib/scheduler.ts` | node-cron scheduler |
| `src/app/appointments/page.tsx` | Public availability dashboard |
| `src/app/appointments/subscribe/page.tsx` | Email subscription form |
| `ecosystem.config.js` | PM2 configuration |
| `server.js` | Custom server for production |
| `.env.oracle.template` | Environment template |
| `prisma/seed-scraper.js` | Scraper config seed script |
| `scripts/deploy-oracle.sh` | Deployment script (optional) |

---

## Quick Reference

```bash
# SSH into server
ssh -i ~/.ssh/ssh-key-2026-04-07.key ubuntu@130.162.169.242

# Restart app
pm2 restart visaroute

# View logs
pm2 logs visaroute --lines 50

# Check status
pm2 status
```
