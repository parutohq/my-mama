# Business rules

> Last verified against code: 2026-09-24  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `98d8246`

## Patient ownership and care

1. A patient owns their profile and care records. Every patient-owned row must be keyed to the authenticated user and protected by RLS.
2. Clinician access requires an appropriate clinician role plus an accepted/completed booking or an active, scoped patient sharing permission. Sharing is patient-controlled and revocable.
3. Demo data is an explicitly separate care space. It must never be merged into account records, must be clearly labelled, and must be removable without deleting real records.
4. Recorded dates and descriptive charts must identify recorded versus estimated information. MAMA must not manufacture diagnostic scores, fertility predictions, or medical outcomes.
5. Pregnancy loss and other sensitive transitions suppress inappropriate celebration, points, streaks, and journey notifications.
6. A pre-account journey choice is onboarding intent only. It does not authorize access, create a clinical record, or imply a health status until the authenticated user explicitly saves the corresponding data.
7. Demo care is never silently merged into a personal care space. Starting, switching, hiding, showing, or permanently deleting demo data must leave personal profile and care rows unchanged.
8. Profile, privacy, theme, notification, sharing, export, deletion, and sign-out controls must remain discoverable from authenticated navigation; changing appearance must not alter care records.

## Safety and communication

9. MAMA is educational support and record-keeping, not diagnosis, prescription, emergency monitoring, or a replacement for clinical care.
10. Urgent/emergency guidance must remain prominent and separate from routine reminders. The user should be directed to immediate local care when symptoms could be serious.
11. Push and lock-screen copy is discreet by default. Do not reveal journey stage, pregnancy status, symptoms, diagnosis, appointment details, or consultation content in generic notification payloads.

## Consultation rules for the planned feature

12. Dr Peace is the default/featured consultant only when an active, provisioned provider record and active service/availability exist; the UI must not invent a slot.
13. A consultation is not confirmed until payment is verified server-side. Client redirects and client-supplied payment status are never authoritative.
14. A slot hold must expire, cannot overlap another confirmed/held booking, and must be released on payment failure, timeout, cancellation, or webhook failure according to the reviewed policy.
15. Paystack references and webhook events are idempotent. Every booking/payment transition must be auditable.
16. Meeting access is disclosed only to the authorized patient/provider for a valid booking, after the required payment and safety checks. Whereby room/token secrets stay server-side.
17. Cancellation, refund, reschedule, settlement, tax, and no-show rules must be explicit before launch.

## Payments and video rules for the planned feature

15. Paystack is the initial payment provider and NGN is the initial currency. Money is represented in integer minor units; prices come from authoritative server/database records and historical booking prices remain unchanged.
16. My MAMA stores no raw card data and sends only the minimum required information to Paystack. Refund eligibility follows a configurable approved policy.
17. Whereby Embedded is the initial video provider behind an abstraction. Rooms are private; patient and consultant access are distinct; room names/URLs contain no unnecessary health information; recording, transcription, and AI-generated notes are off by default.
18. A payment-success redirect is never authoritative. Payment verification, webhook handling, idempotency, double-book protection, and room provisioning are server/database responsibilities.

## Clinical boundaries

19. Missing data is not a negative finding. Descriptive estimates must be labelled as estimates. Follow-up suggestions do not automatically create a booking or charge. Patient summaries require explicit clinician publication, and private clinician notes remain separate.

## Cycle intelligence and commerce

20. User-entered health data is recorded data; calculated cycle outputs are estimated data; educational hormone curves are typical patterns; legitimate laboratory values are measured data.
21. Typical hormone patterns must never be presented as a user's measured hormone level. Dates and symptoms alone must not diagnose disease, infer hormone levels, confirm ovulation, or define contraception-safe days.
22. Period, fertile-window, and cycle estimates must be clearly labelled and may be reduced or withheld when history is insufficient or irregular.
23. Changing journeys must preserve historical records. Missing entries remain unknown, and unsupported journey coexistence must not be implied by the UI.
24. Nutrition content is educational and clinically reviewed; unsupported therapeutic or “hormone-balancing” claims are prohibited.
25. Product merchandising must remain separate from clinical guidance. Commercial incentives must not determine health recommendations, and prescription-product commerce is excluded from the initial product scope.
