import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type Client = SupabaseClient<Database>;
export type CareMode = 'account' | 'demo';
export type DemoState = {
  seeded_at: string | null;
  cleared_at: string | null;
  active_mode: CareMode;
  hidden_at: string | null;
};

const isoDate = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
const isoTime = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();

async function fail(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

export const demoAvailable = (state: DemoState | null) => Boolean(state?.seeded_at && !state.cleared_at);

export async function getDemoState(client: Client, userId: string): Promise<DemoState | null> {
  const result = await client.from('demo_data_state').select('seeded_at, cleared_at, active_mode, hidden_at').eq('user_id', userId).maybeSingle();
  await fail(result);
  if (!result.data) return null;
  const row = result.data as Record<string, unknown>;
  return {
    seeded_at: typeof row.seeded_at === 'string' ? row.seeded_at : null,
    cleared_at: typeof row.cleared_at === 'string' ? row.cleared_at : null,
    active_mode: row.active_mode === 'demo' ? 'demo' : 'account',
    hidden_at: typeof row.hidden_at === 'string' ? row.hidden_at : null,
  };
}

export async function resolveCareMode(client: Client, userId: string, requested: string | null): Promise<CareMode> {
  if (requested !== 'demo') return 'account';
  const state = await getDemoState(client, userId);
  return demoAvailable(state) && !state?.hidden_at ? 'demo' : 'account';
}

export async function seedDemoData(client: Client, userId: string) {
  const state = await getDemoState(client, userId);
  if (state?.cleared_at) return false;
  if (demoAvailable(state)) return true;

  const ids = {
    journey: crypto.randomUUID(), eventOne: crypto.randomUUID(), eventTwo: crypto.randomUUID(), eventThree: crypto.randomUUID(),
    cycleOne: crypto.randomUUID(), cycleTwo: crypto.randomUUID(), cycleThree: crypto.randomUUID(), appointment: crypto.randomUUID(),
    task: crypto.randomUUID(), question: crypto.randomUUID(), journeyTaskOne: crypto.randomUUID(), journeyTaskTwo: crypto.randomUUID(),
    journeyTaskThree: crypto.randomUUID(), reminder: crypto.randomUUID(),
  };

  // Deliberately do not create a profiles row: profiles.id is the auth-user ID,
  // so a sample profile would overwrite the person’s actual profile.
  await fail(await client.from('user_journeys').insert({ id: ids.journey, user_id: userId, stage: 'cycle', is_current: true, date_source: 'estimate', is_demo: true }));
  await fail(await client.from('health_events').insert([
    { id: ids.eventOne, user_id: userId, event_type: 'checkin', occurred_on: isoDate(-6), mood: 'Good', bleeding: 'None', pain: 'None', notes: 'Sample entry — this is illustrative only.', is_demo: true },
    { id: ids.eventTwo, user_id: userId, event_type: 'checkin', occurred_on: isoDate(-3), mood: 'Okay', bleeding: 'Not recorded', pain: 'Mild', notes: 'Sample entry — this is not your health information.', is_demo: true },
    { id: ids.eventThree, user_id: userId, event_type: 'checkin', occurred_on: isoDate(-1), mood: 'Mixed', bleeding: 'None', pain: 'None', notes: 'Sample entry — only records you add in your account are yours.', is_demo: true },
  ]));
  await fail(await client.from('symptom_logs').insert([
    { user_id: userId, health_event_id: ids.eventOne, symptom: 'Tiredness' },
    { user_id: userId, health_event_id: ids.eventTwo, symptom: 'Cramps' },
  ]));
  await fail(await client.from('menstrual_cycles').insert([
    { id: ids.cycleOne, user_id: userId, start_date: isoDate(-70), end_date: isoDate(-65), notes: 'Sample cycle record.', is_demo: true },
    { id: ids.cycleTwo, user_id: userId, start_date: isoDate(-42), end_date: isoDate(-37), notes: 'Sample cycle record.', is_demo: true },
    { id: ids.cycleThree, user_id: userId, start_date: isoDate(-14), end_date: isoDate(-9), notes: 'Sample cycle record.', is_demo: true },
  ]));
  await fail(await client.from('appointments').insert({ id: ids.appointment, user_id: userId, title: 'A sample care conversation', scheduled_on: isoDate(4), scheduled_time: '10:00', location: 'Illustrative location', notes: 'Sample appointment — view only.', is_demo: true }));
  await fail(await client.from('care_tasks').insert({ id: ids.task, user_id: userId, title: 'Prepare a question for a future visit', notes: 'Sample care task — view only.', is_demo: true }));
  await fail(await client.from('care_questions').insert({ id: ids.question, user_id: userId, question: 'What would be helpful for me to discuss at my next appointment?', status: 'open', is_demo: true }));
  await fail(await client.from('journey_tasks').insert([
    { id: ids.journeyTaskOne, user_id: userId, title: 'Log a check-in', description: 'Notice how you are feeling today.', category: 'tracking', status: 'completed', completed_at: isoTime(-1), points_awarded: 1, is_demo: true },
    { id: ids.journeyTaskTwo, user_id: userId, title: 'Read a MAMA guide', description: 'Choose information that feels useful.', category: 'learning', status: 'available', points_awarded: 1, is_demo: true },
    { id: ids.journeyTaskThree, user_id: userId, title: 'Prepare for care', description: 'Save one question for a future conversation.', category: 'preparation', status: 'available', points_awarded: 1, is_demo: true },
  ]));
  await fail(await client.from('user_reminders').insert({ id: ids.reminder, user_id: userId, title: 'A sample MAMA reminder', remind_at: isoTime(1), active: true, is_demo: true }));
  await fail(await client.from('demo_data_state').upsert({ user_id: userId, seeded_at: new Date().toISOString(), cleared_at: null, hidden_at: null, active_mode: 'demo' }, { onConflict: 'user_id' }));
  return true;
}

export async function setDemoMode(client: Client, userId: string, mode: CareMode) {
  const state = await getDemoState(client, userId);
  if (mode === 'demo' && (!demoAvailable(state) || state?.hidden_at)) throw new Error('Make the demo visible before opening it.');
  await fail(await client.from('demo_data_state').upsert({ user_id: userId, active_mode: mode }, { onConflict: 'user_id' }));
}

export async function setDemoHidden(client: Client, userId: string, hidden: boolean) {
  const state = await getDemoState(client, userId);
  if (!demoAvailable(state)) throw new Error('There is no demo data to update.');
  await fail(await client.from('demo_data_state').upsert({ user_id: userId, hidden_at: hidden ? new Date().toISOString() : null, active_mode: hidden ? 'account' : 'account' }, { onConflict: 'user_id' }));
}

export async function clearDemoData(client: Client, userId: string) {
  const demoEvents = await client.from('health_events').select('id').eq('user_id', userId).eq('is_demo', true);
  await fail(demoEvents);
  const eventIds = (demoEvents.data ?? []).map((event) => String((event as { id?: unknown }).id)).filter(Boolean);
  if (eventIds.length) await fail(await client.from('symptom_logs').delete().eq('user_id', userId).in('health_event_id', eventIds));
  await fail(await client.from('health_events').delete().eq('user_id', userId).eq('is_demo', true));
  for (const table of ['menstrual_cycles', 'appointments', 'care_tasks', 'care_questions', 'user_journeys', 'journey_tasks', 'user_reminders'] as const) {
    await fail(await client.from(table).delete().eq('user_id', userId).eq('is_demo', true));
  }
  // Safely removes only historic demo profiles created by the old implementation.
  await fail(await client.from('profiles').delete().eq('id', userId).eq('is_demo', true));
  await fail(await client.from('demo_data_state').upsert({ user_id: userId, seeded_at: null, cleared_at: new Date().toISOString(), hidden_at: null, active_mode: 'account' }, { onConflict: 'user_id' }));
}
