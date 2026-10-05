# Implementation status

> Last verified against code: 2026-09-25
> Repository branch: `design/mymama-premium-ui`  
> Commit: `98d8246`

This ledger is based on the current repository contents and versioned migrations. An old README, release note, comment, or product prompt is not treated as proof that code is live or a migration has been applied to a hosted project.

## Complete and verified in the repository

| Area | Evidence | Status |
| --- | --- | --- |
| Next.js App Router, TypeScript, pnpm scripts | `package.json`, `app/`, `tsconfig.json`, lockfile | Complete; build/test commands are defined. |
| Supabase SSR client and callback flow | `lib/supabase/{client,server,proxy}.ts`, `proxy.ts`, `app/auth/callback/route.ts` | Implemented / unverified; route structure is present, but no hosted auth smoke test was run in this reconciliation. |
| Public landing and unauthenticated journey-start path | `app/page.tsx`, `app/start/page.tsx`, `components/mama/public-journey-start.tsx` | Implemented / unverified; the public path is present, but hosted responsive rendering was not re-run. |
| Authenticated care records and modular repositories | `app/api/records/route.ts`, `lib/repositories/care.ts` | Complete in code; API/unit tests exist for selected paths. |
| Profile, first-data onboarding, journey anchors | `components/mama/first-data-onboarding.tsx`, `app/mama-app.tsx`, `202609220001_personalisation_profile_theme.sql` | Implemented / unverified; profile/settings, history, and first-data paths exist, but end-to-end persistence and hosted migration state were not verified. |
| Demo/account isolation controls | `lib/repositories/demo.ts`, `app/api/demo/route.ts`, demo migrations | Implemented / unverified; code explicitly filters demo/account rows and supports switch/hide/delete, but hosted RLS and cross-account tests were not run. |
| Mobile navigation and engagement data model | `components/mama/mobile-bottom-navigation.tsx`, engagement repository/migrations | Implemented / unverified; controls and persistence paths exist, but mobile/accessibility and hosted delivery behavior were not re-verified. |
| Medication/investigation private records | `lib/repositories/care-details.ts`, `202609160001_expand_lifelong_journeys.sql` | Complete in code; migration application is unverified. |
| RLS regression test source | `supabase/tests/rls.sql` | Test source exists and covers patient/clinician isolation; execution against a live/local database is not evidenced here. |

## Implemented but unverified in a hosted environment

- The migrations define RLS, grants, storage policy, notification preferences, outbox, push-subscription, delivery-log, demo-state, personalization, and provider discovery rules. No repository evidence proves all migrations are applied to the intended staging/production Supabase projects.
- Browser push subscription persistence and the service worker exist, but delivery-provider configuration and end-to-end push delivery are not verified.
- The Postgres notification queue function exists, but the scheduled pg_cron job is only documented in SQL comments and is not enabled by this repository.
- Vercel production/preview deployments have existed historically, but this audit does not re-verify current deployment aliases, environment variables, callback URLs, or live data isolation.

## In progress

- Pregnancy Journey Engine: IMPLEMENTED / TECHNICALLY VERIFIED in code. `lib/journey-engine.ts` provides reusable journey definitions, milestones, goal statuses, week calculation, and non-clinical progress calculations. `components/mama/pregnancy-journey-home.tsx` provides the mobile-first pregnancy journey home, map, goals, learning placeholder, scenario placeholder, and MAMA context hooks using existing records. Clinical content, wellbeing escalation rules, and reviewed scenario answers remain outstanding.

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

## Verification run — 2026-09-24/25

The current branch Preview for commit `98d8246` was identified in Vercel as `https://mymamaapp-87ki4pm2f-jonathanobises-projects.vercel.app/`. Read-only browser verification confirmed the public journey-start page, its seven journey choices, and the Preview Design Lab. Cycle, pregnancy, and postpartum fixture states rendered and remained explicitly illustrative. The production `/design-preview` route returned the expected 404.

