# My MAMA premium UI release candidate

## Deployment boundary

This branch is a preview-only release candidate. It must not be merged or promoted until the staging migration, live RLS checks, and Vercel preview checks listed below are complete.

## Migration review

`202609160001_expand_lifelong_journeys.sql` is additive. It adds five journey-stage enum values and creates `medications` and `investigations`, with user ownership foreign keys, date/value checks, indexes, Row Level Security, authenticated grants, and owner-only CRUD policies. It has no table drops, data updates, destructive alters, functions, or triggers. Existing staging rows are not modified. It has not been applied from this workspace because the Supabase CLI and authenticated project credentials are unavailable.

Apply staging only after linking the project:

```bash
supabase link --project-ref <my-mama-staging-ref>
supabase db push
```

Do not run this command against production.

## Chart audit

| Visualisation | Status | Basis |
| --- | --- | --- |
| Cycle recorded-date view | Implemented | User-recorded period dates only; no fertility prediction |
| Pregnancy timeline | Implemented | Chosen dates/estimated timing, clearly labelled |
| Postpartum timeline | Implemented | Time since birth; no recovery percentage |
| Check-in / wellbeing trend | Partial | Recorded check-ins can be summarised; no health score |
| Task/journey completion | Implemented | User tasks and achievements |
| Symptoms | Partial | Records exist; dedicated longitudinal chart remains future work |
| Menstrual cycle analytics | Partial | Records exist; only descriptive presentation is justified |
| Clinical/diagnostic score | Not implemented | Not clinically justified |
| Fertility prediction | Not implemented | Explicitly out of scope |

## Consultation foundation

The existing relational schema supports providers, services, manually provisioned availability, bookings and booking state. Services can represent 30- and 60-minute consultations. Before offering it publicly, an administrator must create the provider profile, service records, availability, booking confirmation policy, emergency/safety route, and reminder workflow. No real provider or availability has been fabricated.

## Notification readiness

Preferences, subscriptions, private reminders and delivery-log storage are implemented. Browser push requires `NEXT_PUBLIC_VAPID_PUBLIC_KEY` in Vercel and the matching VAPID private key only in the protected scheduler/runtime environment. The scheduler remains disabled. It needs an authenticated cron endpoint/secret, a Vercel Cron schedule, and a delivery worker before activation. Notification content must remain discreet by default.

## Live validation still required

- Apply the pending migration to staging.
- Create two controlled staging users and run authenticated cross-account read/update/delete checks for each private resource.
- Verify anonymous denial through the deployed data layer.
- Test the preview at 375×812, 390×844, 430×932, 768px, 1280px and 1440px with keyboard, reduced motion, long text and screen-reader spot checks.
