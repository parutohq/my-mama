# MAMA

A private reproductive and maternal-care web app built with React, Vinext and Cloudflare D1. This first release is a clinical-review prototype, not approved patient-facing clinical software.

## Included

- Signed-in, per-user saved records using dispatch-owned ChatGPT authentication.
- Journey setup for cycle tracking, preconception, pregnancy, postpartum, or recovery/pause.
- Mood/symptom check-ins and period history with descriptive cycle summaries.
- Editable appointments, questions, tasks, and a saved healthcare contact.
- Evidence-linked educational library and static urgent care guidance.
- Printable care summary with opt-in free-text notes, record export and deletion.
- Responsive layout with accessible component primitives and keyboard navigation.

There is no autonomous symptom assessment, prescribing, fertility prediction, partner sharing, push-notification delivery, appointment booking, or clinical messaging. Content has not been signed off by a Nigerian clinical team. Use fictitious data during review.

## Development

Use the existing pnpm lockfile and pnpm-workspace build approvals. `pnpm dev` starts the local app; `pnpm build` emits the Cloudflare Worker and public assets. The Sites plugin provides local sign-in at `/signin-with-chatgpt` using a development-only identity. Hosting uses dispatcher-provided authenticated identity headers. Direct untrusted exposure of the Worker bypassing the Sites dispatcher is unsupported.

Schema lives in `db/schema.ts`; generated SQL lives in `drizzle/`. Production migrations are applied by Sites. To create a fresh local database after building, run:

```
pnpm exec wrangler d1 execute site-creator-d1 --local --persist-to .wrangler/state --config dist/server/wrangler.json --file drizzle/0000_remarkable_whizzer.sql
```

Do not rerun the initial migration against a database where it already exists. Future production changes need new migrations.

## Validation

- `node --experimental-strip-types --test tests/care-model.test.mjs`: date validation, cycle summaries, pregnancy dating source, recovery pause, unknown symptom data, validation limits.
- `node tests/api.test.mjs`: against localhost:3001 with the local Sites identity; authentication, forged-header rejection, cross-origin protection, CRUD, and private no-store responses. Creates and cleans up only its own temporary test entry.
- An additional local database test inserted an isolated second-owner record and verified that the current identity could neither read nor delete it; the temporary record was removed.
- TypeScript checking and a production build are required before deployment.
- Browser visual/interaction testing was not performed. The two optional WebMCP tools are feature-detected; no supported WebMCP execution context was available, so their live contracts remain unverified.

## Before patient use

Obtain Nigerian clinical validation of the exact educational content and urgent-care wording, validate referral contacts and schedules, perform privacy/security and accessibility reviews, and evaluate user comprehension and care-seeking safety. Appointment dates are an organiser only, not automated reminders. The app does not monitor check-ins or notify clinicians.
