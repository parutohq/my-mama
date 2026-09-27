# Product requirements

> Last verified against code: 2026-09-24  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `98d8246`

## Current requirements evidenced by the repository

- A visitor can view the MAMA public landing experience and choose a journey before creating an account.
- A signed-in patient can maintain a private profile and current journey, with optional cycle, pregnancy, postpartum, care-task, appointment, question, medication, investigation, and check-in records.
- Patient data is relational and user-scoped. Demo records are labelled, isolated from account records, switchable, hideable, and deletable.
- The authenticated experience includes Today, Journey, Journal, My Care, Learn, Care Summary, Ask MAMA/help, profile/privacy controls, mobile bottom navigation, engagement tasks, achievements, reminders, descriptive insights, and export/delete controls where implemented by the current UI.
- Notifications are opt-in by category, discreet by default, generic on a lock screen, and modeled for in-app/push delivery.
- Clinical content is educational and must not present diagnosis, prescription, fertility prediction, emergency monitoring, or a substitute for professional care.
- Sensitive journey transitions can suppress celebration/streak behaviour.
- Profile and privacy controls must be prominent and reachable from authenticated navigation, with editable identity, journey, appearance, notification, sharing, export, deletion, and sign-out controls where applicable.
- A visitor may choose a journey and provide an optional name before account creation; that intent is carried into onboarding as a personalisation hint and is not a health record until the user saves it in the authenticated care space.
- Demo mode is an explicitly labelled, opt-in illustrative care space. It must remain isolated from the account space, switchable, hideable, and deletable by the account owner without changing personal records.
- Authentication must provide accessible, responsive sign-in, registration, recovery, and email-confirmation states that preserve the selected journey intent without exposing private care data before authentication.
- Users must be able to choose Light, Dark, or System appearance, with the account preference as the canonical persisted setting and system mode following the device preference.
- The Design Lab is a preview-only, fixture-backed surface for comparing representative states; it must not read or mutate patient records and must not be treated as a production care route.

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

## Cycle intelligence and journey-care requirements (intended)

- My MAMA may provide a menstrual calendar built from supported recorded period, symptom, care, medication, investigation, and note data.
- Day details must show recorded information only; missing data remains unknown.
- Calculated cycle dates are estimates and must be labelled as such.
- Educational hormone curves for estrogen, progesterone, LH, and FSH must be labelled “Typical hormone pattern” and never presented as measured personal levels.
- The product must not diagnose conditions, infer hormone levels, confirm ovulation, or present fertile windows as contraception-safe days.
- Journey changes preserve longitudinal history and use only the stages supported by the current model.
- Journey context should shape Home, Track, Learn, Prepare, and Care with truthful empty states where depth is not implemented.
- “Food for Your Journey” is a future clinically reviewed educational nutrition experience, not a therapeutic diet service.
- “MAMA Products” is a future non-prescription commerce capability kept separate from clinical guidance.
- Consultation entry points may use generic O&G language and feature Dr Peace when real provider data exists; paid consultation implementation remains governed by the consultation execution plan.
