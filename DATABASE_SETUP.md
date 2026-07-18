# SocioPath — Complete Database Setup Guide

> **Architecture**: SQLite for local development → Supabase (PostgreSQL) for production + Redis Cloud for seat holding/caching.

---

## 🗂 Table of Contents
1. [Local Development (SQLite)](#1-local-development-sqlite)
2. [Production: Supabase PostgreSQL](#2-production-supabase-postgresql)
3. [Cache Layer: Redis Cloud](#3-cache-layer-redis-cloud)
4. [Environment Variables Reference](#4-environment-variables-reference)
5. [Initial Data & Users](#5-initial-data--users)
6. [Redis Data Model](#6-redis-data-model)
7. [Deployment Checklist](#7-deployment-checklist)

---

## 1. Local Development (SQLite)

No extra setup needed for local dev. SQLite is bundled.

```bash
# 1. Install dependencies
npm install

# 2. Apply all migrations to local SQLite
npx prisma migrate dev

# 3. Seed with initial data (5 users, 4 events, reviews, logs)
node prisma/seed.js

# 4. Start the dev server
npm run dev
```

Your `.env.local` file should contain:
```env
DATABASE_URL=file:./dev.db
```

---

## 2. Production: Supabase PostgreSQL

### Step 1 — Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) → **New Project**
2. Choose a region close to Mumbai (e.g. **Asia South 1 - Singapore**)
3. Set a strong database password and save it securely
4. Wait ~2 minutes for the project to spin up

### Step 2 — Get the Connection String

In your Supabase project:
- Go to **Settings → Database**
- Under **Connection string**, select **URI** mode
- Copy the string that looks like:
  ```
  postgresql://postgres:[YOUR-PASSWORD]@db.xxxxxxxxxxxx.supabase.co:5432/postgres
  ```

> ⚠️ Replace `[YOUR-PASSWORD]` with your actual password (URL-encode special characters if any)

### Step 3 — Update `prisma.config.ts`

Open `prisma.config.ts` in the root of the project:

```typescript
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: process.env["DATABASE_URL"],  // ← Already configured ✓
  },
});
```

### Step 4 — Update `prisma/schema.prisma` datasource

Change the provider to `postgresql` when deploying:

```prisma
datasource db {
  provider = "postgresql"   // ← Change from "sqlite" to "postgresql"
}
```

> 💡 **Pro Tip**: You can keep `"sqlite"` locally and change this only on your CI/CD pipeline using environment substitution, or maintain two separate schema files.

### Step 5 — Set Environment Variables in Vercel

Go to your Vercel project → **Settings → Environment Variables** and add:

| Variable | Value | Environments |
|---|---|---|
| `DATABASE_URL` | `postgresql://postgres:...@db.xxxx.supabase.co:5432/postgres` | Production, Preview |

Or use the Vercel CLI:
```powershell
# Windows PowerShell
node node_modules\vercel\dist\index.js env rm DATABASE_URL --yes
node node_modules\vercel\dist\index.js env add DATABASE_URL production --value "postgresql://..."
```

### Step 6 — Apply Migrations to PostgreSQL

After setting `DATABASE_URL` in your environment (or `.env.production`):

```bash
# Generate the Prisma Client for PostgreSQL
npx prisma generate

# Push the full schema to Supabase (one-time, replaces migrate for production)
npx prisma migrate deploy

# Seed initial data into Supabase
DATABASE_URL="postgresql://..." node prisma/seed.js
```

---

## 3. Cache Layer: Redis Cloud

Redis holds seat locks during checkout (10 minutes) and caches event data (5 minutes).

### Step 1 — Create a Redis Cloud Account

1. Go to [redis.io/try-free](https://redis.io/try-free) → **Free Tier**
2. Create a database (choose **AWS ap-south-1** for Mumbai proximity)
3. After creation, find your connection details:
   - **Public Endpoint**: `redis-12345.c1.ap-south-1-1.ec2.redns.redis-cloud.com:12345`
   - **Password**: (shown in the Security tab)

### Step 2 — Build the Redis URL

Format: `redis://:<PASSWORD>@<HOST>:<PORT>`

Example:
```
redis://:MyStrongPass123@redis-12345.c1.ap-south-1-1.ec2.redns.redis-cloud.com:12345
```

### Step 3 — Add to Vercel Environment Variables

| Variable | Value | Environments |
|---|---|---|
| `REDIS_URL` | `redis://:password@host:port` | Production, Preview |

### Step 4 — No Code Changes Needed

The `src/lib/redis.ts` file already handles Redis automatically:
- If `REDIS_URL` is set → connects to Redis Cloud
- If not set → uses in-memory fallback (perfect for local dev)

---

## 4. Environment Variables Reference

### `/.env.local` (Local Development — never commit this file)

```env
# ── Database ───────────────────────────────────────────────────
DATABASE_URL=file:./dev.db

# ── Redis (leave empty for local; uses in-memory fallback) ─────
# REDIS_URL=redis://:password@host:port

# ── Google OAuth ───────────────────────────────────────────────
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-your-google-client-secret

# ── Session ────────────────────────────────────────────────────
SESSION_SECRET=a-very-long-random-string-at-least-32-chars

# ── Razorpay (leave empty for mock mode) ───────────────────────
# RAZORPAY_KEY_ID=rzp_test_...
# RAZORPAY_KEY_SECRET=your-razorpay-secret

# ── App URL ────────────────────────────────────────────────────
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Vercel Production Environment Variables

| Variable | Description | Required |
|---|---|---|
| `DATABASE_URL` | Supabase PostgreSQL connection string | ✅ Yes |
| `REDIS_URL` | Redis Cloud connection string | ⚠️ Recommended |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | ✅ Yes |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | ✅ Yes |
| `SESSION_SECRET` | Random string ≥32 chars for cookie signing | ✅ Yes |
| `RAZORPAY_KEY_ID` | Razorpay API key ID | ⚠️ For live payments |
| `RAZORPAY_KEY_SECRET` | Razorpay API secret | ⚠️ For live payments |
| `NEXT_PUBLIC_APP_URL` | Your Vercel deployment URL | ✅ Yes |

---

## 5. Initial Data & Users

The seed file (`prisma/seed.js`) creates the following:

### Users

| Email | Name | Role | Gender |
|---|---|---|---|
| `iiit.piyush@gmail.com` | Piyush Sharma | **ADMIN** | Male |
| `shubsspa@gmail.com` | Shubham Sharma | USER (External) | Male |
| `priya.mehta@gmail.com` | Priya Mehta | USER | Female |
| `arjun.kapoor@gmail.com` | Arjun Kapoor | USER | Male |
| `ananya.singh@gmail.com` | Ananya Singh | USER | Female |

### Events (4 Events)

| Title | When | Price |
|---|---|---|
| Friday Night Jam — Pure Music & Karaoke | Next Friday 8 PM | ₹1,500 (♀ ₹1,200) |
| Saturday Night Social — Complete Stranger Experience | Next Saturday 8 PM | ₹1,500 (♀ ₹1,200) |
| Bhajan Jamming — Evening of Devotional Music | Last Saturday of month, 7 PM | ₹800 (same for all) |
| Bhajan Jamming — Sunday Soul Gathering | Last Sunday of month, 4 PM | ₹800 (same for all) |

### Re-running the Seed

```bash
# SQLite (local)
node prisma/seed.js

# PostgreSQL (production)
DATABASE_URL="postgresql://..." node prisma/seed.js
```

> ⚠️ The seed **wipes all existing data** before inserting. Only run it once, or on a fresh database.

---

## 6. Redis Data Model

Redis uses simple key-value pairs. Here's the schema:

| Key Pattern | Value | TTL | Purpose |
|---|---|---|---|
| `seat_hold:{eventId}:{userId}` | `"1"` | 600s (10 min) | Holds a seat while user pays |
| `events_cache` | JSON string of events array | 300s (5 min) | Caches event listing |

### How Seat Holding Works

1. User clicks **Book Now** → `POST /api/bookings/create`
2. API writes `seat_hold:{eventId}:{userId} = "1"` (10-min TTL) to Redis
3. User is redirected to payment (Razorpay)
4. On payment success → `POST /api/bookings/verify` → Redis key deleted, DB booking confirmed
5. If user abandons checkout → Redis key auto-expires after 10 minutes, seat released

### Viewing Redis Data (Redis CLI)

```bash
# Count active seat holds for an event
redis-cli -u $REDIS_URL keys "seat_hold:evt-friday-jam:*"

# See all holds
redis-cli -u $REDIS_URL keys "seat_hold:*"

# Clear all seat holds (emergency reset)
redis-cli -u $REDIS_URL keys "seat_hold:*" | xargs redis-cli -u $REDIS_URL del
```

---

## 7. Deployment Checklist

Before going live, verify each item:

- [ ] Supabase project created and `DATABASE_URL` configured in Vercel
- [ ] `prisma/schema.prisma` — `provider = "postgresql"` for production
- [ ] `npx prisma migrate deploy` run against Supabase
- [ ] `node prisma/seed.js` run with production `DATABASE_URL`
- [ ] Redis Cloud account created, `REDIS_URL` set in Vercel
- [ ] `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` from [console.cloud.google.com](https://console.cloud.google.com)
- [ ] Google OAuth Authorized Origins includes your Vercel URL
- [ ] `SESSION_SECRET` set (generate with: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
- [ ] `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (from [dashboard.razorpay.com](https://dashboard.razorpay.com))
- [ ] Razorpay webhook configured to hit `/api/bookings/verify`
- [ ] `NEXT_PUBLIC_APP_URL` set to your production domain
- [ ] Re-deploy Vercel after all env vars are set

---

## 🆘 Troubleshooting

**"P1001: Can't reach database server"**
→ Check your `DATABASE_URL` in Vercel. Make sure the Supabase password has no special characters that need URL-encoding.

**"Error: Cannot find module 'ioredis'"**
→ Run `npm install ioredis` locally. It's in package.json but may need a fresh install.

**Redis connection errors on Vercel**
→ Check if your Redis Cloud plan allows connections from Vercel's IP ranges. Use Redis Cloud's TLS connection string if needed.

**Migration drift errors locally**
→ Run `npx prisma migrate reset --force` to wipe and re-apply all migrations.

**Bookings stuck in PENDING**
→ Check Razorpay webhook events in the Razorpay dashboard. Ensure the webhook URL is set to `https://yourdomain.com/api/bookings/verify`.
