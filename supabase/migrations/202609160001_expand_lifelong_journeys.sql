-- Extends the lifelong journey vocabulary without changing existing patient records.
-- Apply through the reviewed Supabase migration workflow before exposing these choices.
alter type public.journey_stage add value if not exists 'first_period';
alter type public.journey_stage add value if not exists 'reproductive_health';
alter type public.journey_stage add value if not exists 'trying_to_conceive';
alter type public.journey_stage add value if not exists 'perimenopause';
alter type public.journey_stage add value if not exists 'menopause';

-- Patient-managed organisers. These are private lists, not prescribing or diagnostic records.
create table public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 150),
  schedule text not null default '' check (char_length(schedule) <= 300),
  notes text not null default '' check (char_length(notes) <= 2000),
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.investigations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 150),
  status text not null default 'planned' check (status in ('planned', 'completed', 'discussed')),
  scheduled_on date,
  notes text not null default '' check (char_length(notes) <= 2000),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index medications_user_created on public.medications(user_id, created_at desc);
create index investigations_user_created on public.investigations(user_id, created_at desc);
alter table public.medications enable row level security;
alter table public.investigations enable row level security;
revoke all on public.medications, public.investigations from anon, authenticated;
grant select, insert, update, delete on public.medications, public.investigations to authenticated;
create policy "patients manage their own medicines" on public.medications for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients manage their own investigations" on public.investigations for all to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