Vercel Preview and Production are intentionally configured to use the same shared Supabase project. Preview is not staging and is not database-isolated. The currently identified Supabase dashboard project is `fdgfiiymnpvtlkauzaos`; hosted migration completeness remains unverified. New-user account creation, email confirmation, two-account RLS isolation, demo persistence, profile persistence, and authenticated theme persistence are now **READY FOR CONTROLLED VERIFICATION** using synthetic accounts only. Destructive migration/reset tests, mass deletion, test-only migrations, live payments, bulk notification delivery, and destructive admin operations remain **BLOCKED** because they could affect unrelated Production records.

Controlled accounts required: **Test Patient A**, **Test Patient B**, and **Test Unverified User**. Do not use genuine patient information or create production consultant/admin accounts for this phase.

Local validation on this commit: `pnpm test` passed (12 tests); `pnpm exec tsc --noEmit` passed; `pnpm lint` failed on pre-existing accessibility/TypeScript/Deno diagnostics across application and Edge Function files; `pnpm build` was blocked by the sandbox denying Turbopack subprocess/port creation (`Operation not permitted`). No application files were changed by these checks.

## Coverage matrix

## Phase 1 verification run — 2026-09-25

- **Preview:** `https://mymamaapp-87ki4pm2f-jonathanobises-projects.vercel.app/` rendered successfully.
- **Public journey path:** PASS for landing and journey selection. The deployed UI exposes Growing up, My cycle, Planning ahead, Trying for a baby, Pregnancy, After birth, and Midlife, plus optional name capture.
- **Registration surface:** PASS for rendering; account creation was not submitted because no controlled test email address was available in this session.
- **Design Lab:** PASS for Preview. Cycle, pregnancy, and postpartum fixtures rendered with illustrative labels and no account/health-record claims. No production route was changed.
- **Authenticated verification:** BLOCKED pending controlled synthetic identities and email confirmation access. No accounts were created and no health data was entered.
- **Responsive matrix:** NOT COMPLETED; authenticated and responsive checks require the controlled account pass and supported viewport runner.
- **Local checks:** `pnpm test` passed (12 tests), `pnpm exec tsc --noEmit` passed. `pnpm lint` failed on existing accessibility, chart TypeScript, and Deno Edge Function diagnostics. Build was not rerun in this pass; prior sandbox Turbopack process/port restriction remains documented.

| Area | Status | Evidence | Verification | Known gap / next action |
| --- | --- | --- | --- | --- |
| Foundation: Next.js/TypeScript/Supabase | COMPLETE | `package.json`, `app/`, `lib/supabase/`, migrations | Repository inspection; prior build evidence in release note | Re-run in a controlled workspace if needed. |
| Foundation: Vercel, shared Preview/Production | IMPLEMENTED / UNVERIFIED | Vercel project and environment metadata; shared Supabase topology documented above | Hosted migration completeness and end-to-end env value matching remain unverified | Run controlled synthetic verification; do not call Preview staging. |
| Auth: registration, verification, login, logout, recovery | READY FOR CONTROLLED VERIFICATION | `auth-form.tsx`, callback, reset page, `proxy.ts`; shared database boundary documented | No live email/session smoke test here | Test only Test Patient A/B and Test Unverified User. |
| Auth: protected routes/sessions | IMPLEMENTED / UNVERIFIED | `app/page.tsx`, server `getUser()`, proxy refresh | Hosted session behavior not re-run | Verify expiry, redirect, and sign-out invalidation. |
| Profile, settings, appearance, privacy/sharing | READY FOR CONTROLLED VERIFICATION | `MamaApp`, profile/preferences migrations, sharing API | Hosted RLS not run | Verify with synthetic users and no destructive cleanup. |
| Onboarding, empty states, demo replacement | READY FOR CONTROLLED VERIFICATION | public journey start, first-data onboarding, demo repository/API | Code path inspected; no live data test | Test with synthetic account rows; avoid ambiguous health-data seeds. |
| Themes: light/dark/system | READY FOR CONTROLLED VERIFICATION | `globals.css`, layout theme bootstrap, preference updates | No browser matrix run here | Verify SSR flash, mobile contrast, and persistence without changing shared data. |
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

