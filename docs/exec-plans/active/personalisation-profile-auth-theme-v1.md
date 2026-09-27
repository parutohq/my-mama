# Personalisation, profile, auth, and theme v1 — reconciliation plan

> Last verified against code: 2026-09-25  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `98d8246`

This plan contains only gaps between `docs/specs/personalisation-profile-auth-theme-v1.md` and the current repository. The specification is treated as intended product behaviour; code and migrations remain authoritative. Existing systems must be extended or verified before any new system is proposed.

## Phase 1 — verify the existing account and onboarding paths

### Gap 1: hosted end-to-end verification is missing

- **Current state:** The repository contains Supabase SSR auth, public journey selection, `mama_start_intent` handoff, signed-in first-data onboarding, profile editing, and protected care views. No evidence in this branch proves the complete journey from public selection through email confirmation, callback, onboarding persistence, and return to the personal Home in a controlled preview environment.
- **Required state:** The existing flow is verified with controlled test accounts and documented evidence; no duplicate onboarding or auth flow is introduced.
- **Affected files/systems:** `app/page.tsx`, `components/mama/public-journey-start.tsx`, `components/mama/auth-form.tsx`, `components/mama/first-data-onboarding.tsx`, `app/auth/callback/route.ts`, Supabase Auth, `/api/records`.
- **Dependencies:** Preview deployment, configured Supabase redirect URLs, test email access, and dedicated synthetic accounts. Preview and Production intentionally share Supabase; Preview is not staging.
- **Acceptance criteria:** Journey choice and optional name survive signup; unverified users cannot access protected care data; callback and sign-out work; saved first data appears only in the signed-in account.
- **Validation required:** Browser smoke test on Preview, Auth callback/log inspection, and targeted API/RLS checks using Test Patient A/B and Test Unverified User only. No destructive cleanup or migration tests.

### Gap 2: profile surface completeness and mobile accessibility are unverified

- **Current state:** `MamaApp` already exposes profile/privacy, editable identity and journey, journey history, appearance, notifications, care contact, achievements, demo controls, sharing, export, deletion, and sign-out. The specification’s requirement is broader than a single settings view, and no current evidence verifies keyboard/screen-reader/mobile behaviour for the full surface.
- **Required state:** The existing profile surface is verified as the account hub on mobile and desktop, with all controls reachable, labelled, and usable without exposing another user’s data. Any missing control discovered by testing should be added to the existing settings architecture.
- **Affected files/systems:** `app/mama-app.tsx`, `components/mama/mobile-bottom-navigation.tsx`, `app/globals.css`, profile/preferences/demo repositories and APIs.
- **Dependencies:** Phase 1 account fixture and a supported browser/device matrix.
- **Acceptance criteria:** Profile is reachable from header and mobile navigation; edit/save, theme, notification, demo switch/hide/delete, sharing revoke, export/delete, and sign-out controls are keyboard accessible and preserve account isolation.
- **Validation required:** Responsive browser matrix, keyboard traversal, accessible-name/contrast audit, and two-account isolation test.

## Phase 2 — close canonical persistence and theme gaps

### Gap 3: theme bootstrap can drift from the canonical account preference

- **Current state:** `profile_preferences.theme` is persisted through the engagement/profile path and CSS supports light/dark/system, but `app/layout.tsx` also bootstraps from `localStorage('mama-theme')`. This is a flash-prevention cache, not the canonical store, and it can be stale or absent across devices.
- **Required state:** Supabase remains canonical; the bootstrap must be explicitly reconciled so stale browser storage cannot override a loaded account preference, and system mode must follow the device setting without hydration or contrast regressions.
- **Affected files/systems:** `app/layout.tsx`, `app/mama-app.tsx`, `app/globals.css`, profile preference repository/migration.
- **Dependencies:** Authenticated profile load and browser verification from Phase 1.
- **Acceptance criteria:** Account preference wins after hydration; system mode responds to OS changes; signed-out/public pages have a deterministic theme; no health data is stored in browser storage.
- **Validation required:** Light/dark/system browser matrix, reload/device comparison, hydration-console check, and preference persistence test.

## Phase 3 — reconcile Dr Peace and preview boundaries

### Gap 4: Dr Peace is specified but not provisioned in production data

- **Current state:** Provider schema fields support `is_featured` and `is_default`, and the Design Lab contains a Dr Peace fixture. There is no production provider seed/provisioning flow, active service record, or verified availability; the UI must not present the fixture as a real consultant.
- **Required state:** A reviewed, repeatable provider provisioning process creates Dr Peace as the default/featured consultant only when the provider, services, and availability are real. Additional consultants remain supported through provider IDs and discovery, not a hard-coded UUID.
- **Affected files/systems:** Provider migrations/data, `lib/repositories/providers.ts`, consultation UI/API boundaries, Supabase staging data, and [consultation-platform-v1.md](consultation-platform-v1.md).
- **Dependencies:** Consultation platform plan, clinical governance, provider credentials/profile, service pricing, availability policy, and staging data access.
- **Acceptance criteria:** Production-facing code never confuses a fixture with Dr Peace; provider selection is data-driven; no consultant is shown as bookable without active service and availability.
- **Validation required:** Staging data inspection, provider/RLS tests, and preview browser test. Do not implement the consultation system in this documentation task.

### Gap 5: Design Lab availability and fixture isolation need release evidence

