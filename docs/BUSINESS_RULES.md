# Business rules

> Last verified against code: 2026-09-24  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `1e35386`

## Patient ownership and care

1. A patient owns their profile and care records. Every patient-owned row must be keyed to the authenticated user and protected by RLS.
2. Clinician access requires an appropriate clinician role plus an accepted/completed booking or an active, scoped patient sharing permission. Sharing is patient-controlled and revocable.
3. Demo data is an explicitly separate care space. It must never be merged into account records, must be clearly labelled, and must be removable without deleting real records.
4. Recorded dates and descriptive charts must identify recorded versus estimated information. MAMA must not manufacture diagnostic scores, fertility predictions, or medical outcomes.
5. Pregnancy loss and other sensitive transitions suppress inappropriate celebration, points, streaks, and journey notifications.

## Safety and communication

6. MAMA is educational support and record-keeping, not diagnosis, prescription, emergency monitoring, or a replacement for clinical care.
7. Urgent/emergency guidance must remain prominent and separate from routine reminders. The user should be directed to immediate local care when symptoms could be serious.
8. Push and lock-screen copy is discreet by default. Do not reveal journey stage, pregnancy status, symptoms, diagnosis, appointment details, or consultation content in generic notification payloads.

## Consultation rules for the planned feature

9. Dr Peace is the default/featured consultant only when an active, provisioned provider record and active service/availability exist; the UI must not invent a slot.
10. A consultation is not confirmed until payment is verified server-side. Client redirects and client-supplied payment status are never authoritative.
11. A slot hold must expire, cannot overlap another confirmed/held booking, and must be released on payment failure, timeout, cancellation, or webhook failure according to the reviewed policy.
12. Paystack references and webhook events are idempotent. Every booking/payment transition must be auditable.
13. Meeting access is disclosed only to the authorized patient/provider for a valid booking, after the required payment and safety checks. Whereby room/token secrets stay server-side.
14. Cancellation, refund, reschedule, settlement, tax, and no-show rules must be explicit before launch.

## Payments and video rules for the planned feature

15. Paystack is the initial payment provider and NGN is the initial currency. Money is represented in integer minor units; prices come from authoritative server/database records and historical booking prices remain unchanged.
16. My MAMA stores no raw card data and sends only the minimum required information to Paystack. Refund eligibility follows a configurable approved policy.
17. Whereby Embedded is the initial video provider behind an abstraction. Rooms are private; patient and consultant access are distinct; room names/URLs contain no unnecessary health information; recording, transcription, and AI-generated notes are off by default.
18. A payment-success redirect is never authoritative. Payment verification, webhook handling, idempotency, double-book protection, and room provisioning are server/database responsibilities.

## Clinical boundaries

19. Missing data is not a negative finding. Descriptive estimates must be labelled as estimates. Follow-up suggestions do not automatically create a booking or charge. Patient summaries require explicit clinician publication, and private clinician notes remain separate.
