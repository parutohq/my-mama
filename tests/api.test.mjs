import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const migration = readFileSync(new URL('../supabase/migrations/202609090001_initial_my_mama.sql', import.meta.url), 'utf8');
const route = readFileSync(new URL('../app/api/records/route.ts', import.meta.url), 'utf8');
const proxy = readFileSync(new URL('../proxy.ts', import.meta.url), 'utf8');

for (const table of ['profiles', 'user_journeys', 'health_events', 'symptom_logs', 'menstrual_cycles', 'appointments', 'care_tasks', 'care_questions', 'providers', 'consultation_bookings', 'sharing_permissions', 'clinical_content', 'audit_logs']) {
  assert.match(migration, new RegExp(`create table public\\.${table}`));
  assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
}
assert.match(migration, /can_provider_access_patient/);
assert.match(migration, /revoke all on all tables in schema public from anon, authenticated/);
assert.match(route, /supabase\.auth\.getUser/);
assert.match(route, /function hasAllowedOrigin/);
assert.match(route, /if \(!hasAllowedOrigin\(request\)\)/);
assert.doesNotMatch(route, /oai-authenticated-user-id|care_records/);
assert.match(proxy, /updateSession/);
assert.equal(existsSync(new URL('../app/chatgpt-auth.ts', import.meta.url)), false);
console.log('PASS: relational Supabase migration, RLS foundation, verified session boundary, and legacy identity removal.');

const pushRoute = readFileSync(new URL('../app/api/push-subscription/route.ts', import.meta.url), 'utf8');
const pushWorker = readFileSync(new URL('../public/mama-push-sw.js', import.meta.url), 'utf8');
assert.match(pushRoute, /supabase\.auth\.getUser/);
assert.match(pushRoute, /hasAllowedOrigin/);
assert.match(pushRoute, /user_id: user\.id/);
assert.match(pushRoute, /eq\('user_id', user\.id\)/);
assert.match(pushWorker, /A private MAMA reminder/);
assert.doesNotMatch(pushWorker, /pregnan|symptom|diagnos|appointment/i);
const engagementRoute = readFileSync(new URL('../app/api/engagement/route.ts', import.meta.url), 'utf8');
assert.match(engagementRoute, /body\.kind === 'notification'/);
assert.match(engagementRoute, /eq\('user_id', user\.id\)\.eq\('id', id\)/);
const personalisationMigration = readFileSync(new URL('../supabase/migrations/202609220001_personalisation_profile_theme.sql', import.meta.url), 'utf8');
assert.match(personalisationMigration, /add column if not exists theme/);
assert.match(personalisationMigration, /enable row level security|profile_preferences/);
assert.match(personalisationMigration, /patients read active providers/);
assert.match(personalisationMigration, /patients read active consultation services/);
const sharingRoute = readFileSync(new URL('../app/api/sharing/route.ts', import.meta.url), 'utf8');
assert.match(sharingRoute, /supabase\.auth\.getUser/);
assert.match(sharingRoute, /eq\('patient_id', user\.id\)/);
assert.match(sharingRoute, /eq\('id', body\.id\)\.eq\('patient_id', user\.id\)/);
assert.match(sharingRoute, /is\('revoked_at', null\)/);

const lifelongMigration = readFileSync(new URL('../supabase/migrations/202609160001_expand_lifelong_journeys.sql', import.meta.url), 'utf8');
const careDetailsRoute = readFileSync(new URL('../app/api/care-details/route.ts', import.meta.url), 'utf8');
for (const table of ['medications', 'investigations']) {
  assert.match(lifelongMigration, new RegExp(`create table public\\.${table}`));
  assert.match(lifelongMigration, new RegExp(`alter table public\\.${table} enable row level security`));
  assert.match(lifelongMigration, new RegExp(`patients manage their own ${table === 'medications' ? 'medicines' : 'investigations'}`));
}
assert.match(careDetailsRoute, /supabase\.auth\.getUser/);
assert.match(careDetailsRoute, /hasAllowedOrigin/);
assert.match(careDetailsRoute, /removeCareDetail\(supabase, user\.id/);
assert.match(careDetailsRoute, /saveMedication\(supabase, user\.id/);
assert.match(careDetailsRoute, /saveInvestigation\(supabase, user\.id/);
