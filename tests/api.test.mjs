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
assert.doesNotMatch(route, /oai-authenticated-user-id|care_records/);
assert.match(proxy, /updateSession/);
assert.equal(existsSync(new URL('../app/chatgpt-auth.ts', import.meta.url)), false);
console.log('PASS: relational Supabase migration, RLS foundation, verified session boundary, and legacy identity removal.');
