# Plan: Restructure Project Firefly for Dev / QA / Production

## Context

The current codebase is a working MVP demo, but demo assumptions are deeply embedded:
- 3 hardcoded UUIDs in `checkout/page.tsx`, `vendor/page.tsx`, `delivery/page.tsx`
- No authentication at all (no middleware, no login, no session checks)
- API routes trust client-sent user IDs without validation
- Single Supabase project, no CI/CD, no environment separation

The architecture, schema, UI, and real-time logic are all production-quality — only the identity/auth layer needs restructuring. The goal is to decouple demo behavior from production code while keeping a demo/QA site always available.

## Target Environment Setup

| Environment | Trigger | Supabase | Demo Mode | URL |
|---|---|---|---|---|
| **Development** | `npm run dev` | Dev project | `true` | localhost:3000 |
| **Staging / QA** | PR opened → Vercel preview | Staging project | `true` | pr-123.vercel.app |
| **Production** | Merge to `main` → Vercel prod | Prod project | `false` | firefly.app |

Vercel preview deployments = automatic QA/demo site per PR. No extra branches needed.

---

## Phase 1: Centralize Demo Config (zero-risk refactor)

**GitHub Issue:** [#1](https://github.com/WWStoryMode/project-firefly/issues/1)

Extract hardcoded IDs into one module, gated by an env var. Behavior stays identical.

**Create** `src/lib/config/demo.ts`
- Export `DEMO_MODE` flag from `NEXT_PUBLIC_DEMO_MODE` env var
- Export `DEMO_IDS` object with the 3 hardcoded UUIDs
- Export `isDemoMode()` helper

**Modify** 3 files to import from the central config instead of declaring local constants:
- `src/app/checkout/page.tsx` — replace `DEMO_CUSTOMER_ID` with `DEMO_IDS.CUSTOMER_ID`
- `src/app/vendor/page.tsx` — replace `DEMO_VENDOR_ID` with `DEMO_IDS.VENDOR_ID`
- `src/app/delivery/page.tsx` — replace `DEMO_DELIVERY_PERSON_ID` with `DEMO_IDS.DELIVERY_PERSON_ID`

**Modify** `.env.local` and `.env.local.example` — add `NEXT_PUBLIC_DEMO_MODE=true`

**Verify**: `npm run dev` + `npm run build` work identically to before.

---

## Phase 2: Git Branching + CI/CD

**GitHub Issue:** [#2](https://github.com/WWStoryMode/project-firefly/issues/2)

Establish the development workflow before making bigger code changes.

**Branching model**: GitHub Flow (simple)
- `main` = production-ready, auto-deploys to Vercel production
- Feature branches (`feature/`, `fix/`, `chore/`) created from `main`
- Every PR gets automatic Vercel preview deployment (staging env vars)
- Squash-merge to `main`

**Create** `.github/workflows/ci.yml`
- Runs on PRs to `main` and pushes to `main`
- Steps: checkout → setup Node (.nvmrc) → `npm ci` → lint → type-check (`tsc --noEmit`) → build
- Build uses placeholder Supabase env vars (only needs compile-time values)

**Modify** `package.json` — add `"type-check": "tsc --noEmit"` script

**Create** `docs/CONTRIBUTING.md` — branch naming, PR process, CI requirements

---

## Phase 3: Multi-Environment Configuration

**GitHub Issue:** [#3](https://github.com/WWStoryMode/project-firefly/issues/3)

Set up separate Supabase projects and Vercel env var configuration.

**Create** 3 Supabase projects: `firefly-dev`, `firefly-staging`, `firefly-prod`
- Run migrations on all three
- Run `seed.sql` on dev and staging only (not prod)

**Configure Vercel** environment variables (in dashboard):
- Preview: staging Supabase URL/key + `DEMO_MODE=true`
- Production: prod Supabase URL/key + `DEMO_MODE=false`

**Update** `.env.local.example` — document all env vars with comments for each environment

**Modify** `src/app/layout.tsx` — add a small "DEMO MODE" banner when demo mode is on:
```tsx
{process.env.NEXT_PUBLIC_DEMO_MODE === 'true' && (
  <div className="bg-amber-500 text-white text-center text-xs py-1">
    DEMO MODE
  </div>
)}
```

**Create** `docs/ENVIRONMENTS.md` — document setup for each Supabase project + Vercel config

---

## Phase 4: Authentication Layer (the big one)

**GitHub Issue:** [#4](https://github.com/WWStoryMode/project-firefly/issues/4)

Add Supabase Auth that activates when `DEMO_MODE=false`. Demo mode keeps working unchanged.

**Create** `src/hooks/use-auth.tsx` — Auth context provider
- In demo mode: returns synthetic session using demo IDs based on current role
- In production mode: wraps `supabase.auth.getSession()` / `onAuthStateChange()`
- Exposes: `user`, `loading`, `signIn()`, `signUp()`, `signOut()`
- Exposes role-specific ID getters that return demo ID or real profile ID

**Create** `src/middleware.ts` — Next.js middleware for route protection
- In demo mode: passes everything through (no-op)
- In production mode: checks Supabase session, redirects to `/login` if unauthenticated
- Refreshes auth tokens on each request (standard Supabase SSR pattern)
- Public routes: `/`, `/login`, `/register`, `/vendors` (browsing)

**Create** `src/app/login/page.tsx` — email/password login with Supabase Auth
**Create** `src/app/register/page.tsx` — signup with role selection

**Modify** `src/app/layout.tsx` — wrap app with `<AuthProvider>`

**Modify** 3 role pages to use auth context:
- `src/app/checkout/page.tsx` — `isDemoMode() ? DEMO_IDS.CUSTOMER_ID : auth.user.id`
- `src/app/vendor/page.tsx` — `isDemoMode() ? DEMO_IDS.VENDOR_ID : auth.vendorId`
- `src/app/delivery/page.tsx` — `isDemoMode() ? DEMO_IDS.DELIVERY_PERSON_ID : auth.deliveryPersonId`

**Modify** 4 API routes — add auth guard when demo mode is off:
- `src/app/api/orders/route.ts`
- `src/app/api/orders/[id]/status/route.ts`
- `src/app/api/delivery/assignments/route.ts`
- `src/app/api/delivery/assignments/[id]/route.ts`

**Modify** `src/app/page.tsx` — in production mode, show sign-in/register instead of role picker

---

## Phase 5: Database Migration Tooling

**GitHub Issue:** [#5](https://github.com/WWStoryMode/project-firefly/issues/5)

Replace the manual copy-paste migration workflow.

**Modify** `scripts/setup-database.js` — accept `--env` flag, run migrations in order, conditionally seed
**Modify** `package.json` — add `db:setup:dev`, `db:setup:staging`, `db:setup:prod` scripts

---

## Implementation Order

```
Phase 1 (demo config)  →  Phase 2 (CI/CD)  →  Phase 3 (multi-env)  →  Phase 4 (auth)  →  Phase 5 (DB tooling)
```

Phase 1 is a pure refactor — safe to do immediately on `main`.
Phases 2 & 3 are infrastructure — no app code changes, can be done in parallel.
Phase 4 is the big feature — should be done on a feature branch with CI and preview deployments already in place.
Phase 5 is a workflow improvement — can be done anytime after Phase 3.

---

## Verification

After all phases:
- `DEMO_MODE=true`: App works exactly as it does today (hardcoded users, no login, demo data)
- `DEMO_MODE=false`: App requires login, uses real user IDs, API routes validate auth
- Every PR gets a Vercel preview deployment with demo mode ON for QA review
- Merges to `main` auto-deploy to production with demo mode OFF
- CI blocks PRs that fail lint, type-check, or build
