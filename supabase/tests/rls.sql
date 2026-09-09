begin;
select plan(10);

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

reset role;
select * from finish();
rollback;
