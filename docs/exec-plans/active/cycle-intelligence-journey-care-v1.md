# Active execution plan: Cycle Intelligence, Journey Transitions & Care v1

> This plan contains only gaps found during reconciliation.  
> Last verified against code: 2026-09-27  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `98d8246`

## Phase 1 — cycle-calendar foundation

**Status:** IN PROGRESS — foundation implemented; verification remains open.

**Current state:** `lib/care-model.ts` and the care repository support periods, check-ins, symptoms, pain, mood, notes, appointments, tasks, medicines, and investigations. `components/mama/care-calendar.tsx` and `lib/care-calendar-model.ts` now provide an integrated month/day surface in My Journal for cycle-mode journeys, with a restrained plum/blush atmosphere, stronger selected-day state, and non-color marker distinctions for period, spotting, check-in, and care activity. Medication records have no date field and are intentionally excluded from cell markers until the schema supports one.

**Objective:** Reuse existing records to provide month view, day details, and a future Trends path.

**Dependencies:** Existing repositories/API, profile journey verification plan, hosted RLS evidence.

**Implementation scope:** Add presentation/configuration around existing records only; show recorded fields, label calculated overlays as estimated, and preserve unknowns.

**Acceptance criteria:** Day details show actual recorded data only; no unsupported fields, inferred “no symptoms,” fertility-safe-day language, or duplicate chart/calendar systems. Recorded and future estimated information must remain visibly distinct; this phase currently renders no estimated overlays.

**Validation:** Pure aggregation tests and TypeScript verification pass. Browser responsive tests, accessibility audit, repository/API tests against hosted data, and synthetic-account RLS checks remain required before completion.

**Security / clinical safety:** Patient ownership and demo filters remain enforced; no clinical inference from missing data.

**Known risks:** Current schema may not represent every suggested symptom/discharge field; document limitations instead of inventing columns.

## Phase 2 — educational cycle intelligence

**Status:** IMPLEMENTED / TECHNICALLY VERIFIED — educational reference only; **CLINICAL REVIEW REQUIRED**.

**Current state:** `components/mama/typical-hormone-pattern.tsx` and `lib/typical-hormone-pattern-model.ts` provide normalized, qualitative reference curves for estrogen, progesterone, LH, and FSH within the calendar surface. The optional marker reflects a recorded/derived cycle day and is explicitly described as context, never as a measured hormone level. No lab ingestion or personalized curve stretching was added.

**Objective:** Add a reusable educational visualization for typical estrogen, progesterone, LH, and FSH patterns.

**Dependencies:** Phase 1 data classification and clinical content review.

**Implementation scope:** Reuse `components/ui/chart.tsx` and existing insight styling; support recorded/estimated/typical/measured labels and optional cycle-day marker.

**Acceptance criteria:** The chart says “Typical hormone pattern,” never presents typical curves as measured personal levels, reduces precision for insufficient/irregular history, and makes no diagnosis or contraception claim.

**Validation:** Feature lint, TypeScript, automated tests, and a webpack production build pass, including all four series, marker bounds, and normalized values. Design Lab has illustrative typical-only, recorded-day marker, no-context, variable-cycle, and theme controls. Rendered responsive/accessibility/theme verification is blocked until these uncommitted changes are available in Preview; local runtime currently fails before render because Supabase environment variables are unavailable. Clinical/content review remains required. The reference shapes were authored without a cited clinical source and must not be described as clinically reviewed.

**Security / clinical safety:** No lab or health data is sent to third parties; measured values require legitimate source data.

**Known risks:** Educational curves can be misread as predictions; wording and legends must remain prominent.

**Verification matrix (2026-09-27):** 375×812, 390×844, 430×932, 768, 1280, and 1440px: **BLOCKED** for rendered inspection because the current hosted Preview predates the uncommitted feature and the local app cannot initialize without Supabase environment variables. Light, dark, and system rendered checks: **BLOCKED** for the same reason. Feature-specific lint, TypeScript, automated tests, and webpack build: **PASS**. Clinical review: **REQUIRED**.

**Clinical-review summary:** The current fixture uses a 28-day reference axis and dimensionless 0–100 relative values. Estrogen is represented as a pre-midpoint rise followed by a decline and smaller later rise; progesterone remains low early and rises later; LH has a narrow relative midpoint peak; FSH is higher at the edges with a modest midpoint lift. These are illustrative shape choices, not cited clinical measurements or validated patient models. **CLINICAL REVIEW REQUIRED.** No curve is presented as a user's hormone level, and no wording confirms ovulation, fertility, or a safe day.

## Phase 3 — journey transition and longitudinal-history validation

**Status:** PARTIALLY IMPLEMENTED.

**Current state:** Journey transitions and historical transition records exist, with sensitive-transition suppression. One current journey is selected by the existing model.

**Objective:** Verify journey changes preserve history and expose only supported transitions.

**Dependencies:** Personalisation/profile verification plan and shared-environment synthetic accounts.

**Implementation scope:** Audit transition UX and copy; do not invent coexistence semantics unsupported by the schema.

**Acceptance criteria:** Switching journeys does not delete prior records; sensitive transitions remain quiet; unsupported coexistence is not implied.

**Validation:** Two-account persistence/RLS checks and responsive profile/journey testing.

