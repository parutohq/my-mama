# Security and privacy boundaries

> Last verified against code: 2026-09-24  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `1e35386`

## Authentication

Supabase email/password Auth is used with SSR cookies. The server creates a request-scoped Supabase client, refreshes sessions in `proxy.ts`, and uses `auth.getUser()` in protected routes. Callback redirects must remain allowlisted and same-origin/safe-path validated. Password recovery uses the Supabase recovery flow.

## Authorization and RLS

The initial migration enables RLS on patient, provider, sharing, content, audit, and booking tables. Patient policies compare ownership to `auth.uid()`. Clinician reads of health events, symptoms, and cycles pass through `can_provider_access_patient`, which requires a clinician role and an accepted/completed booking or active scoped share. Demo and engagement migrations add owner-scoped policies. Anonymous access is limited to published clinical content; sensitive tables revoke anon/authenticated grants before granting the minimum authenticated operations.

The current policy source needs live execution against controlled users before release. In particular, verify UPDATE `USING`/`WITH CHECK`, provider access after cancellation/revocation, demo isolation across two users, storage folder boundaries, and that hosted grants match migrations.

The role model currently contains `patient`, `clinician`, and `admin` values, but no admin/consultant application surface was found. Role existence in the database is not equivalent to a complete RBAC product.

## Secrets and client boundaries

Only `NEXT_PUBLIC_SUPABASE_URL`, the Supabase publishable key, and a VAPID public key are browser-safe. Supabase secret/service-role keys, database passwords, VAPID private keys, Paystack secret keys, webhook secrets, and Whereby/API credentials must be server-only Vercel/Supabase environment variables. Never commit `.env.local` or paste secrets into issues, logs, or client metadata.

## Notifications

The notification schema stores subscriptions and delivery history with owner RLS. The queue function is `SECURITY DEFINER` and deliberately has no role grants; any production scheduler must be a reviewed privileged path with a secret/identity check and least privilege. Generic copy is required for lock screens. External push delivery is not yet production-complete.

## Consultation/payment security requirements

The current repository has no Paystack or Whereby implementation. Before adding it: initialize Paystack only server-side; verify transaction status with Paystack, amount, currency, reference, and expected user/booking; make callbacks and webhooks idempotent; authenticate and replay-protect webhooks; never trust browser success redirects; keep payment records separate from clinical records; encrypt/minimize meeting data; issue short-lived authorized join links; and log security-relevant state transitions without sensitive clinical content.

## Release gates

Do not accept real health data or launch paid consultation until hosted migrations and RLS tests pass, auth/callback/email delivery are smoke-tested, secrets are configured, notification scheduling is reviewed, privacy/retention/incident-response and clinical governance are approved, and production observability is in place.

## Current versus required

**Currently implemented:** Supabase Auth wiring, cookie sessions, owner-scoped RLS, provider relationship checks, patient-controlled sharing, private storage policy, demo separation, notification minimization, and environment examples.

**Required before production consultation:** complete RBAC surfaces, hosted RLS execution, Paystack webhook/idempotency/refund controls, private Whereby authorization, clinician-note publication controls, audit coverage for financial/consultation transitions, and verified monitoring/incident procedures. No compliance certification or legal compliance claim is made here.
