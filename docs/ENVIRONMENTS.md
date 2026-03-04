# Environment Configuration

Project Firefly uses three environments, each with its own Supabase project and configuration.

## Overview

| Environment | Trigger | Supabase Project | URL |
|---|---|---|---|
| **Development** | `npm run dev` | `firefly-dev` | `localhost:3000` |
| **Staging / QA** | PR opened → Vercel preview | `firefly-staging` | `pr-123.vercel.app` |
| **Production** | Merge to `main` → Vercel prod | `firefly-prod` | `firefly.app` |

For demo purposes, use a separate Supabase project with seeded data (`supabase/seed.sql`). The same frontend code is used — only the Supabase URL and anon key differ.

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

## Vercel Configuration

Environment variables are set in the Vercel dashboard under **Settings → Environment Variables**.

### Preview Deployments (Staging/QA)

Every PR automatically gets a preview deployment. These use staging config:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://firefly-staging-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Staging anon key |

Set these with the **Preview** environment checkbox in Vercel.

### Production

Merges to `main` auto-deploy to production:

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://firefly-prod-ref.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Prod anon key |

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
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```
