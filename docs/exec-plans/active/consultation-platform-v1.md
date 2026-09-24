# Active execution plan: Consultation Platform v1

> Last verified against code: 2026-09-24  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `1e35386`

Status: planned/in progress. This plan is intentionally separate from implementation status. The repository currently has provider/service/availability/booking foundations but no paid consultation workflow.

## Phase status register

The existing schema is a foundation only. Every phase below is still open unless stated otherwise.

| Phase | Status | Dependencies | Implementation objective | Acceptance criteria | Validation | Known risks |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Existing architecture reconciliation | IN PROGRESS | Current migrations, repositories, RLS | Reconcile existing provider/service/availability/booking model with the intended multi-provider flow | Evidence and gaps documented; no hard-coded provider UUID | Schema/repository review, type generation, RLS tests | Existing status model lacks payment/hold states |
| 2. Provider model / Dr Peace | BLOCKED | Provider identity, verification, governance | Provision Dr Peace as default/featured while supporting future verified providers | Active verified row, discovery policy, operational owner | Controlled seed and RLS discovery test | Incorrect provider/clinical metadata |
| 3. Consultation services | NOT IMPLEMENTED | Provider, pricing, currency | Configure 30/60-minute services with authoritative pricing | Database-configured prices; historical prices stable | API and tamper tests | Currency/minor-unit errors |
| 4. Intake | NOT IMPLEMENTED | Clinical copy and privacy review | Collect minimum consultation context | No unnecessary data; saved only to authorized scope | Validation and privacy tests | Excess collection |
| 5. Safety gate | NOT IMPLEMENTED | Clinical governance | Route urgent concerns to care before routine booking | Emergency path is clear and cannot be bypassed by normal flow | Content/accessibility review | Unsafe triage |
| 6. Duration recommendation | NOT IMPLEMENTED | Safety/intake policy | Present 30/60 options without diagnostic scoring | Optional, explainable, non-diagnostic choice | Unit/copy tests | Implied diagnosis |
| 7. Availability | NOT IMPLEMENTED | Provider schedules/timezone | Manage real provider availability | No invented slots; timezone-aware | Schedule tests | DST/timezone mistakes |
| 8. Slot generation | NOT IMPLEMENTED | Availability, service duration | Generate valid slots | Deterministic slots with boundaries | Unit tests | Off-by-one/overlap errors |
| 9. Double-book protection | NOT IMPLEMENTED | Database constraints/transaction design | Prevent concurrent booking conflicts | Race tests cannot create overlap | Database concurrency tests | Race conditions |
| 10. Temporary holds | NOT IMPLEMENTED | Slot generation, expiry job | Hold a slot during review/payment | Expiry releases hold safely | Expiry and retry tests | Abandoned holds |
| 11. Booking | NOT IMPLEMENTED | Holds, auth, RLS | Create/cancel/reschedule booking state | Server-authoritative state and audit trail | API/browser tests | Client/server divergence |
| 12. Paystack | NOT IMPLEMENTED | Merchant account, NGN prices, webhook secret | Initialize and verify payment server-side | Redirect never confirms; duplicate webhook idempotent | Paystack test mode/replay tests | Financial loss |
| 13. Booking confirmation | NOT IMPLEMENTED | Verified payment | Confirm only after authoritative payment | Payment/booking states consistent | End-to-end state tests | Partial failure |
| 14. Whereby | NOT IMPLEMENTED | Confirmed booking, Whereby account | Create private meeting access | Role-specific, expiring links; no recording by default | Authorized/unauthorized join tests | Link leakage |
| 15. Patient experience | NOT IMPLEMENTED | Phases 2–14 | Build mobile-first discovery-to-join flow | Accessible loading/error/empty/no-availability states | Browser/accessibility tests | Sensitive data in client |
| 16. Consultant dashboard | NOT IMPLEMENTED | Provider RBAC and booking truth | Manage availability/bookings | Provider sees only authorized operations | Role/RLS tests | Overbroad role access |
| 17. Private notes | NOT IMPLEMENTED | Consultant auth/governance | Store clinician-only notes | Never patient-visible | RLS tests | Confidentiality breach |
| 18. Patient summary | NOT IMPLEMENTED | Notes and publication rules | Publish explicit patient-facing summary | Publication is explicit and auditable | Publication/RLS tests | Accidental disclosure |
| 19. Follow-up | NOT IMPLEMENTED | Summary and policy | Offer follow-up/rebook suggestions | Never auto-books or charges | UX/API tests | Unintended booking |
| 20. Cancellation/rescheduling | NOT IMPLEMENTED | Booking/payment policy | Apply configurable policy | State/refund effects are explicit | Policy tests | Ambiguous customer outcome |
| 21. Refunds | NOT IMPLEMENTED | Paystack and policy | Reconcile/refund eligible payments | Idempotent refund records | Provider test mode | Double refund |
| 22. Notifications | IN PROGRESS for generic notification foundation; NOT IMPLEMENTED for consultation | Scheduler, booking truth | Send discreet reminders | Preference/sensitive-state suppression works | Delivery/idempotency tests | Medical disclosure |
| 23. Revenue/reporting | NOT IMPLEMENTED | Transaction ledger and access roles | Reconcile paid/refunded revenue | Reports match authoritative transactions | Reconciliation tests | Settlement mismatch |
| 24. RLS/security | IMPLEMENTED / UNVERIFIED for foundation; NOT IMPLEMENTED for consultation tables | Schema design, hosted Supabase | Protect every new row and secret boundary | Controlled-user RLS matrix passes | `supabase/tests/rls.sql` plus new tests | Hosted drift |
| 25. E2E testing | NOT IMPLEMENTED | All prior phases and test accounts | Verify patient/provider/payment/video flow | Preview/staging flow passes | Browser, API, webhook tests | External-service flakiness |
| 26. Production readiness review | BLOCKED | Governance, privacy, incident response, credentials | Approve controlled launch | No critical open issue; rollback rehearsed | Full release checklist | External decisions/configuration |

