import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type Client = SupabaseClient<Database>;
const isoDate = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString().slice(0, 10);
const isoTime = (offsetDays: number) => new Date(Date.now() + offsetDays * 86_400_000).toISOString();

async function fail(result: { error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
}

export async function getDemoState(client: Client, userId: string) {
  const result = await client.from('demo_data_state').select('seeded_at, cleared_at').eq('user_id', userId).maybeSingle();
  await fail(result);
  return result.data as { seeded_at: string | null; cleared_at: string | null } | null;
}

export async function seedDemoData(client: Client, userId: string) {
  const state = await getDemoState(client, userId);
  if (state?.seeded_at || state?.cleared_at) return Boolean(state?.seeded_at && !state.cleared_at);
  const existing = await Promise.all([
    client.from('profiles').select('id').eq('id', userId).limit(1),
    client.from('health_events').select('id').eq('user_id', userId).limit(1),
    client.from('menstrual_cycles').select('id').eq('user_id', userId).limit(1),
    client.from('appointments').select('id').eq('user_id', userId).limit(1),
    client.from('care_tasks').select('id').eq('user_id', userId).limit(1),
    client.from('care_questions').select('id').eq('user_id', userId).limit(1),
  ]);
  for (const result of existing) await fail(result);
  if (existing.some((result) => result.data?.length)) {
    await fail(await client.from('demo_data_state').upsert({ user_id: userId, cleared_at: new Date().toISOString() }, { onConflict: 'user_id' }));
    return false;
  }

  const ids = {
    profile: userId,
    journey: crypto.randomUUID(),
    eventOne: crypto.randomUUID(),
    eventTwo: crypto.randomUUID(),
    eventThree: crypto.randomUUID(),
    cycleOne: crypto.randomUUID(),
    cycleTwo: crypto.randomUUID(),
    cycleThree: crypto.randomUUID(),
    appointment: crypto.randomUUID(),
    task: crypto.randomUUID(),
    question: crypto.randomUUID(),
    journeyTaskOne: crypto.randomUUID(),
    journeyTaskTwo: crypto.randomUUID(),
    journeyTaskThree: crypto.randomUUID(),
    reminder: crypto.randomUUID(),
  };

  await fail(await client.from('profiles').upsert({ id: userId, display_name: 'MAMA sample', is_demo: true }, { onConflict: 'id' }));
  await fail(await client.from('user_journeys').insert({ id: ids.journey, user_id: userId, stage: 'cycle', is_current: true, date_source: 'estimate', is_demo: true }));
  await fail(await client.from('health_events').insert([
    { id: ids.eventOne, user_id: userId, event_type: 'checkin', occurred_on: isoDate(-6), mood: 'Good', bleeding: 'None', pain: 'None', notes: 'Sample entry — replace or clear whenever you are ready.', is_demo: true },
    { id: ids.eventTwo, user_id: userId, event_type: 'checkin', occurred_on: isoDate(-3), mood: 'Okay', bleeding: 'Not recorded', pain: 'Mild', notes: 'Sample entry — this is not your health information.', is_demo: true },
    { id: ids.eventThree, user_id: userId, event_type: 'checkin', occurred_on: isoDate(-1), mood: 'Mixed', bleeding: 'None', pain: 'None', notes: 'Sample entry — only the records you add are yours.', is_demo: true },
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
  await fail(await client.from('appointments').insert({ id: ids.appointment, user_id: userId, title: 'A sample care conversation', scheduled_on: isoDate(4), scheduled_time: '10:00', location: 'Add your preferred location', notes: 'Sample appointment — edit or remove it.', is_demo: true }));
  await fail(await client.from('care_tasks').insert({ id: ids.task, user_id: userId, title: 'Prepare a question for a future visit', notes: 'Sample care task — edit or remove it.', is_demo: true }));
  await fail(await client.from('care_questions').insert({ id: ids.question, user_id: userId, question: 'What would be helpful for me to discuss at my next appointment?', status: 'open', is_demo: true }));
  await fail(await client.from('journey_tasks').insert([
    { id: ids.journeyTaskOne, user_id: userId, title: 'Log a check-in', description: 'Notice how you are feeling today.', category: 'tracking', status: 'completed', completed_at: isoTime(-1), points_awarded: 1, is_demo: true },
    { id: ids.journeyTaskTwo, user_id: userId, title: 'Read a MAMA guide', description: 'Choose information that feels useful.', category: 'learning', status: 'available', points_awarded: 1, is_demo: true },
    { id: ids.journeyTaskThree, user_id: userId, title: 'Prepare for care', description: 'Save one question for a future conversation.', category: 'preparation', status: 'available', points_awarded: 1, is_demo: true },
  ]));
  await fail(await client.from('user_reminders').insert({ id: ids.reminder, user_id: userId, title: 'A private MAMA reminder', remind_at: isoTime(1), active: true, is_demo: true }));
  await fail(await client.from('demo_data_state').upsert({ user_id: userId, seeded_at: new Date().toISOString(), cleared_at: null }, { onConflict: 'user_id' }));
  return true;
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
  await fail(await client.from('profiles').delete().eq('id', userId).eq('is_demo', true));
  await fail(await client.from('demo_data_state').upsert({ user_id: userId, seeded_at: null, cleared_at: new Date().toISOString() }, { onConflict: 'user_id' }));
}
