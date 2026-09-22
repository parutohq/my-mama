begin;
select plan(13);

select tests.create_supabase_user('patient_a');
select tests.create_supabase_user('patient_b');
select tests.create_supabase_user('clinician');

set local role authenticated;
select set_config('request.jwt.claim.sub', tests.get_supabase_uid('patient_a')::text, true);
insert into public.profiles (id, display_name) values (tests.get_supabase_uid('patient_a'), 'Patient A');
select results_eq('select display_name from public.profiles', $$values ('Patient A'::text)$$, 'patient reads own profile');

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('patient_b')::text, true);
select is_empty('select * from public.profiles', 'patient cannot read another patient profile');
select throws_ok($$insert into public.health_events (user_id, event_type, occurred_on) values ('00000000-0000-0000-0000-000000000000', 'checkin', current_date)$$, '42501', null, 'patient cannot insert another patient event');

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('clinician')::text, true);
select is_empty('select * from public.health_events', 'clinician has no broad event access');

-- Establish a care relationship only after proving that a clinician cannot browse records.
reset role;
insert into public.profiles (id, display_name)
values (tests.get_supabase_uid('patient_b'), 'Patient B');
insert into public.health_events (user_id, event_type, occurred_on, notes)
values (tests.get_supabase_uid('patient_b'), 'checkin', current_date, 'Private patient B record');
insert into public.user_roles (user_id, role)
values (tests.get_supabase_uid('clinician'), 'clinician');
insert into public.providers (id, user_id, display_name, active, verified_at)
values ('10000000-0000-0000-0000-000000000001', tests.get_supabase_uid('clinician'), 'Clinician', true, now());
insert into public.consultation_bookings (patient_id, provider_id, starts_at, ends_at, status)
values (tests.get_supabase_uid('patient_b'), '10000000-0000-0000-0000-000000000001', now(), now() + interval '30 minutes', 'accepted');

set local role authenticated;
select set_config('request.jwt.claim.sub', tests.get_supabase_uid('clinician')::text, true);
select results_eq(
  $$select notes from public.health_events where user_id = tests.get_supabase_uid('patient_b')$$,
  $$values ('Private patient B record'::text)$$,
  'clinician reads only the patient connected through an accepted booking'
);

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('patient_b')::text, true);
select lives_ok(
  $$update public.consultation_bookings set status = 'cancelled' where patient_id = tests.get_supabase_uid('patient_b')$$,
  'patient can cancel their own booking'
);
select lives_ok(
  $$insert into public.sharing_permissions (patient_id, provider_user_id, scopes) values (tests.get_supabase_uid('patient_b'), tests.get_supabase_uid('clinician'), array['health_events'])$$,
  'patient can grant a limited sharing permission'
);

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('clinician')::text, true);
select results_eq(
  $$select notes from public.health_events where user_id = tests.get_supabase_uid('patient_b')$$,
  $$values ('Private patient B record'::text)$$,
  'clinician reads only the scope explicitly shared after a booking is cancelled'
);

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('patient_b')::text, true);
select lives_ok(
  $$update public.sharing_permissions set revoked_at = now() where patient_id = tests.get_supabase_uid('patient_b') and provider_user_id = tests.get_supabase_uid('clinician')$$,
  'patient can revoke a sharing permission'
);
select set_config('request.jwt.claim.sub', tests.get_supabase_uid('clinician')::text, true);
select is_empty(
  $$select * from public.health_events where user_id = tests.get_supabase_uid('patient_b')$$,
  'clinician loses access once the accepted booking is cancelled and sharing is revoked'
);

reset role;
select ok(has_column('public', 'profile_preferences', 'theme'), 'profile preferences persist the chosen appearance');
select ok(has_column('public', 'user_journeys', 'anchor_kind'), 'journeys persist a transparent first-data anchor');
select ok(has_table_privilege('anon', 'public.profile_preferences', 'select') = false, 'anonymous users cannot read profile preferences');
select * from finish();
rollback;