**Security / clinical safety:** Transition history is private and user-owned; no journey implies a diagnosis or pregnancy.

**Known risks:** The current one-current-journey model may require a later reviewed schema decision for coexistence.

## Phase 4 — journey-aware Home, Track, Learn, Prepare, and Care

**Status:** PARTIALLY IMPLEMENTED.

**Current state:** `app/mama-app.tsx` and `lib/education.ts` already vary content for cycle, pregnancy, postpartum, recovery, preconception, and midlife-related stages. Depth is uneven and some states are descriptive only.

**Objective:** Close truthful experience gaps without duplicating journey branches or inventing unsupported data.

**Dependencies:** Existing care model, education content, safety review, and Phase 3.

**Implementation scope:** Prefer reusable journey configuration and existing Home/Track/Learn/Care primitives.

**Acceptance criteria:** Each supported journey has honest content or an explicit empty state; cycle awareness never claims ovulation certainty; pregnancy/postpartum care remains safety-led.

**Validation:** Journey matrix, accessibility, responsive, content, and synthetic persistence tests.

**Security / clinical safety:** Urgent pathways override routine CTAs; sensitive transitions suppress celebratory content.

**Known risks:** Over-expanding journey-specific UI could create duplicated logic and inconsistent copy.

## Phase 5 — Food for Your Journey

**Status:** NOT IMPLEMENTED.

**Current state:** Education content includes some nutrition-related preparation guidance, but no dedicated nutrition experience, preference model, or meal catalogue exists.

**Objective:** Define a clinically reviewed, culturally relevant educational nutrition layer.

**Dependencies:** Clinical governance, content sources, and product decisions for regional/preferences scope.

**Implementation scope:** Reuse education/content architecture; do not add therapeutic diets or unsupported hormone claims.

**Acceptance criteria:** Content is educational, reviewed, journey-aware where appropriate, and clearly separate from diagnosis or individualized treatment.

**Validation:** Clinical/content review, accessibility, source-link checks, and privacy review.

**Security / clinical safety:** No sensitive health profile is sent to merchandising or external nutrition services.

**Known risks:** Cultural specificity and clinical claims require review before implementation.

## Phase 6 — MAMA Products foundation

**Status:** NOT IMPLEMENTED.

**Current state:** No catalogue, product, inventory, fulfillment, or commerce implementation was found.

**Objective:** Design a future non-prescription product abstraction without coupling it to clinical recommendations.

**Dependencies:** Business model, payment/security review, fulfillment, privacy, and consultation plans.

**Implementation scope:** Discovery and architecture only until a separate approved commerce plan exists.

**Acceptance criteria:** Merchandising is independent from care guidance; journey-aware categories are possible; prescription commerce is excluded.

**Validation:** Threat model, payment review, content governance, and privacy review.

**Security / clinical safety:** No commercial ranking may alter clinical advice; payment and health data remain separate.

**Known risks:** Commerce creates conflicts-of-interest, financial, and privacy obligations beyond the current app.

## Phase 7 — contextual consultation entry points

**Status:** PARTIALLY IMPLEMENTED; detailed delivery remains in `consultation-platform-v1.md`.

**Current state:** A Dr Peace consultation CTA and fixture service chips exist; no real provider provisioning, booking, payment, or video flow exists.

**Objective:** Add only safe contextual entry-point wording and journey links when the consultation platform becomes operational.

**Dependencies:** Consultation platform plan, provider governance, and safety review.

**Implementation scope:** Generic O&G language, Dr Peace default/featured resolution, and prepare-a-question prompts; no duplicated payment/booking work.

**Acceptance criteria:** No fixture is presented as bookable; prompts never diagnose; urgent guidance overrides consultation.

**Validation:** Provider-data and safety-copy tests, then consultation-plan E2E validation.

**Security / clinical safety:** Preserve provider authorization, RLS, and private clinical boundaries.

**Known risks:** Contextual prompts could imply diagnosis or availability if data-driven gating is incomplete.

## Phase 8 — responsive, accessibility, safety, and E2E verification

**Status:** IMPLEMENTED / UNVERIFIED.

**Current state:** Mobile navigation, themes, chart/calendar primitives, demo isolation, and safety copy exist; the full authenticated matrix is not verified.

**Objective:** Verify all new surfaces across mobile/desktop, light/dark/system, keyboard/screen-reader, RLS, demo isolation, and anonymous boundaries.

**Dependencies:** Phases 1–7 as applicable and the personalisation verification plan.

**Implementation scope:** Test and document; fix only defects attributable to this plan in a later implementation pass.

**Acceptance criteria:** No console/accessibility regressions, correct data labels, no unsupported inference, and no cross-account access.

**Validation:** `pnpm test`, typecheck, lint classification, browser matrix, synthetic RLS checks, and release review.

**Security / clinical safety:** Shared Preview/Production Supabase requires synthetic, reversible, non-destructive verification only.

**Known risks:** Hosted email delivery and shared-database boundaries remain external blockers for authenticated verification.

## Cross-plan dependencies

- `personalisation-profile-auth-theme-v1.md` governs account, onboarding, profile, themes, demo isolation, and hosted verification.
- `consultation-platform-v1.md` governs provider, Dr Peace provisioning, services, availability, booking, Paystack, Whereby, notes, summaries, and follow-up.
