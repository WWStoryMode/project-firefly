# Contributing to Project Firefly

## Branching Model

We use **GitHub Flow** — a simple branch-based workflow.

- `main` is always production-ready and auto-deploys to Vercel production
- All work happens on feature branches created from `main`
- Every PR gets an automatic Vercel preview deployment for QA

### Branch Naming

Use a prefix that describes the type of change:

| Prefix | Use for |
|---|---|
| `feature/` | New functionality |
| `fix/` | Bug fixes |
| `chore/` | Tooling, config, refactors, docs |

Examples: `feature/auth-layer`, `fix/checkout-redirect`, `chore/update-deps`

## Pull Request Process

1. Create a branch from `main`:
   ```bash
   git checkout main && git pull
   git checkout -b feature/my-feature
   ```

2. Make your changes, commit, and push:
   ```bash
   git push -u origin feature/my-feature
   ```

3. Open a PR targeting `main` on GitHub.

4. CI must pass before merging. The pipeline runs:
   - **Lint** — `npm run lint`
   - **Type check** — `npm run type-check`
   - **Build** — `npm run build`

5. Get a code review, then **squash-merge** to `main`.

## CI Requirements

All PRs must pass the CI pipeline before merging. You can run the checks locally:

```bash
npm run lint
npm run type-check
npm run build
```

## Local Development

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in your Supabase project credentials

# Start dev server
npm run dev
```

## Environment Variables

See `.env.local.example` for all required variables. Refer to `docs/ENVIRONMENTS.md` for environment-specific configuration.
