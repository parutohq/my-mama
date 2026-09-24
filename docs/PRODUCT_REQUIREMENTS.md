# Product requirements

> Last verified against code: 2026-09-24  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `1e35386`

## Current requirements evidenced by the repository

- A visitor can view the MAMA public landing experience and choose a journey before creating an account.
- A signed-in patient can maintain a private profile and current journey, with optional cycle, pregnancy, postpartum, care-task, appointment, question, medication, investigation, and check-in records.
- Patient data is relational and user-scoped. Demo records are labelled, isolated from account records, switchable, hideable, and deletable.
- The authenticated experience includes Today, Journey, Journal, My Care, Learn, Care Summary, Ask MAMA/help, profile/privacy controls, mobile bottom navigation, engagement tasks, achievements, reminders, descriptive insights, and export/delete controls where implemented by the current UI.
- Notifications are opt-in by category, discreet by default, generic on a lock screen, and modeled for in-app/push delivery.
- Clinical content is educational and must not present diagnosis, prescription, fertility prediction, emergency monitoring, or a substitute for professional care.
- Sensitive journey transitions can suppress celebration/streak behaviour.

## Intended product requirements

My MAMA is intended to be a lifelong women's reproductive-health companion. It should support, where applicable, Growing Up/first period, menstrual health, general reproductive health, planning ahead, trying to conceive, pregnancy, birth preparation, postpartum, ongoing reproductive health, and perimenopause/midlife. Pregnancy is one possible journey, never an assumed destination.

The universal product model is **Track, Learn, Prepare, Get Help, Ask MAMA**. The durable product areas are personalized Home, Journey, Track, My Care, Ask MAMA, Profile, Insights, notifications, and consultations.

The consultation prompt supplied with this repository is a product specification, not implementation evidence. It intends a multi-provider consultation marketplace with Dr Peace as the default/featured consultant, 30- and 60-minute services, availability and timezone-aware slots, safe slot holds, Paystack payments, Whereby consultations, reminders, receipts, cancellations/refunds, auditability, and provider operations. It also requires safety gating, no booking without payment, idempotent callbacks/webhooks, and RLS-protected patient/provider data.

The intended future experience should preserve the existing patient-care foundation, allow provider discovery without exposing private health records, and keep consultation status/payment state separate from clinical records. It should not silently invent availability, prices, diagnoses, or clinical outcomes.

## Non-functional requirements

- Mobile-first, accessible, responsive UI with safe-area support and keyboard/screen-reader labels.
- Server-side secret handling; no payment, meeting, or service-role credential in browser bundles.
- Database-backed persistence with reviewed migrations and RLS.
- Idempotent payment/webhook operations and auditable state transitions.
- Preview verification before production promotion.
- No real-health-data release until security, clinical governance, privacy, retention, and incident-response gates are closed.
