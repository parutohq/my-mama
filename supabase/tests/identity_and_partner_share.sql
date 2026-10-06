begin;
select plan(16);

select tests.create_supabase_user('identity_a');
select tests.create_supabase_user('identity_b');
select is((select public.mama_username_status('mama')), 'reserved', 'brand names cannot be claimed');
select is((select public.mama_username_status('ab')), 'invalid', 'short names are rejected');

set local role authenticated;
select set_config('request.jwt.claim.sub', tests.get_supabase_uid('identity_a')::text, true);
select is(public.claim_mama_identity('alice_mama', 'Alice', true), 'alice_mama', 'first account claims a username');
select is(public.mama_username_status('ALICE_MAMA'), 'unavailable', 'availability is case insensitive');
select throws_ok($$select public.claim_mama_identity('different', 'Alice', true)$$, 'P0001', null, 'claimed username is stable');

select set_config('request.jwt.claim.sub', tests.get_supabase_uid('identity_b')::text, true);
select throws_ok($$select public.claim_mama_identity('alice_mama', 'Bob', true)$$, 'P0001', null, 'a second account cannot claim the same username');
select throws_ok($$select public.claim_mama_identity('bob_mama', 'Bob', false)$$, 'P0001', null, 'age self-confirmation is required');
select is(public.claim_mama_identity('bob_mama', 'Bob', true), 'bob_mama', 'second account can claim another name');

reset role;
update public.profiles set profile_visibility = 'public' where id = tests.get_supabase_uid('identity_a');
insert into public.user_journeys (id, user_id, stage, anchor_date, anchor_kind, is_current)
values ('20000000-0000-0000-0000-000000000001', tests.get_supabase_uid('identity_a'), 'pregnancy', current_date, 'due_date', true);
insert into public.pregnancies (id, user_id, journey_id, due_date, status)
values ('30000000-0000-0000-0000-000000000001', tests.get_supabase_uid('identity_a'), '20000000-0000-0000-0000-000000000001', current_date + 84, 'active');
insert into public.health_events (user_id, event_type, occurred_on, notes)
values (tests.get_supabase_uid('identity_a'), 'checkin', current_date, 'NEVER_PUBLIC_PRIVATE_NOTE');
insert into public.pregnancy_share_links (id, user_id, created_by, pregnancy_id, token_hash, scopes, expires_at)
values ('40000000-0000-0000-0000-000000000001', tests.get_supabase_uid('identity_a'), tests.get_supabase_uid('identity_a'), '30000000-0000-0000-0000-000000000001', repeat('a',64), array['week','progress','edd'], now() + interval '7 days');
insert into public.pregnancy_share_links (id, user_id, created_by, pregnancy_id, token_hash, scopes, created_at, expires_at)
values ('40000000-0000-0000-0000-000000000002', tests.get_supabase_uid('identity_a'), tests.get_supabase_uid('identity_a'), '30000000-0000-0000-0000-000000000001', repeat('c',64), array['week'], now() - interval '8 days', now() - interval '1 day');

set local role anon;
select ok(not has_table_privilege('anon','public.profiles','select'), 'anonymous cannot select private profile rows');
select ok(not has_table_privilege('anon','public.pregnancy_share_links','select'), 'anonymous cannot select token hashes');
select ok(public.mama_public_profile('alice_mama') ? 'username', 'opted-in identity has a narrow public projection');
select ok(not (public.mama_public_profile('alice_mama') ? 'age_13_plus_confirmed'), 'age attestation is never public');
select ok(public.resolve_pregnancy_share(repeat('a',64)) ? 'estimatedDueDate', 'selected due date is visible to link holder');
select ok(not (public.resolve_pregnancy_share(repeat('a',64)) ? 'nextAppointmentDate'), 'unselected appointment is absent');
select ok(position('NEVER_PUBLIC_PRIVATE_NOTE' in public.resolve_pregnancy_share(repeat('a',64))::text) = 0, 'private notes never enter the projection');
select ok(public.resolve_pregnancy_share(repeat('b',64)) is null, 'guessed token hash is rejected');
select ok(public.resolve_pregnancy_share(repeat('c',64)) is null, 'expired link is rejected');

reset role;
update public.pregnancy_share_links set revoked_at = now() where id = '40000000-0000-0000-0000-000000000001';
set local role anon;
select ok(public.resolve_pregnancy_share(repeat('a',64)) is null, 'revoke immediately ends access');
select * from finish();
rollback;
