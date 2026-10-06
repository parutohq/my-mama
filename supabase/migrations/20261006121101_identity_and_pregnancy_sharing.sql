-- Public identity is a narrow projection of an owner-only profile. Health tables stay private.
create table public.reserved_usernames (username text primary key);
insert into public.reserved_usernames(username) values
 ('admin'),('administrator'),('mama'),('mymama'),('support'),('help'),('official'),
 ('moderator'),('mod'),('security'),('system'),('doctor'),('clinician'),
 ('paruto'),('parutohealth'),('staff'),('api'),('auth'),('sign_in'),('sign_up'),
 ('privacy'),('terms'),('pregnancy'),('start'),('profile');
alter table public.reserved_usernames enable row level security;
revoke all on public.reserved_usernames from anon, authenticated;

alter table public.profiles
  add column username text,
  add column username_normalized text generated always as (lower(username)) stored,
  add column avatar_ref text,
  add column bio text check (bio is null or char_length(bio) <= 280),
  add column profile_visibility text not null default 'private' check (profile_visibility in ('public','private')),
  add column age_13_plus_confirmed boolean not null default false,
  add column age_confirmed_at timestamptz,
  add column age_confirmation_version text,
  add column age_group text check (age_group in ('13_17','18_plus'));
alter table public.profiles add constraint profiles_username_format check
  (username is null or (username = lower(username) and username ~ '^[a-z0-9_]{3,20}$'));
alter table public.profiles add constraint profiles_confirmed_identity check
  (username is null or (age_13_plus_confirmed and age_confirmed_at is not null and age_confirmation_version is not null));
create unique index profiles_username_normalized_unique on public.profiles(username_normalized) where username_normalized is not null;
-- Ordinary profile saves may update display details, never the username or age attestation.
revoke insert, update on public.profiles from authenticated;
grant insert(id, display_name, is_demo) on public.profiles to authenticated;
grant update(id, display_name, is_demo, profile_visibility, bio, avatar_ref) on public.profiles to authenticated;

-- Persist the server-validated self-attestation at account creation for MAMA sign-ups.
-- Legacy identities without this metadata remain unconfirmed until first-run claim.
create or replace function public.record_mama_age_confirmation() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.raw_user_meta_data ? 'mama_requested_username' then
    if new.raw_user_meta_data ->> 'mama_age_13_plus_confirmed' is distinct from 'true'
      or new.raw_user_meta_data ->> 'mama_age_confirmation_version' is distinct from '2026-10-identity-v1' then
      raise exception 'MAMA age confirmation is required';
    end if;
    insert into public.profiles(id, age_13_plus_confirmed, age_confirmed_at, age_confirmation_version)
    values(new.id, true, now(), '2026-10-identity-v1')
    on conflict(id) do update set age_13_plus_confirmed = true,
      age_confirmed_at = coalesce(public.profiles.age_confirmed_at, now()),
      age_confirmation_version = coalesce(public.profiles.age_confirmation_version, '2026-10-identity-v1');
  end if;
  return new;
end $$;
create trigger mama_age_confirmation_on_signup after insert on auth.users
for each row execute function public.record_mama_age_confirmation();
revoke all on function public.record_mama_age_confirmation() from public;

create or replace function public.mama_username_status(candidate text) returns text
language plpgsql stable security definer set search_path = '' as $$
declare normalized text := lower(coalesce(candidate,''));
begin
  if normalized !~ '^[a-z0-9_]{3,20}$' then return 'invalid'; end if;
  if exists(select 1 from public.reserved_usernames r where r.username = normalized) then return 'reserved'; end if;
  if exists(select 1 from public.profiles p where p.username_normalized = normalized) then return 'unavailable'; end if;
  return 'available';
end $$;
revoke all on function public.mama_username_status(text) from public;
grant execute on function public.mama_username_status(text) to anon, authenticated;

create or replace function public.claim_mama_identity(candidate text, chosen_display_name text, confirmed_13_plus boolean)
returns text language plpgsql security definer set search_path = '' as $$
declare normalized text := lower(coalesce(candidate,'')); existing_username text;
begin
  if auth.uid() is null then raise exception 'Sign in first'; end if;
  if confirmed_13_plus is distinct from true then raise exception 'Age confirmation is required'; end if;
  select username into existing_username from public.profiles where id = auth.uid();
  if existing_username is not null and existing_username <> normalized then raise exception 'Username changes are not yet available'; end if;
  if public.mama_username_status(normalized) in ('invalid','reserved') then raise exception 'Username is invalid or reserved'; end if;
  if existing_username is null and public.mama_username_status(normalized) = 'unavailable' then raise exception 'Username has already been claimed'; end if;
  insert into public.profiles(id, display_name, username, age_13_plus_confirmed, age_confirmed_at, age_confirmation_version)
  values(auth.uid(), left(trim(coalesce(chosen_display_name,'')),60), normalized, true, now(), '2026-10-identity-v1')
  on conflict(id) do update set
    username = excluded.username,
    display_name = case when excluded.display_name <> '' then excluded.display_name else public.profiles.display_name end,
    age_13_plus_confirmed = true,
    age_confirmed_at = coalesce(public.profiles.age_confirmed_at, now()),
    age_confirmation_version = coalesce(public.profiles.age_confirmation_version, '2026-10-identity-v1'),
    updated_at = now();
  return normalized;
