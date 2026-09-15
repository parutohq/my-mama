-- In-app notification outbox. Runs entirely in Postgres; external push delivery is opt-in
-- and must be connected only after VAPID credentials and a mobile/web-push review are complete.
alter table public.notifications add column source_key text;
create unique index notifications_user_source_key_unique on public.notifications(user_id, source_key) where source_key is not null;

create or replace function public.queue_due_mama_notifications()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  -- All generated copy is deliberately generic: it does not expose a journey stage,
  -- appointment name, symptom, or other medical detail on a lock screen.
  insert into public.notifications (user_id, kind, title, body, sensitive, scheduled_for, source_key)
  select r.user_id, 'user_reminder', 'A private MAMA reminder', 'Open MAMA when you are ready.', false, r.remind_at,
    'reminder:' || r.id::text || ':' || to_char(r.remind_at, 'YYYYMMDDHH24MI')
  from public.user_reminders r
  left join public.profile_preferences p on p.user_id = r.user_id
  where r.active and r.completed_at is null and r.remind_at <= now() and r.remind_at > now() - interval '24 hours'
    and coalesce(p.user_reminders_enabled, true)
  on conflict do nothing;

  insert into public.notifications (user_id, kind, title, body, sensitive, scheduled_for, source_key)
  select a.user_id, 'appointment_reminder', 'A gentle MAMA reminder', 'Open MAMA to review your care plan.', false,
    (a.scheduled_on::timestamp at time zone 'Africa/Lagos') - interval '24 hours',
    'appointment:' || a.id::text || ':' || a.scheduled_on::text
  from public.appointments a
  left join public.profile_preferences p on p.user_id = a.user_id
  where not a.done and a.scheduled_on = (now() at time zone 'Africa/Lagos' + interval '1 day')::date
    and coalesce(p.appointment_reminders_enabled, true)
  on conflict do nothing;

  insert into public.notification_delivery_logs (notification_id, user_id, channel, status)
  select n.id, n.user_id, 'in_app', 'sent'
  from public.notifications n
  where n.delivered_at is null and n.scheduled_for <= now()
  on conflict do nothing;

  update public.notifications set delivered_at = now()
  where delivered_at is null and scheduled_for <= now();
end;
$$;

revoke all on function public.queue_due_mama_notifications() from public, anon, authenticated;
-- Supabase Cron runs as the database owner. Enable the pg_cron extension in the dashboard,
-- then create this reviewed job in staging before production:
-- select cron.schedule('mama-queue-due-notifications', '*/15 * * * *', $$select public.queue_due_mama_notifications()$$);
