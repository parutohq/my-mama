import { createClient } from '@/lib/supabase/server';
import { validateRecord, type CareRecord, type Checkin, type Period, type CareItem, type Profile } from '@/lib/care-model';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });

async function currentUser() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}
function safeRows(data: unknown) { return Array.isArray(data) ? data as Record<string, unknown>[] : []; }
function textValue(value: unknown, fallback = '') { return typeof value === 'string' ? value : fallback; }
function profileRecord(profile: Record<string, unknown> | undefined, journey: Record<string, unknown> | undefined): Profile | null {
  if (!profile || !journey) return null;
  return { kind: 'profile', id: 'profile', name: textValue(profile.display_name), stage: textValue(journey.stage, 'none') as Profile['stage'], date: textValue(journey.anchor_date), dateSource: journey.date_source === 'clinician' ? 'clinician' : 'estimate', contactName: textValue(journey.contact_name), phone: textValue(journey.contact_phone) };
}

export async function GET() {
  const { supabase, user } = await currentUser();
  if (!user) return reply({ error: 'Sign in to access your care space.' }, 401);
  const [profileRes, journeyRes, eventsRes, symptomsRes, periodsRes, appointmentsRes, tasksRes] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    supabase.from('user_journeys').select('*').eq('user_id', user.id).eq('is_current', true).maybeSingle(),
    supabase.from('health_events').select('*').eq('user_id', user.id).eq('event_type', 'checkin').order('occurred_on', { ascending: false }),
    supabase.from('symptom_logs').select('*').eq('user_id', user.id),
    supabase.from('menstrual_cycles').select('*').eq('user_id', user.id).order('start_date', { ascending: false }),
    supabase.from('appointments').select('*').eq('user_id', user.id).order('scheduled_on', { ascending: true }),
    supabase.from('care_tasks').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
  ]);
  const failure = [profileRes, journeyRes, eventsRes, symptomsRes, periodsRes, appointmentsRes, tasksRes].find((r) => r.error);
  if (failure?.error) return reply({ error: 'Your records could not be loaded. Please try again.' }, 503);
  const symptomByEvent = new Map<string, string[]>();
  safeRows(symptomsRes.data).forEach((row) => { const eventId = textValue(row.health_event_id); symptomByEvent.set(eventId, [...(symptomByEvent.get(eventId) || []), textValue(row.symptom)]); });
  const records: CareRecord[] = [];
  const profile = profileRecord(profileRes.data as Record<string, unknown>, journeyRes.data as Record<string, unknown>);
  if (profile) records.push(profile);
  safeRows(eventsRes.data).forEach((row) => records.push({ kind: 'checkin', id: textValue(row.id), date: textValue(row.occurred_on), mood: textValue(row.mood, 'Okay'), symptoms: symptomByEvent.get(textValue(row.id)) || [], bleeding: textValue(row.bleeding, 'Not recorded'), pain: textValue(row.pain, 'Not recorded'), notes: textValue(row.notes) }));
  safeRows(periodsRes.data).forEach((row) => records.push({ kind: 'period', id: textValue(row.id), start: textValue(row.start_date), end: textValue(row.end_date), notes: textValue(row.notes) }));
  safeRows(appointmentsRes.data).forEach((row) => records.push({ kind: 'care', id: textValue(row.id), type: 'appointment', title: textValue(row.title), date: textValue(row.scheduled_on), time: textValue(row.scheduled_time), location: textValue(row.location), notes: textValue(row.notes), done: Boolean(row.done) }));
  safeRows(tasksRes.data).forEach((row) => records.push({ kind: 'care', id: textValue(row.id), type: 'task', title: textValue(row.title), date: '', time: '', location: '', notes: textValue(row.notes), done: Boolean(row.done) }));
  return reply({ records });
}

