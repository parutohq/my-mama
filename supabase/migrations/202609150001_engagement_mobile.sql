-- My MAMA engagement and mobile experience foundation.
-- This migration stores engagement data without inferring clinical status or outcomes.

create type public.engagement_task_category as enum ('tracking', 'learning', 'preparation', 'follow_up');
create type public.engagement_task_status as enum ('available', 'completed', 'dismissed');
create type public.notification_kind as enum ('journey_update', 'appointment_reminder', 'consultation_reminder', 'weekly_recap', 'user_reminder');
create type public.notification_delivery_channel as enum ('in_app', 'push');
create type public.notification_delivery_status as enum ('queued', 'sent', 'failed', 'suppressed');

create table public.profile_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  timezone text not null default 'Africa/Lagos' check (char_length(timezone) <= 80),
  locale text not null default 'en-NG' check (char_length(locale) <= 20),
  discreet_notifications boolean not null default true,
  journey_updates_enabled boolean not null default true,
  appointment_reminders_enabled boolean not null default true,
  consultation_reminders_enabled boolean not null default true,
  weekly_recap_enabled boolean not null default true,
  user_reminders_enabled boolean not null default true,
  points_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

-- Retains a minimal history of a chosen journey without requiring clinical details.
create table public.journey_transitions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  from_stage public.journey_stage,
  to_stage public.journey_stage not null,
  transition_kind text not null default 'user_selected' check (transition_kind in ('user_selected', 'sensitive_transition')),
  suppress_celebration boolean not null default false,
  occurred_at timestamptz not null default now()
);

create table public.journey_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  journey_stage public.journey_stage,
  title text not null check (char_length(title) between 1 and 150),
  description text not null default '' check (char_length(description) <= 500),
  category public.engagement_task_category not null,
  task_key text check (char_length(task_key) <= 100),
  status public.engagement_task_status not null default 'available',
  completed_at timestamptz,
  points_awarded smallint not null default 0 check (points_awarded between 0 and 50),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'completed') = (completed_at is not null))
);
create unique index journey_tasks_user_task_key_unique
  on public.journey_tasks(user_id, task_key) where task_key is not null;
create index journey_tasks_user_status on public.journey_tasks(user_id, status, created_at desc);

create table public.achievement_definitions (
  code text primary key check (char_length(code) between 1 and 100),
  title text not null check (char_length(title) between 1 and 100),
  description text not null check (char_length(description) <= 300),
  category public.engagement_task_category not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  achievement_code text not null references public.achievement_definitions(code) on delete restrict,
  awarded_at timestamptz not null default now(),
  unique (user_id, achievement_code)
);

-- User-created reminders are intentionally generic. Health details belong in the patient's private records, not notification payloads.
create table public.user_reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  remind_at timestamptz not null,
  active boolean not null default true,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index user_reminders_due on public.user_reminders(user_id, remind_at) where active;

-- Outbox records use a safe title/body. Default payloads must never disclose symptoms, diagnosis, pregnancy status or appointments on a lock screen.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind public.notification_kind not null,
  title text not null check (char_length(title) between 1 and 120),
  body text not null default '' check (char_length(body) <= 300),
  sensitive boolean not null default false,
  scheduled_for timestamptz not null default now(),
  delivered_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_scheduled on public.notifications(user_id, scheduled_for desc);

-- Stores Web Push subscription material; VAPID/server credentials remain server-only.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  endpoint text not null check (char_length(endpoint) <= 2048),
  p256dh text not null check (char_length(p256dh) <= 512),
  auth text not null check (char_length(auth) <= 512),
  user_agent text,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  revoked_at timestamptz,
  unique (user_id, endpoint)
);

-- Only controlled server paths write delivery records. Patients can inspect their own non-sensitive delivery history.
create table public.notification_delivery_logs (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  channel public.notification_delivery_channel not null,
  status public.notification_delivery_status not null default 'queued',
  provider_message_id text,
  failure_code text check (char_length(failure_code) <= 100),
  created_at timestamptz not null default now()
);
create index notification_delivery_logs_user_created on public.notification_delivery_logs(user_id, created_at desc);

insert into public.achievement_definitions (code, title, description, category) values
  ('first-check-in', 'First check-in', 'You made space to notice how you are feeling.', 'tracking'),
  ('care-prepared', 'Care prepared', 'You added a practical step for a future conversation or visit.', 'preparation'),
  ('curious-care', 'Curious care', 'You saved a question to help guide a care conversation.', 'follow_up'),
  ('learning-moment', 'Learning moment', 'You explored a MAMA learning guide.', 'learning')
on conflict (code) do nothing;

alter table public.profile_preferences enable row level security;
alter table public.journey_transitions enable row level security;
alter table public.journey_tasks enable row level security;
alter table public.achievement_definitions enable row level security;
alter table public.user_achievements enable row level security;
alter table public.user_reminders enable row level security;
alter table public.notifications enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.notification_delivery_logs enable row level security;

revoke all on public.profile_preferences, public.journey_transitions, public.journey_tasks,
  public.achievement_definitions, public.user_achievements, public.user_reminders,
  public.notifications, public.push_subscriptions, public.notification_delivery_logs from anon, authenticated;
grant select, insert, update, delete on public.profile_preferences, public.journey_transitions,
  public.journey_tasks, public.user_reminders, public.push_subscriptions to authenticated;
grant select, update on public.notifications to authenticated;
grant select on public.achievement_definitions, public.user_achievements, public.notification_delivery_logs to authenticated;

create policy "patients manage own engagement preferences" on public.profile_preferences for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients read own journey transitions" on public.journey_transitions for select to authenticated
  using (user_id = (select auth.uid()));
create policy "patients add own journey transitions" on public.journey_transitions for insert to authenticated
  with check (user_id = (select auth.uid()));
create policy "patients manage own journey tasks" on public.journey_tasks for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "authenticated users read active achievements" on public.achievement_definitions for select to authenticated
  using (active = true);
create policy "patients read own achievements" on public.user_achievements for select to authenticated
  using (user_id = (select auth.uid()));
create policy "patients manage own reminders" on public.user_reminders for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients read own notifications" on public.notifications for select to authenticated
  using (user_id = (select auth.uid()));
create policy "patients mark own notifications" on public.notifications for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients manage own push subscriptions" on public.push_subscriptions for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "patients read own delivery history" on public.notification_delivery_logs for select to authenticated
  using (user_id = (select auth.uid()));
