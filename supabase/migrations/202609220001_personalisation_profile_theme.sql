-- Personalisation keeps setup and appearance preferences private to the patient.
alter table public.user_journeys
  add column if not exists anchor_kind text not null default 'none'
    check (anchor_kind in ('period_start', 'due_date', 'last_period', 'birth_date', 'none')),
  add column if not exists cycle_pattern text not null default 'not_sure'
    check (cycle_pattern in ('regular', 'varies', 'not_sure'));

alter table public.profile_preferences
  add column if not exists theme text not null default 'system'
    check (theme in ('light', 'dark', 'system'));

-- A journey has at most one current pregnancy or postpartum context.
create unique index if not exists pregnancies_current_journey_unique
  on public.pregnancies (journey_id) where journey_id is not null;
create unique index if not exists postpartum_current_journey_unique
  on public.postpartum_profiles (journey_id) where journey_id is not null;

-- The provider model remains multi-provider. These attributes let a provisioned
-- provider be featured without placing credentials or availability in the UI.
alter table public.providers
  add column if not exists professional_title text,
  add column if not exists specialty text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists is_featured boolean not null default false,
  add column if not exists is_default boolean not null default false;
create unique index if not exists providers_one_default_active_idx
  on public.providers (is_default) where is_default and active;

-- Patients may discover active, provisioned providers and their active
-- consultation offerings. They never gain write access to provider records.
drop policy if exists "patients read active providers" on public.providers;
create policy "patients read active providers" on public.providers for select to authenticated
  using (active = true);
drop policy if exists "patients read active consultation services" on public.consultation_services;
create policy "patients read active consultation services" on public.consultation_services for select to authenticated
  using (active = true and exists (select 1 from public.providers p where p.id = provider_id and p.active = true));
drop policy if exists "patients read active provider availability" on public.provider_availability;
create policy "patients read active provider availability" on public.provider_availability for select to authenticated
  using (available = true and exists (select 1 from public.providers p where p.id = provider_id and p.active = true));

-- Grants already exist; these are explicit for a migration that can be applied
-- independently to staging and production.
revoke all on public.profile_preferences from anon;
grant select, insert, update, delete on public.profile_preferences to authenticated;
