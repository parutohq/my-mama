import { createClient } from '@/lib/supabase/server';
import { getEngagementData, removeEngagementRecord, saveJourneyTask, savePreferences, saveReminder } from '@/lib/repositories/engagement';
import { validatePreferences, validateReminder, validateTask } from '@/lib/engagement-model';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const hasAllowedOrigin = (request: Request) => { const origin = request.headers.get('origin'); return !origin || origin === new URL(request.url).origin; };
async function auth() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user }; }

export async function GET() {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to access engagement settings.' }, 401);
  try { return reply({ engagement: await getEngagementData(supabase, user.id) }); }
  catch { return reply({ error: 'Engagement data could not be loaded.' }, 503); }
}
export async function PUT(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to update engagement settings.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const raw = await request.text(); if (raw.length > 12_000) return reply({ error: 'This update is too long.' }, 413);
    const body = JSON.parse(raw) as { kind?: unknown; value?: unknown };
    if (body.kind === 'preferences') await savePreferences(supabase, user.id, validatePreferences(body.value));
    else if (body.kind === 'task') await saveJourneyTask(supabase, user.id, validateTask(body.value));
    else if (body.kind === 'reminder') await saveReminder(supabase, user.id, validateReminder(body.value));
    else if (body.kind === 'notification') {
      const id = typeof body.value === 'string' ? body.value : '';
      if (!/^[0-9a-f-]{36}$/i.test(id)) return reply({ error: 'Invalid notification.' }, 400);
      const result = await supabase.from('notifications').update({ read_at: new Date().toISOString() }).eq('user_id', user.id).eq('id', id);
      if (result.error) throw new Error(result.error.message);
    } else return reply({ error: 'Unknown engagement update.' }, 400);
    return reply({ engagement: await getEngagementData(supabase, user.id) });
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Could not save engagement data.' }, 400); }
}
export async function DELETE(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to update engagement settings.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const body = await request.json() as { kind?: unknown; id?: unknown };
    if ((body.kind !== 'task' && body.kind !== 'reminder') || typeof body.id !== 'string') return reply({ error: 'Choose an item to delete.' }, 400);
    await removeEngagementRecord(supabase, user.id, body.kind, body.id);
    return reply({ engagement: await getEngagementData(supabase, user.id) });
  } catch { return reply({ error: 'Could not delete this item.' }, 503); }
}