export async function PUT(request: Request) {
  const { supabase, user } = await currentUser();
  if (!user) return reply({ error: 'Sign in to save your records.' }, 401);
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 16000) return reply({ error: 'This entry is too long.' }, 413);
    const record = validateRecord(JSON.parse(raw));
    let error: { message: string } | null = null;
    if (record.kind === 'profile') {
      const profile = record as Profile;
      ({ error } = await supabase.from('profiles').upsert({ id: user.id, display_name: profile.name }, { onConflict: 'id' }));
      if (!error) ({ error } = await supabase.from('user_journeys').upsert({ user_id: user.id, stage: profile.stage, anchor_date: profile.date || null, date_source: profile.dateSource, contact_name: profile.contactName || null, contact_phone: profile.phone || null, is_current: true }, { onConflict: 'user_id,is_current' }));
    } else if (record.kind === 'checkin') {
      const checkin = record as Checkin;
      ({ error } = await supabase.from('health_events').upsert({ id: checkin.id, user_id: user.id, event_type: 'checkin', occurred_on: checkin.date, mood: checkin.mood, bleeding: checkin.bleeding, pain: checkin.pain, notes: checkin.notes }, { onConflict: 'id' }));
      if (!error) {
        const deletion = await supabase.from('symptom_logs').delete().eq('health_event_id', checkin.id).eq('user_id', user.id);
        error = deletion.error;
        if (!error && checkin.symptoms.length) ({ error } = await supabase.from('symptom_logs').insert(checkin.symptoms.map((symptom) => ({ user_id: user.id, health_event_id: checkin.id, symptom }))));
      }
    } else if (record.kind === 'period') {
      const period = record as Period;
      ({ error } = await supabase.from('menstrual_cycles').upsert({ id: period.id, user_id: user.id, start_date: period.start, end_date: period.end || null, notes: period.notes }, { onConflict: 'id' }));
    } else {
      const care = record as CareItem;
      const table = care.type === 'appointment' ? 'appointments' : 'care_tasks';
      const values = care.type === 'appointment' ? { id: care.id, user_id: user.id, title: care.title, scheduled_on: care.date, scheduled_time: care.time || null, location: care.location || null, notes: care.notes, done: care.done } : { id: care.id, user_id: user.id, title: care.title, notes: care.notes, done: care.done };
      ({ error } = await supabase.from(table).upsert(values as never, { onConflict: 'id' }));
    }
    if (error) return reply({ error: 'Your changes were not saved. Please try again.' }, 503);
    return reply({ record });
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Invalid entry.' }, 400); }
}

export async function DELETE(request: Request) {
  const { supabase, user } = await currentUser();
  if (!user) return reply({ error: 'Sign in to save your records.' }, 401);
  try {
    const data = await request.json() as { id?: string; all?: boolean };
    if (data.all === true) {
      const userTables = ['symptom_logs', 'health_events', 'menstrual_cycles', 'appointments', 'care_tasks', 'user_journeys'] as const;
      for (const table of userTables) { const { error } = await supabase.from(table).delete().eq('user_id', user.id); if (error) return reply({ error: 'Deletion failed. Your records have not been confirmed deleted.' }, 503); }
      const { error } = await supabase.from('profiles').delete().eq('id', user.id);
      if (error) return reply({ error: 'Deletion failed. Your records have not been confirmed deleted.' }, 503);
    } else if (typeof data.id === 'string') {
      const candidates = ['health_events', 'menstrual_cycles', 'appointments', 'care_tasks'] as const;
      for (const table of candidates) { const { error, data: removed } = await supabase.from(table).delete().eq('id', data.id).eq('user_id', user.id).select('id'); if (error) return reply({ error: 'Deletion failed.' }, 503); if (removed?.length) return reply({ ok: true }); }
    } else return reply({ error: 'Choose a record to delete.' }, 400);
    return reply({ ok: true });
  } catch { return reply({ error: 'Deletion failed. Your records have not been confirmed deleted.' }, 503); }
}
