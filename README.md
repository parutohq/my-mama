# My MAMA

A private maternal and reproductive-care companion for women in Nigeria.

## Production foundation

- **Next.js App Router + TypeScript + Tailwind** for the application.
- **Supabase Auth** for confirmed email/password accounts and cookie-backed sessions.
- **Supabase PostgreSQL** for personal care records, RLS, migrations and later private storage.
- **Vercel** for Preview deployments from feature branches and the live deployment from `main`.

Sensitive data never relies on browser storage or a generic JSON database field. The application uses relational records protected by Supabase Row Level Security. A patient can access only her own records; clinicians require an accepted care relationship or an active, scoped sharing permission.

## Rebuild sequence

1. Keep the existing authentication, verified server session and RLS foundation.
2. Replace the original all-in-one record handler with modular Supabase repositories. The legacy UI adapter remains only while screens are migrated one by one.
3. Rebuild the authenticated patient experience around Today, Journal, Care, Learn and Care Summary.
4. Add patient-controlled sharing, clinician profiles and consultation workflows only after the patient records flow is complete.
5. Add exports, audit events, descriptive trends, production monitoring and clinical/privacy review gates.

## Local setup

Create `.env.local` from `.env.example`, then add the Supabase project URL and publishable key:

```bash
pnpm install
pnpm dev
```

Never commit `.env.local`, a database password, or a Supabase service-role key.

## Checks

```bash
pnpm test
pnpm lint
pnpm build
```

Before accepting real health data, verify RLS for anonymous users, two patients, and clinicians with and without an active care relationship. Use a separate Supabase production project before public launch.
