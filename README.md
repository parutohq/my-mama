# My MAMA

My MAMA is a private reproductive and maternal-care companion. It is a clinical-review prototype and must not accept real health data until Nigerian clinical, privacy, and operational reviews are complete.

## Production architecture

- **Next.js + Vercel:** application hosting, protected preview deployments, and production releases from `main`.
- **Supabase:** PostgreSQL, email/password authentication, private storage, migrations, RLS, and database tests.
- **Environment split:** use isolated London Supabase staging and production projects. Vercel previews use staging credentials; `main` uses production credentials.

The legacy Cloudflare/Vinext/D1 implementation and dispatcher authentication have been removed. The application maintains the existing care interface while mapping profile, check-in, period, appointment, and task records to relational tables.

## Local setup

1. Copy `.env.example` to `.env.local` and add the **staging** Supabase URL and publishable key.
2. Install and authenticate the Supabase CLI, link the staging project, then run `pnpm supabase:reset`.
3. Run `pnpm dev`.
4. After the project is linked, refresh checked-in database types with `pnpm supabase:types`.

Never commit `.env.local`, service-role keys, real health data, or production exports.

## Database and access control

`supabase/migrations/202609090001_initial_my_mama.sql` creates the production foundation. Every exposed sensitive table enables RLS and has explicit authenticated grants and policies. A clinician receives no patient data simply by holding a clinician role: access requires an accepted booking or an active, scoped, explicit sharing permission.

`supabase/tests/rls.sql` is the database test baseline. Extend it with allow and deny tests for every new policy before applying a migration to staging or production.

## Release flow

Create pull requests against `main`. Vercel previews must use staging-only credentials. Apply and test migrations in staging, validate sign-in and RLS, then merge reviewed changes to `main`; apply the same reviewed migration to production before accepting real records.

## Verification

- `pnpm exec tsc --noEmit`
- `pnpm test`
- `pnpm build`
- `pnpm supabase:test` after Supabase CLI setup
