# Current Supabase/PostgreSQL database

> Last verified against code: 2026-09-24  
> Repository branch: `design/mymama-premium-ui`  
> Commit: `1e35386`

The schema is defined by seven versioned migrations under `supabase/migrations/`. This document describes repository SQL; it does not assert that every migration has been applied to a hosted project.

## Core tables and relationships

- `profiles`: one row per `auth.users` record; display name and timestamps.
- `user_roles`: one role per user (`patient`, `clinician`, `admin`).
- `user_journeys`: current/previous journey stage, anchor date/source, contact fields, and personalization fields. A user has at most one current journey.
- `pregnancies` and `postpartum_profiles`: optional journey-linked context rows.
- `health_events` and `symptom_logs`: check-ins/notes and their symptom children.
- `menstrual_cycles`: recorded period intervals.
- `appointments`, `care_tasks`, and `care_questions`: patient-owned preparation records.
- `medications` and `investigations`: lifelong-care detail records added later, each user-owned.
- `providers`: clinician profile and active/featured/default flags; references an auth user.
- `consultation_services`: provider-owned service definitions and durations.
- `provider_availability`: provider time windows.
- `consultation_bookings`: patient/provider/service relationship, start/end, and `booking_status` (`requested`, `accepted`, `declined`, `cancelled`, `completed`). There is no payment or meeting-room table.
- `sharing_permissions`: patient-to-provider scopes, expiry, and revocation.
- `clinical_content`: versioned, country-tagged educational content with publication status.
- `audit_logs`: actor, subject, action, resource, metadata, and timestamp.

## Engagement and notification tables

`profile_preferences` stores locale, timezone, discreet-notification and category toggles, points, and theme. `journey_transitions`, `journey_tasks`, `achievement_definitions`, `user_achievements`, and `user_reminders` support engagement. `notifications` is an in-app outbox; `push_subscriptions` stores Web Push material; `notification_delivery_logs` records channel/status/provider message IDs. `queue_due_mama_notifications()` queues generic reminders and appointment reminders and marks due in-app deliveries.

## Demo isolation

`demo_data_state` stores per-user seed/clear timestamps, active mode, and hidden state. Demo flags were added to profiles, journeys, events, cycles, appointments, tasks, questions, journey tasks, and reminders. Repository queries explicitly filter account versus demo mode, and demo deletion is performed by the demo repository.

## RLS and grants

All listed public tables enable RLS. Patient-owned operations use `auth.uid()` ownership predicates. Provider discovery is limited to active records; provider self-management is not exposed to patients. Published clinical content is readable to anonymous/authenticated roles. The private `patient-documents` storage bucket uses the first path segment as the authenticated user ID. See [SECURITY.md](SECURITY.md) and `supabase/tests/rls.sql` for the access model and test evidence.

## Migrations

1. `202609090001_initial_my_mama.sql` — core schema, roles, provider/booking foundation, RLS, storage bucket/policy.
2. `202609150001_engagement_mobile.sql` — engagement, preferences, notification/outbox, push and delivery tables.
3. `202609150002_notification_scheduler.sql` — notification source-key idempotency and queue function.
4. `202609150003_demo_experience.sql` — demo state and demo flags.
5. `202609160001_expand_lifelong_journeys.sql` — journey enum expansion plus medications/investigations.
6. `202609210001_isolate_demo_care_spaces.sql` — demo mode and visibility state.
7. `202609220001_personalisation_profile_theme.sql` — journey anchors/patterns, theme, provider presentation fields, active provider/service/availability read policies.

No migration in this repository creates payment, transaction, refund, webhook-event, slot-hold, or meeting-room tables. Those are required additions for the planned paid consultation feature.

## Tables that appear unused or only partially wired

`user_roles`, `providers`, `consultation_services`, `provider_availability`, `consultation_bookings`, `clinical_content`, and `audit_logs` exist in the schema and generated type surface, but repository inspection found no complete patient consultation flow, provider dashboard, content-management surface, or general audit-write path. They should be treated as schema foundations until code and hosted verification demonstrate active use.
