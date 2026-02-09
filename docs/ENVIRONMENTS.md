# Environment Configuration

Project Firefly uses three environments, each with its own Supabase project and configuration.

## Overview

| Environment | Trigger | Supabase Project | Demo Mode | URL |
|---|---|---|---|---|
| **Development** | `npm run dev` | `firefly-dev` | `true` | `localhost:3000` |
| **Staging / QA** | PR opened → Vercel preview | `firefly-staging` | `true` | `pr-123.vercel.app` |
| **Production** | Merge to `main` → Vercel prod | `firefly-prod` | `false` | `firefly.app` |

## Supabase Projects

Create three separate Supabase projects. Each project is fully isolated with its own database, auth, and API keys.

### Setup Steps (per project)

1. Create a new project at [supabase.com/dashboard](https://supabase.com/dashboard)
2. Run the migration: copy `supabase/migrations/001_initial_schema.sql` into the SQL Editor and execute
3. Run the second migration: copy `supabase/migrations/002_vendor_accepted.sql` and execute
4. **Dev and Staging only:** Run `supabase/seed.sql` to insert demo data (vendor, menu items, delivery person)
5. Copy the project URL and anon key from **Settings → API**

### What Each Project Contains

| | firefly-dev | firefly-staging | firefly-prod |
|---|---|---|---|
| Schema (migrations) | Yes | Yes | Yes |
| Seed data (demo vendor, menu) | Yes | Yes | **No** |
| Demo user IDs in data | Yes | Yes | **No** |

## Vercel Configuration

Environment variables are set in the Vercel dashboard under **Settings → Environment Variables**.

### Preview Deployments (Staging/QA)

Every PR automatically gets a preview deployment. These use staging config:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://firefly-staging-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging anon key |
| `NEXT_PUBLIC_DEMO_MODE` | `true` |

Set these with the **Preview** environment checkbox in Vercel.

### Production

Merges to `main` auto-deploy to production:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://firefly-prod-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod anon key |
| `NEXT_PUBLIC_DEMO_MODE` | `false` |

Set these with the **Production** environment checkbox in Vercel.

## Local Development

1. Copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Fill in your **firefly-dev** Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://your-dev-ref.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-dev-anon-key
   NEXT_PUBLIC_DEMO_MODE=true
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Demo Mode Behavior

When `NEXT_PUBLIC_DEMO_MODE=true`:
- A yellow "DEMO MODE" banner appears at the top of every page
- Hardcoded demo user IDs are used (no login required)
- The landing page shows the role picker for testing all three roles

When `NEXT_PUBLIC_DEMO_MODE=false`:
- No demo banner
- Real Supabase Auth is required (login/register flow)
- API routes validate authentication tokens