exception when unique_violation then raise exception 'Username has already been claimed';
end $$;
revoke all on function public.claim_mama_identity(text,text,boolean) from public;
grant execute on function public.claim_mama_identity(text,text,boolean) to authenticated;

create or replace function public.mama_public_profile(handle text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare result jsonb;
begin
  if lower(coalesce(handle,'')) !~ '^[a-z0-9_]{3,20}$' then return null; end if;
  select jsonb_build_object('username',p.username_normalized,'displayName',p.display_name,
    'bio',p.bio,'avatarRef',p.avatar_ref)
  into result from public.profiles p where p.username_normalized = lower(handle)
    and p.profile_visibility = 'public' and p.is_demo = false;
  return result;
end $$;
revoke all on function public.mama_public_profile(text) from public;
grant execute on function public.mama_public_profile(text) to anon, authenticated;

-- Support links authorize a purpose-built projection; anonymous roles never read care tables.
create table public.pregnancy_share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pregnancy_id uuid not null references public.pregnancies(id) on delete cascade,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  label text check (label is null or char_length(label) <= 60),
  scopes text[] not null default array['week','progress']::text[]
    check (array_length(scopes,1) between 1 and 4 and scopes <@ array['week','progress','edd','appointment']::text[]),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null check (expires_at > created_at and expires_at <= created_at + interval '31 days'),
  revoked_at timestamptz,
  last_accessed_at timestamptz,
  created_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
create index pregnancy_share_owner on public.pregnancy_share_links(user_id,created_at desc);
alter table public.pregnancy_share_links enable row level security;
revoke all on public.pregnancy_share_links from anon, authenticated;
grant select, insert on public.pregnancy_share_links to authenticated;
grant update(revoked_at) on public.pregnancy_share_links to authenticated;
create policy "owner reads support links" on public.pregnancy_share_links for select to authenticated
  using (user_id = (select auth.uid()));
create policy "owner creates support links" on public.pregnancy_share_links for insert to authenticated
  with check (user_id = (select auth.uid()) and created_by = (select auth.uid()) and
    exists(select 1 from public.pregnancies p where p.id = pregnancy_id and p.user_id = (select auth.uid()) and p.status = 'active'));
create policy "owner revokes support links" on public.pregnancy_share_links for update to authenticated
  using (user_id = (select auth.uid()) and revoked_at is null)
  with check (user_id = (select auth.uid()) and revoked_at is not null);
-- Only the server projection may resolve opaque tokens. It returns explicitly selected fields.
create or replace function public.resolve_pregnancy_share(lookup_hash text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare link public.pregnancy_share_links%rowtype; due date; week_number integer; result jsonb := '{}'::jsonb;
begin
  if lookup_hash !~ '^[0-9a-f]{64}$' then return null; end if;
  select * into link from public.pregnancy_share_links
  where token_hash = lookup_hash and revoked_at is null and expires_at > now();
  if not found then return null; end if;
  select coalesce(p.due_date, case when j.anchor_kind = 'due_date' then j.anchor_date
    when j.anchor_kind = 'last_period' then j.anchor_date + 280 else null end)
    into due from public.pregnancies p join public.user_journeys j on j.id = p.journey_id
    where p.id = link.pregnancy_id and p.user_id = link.user_id and p.status = 'active' and j.is_current;
  if due is null then return null; end if;
  week_number := greatest(0,least(44, floor((280 - (due - current_date)) / 7.0)::integer));
  if 'week' = any(link.scopes) then result := result || jsonb_build_object('week',week_number,'trimester',case when week_number < 13 then 1 when week_number < 28 then 2 else 3 end); end if;
  if 'progress' = any(link.scopes) then result := result || jsonb_build_object('progress',least(100,round(week_number * 100.0 / 40)::integer)); end if;
  if 'edd' = any(link.scopes) then result := result || jsonb_build_object('estimatedDueDate',due); end if;
  if 'appointment' = any(link.scopes) then
    result := result || jsonb_build_object('nextAppointmentDate',
      (select min(a.scheduled_on) from public.appointments a where a.user_id = link.user_id and a.scheduled_on >= current_date and not a.done));
  end if;
  update public.pregnancy_share_links set last_accessed_at = now() where id = link.id;
  return result;
end $$;
revoke all on function public.resolve_pregnancy_share(text) from public;
grant execute on function public.resolve_pregnancy_share(text) to anon, authenticated;