## Product defaults

- Default/featured consultant: **Dr Peace**, represented by a provisioned active provider row.
- Payment provider: **Paystack**, server-side initialization and verification with webhook reconciliation.
- Meeting provider: **Whereby**, with server-created rooms or short-lived authorized join links.
- Service choices: 30-minute and 60-minute consultations, with prices and currency supplied by the business before launch.

## Phase 0 — decisions and safety gate

- Confirm Dr Peace identity, credentials, specialty, bio, avatar, service copy, price/currency, working timezone, cancellation/refund/no-show policy, settlement/tax rules, and clinical governance owner.
- Confirm Paystack merchant account, webhook URL/secret, test/live keys, supported currency, and notification email sender.
- Confirm Whereby account/API model, room retention, join-token lifecycle, recording policy (default no recording), and data-processing terms.
- Define urgent-care gate copy and the conditions under which routine booking is refused or redirected.

Acceptance: signed-off product, clinical, privacy, payment, and incident-response decisions.

## Phase 1 — schema and RLS

Add reviewed migrations for provider services/availability normalization if needed, slot holds, consultation orders, Paystack transactions, webhook events/idempotency keys, refunds, and meeting-room metadata. Keep payment/meeting rows separate from clinical records. Add ownership/provider/admin RLS and audit transitions. Add conflict-safe indexes and constraints for overlapping holds/bookings.

Acceptance: migration review, `supabase db advisors`, RLS tests for two patients, Dr Peace/provider, unauthorized user, expired hold, cancelled booking, and replayed webhook.

## Phase 2 — availability and booking API

Implement server-side provider/service discovery, timezone-aware slot generation, safe hold creation with expiry, hold release, booking creation, cancellation, and reschedule rules. Never trust client-provided availability or booking status. Use idempotency keys for create/confirm/cancel operations.

Acceptance: deterministic slot tests, overlap/race tests, hold-expiry tests, origin/auth checks, and audit records.

## Phase 3 — Paystack

Create a server route to initialize a Paystack transaction for a specific held booking and amount. Store only required references/status. Verify callback server-side, reconcile via signed webhook with replay protection, and make all event handling idempotent. Handle failed, abandoned, successful, refunded, and chargeback states.

Acceptance: Paystack test-mode integration tests and controlled end-to-end test covering duplicate callback/webhook delivery and amount mismatch.

## Phase 4 — Whereby and consultation access

Provision meeting details only after verified payment and confirmed booking. Store minimal room/reference data, issue short-lived patient/provider join links, enforce start/end expiry, and do not record by default. Ensure links are never exposed in logs or public client config.

Acceptance: authorized patient/provider join test, unauthorized access denial, expiry test, cancellation/revocation test.

## Phase 5 — patient and provider UX

Build reusable patient screens for Dr Peace profile, service choice, safety gate, date/time selection, checkout, confirmation, upcoming consultation, cancellation/refund status, and join action. Build a minimal provider/admin surface for availability, booking status, and operational exceptions. Preserve the existing MAMA visual language and mobile-first navigation.

Acceptance: accessible mobile/desktop flows, loading/error/empty states, no invented availability, and copy review.

## Phase 6 — notifications and operations

Add consultation reminders only after booking/payment state is authoritative. Keep lock-screen copy discreet, use the existing notification preferences/outbox, and record delivery outcomes. Add reconciliation, refund/manual-review alerts, structured logs, and runbooks.

Acceptance: reminder preference tests, suppressed/sensitive transition tests, delivery retry/idempotency tests, and operational alert review.

## Phase 7 — staged release

Run lint, typecheck/build, unit/API tests, RLS tests, Paystack test-mode checks, preview browser verification, accessibility checks, and production smoke tests with controlled accounts. Promote only after clinical/privacy/security review and verified rollback/incident procedures.

## Known blockers

Business pricing/currency, Dr Peace provisioning, Paystack credentials/webhook configuration, Whereby credentials/room policy, refund policy, and hosted Supabase migration/RLS access are not present in the repository and must be supplied before implementation can be completed.
