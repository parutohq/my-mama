-- Per-user sample data for the MAMA product tour. It is explicitly marked,
-- isolated by RLS, and can be removed without touching a person's real records.
create table public.demo_data_state (
  user_id uuid primary key references auth.users(id) on delete cascade,
  seeded_at timestamptz,
  cleared_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.profiles add column is_demo boolean not null default false;
alter table public.user_journeys add column is_demo boolean not null default false;
alter table public.health_events add column is_demo boolean not null default false;
alter table public.menstrual_cycles add column is_demo boolean not null default false;
alter table public.appointments add column is_demo boolean not null default false;
alter table public.care_tasks add column is_demo boolean not null default false;
alter table public.care_questions add column is_demo boolean not null default false;
alter table public.journey_tasks add column is_demo boolean not null default false;
alter table public.user_reminders add column is_demo boolean not null default false;

alter table public.demo_data_state enable row level security;
revoke all on public.demo_data_state from anon, authenticated;
grant select, insert, update on public.demo_data_state to authenticated;
create policy "patients manage their own demo state" on public.demo_data_state for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
