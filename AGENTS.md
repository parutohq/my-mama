# My MAMA agent guide

> Documentation metadata is current as of 2026-09-24, branch `design/mymama-premium-ui`, commit `1e35386`. Reconcile it against code after meaningful changes.

This file is the short operating guide for the repository. Read the linked documents before changing product behaviour, data access, auth, or deployment configuration.

## Source of truth

- [ARCHITECTURE.md](ARCHITECTURE.md) describes the architecture that is actually present.
- [docs/IMPLEMENTATION_STATUS.md](docs/IMPLEMENTATION_STATUS.md) is the evidence-based status ledger.
- [docs/PRODUCT_REQUIREMENTS.md](docs/PRODUCT_REQUIREMENTS.md) separates current requirements from intended work.
- [docs/BUSINESS_RULES.md](docs/BUSINESS_RULES.md) contains stable product rules.
- [docs/SECURITY.md](docs/SECURITY.md) contains auth, RLS, secrets, and release gates.
- [docs/DATABASE.md](docs/DATABASE.md) describes the versioned Supabase schema.
- [docs/exec-plans/active/](docs/exec-plans/active/) contains work that is not complete.

Inspect the repository before relying on these documents; code and migrations are authoritative when they disagree.

## Working rules

1. Preserve the App Router, Supabase SSR session flow, repository/data-access boundaries, and migration history unless a plan explicitly changes them.
2. Treat Supabase migrations and RLS as production security code. Never use browser storage as the canonical store for health data, and never expose service-role or secret keys to the client.
3. Do not infer clinical status, diagnosis, fertility, risk, or outcomes from descriptive records. Keep emergency guidance separate from routine app flows.
4. Keep demo records explicitly isolated from account records and removable by the account owner.
5. Mark work as verified only when repository evidence or a reproducible test supports it. Do not promote a roadmap, comment, or old release note to implementation evidence.
6. For schema changes, add a reviewed migration, update tests/types, and verify RLS in a controlled Supabase environment before production.
7. Preserve light/dark/system support and mobile-first design. Do not silently change stable business rules. Clinical safety pathways must not depend solely on unrestricted AI.

## Local checks

From the repository root:

```bash
pnpm test
pnpm lint
pnpm build
```

Use `pnpm supabase:test` only against a deliberately configured local/controlled database. Keep `.env.local`, database passwords, service-role keys, Paystack secrets, and meeting-provider credentials out of git.