- **Current state:** `/design-preview` is fixture-backed, avoids care data, and is hidden in Vercel production via `notFound()`. Its selectors cover representative visual states, but no current evidence verifies preview-only routing and responsive rendering on the intended deployment.
- **Required state:** Design Lab remains a non-production comparison surface, never reads or mutates patient records, and renders the representative states correctly at supported breakpoints.
- **Affected files/systems:** `app/design-preview/page.tsx`, `components/mama/design-preview-client.tsx`, `components/mama/home-visual-prototype.tsx`, Vercel preview configuration.
- **Dependencies:** A current Vercel Preview deployment and browser verification tooling.
- **Acceptance criteria:** Preview route works only in non-production; production returns 404; state selectors are labelled and deterministic; no Supabase care request occurs.
- **Validation required:** Preview/production route checks, network inspection, responsive screenshots, and console-error scan.

## Explicitly out of scope for this plan

- Rebuilding the existing auth, profile, demo, onboarding, or theme systems without a verified gap.
- Creating migrations solely because the old specification suggested them.
- Implementing consultation, Paystack, Whereby, or changing `consultation-platform-v1.md`; the only dependency is the cross-reference above.
- Deploying, changing external service configuration, or modifying application code in this reconciliation task.

## Phase 1 verification result — 2026-09-24/25

- **Preview identified:** `https://mymamaapp-87ki4pm2f-jonathanobises-projects.vercel.app/`, Vercel Preview for branch `design/mymama-premium-ui`, commit `98d8246`.
- **Verified:** Public journey-start rendering and seven journey choices; Design Lab rendering for cycle, pregnancy, and postpartum fixtures; production `/design-preview` returns 404; fixtures are labelled illustrative in the accessible page content.
- **Environment decision:** Preview and Production intentionally use the same shared Supabase project (`fdgfiiymnpvtlkauzaos` as identified in the Supabase dashboard). Preview is not staging and is not database-isolated.
- **Ready for controlled verification:** Email delivery, authenticated new-user flow, first-data persistence, two-account RLS isolation, demo persistence, profile persistence, and authenticated theme persistence may proceed with Test Patient A, Test Patient B, and Test Unverified User, synthetic values only, and reversible/non-destructive actions.
- **Still blocked/unsafe:** Destructive migrations or resets, mass deletion, test-only migrations, live payment transactions, bulk notification delivery, and destructive admin operations remain blocked because the shared database includes Production data.
- **Local validation:** `pnpm test` passed (12 tests); `pnpm exec tsc --noEmit` passed; `pnpm lint` failed on pre-existing repository diagnostics; `pnpm build` was blocked by sandbox process/port restrictions in Turbopack.
- **Plan status:** Phase 1 remains open. No later phase was started, no production data was accessed, and no application functionality was changed.

## Controlled verification boundary

The next Phase 1 pass must use only three dedicated synthetic identities: **Test Patient A**, **Test Patient B**, and **Test Unverified User**. Safe checks include signup, confirmation, login/logout, synthetic first-data persistence, cross-user RLS isolation, profile/settings, themes, demo isolation, Design Lab isolation, and responsive UI. Do not use genuine patient information, create consultant/admin accounts, apply migrations, reset shared tables, seed ambiguous health records, run mass deletion, send bulk notifications, or perform live payments.

## Verification attempt — 2026-09-25 (synthetic registrations)

- **Registration:** PASS at Preview for Test Patient A, Test Patient B, and Test Unverified User; each submission returned the expected confirmation-required message.
- **Confirmation delivery:** BLOCKED. The forwarded confirmation mail was not received/observed, so the callback and verified session cannot be tested.
- **Remaining Phase 1 checks:** BLOCKED — unverified-user enforcement, login/logout, session persistence, journey/first-data persistence, refresh/re-login, Patient A/B RLS isolation, anonymous isolation, demo isolation, profile/settings, theme persistence, and authenticated responsive layouts all require a confirmed synthetic session.
- **No side effects:** no health data, migrations, configuration changes, production changes, or unrelated records were touched.
- **Next action:** obtain a directly accessible synthetic mailbox or inspect read-only Supabase Auth delivery/audit logs to establish whether messages were queued, rejected, or delivered. Once a confirmation link is available, resume Phase 1 from email confirmation.

**Additional evidence supplied 2026-09-25:** Supabase Auth Users shows all three synthetic accounts with confirmation-sent timestamps and no confirmed timestamps; per-user Auth logs show successful HTTP 200 `/signup` requests. Signup and email initiation are therefore verified; mailbox delivery remains unverified and is the sole blocker before confirmation-dependent checks can resume.

## Verification attempt — 2026-09-25

- **Preview:** PASS — the current Preview URL rendered the public landing and journey-selection flow.
- **Journey selection:** PASS — all seven journey options and optional name capture were present.
- **Registration:** BLOCKED before submission — no controlled test email address with confirmation access was available. No account was created.
- **Design Lab:** PASS — cycle, pregnancy, and postpartum fixture states rendered and remained explicitly illustrative.
- **Authenticated persistence, RLS, demo isolation, profile, themes, and responsive matrix:** BLOCKED pending the controlled synthetic-account pass.
- **Local validation:** `pnpm test` PASS (12); `pnpm exec tsc --noEmit` PASS; `pnpm lint` FAIL with pre-existing application accessibility/chart and Edge Function tooling diagnostics.

**Manual prerequisite for the next pass:** provide or configure access to three dedicated synthetic email identities (Test Patient A, Test Patient B, Test Unverified User). If confirmation links cannot be accessed automatically, the account owner must open each confirmation email and complete the link manually before verification continues.
