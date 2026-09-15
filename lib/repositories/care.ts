import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import {
  type CareItem,
  type CareQuestion,
  type CareRecord,
  type Checkin,
  type Period,
  type Profile,
} from '@/lib/care-model';

type Client = SupabaseClient<Database>;
type Row = Record<string, unknown>;

const rows = (data: unknown): Row[] => (Array.isArray(data) ? data as Row[] : []);
const text = (value: unknown, fallback = ''): string =>
  typeof value === 'string' ? value : fallback;

function profileFromRows(profile?: Row | null, journey?: Row | null): Profile | null {
  if (!profile || !journey) return null;

  return {
    kind: 'profile',
    id: 'profile',
    name: text(profile.display_name),
    stage: text(journey.stage, 'none') as Profile['stage'],
    date: text(journey.anchor_date),
    dateSource: journey.date_source === 'clinician' ? 'clinician' : 'estimate',
    contactName: text(journey.contact_name),
    phone: text(journey.contact_phone),
  };
}

/**
 * Temporary UI adapter. It deliberately maps relational Supabase records to the
 * existing UI shapes while the screen-by-screen MAMA rebuild is in progress.
 */
export async function getCareRecords(client: Client, userId: string) {
  const [profileRes, journeyRes, eventsRes, symptomsRes, periodsRes, appointmentsRes, tasksRes, questionsRes] = await Promise.all([
    client.from('profiles').select('*').eq('id', userId).maybeSingle(),
    client.from('user_journeys').select('*').eq('user_id', userId).eq('is_current', true).maybeSingle(),
    client.from('health_events').select('*').eq('user_id', userId).eq('event_type', 'checkin').order('occurred_on', { ascending: false }),
    client.from('symptom_logs').select('*').eq('user_id', userId),
    client.from('menstrual_cycles').select('*').eq('user_id', userId).order('start_date', { ascending: false }),
    client.from('appointments').select('*').eq('user_id', userId).order('scheduled_on', { ascending: true }),
    client.from('care_tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('care_questions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);

  const results = [profileRes, journeyRes, eventsRes, symptomsRes, periodsRes, appointmentsRes, tasksRes, questionsRes];
  const failed = results.find((result) => result.error);
  if (failed?.error) throw new Error(failed.error.message);

  const symptomsByEvent = new Map<string, string[]>();
  rows(symptomsRes.data).forEach((row) => {
    const eventId = text(row.health_event_id);
    symptomsByEvent.set(eventId, [...(symptomsByEvent.get(eventId) ?? []), text(row.symptom)]);
  });

  const records: CareRecord[] = [];
  const profile = profileFromRows(profileRes.data as Row | null, journeyRes.data as Row | null);
  if (profile) records.push(profile);

  rows(eventsRes.data).forEach((row) => records.push({
    kind: 'checkin', id: text(row.id), date: text(row.occurred_on), mood: text(row.mood, 'Okay'),
    symptoms: symptomsByEvent.get(text(row.id)) ?? [], bleeding: text(row.bleeding, 'Not recorded'),
    pain: text(row.pain, 'Not recorded'), notes: text(row.notes),
  }));
  rows(periodsRes.data).forEach((row) => records.push({
    kind: 'period', id: text(row.id), start: text(row.start_date), end: text(row.end_date), notes: text(row.notes),
  }));
  rows(appointmentsRes.data).forEach((row) => records.push({
    kind: 'care', id: text(row.id), type: 'appointment', title: text(row.title), date: text(row.scheduled_on),
    time: text(row.scheduled_time), location: text(row.location), notes: text(row.notes), done: Boolean(row.done),
  }));
  rows(tasksRes.data).forEach((row) => records.push({
    kind: 'care', id: text(row.id), type: 'task', title: text(row.title), date: '', time: '', location: '',
    notes: text(row.notes), done: Boolean(row.done),
  }));
  rows(questionsRes.data).forEach((row) => records.push({
    kind: 'question', id: text(row.id), question: text(row.question),
    status: text(row.status, 'open') as CareQuestion['status'],
  }));

  return records;
}

export async function saveProfile(client: Client, userId: string, profile: Profile) {
  const profileResult = await client.from('profiles').upsert(
    { id: userId, display_name: profile.name, is_demo: false }, { onConflict: 'id' },
  );
  if (profileResult.error) throw new Error(profileResult.error.message);

  const journeyResult = await client.from('user_journeys').upsert({
    user_id: userId, stage: profile.stage, anchor_date: profile.date || null,
    date_source: profile.dateSource, contact_name: profile.contactName || null,
    contact_phone: profile.phone || null, is_current: true, is_demo: false,
  }, { onConflict: 'user_id,is_current' });
  if (journeyResult.error) throw new Error(journeyResult.error.message);
}

export async function saveCheckin(client: Client, userId: string, checkin: Checkin) {
  const eventResult = await client.from('health_events').upsert({
    id: checkin.id, user_id: userId, event_type: 'checkin', occurred_on: checkin.date,
    mood: checkin.mood, bleeding: checkin.bleeding, pain: checkin.pain, notes: checkin.notes, is_demo: false,
  }, { onConflict: 'id' });
  if (eventResult.error) throw new Error(eventResult.error.message);

  const deleteResult = await client.from('symptom_logs').delete()
    .eq('health_event_id', checkin.id).eq('user_id', userId);
  if (deleteResult.error) throw new Error(deleteResult.error.message);
  if (!checkin.symptoms.length) return;

  const insertResult = await client.from('symptom_logs').insert(
    checkin.symptoms.map((symptom) => ({ user_id: userId, health_event_id: checkin.id, symptom })),
  );
  if (insertResult.error) throw new Error(insertResult.error.message);
}

export async function savePeriod(client: Client, userId: string, period: Period) {
  const result = await client.from('menstrual_cycles').upsert({
    id: period.id, user_id: userId, start_date: period.start, end_date: period.end || null, notes: period.notes, is_demo: false,
  }, { onConflict: 'id' });
  if (result.error) throw new Error(result.error.message);
}

export async function saveCareItem(client: Client, userId: string, item: CareItem) {
  const result = item.type === 'appointment'
    ? await client.from('appointments').upsert({
      id: item.id, user_id: userId, title: item.title, scheduled_on: item.date,
      scheduled_time: item.time || null, location: item.location || null, notes: item.notes, done: item.done, is_demo: false,
    }, { onConflict: 'id' })
    : await client.from('care_tasks').upsert({
      id: item.id, user_id: userId, title: item.title, notes: item.notes, done: item.done, is_demo: false,
    }, { onConflict: 'id' });
  if (result.error) throw new Error(result.error.message);
}

export async function saveQuestion(client: Client, userId: string, question: CareQuestion) {
  const result = await client.from('care_questions').upsert({
    id: question.id, user_id: userId, question: question.question, status: question.status, is_demo: false,
  }, { onConflict: 'id' });
  if (result.error) throw new Error(result.error.message);
}

export async function saveCareRecord(client: Client, userId: string, record: CareRecord) {
  if (record.kind === 'profile') return saveProfile(client, userId, record);
  if (record.kind === 'checkin') return saveCheckin(client, userId, record);
  if (record.kind === 'period') return savePeriod(client, userId, record);
  if (record.kind === 'question') return saveQuestion(client, userId, record);
  return saveCareItem(client, userId, record);
}

export async function deleteCareRecord(client: Client, userId: string, recordId: string) {
  const tables = ['health_events', 'menstrual_cycles', 'appointments', 'care_tasks', 'care_questions'] as const;
  for (const table of tables) {
    const result = await client.from(table).delete().eq('id', recordId).eq('user_id', userId).select('id');
    if (result.error) throw new Error(result.error.message);
    if (result.data?.length) return;
  }
}

export async function deleteAllCareData(client: Client, userId: string) {
  const tables = ['symptom_logs', 'health_events', 'menstrual_cycles', 'appointments', 'care_tasks', 'care_questions', 'user_journeys'] as const;
  for (const table of tables) {
    const result = await client.from(table).delete().eq('user_id', userId);
    if (result.error) throw new Error(result.error.message);
  }
  const profileResult = await client.from('profiles').delete().eq('id', userId);
  if (profileResult.error) throw new Error(profileResult.error.message);
}
