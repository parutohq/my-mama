import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { type Investigation, type Medication } from '@/lib/care-details-model';

type Client = SupabaseClient<Database>;
type Row = Record<string, unknown>;
const rows = (value: unknown): Row[] => Array.isArray(value) ? value as Row[] : [];
const text = (value: unknown, fallback = '') => typeof value === 'string' ? value : fallback;

export async function getCareDetails(client: Client, userId: string) {
  const [medications, investigations] = await Promise.all([
    client.from('medications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    client.from('investigations').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
  ]);
  if (medications.error) throw new Error(medications.error.message);
  if (investigations.error) throw new Error(investigations.error.message);
  return {
    medications: rows(medications.data).map((row): Medication => ({ id: text(row.id), name: text(row.name), schedule: text(row.schedule), notes: text(row.notes), active: row.active !== false })),
    investigations: rows(investigations.data).map((row): Investigation => ({ id: text(row.id), title: text(row.title), status: text(row.status, 'planned') as Investigation['status'], scheduledOn: text(row.scheduled_on), notes: text(row.notes) })),
  };
}

export async function saveMedication(client: Client, userId: string, item: Medication) {
  const result = await client.from('medications').upsert({ id: item.id, user_id: userId, name: item.name, schedule: item.schedule, notes: item.notes, active: item.active, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (result.error) throw new Error(result.error.message);
}

export async function saveInvestigation(client: Client, userId: string, item: Investigation) {
  const result = await client.from('investigations').upsert({ id: item.id, user_id: userId, title: item.title, status: item.status, scheduled_on: item.scheduledOn || null, notes: item.notes, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (result.error) throw new Error(result.error.message);
}

export async function removeCareDetail(client: Client, userId: string, kind: 'medication' | 'investigation', id: string) {
  const table = kind === 'medication' ? 'medications' : 'investigations';
  const result = await client.from(table).delete().eq('id', id).eq('user_id', userId);
  if (result.error) throw new Error(result.error.message);
}
