# Implementation status

> Last verified against code: 2026-09-24  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `1e35386`

This ledger is based on the current repository contents and versioned migrations. An old README, release note, comment, or product prompt is not treated as proof that code is live or a migration has been applied to a hosted project.

## Complete and verified in the repository

| Area | Evidence | Status |
| --- | --- | --- |
| Next.js App Router, TypeScript, pnpm scripts | `package.json`, `app/`, `tsconfig.json`, lockfile | Complete; build/test commands are defined. |
| Supabase SSR client and callback flow | `lib/supabase/{client,server,proxy}.ts`, `proxy.ts`, `app/auth/callback/route.ts` | Complete in code; covered by route structure, not a hosted auth smoke test. |
| Public landing and unauthenticated journey-start path | `app/page.tsx`, `app/start/page.tsx`, `components/mama/public-journey-start.tsx` | Complete in code. |
| Authenticated care records and modular repositories | `app/api/records/route.ts`, `lib/repositories/care.ts` | Complete in code; API/unit tests exist for selected paths. |
| Profile, first-data onboarding, journey anchors | `components/mama/first-data-onboarding.tsx`, `202609220001_personalisation_profile_theme.sql` | Complete in code. |
| Demo/account isolation controls | `lib/repositories/demo.ts`, `app/api/demo/route.ts`, demo migrations | Complete in code; requires hosted RLS verification. |
| Mobile navigation and engagement data model | `components/mama/mobile-bottom-navigation.tsx`, engagement repository/migrations | Complete in code. |
| Medication/investigation private records | `lib/repositories/care-details.ts`, `202609160001_expand_lifelong_journeys.sql` | Complete in code; migration application is unverified. |
| RLS regression test source | `supabase/tests/rls.sql` | Test source exists and covers patient/clinician isolation; execution against a live/local database is not evidenced here. |

## Implemented but unverified in a hosted environment

- The migrations define RLS, grants, storage policy, notification preferences, outbox, push-subscription, delivery-log, demo-state, personalization, and provider discovery rules. No repository evidence proves all migrations are applied to the intended staging/production Supabase projects.
- Browser push subscription persistence and the service worker exist, but delivery-provider configuration and end-to-end push delivery are not verified.
- The Postgres notification queue function exists, but the scheduled pg_cron job is only documented in SQL comments and is not enabled by this repository.
- Vercel production/preview deployments have existed historically, but this audit does not re-verify current deployment aliases, environment variables, callback URLs, or live data isolation.

## In progress

- Consultation product architecture: provider discovery fields and booking tables exist, but the application flow, payments, meeting rooms, and operational tooling are absent. See [the active plan](exec-plans/active/consultation-platform-v1.md).
- Production notification delivery: generic in-app queueing is present; secure scheduled execution and external push delivery remain deployment work.
- Clinical/privacy release hardening: hosted RLS tests, retention, incident response, governance review, and transactional email delivery require controlled environment evidence.

## Not implemented

- Patient-facing consultation service selection, slot browsing, slot reservation/hold expiry, booking confirmation, cancellation/refund policy UI, and booking status workflow.
- Dr Peace provider seed/provisioning and consultant dashboard.
- Paystack initialization, callback verification, webhook idempotency, transaction ledger, refund handling, and reconciliation.
- Whereby room creation, secure join-token delivery, expiry, and consultation room lifecycle.
- Consultation-specific notification scheduling and delivery tied to paid bookings.
- Calendar export, automated provider availability management, and a production operations/admin surface.
- A checked-in CI gate that runs the full lint/build/test/RLS release sequence.

## Blocked or dependent on external decisions

- Real consultation launch is blocked until provider credentials/profile, clinical governance, Paystack merchant/webhook configuration, Whereby account/API details, refund/cancellation policy, tax/settlement rules, and a tested production email/push delivery path are supplied and reviewed.
- Acceptance of real health data remains blocked until hosted migration/RLS verification, privacy/retention/incident-response review, and controlled production smoke tests are complete.

## Coverage matrix