## Verification attempt — 2026-09-25 (synthetic registrations)

- **Registration submission:** PASS — Preview accepted all three supplied synthetic identities and displayed the confirmation-required state for each.
- **Email confirmation:** BLOCKED — confirmation mail was not observed at the forwarded mailbox, so no confirmation link was opened.
- **Unverified-user behaviour, login/logout, persistence, RLS, demo isolation, profile/settings, themes, and authenticated responsive layouts:** BLOCKED pending confirmed sessions.
- **Safety:** no health records were entered, no migrations or configuration were changed, and no unrelated records were touched. No critical RLS failure was encountered because authenticated/RLS checks could not start.
- **Required unblock:** inspect Supabase Auth delivery/audit logs or provide a directly accessible mailbox for the synthetic identities. Do not provide credentials; a delivery status or screenshot is sufficient.

**Additional evidence supplied 2026-09-25:** Supabase Auth Users shows all three synthetic accounts present with `Confirmation sent at` timestamps and no `Confirmed at` value; per-user Auth logs show HTTP 200 `/signup` requests. This verifies signup acceptance and confirmation-email initiation, but not mailbox delivery or link usability.

## Cycle intelligence reconciliation — 2026-09-25

- **Cycle records and calculations:** IMPLEMENTED / UNVERIFIED. Period, check-in, symptom, care, medication, investigation, and cycle-day models exist. Medication records still have no user-selected date, so they are not assigned to calendar cells.
- **Cycle calendar foundation:** IMPLEMENTED / UNVERIFIED. `components/mama/care-calendar.tsx` is integrated into the authenticated My Journal view for cycle-mode journeys. It provides a Monday-first month grid, previous/next/today navigation, recorded period/check-in/care/investigation markers, day details, empty states, and add-check-in/add-period entry points. It uses existing repositories and makes no schema changes. Hosted responsive, accessibility, and RLS verification remain open.
- **Charts and calendar primitives:** IMPLEMENTED / UNVERIFIED. Reusable chart/calendar primitives and the new calendar aggregation model exist; no dedicated Trends surface exists.
- **Typical hormone-pattern visualization:** IMPLEMENTED / TECHNICALLY VERIFIED — **CLINICAL REVIEW REQUIRED**. `components/mama/typical-hormone-pattern.tsx` renders normalized relative reference curves for estrogen, progesterone, LH, and FSH, with explicit typical-versus-recorded wording and an optional recorded cycle-day context marker. The relative shapes were authored without a cited clinical source; no clinical validation is claimed. It does not display laboratory units or make fertility/ovulation claims. Feature lint, TypeScript, automated tests, and a webpack production build pass. Hosted Preview, rendered accessibility, and viewport/theme verification remain blocked because the current Preview predates these uncommitted changes and local runtime requires unavailable Supabase environment variables.
- **Journey transitions/history:** IN PROGRESS. Journey stages, current journey selection, transition history, and sensitive-transition suppression exist; coexistence and full longitudinal browser verification remain open.
- **Journey-aware product areas:** IN PROGRESS. Home, Journey, Learn, Care, and profile vary by stage, but depth is uneven and unsupported states require truthful completion.
- **Food for Your Journey:** NOT IMPLEMENTED as a dedicated experience.
- **MAMA Products/catalogue:** NOT IMPLEMENTED; no catalogue or commerce architecture was found.
- **Consultation entry points:** IMPLEMENTED / UNVERIFIED as a Dr Peace fixture/CTA only. Real provider provisioning and consultation delivery remain governed by the consultation plan.
