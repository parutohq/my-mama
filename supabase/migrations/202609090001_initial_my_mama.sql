-- My MAMA foundation. Apply through the Supabase CLI; do not use ad-hoc dashboard SQL.
create extension if not exists pgcrypto;

create type public.journey_stage as enum ('none', 'cycle', 'preconception', 'pregnancy', 'postpartum', 'recovery');
create type public.booking_status as enum ('requested', 'accepted', 'declined', 'cancelled', 'completed');
create type public.content_status as enum ('draft', 'in_review', 'published', 'archived');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (char_length(display_name) <= 60),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.user_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('patient', 'clinician', 'admin')) default 'patient',
  assigned_at timestamptz not null default now(), assigned_by uuid references auth.users(id)
);
create table public.user_journeys (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  stage public.journey_stage not null default 'none', anchor_date date, date_source text not null default 'estimate' check (date_source in ('estimate', 'clinician')),
  contact_name text, contact_phone text, is_current boolean not null default true, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (user_id, is_current)
);
create table public.pregnancies (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, journey_id uuid references public.user_journeys(id) on delete set null,
  due_date date, due_date_source text check (due_date_source in ('estimate', 'clinician')), status text not null default 'active' check (status in ('active', 'ended', 'unknown')), created_at timestamptz not null default now()
);
create table public.postpartum_profiles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, journey_id uuid references public.user_journeys(id) on delete set null,
  birth_date date, created_at timestamptz not null default now()
);
create table public.health_events (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  event_type text not null check (event_type in ('checkin', 'note')), occurred_on date not null, mood text, bleeding text, pain text, notes text not null default '' check (char_length(notes) <= 2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.symptom_logs (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  health_event_id uuid not null references public.health_events(id) on delete cascade, symptom text not null check (char_length(symptom) <= 100), created_at timestamptz not null default now(), unique(health_event_id, symptom)
);
create table public.menstrual_cycles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  start_date date not null, end_date date, notes text not null default '' check (char_length(notes) <= 2000), created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (end_date is null or end_date >= start_date)
);
create table public.appointments (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150), scheduled_on date not null, scheduled_time time, location text, notes text not null default '' check (char_length(notes) <= 2000), done boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.care_tasks (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150), notes text not null default '' check (char_length(notes) <= 2000), done boolean not null default false, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.care_questions (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade, question text not null check (char_length(question) between 1 and 2000), status text not null default 'open' check (status in ('open','answered','closed')), created_at timestamptz not null default now()
);
create table public.providers (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade, display_name text not null, credentials text, verified_at timestamptz, active boolean not null default false, created_at timestamptz not null default now()
);
create table public.consultation_services (
  id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.providers(id) on delete cascade, title text not null, description text not null default '', duration_minutes integer not null check (duration_minutes between 5 and 240), active boolean not null default false, created_at timestamptz not null default now()
);
create table public.provider_availability (
  id uuid primary key default gen_random_uuid(), provider_id uuid not null references public.providers(id) on delete cascade, starts_at timestamptz not null, ends_at timestamptz not null, available boolean not null default true, check (ends_at > starts_at)
);
create table public.consultation_bookings (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references auth.users(id) on delete cascade, provider_id uuid not null references public.providers(id) on delete restrict, service_id uuid references public.consultation_services(id) on delete set null, starts_at timestamptz not null, ends_at timestamptz not null, status public.booking_status not null default 'requested', created_at timestamptz not null default now(), check (ends_at > starts_at)
);
create table public.sharing_permissions (
  id uuid primary key default gen_random_uuid(), patient_id uuid not null references auth.users(id) on delete cascade, provider_user_id uuid not null references auth.users(id) on delete cascade, scopes text[] not null default '{}', granted_at timestamptz not null default now(), expires_at timestamptz, revoked_at timestamptz, check (provider_user_id <> patient_id)
);
create table public.clinical_content (
  id uuid primary key default gen_random_uuid(), slug text not null unique, title text not null, body text not null, country_code text not null default 'NG', status public.content_status not null default 'draft', source_urls text[] not null default '{}', reviewed_by uuid references auth.users(id), reviewed_at timestamptz, published_at timestamptz, version integer not null default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.audit_logs (
  id uuid primary key default gen_random_uuid(), actor_id uuid references auth.users(id) on delete set null, subject_id uuid references auth.users(id) on delete set null, action text not null, resource_type text not null, resource_id uuid, metadata jsonb not null default '{}', created_at timestamptz not null default now()
);

create index health_events_user_date on public.health_events(user_id, occurred_on desc);
create index cycles_user_start on public.menstrual_cycles(user_id, start_date desc);
create index appointments_user_date on public.appointments(user_id, scheduled_on);
create index bookings_patient on public.consultation_bookings(patient_id);
create index sharing_patient_provider on public.sharing_permissions(patient_id, provider_user_id) where revoked_at is null;

create or replace function public.is_clinician() returns boolean language sql stable security definer set search_path = public as $$ select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'clinician') $$;
create or replace function public.can_provider_access_patient(target_user_id uuid, requested_scope text) returns boolean language sql stable security definer set search_path = public as $$
  select public.is_clinician() and (
    exists (select 1 from public.consultation_bookings b join public.providers p on p.id = b.provider_id where p.user_id = auth.uid() and b.patient_id = target_user_id and b.status in ('accepted','completed'))
    or exists (select 1 from public.sharing_permissions s where s.patient_id = target_user_id and s.provider_user_id = auth.uid() and s.revoked_at is null and (s.expires_at is null or s.expires_at > now()) and requested_scope = any(s.scopes))
  )
$$;
revoke all on function public.is_clinician() from public;
revoke all on function public.can_provider_access_patient(uuid, text) from public;
grant execute on function public.can_provider_access_patient(uuid, text) to authenticated;

-- Sensitive tables have RLS and explicitly limited authenticated grants.
alter table public.profiles enable row level security;
alter table public.user_journeys enable row level security;
alter table public.pregnancies enable row level security;
alter table public.postpartum_profiles enable row level security;
alter table public.health_events enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.menstrual_cycles enable row level security;
alter table public.appointments enable row level security;
alter table public.care_tasks enable row level security;
alter table public.care_questions enable row level security;
alter table public.providers enable row level security;
alter table public.consultation_services enable row level security;
alter table public.provider_availability enable row level security;
alter table public.consultation_bookings enable row level security;
alter table public.sharing_permissions enable row level security;
alter table public.clinical_content enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_roles enable row level security;

revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on public.profiles, public.user_journeys, public.pregnancies, public.postpartum_profiles, public.health_events, public.symptom_logs, public.menstrual_cycles, public.appointments, public.care_tasks, public.care_questions, public.consultation_bookings, public.sharing_permissions to authenticated;
grant select on public.clinical_content to anon, authenticated;
grant select on public.providers, public.consultation_services, public.provider_availability to authenticated;

create policy "patients manage their own profile" on public.profiles for all to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "patients manage their own journeys" on public.user_journeys for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients manage their own pregnancies" on public.pregnancies for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients manage their own postpartum profile" on public.postpartum_profiles for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients and authorised clinicians read events" on public.health_events for select to authenticated using (user_id = (select auth.uid()) or public.can_provider_access_patient(user_id, 'health_events'));
create policy "patients manage their own events" on public.health_events for insert to authenticated with check (user_id = (select auth.uid()));
create policy "patients update their own events" on public.health_events for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients delete their own events" on public.health_events for delete to authenticated using (user_id = (select auth.uid()));
create policy "patients and authorised clinicians read symptoms" on public.symptom_logs for select to authenticated using (user_id = (select auth.uid()) or public.can_provider_access_patient(user_id, 'symptom_logs'));
create policy "patients manage their own symptoms" on public.symptom_logs for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients and authorised clinicians read cycles" on public.menstrual_cycles for select to authenticated using (user_id = (select auth.uid()) or public.can_provider_access_patient(user_id, 'menstrual_cycles'));
create policy "patients manage their own cycles" on public.menstrual_cycles for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients manage their own appointments" on public.appointments for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients manage their own tasks" on public.care_tasks for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients manage their own questions" on public.care_questions for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients own their bookings" on public.consultation_bookings for all to authenticated using (patient_id = (select auth.uid())) with check (patient_id = (select auth.uid()));
create policy "providers read their bookings" on public.consultation_bookings for select to authenticated using (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));
create policy "patients manage sharing" on public.sharing_permissions for all to authenticated using (patient_id = (select auth.uid())) with check (patient_id = (select auth.uid()));
create policy "providers read active grants made to them" on public.sharing_permissions for select to authenticated using (provider_user_id = (select auth.uid()));
create policy "published content is readable" on public.clinical_content for select using (status = 'published');
create policy "providers read their own profile" on public.providers for select to authenticated using (user_id = (select auth.uid()));
create policy "providers read their own services" on public.consultation_services for select to authenticated using (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));
create policy "providers read their own availability" on public.provider_availability for select to authenticated using (exists (select 1 from public.providers p where p.id = provider_id and p.user_id = (select auth.uid())));
create policy "users read their own audit events" on public.audit_logs for select to authenticated using (actor_id = (select auth.uid()) or subject_id = (select auth.uid()));

-- Private storage bucket reserved for later document uploads; no application upload UI is enabled yet.
insert into storage.buckets (id, name, public) values ('patient-documents', 'patient-documents', false) on conflict (id) do nothing;
create policy "patients manage documents in their folder" on storage.objects for all to authenticated using (bucket_id = 'patient-documents' and (storage.foldername(name))[1] = (select auth.uid()::text)) with check (bucket_id = 'patient-documents' and (storage.foldername(name))[1] = (select auth.uid()::text));
