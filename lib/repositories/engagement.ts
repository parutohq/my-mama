import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { defaultEngagementPreferences, type EngagementData, type EngagementPreferences, type JourneyTask, type UserReminder, type Achievement, type InAppNotification } from '@/lib/engagement-model';

type Client = SupabaseClient<Database>;
type Row = Record<string, unknown>;
const rows = (data: unknown): Row[] => Array.isArray(data) ? data as Row[] : [];
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;
const boolean = (value: unknown, fallback = false) => typeof value === 'boolean' ? value : fallback;

function preferencesFrom(row?: Row | null): EngagementPreferences {
  if (!row) return defaultEngagementPreferences;
  return { timezone: text(row.timezone, 'Africa/Lagos'), locale: text(row.locale, 'en-NG'),
    discreetNotifications: boolean(row.discreet_notifications, true), journeyUpdatesEnabled: boolean(row.journey_updates_enabled, true),
    appointmentRemindersEnabled: boolean(row.appointment_reminders_enabled, true), consultationRemindersEnabled: boolean(row.consultation_reminders_enabled, true),
    weeklyRecapEnabled: boolean(row.weekly_recap_enabled, true), userRemindersEnabled: boolean(row.user_reminders_enabled, true), pointsEnabled: boolean(row.points_enabled, false) };
}

export async function getEngagementData(client: Client, userId: string): Promise<EngagementData> {
  const [preferences, tasks, reminders, achievements, notifications] = await Promise.all([
    client.from('profile_preferences').select('*').eq('user_id', userId).maybeSingle(),
    client.from('journey_tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('user_reminders').select('*').eq('user_id', userId).order('remind_at', { ascending: true }),
    client.from('user_achievements').select('awarded_at, achievement_definitions(code,title,description,category)').eq('user_id', userId).order('awarded_at', { ascending: false }),
    client.from('notifications').select('*').eq('user_id', userId).order('scheduled_for', { ascending: false }).limit(12),
  ]);
  for (const result of [preferences, tasks, reminders, achievements, notifications]) if (result.error) throw new Error(result.error.message);
  return {
    preferences: preferencesFrom(preferences.data as Row | null),
    tasks: rows(tasks.data).map((row): JourneyTask => ({ id: text(row.id), title: text(row.title), description: text(row.description),
      category: text(row.category, 'tracking') as JourneyTask['category'], status: text(row.status, 'available') as JourneyTask['status'],
      pointsAwarded: Number(row.points_awarded) || 0, completedAt: typeof row.completed_at === 'string' ? row.completed_at : null })),
    reminders: rows(reminders.data).map((row): UserReminder => ({ id: text(row.id), title: text(row.title), remindAt: text(row.remind_at),
      active: boolean(row.active, true), completedAt: typeof row.completed_at === 'string' ? row.completed_at : null })),
    achievements: rows(achievements.data).flatMap((row): Achievement[] => {
      const definition = row.achievement_definitions as Row | null;
      return definition ? [{ code: text(definition.code), title: text(definition.title), description: text(definition.description),
        category: text(definition.category, 'tracking') as Achievement['category'], awardedAt: text(row.awarded_at) }] : [];
    }),
    notifications: rows(notifications.data).map((row): InAppNotification => ({ id: text(row.id), kind: text(row.kind), title: text(row.title),
      body: text(row.body), scheduledFor: text(row.scheduled_for), readAt: typeof row.read_at === 'string' ? row.read_at : null })),
  };
}

export async function savePreferences(client: Client, userId: string, preferences: EngagementPreferences) {
  const result = await client.from('profile_preferences').upsert({ user_id: userId, timezone: preferences.timezone, locale: preferences.locale,
    discreet_notifications: preferences.discreetNotifications, journey_updates_enabled: preferences.journeyUpdatesEnabled,
    appointment_reminders_enabled: preferences.appointmentRemindersEnabled, consultation_reminders_enabled: preferences.consultationRemindersEnabled,
    weekly_recap_enabled: preferences.weeklyRecapEnabled, user_reminders_enabled: preferences.userRemindersEnabled, points_enabled: preferences.pointsEnabled,
    updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (result.error) throw new Error(result.error.message);
}
export async function saveJourneyTask(client: Client, userId: string, task: JourneyTask) {
  const result = await client.from('journey_tasks').upsert({ id: task.id, user_id: userId, title: task.title, description: task.description,
    category: task.category, status: task.status, completed_at: task.completedAt, points_awarded: 0, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (result.error) throw new Error(result.error.message);
}
export async function saveReminder(client: Client, userId: string, reminder: UserReminder) {
  const result = await client.from('user_reminders').upsert({ id: reminder.id, user_id: userId, title: reminder.title, remind_at: reminder.remindAt,
    active: reminder.active, completed_at: reminder.completedAt, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (result.error) throw new Error(result.error.message);
}
export async function removeEngagementRecord(client: Client, userId: string, kind: 'task' | 'reminder', id: string) {
  const table = kind === 'task' ? 'journey_tasks' : 'user_reminders';
  const result = await client.from(table).delete().eq('id', id).eq('user_id', userId);
  if (result.error) throw new Error(result.error.message);
}