| Area | Status | Evidence | Verification | Known gap / next action |
| --- | --- | --- | --- | --- |
| Foundation: Next.js/TypeScript/Supabase | COMPLETE | `package.json`, `app/`, `lib/supabase/`, migrations | Repository inspection; prior build evidence in release note | Re-run in a controlled workspace if needed. |
| Foundation: Vercel, staging, production | IMPLEMENTED / UNVERIFIED | README and release note describe deployment; no checked-in Vercel config | Current aliases/envs not verified in this audit | Confirm linked project, aliases, envs, and deployment gates. |
| Auth: registration, verification, login, logout, recovery | IMPLEMENTED / UNVERIFIED | `auth-form.tsx`, callback, reset page, `proxy.ts` | No live email/session smoke test here | Test controlled accounts and callback allowlist. |
| Auth: protected routes/sessions | IMPLEMENTED / UNVERIFIED | `app/page.tsx`, server `getUser()`, proxy refresh | Hosted session behavior not re-run | Verify expiry, redirect, and sign-out invalidation. |
| Profile, settings, appearance, privacy/sharing | IMPLEMENTED / UNVERIFIED | `MamaApp`, profile/preferences migrations, sharing API | RLS source exists; hosted RLS not run | Verify two-user isolation and revocation. |
| Onboarding, empty states, demo replacement | IMPLEMENTED / UNVERIFIED | public journey start, first-data onboarding, demo repository/API | Code path inspected; no live data test | Test seed/switch/hide/delete with real account rows. |
| Themes: light/dark/system | IMPLEMENTED / UNVERIFIED | `globals.css`, layout theme bootstrap, preference updates | No browser matrix run here | Verify SSR flash, mobile contrast, and persistence. |
| Health journeys | IMPLEMENTED / UNVERIFIED | `care-model.ts`, education, onboarding; stages include first period, cycle, reproductive health, preconception, trying, pregnancy, postpartum, recovery, perimenopause, menopause | Static code inspection | Birth is represented as education/postpartum context, not a standalone stage. Test copy and transitions. |
| Tracking: cycles/symptoms/pregnancy/postpartum/care | IMPLEMENTED / UNVERIFIED | repositories, APIs, `MamaApp`, core migrations | Unit/API sources exist; no full hosted flow | Verify validation and RLS for each record type. |
| Tracking: medicines/supplements/investigations | IMPLEMENTED / UNVERIFIED | `care-details` API/repository and migration | Migration/live RLS unverified | Apply and test controlled migration. |
| Engagement: notifications/push/achievements/insights/recap | IN PROGRESS | engagement migration/repository, push route/service worker, descriptive insight cards | No production scheduler/push verification | Finish worker, scheduling, delivery retries, and weekly recap semantics. |
| Clinical safety and sensitive transitions | IMPLEMENTED / UNVERIFIED | help modal, education safety copy, recovery stage, suppression logic | Copy/code inspected; clinical governance not evidenced | Clinical review and urgent-path browser tests. |
| Consultations: provider model | IN PROGRESS | `providers` table, active/default/featured fields, provider policies | Schema source only | Provision Dr Peace without hard-coded UUID; verify provider onboarding. |
| Consultations: Dr Peace | NOT IMPLEMENTED | Design Lab fixture only | Fixture is not production data | Create reviewed provider/service seed process. |
| Consultations: 30/60 services, intake, safety gate, duration | NOT IMPLEMENTED | No patient workflow/API | None | Build configurable service/intake model. |
| Consultations: availability, slots, holds, booking | IN PROGRESS | `provider_availability` and `consultation_bookings` tables only | No conflict/hold implementation | Add server slot generation, expiry, overlap protection, and booking API. |
| Consultations: dashboard, notes, summaries, follow-up | NOT IMPLEMENTED | No consultant/admin routes or note tables | None | Design provider boundary and publication workflow. |
| Payments: abstraction/Paystack/init/verify/webhooks/refunds | NOT IMPLEMENTED | No payment code/tables | None | Implement server-authoritative payment plan in active execution plan. |
| Video: abstraction/Whereby/rooms/join/pre-call/embed | NOT IMPLEMENTED | No Whereby code or room tables | None | Add provider abstraction after payment/booking design. |
| Security: RLS/RBAC/sharing/audit/secrets | IMPLEMENTED / UNVERIFIED | migration policies, role helpers, sharing API, audit table, env example | SQL test source exists; not executed here | Run hosted RLS matrix and review `SECURITY.md` gates. |
| Deployment/migrations | IMPLEMENTED / UNVERIFIED | migration history, package scripts, release note | No hosted migration verification | Reconcile staging then production migration state. |
| Admin/consultant operations | NOT IMPLEMENTED | No admin/consultant UI or routes | None | Define role boundaries and operational surface. |
| Tests/fixtures/Design Lab | IMPLEMENTED / UNVERIFIED | `tests/`, `supabase/tests/rls.sql`, `/design-preview` | Prior release note reports selected tests/build; this audit did not rerun due pnpm environment | Run tests in clean CI-like environment; keep fixtures preview-only. |
