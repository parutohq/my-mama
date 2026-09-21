import { createClient } from '@/lib/supabase/server';
import { validateInvestigation, validateMedication } from '@/lib/care-details-model';
import { getCareDetails, removeCareDetail, saveInvestigation, saveMedication } from '@/lib/repositories/care-details';
import { resolveCareMode } from '@/lib/repositories/demo';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const hasAllowedOrigin = (request: Request) => { const origin = request.headers.get('origin'); return !origin || origin === new URL(request.url).origin; };
async function auth() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user }; }

export async function GET(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to view your care organiser.' }, 401);
  try { const mode = await resolveCareMode(supabase, user.id, new URL(request.url).searchParams.get('mode')); return reply(mode === 'demo' ? { medications: [], investigations: [], mode } : { ...await getCareDetails(supabase, user.id), mode }); }
  catch { return reply({ error: 'Your care organiser could not be loaded.' }, 503); }
}
export async function PUT(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to update your care organiser.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const raw = await request.text(); if (raw.length > 12_000) return reply({ error: 'This entry is too long.' }, 413);
    const body = JSON.parse(raw) as { kind?: unknown; value?: unknown };
    if (body.kind === 'medication') await saveMedication(supabase, user.id, validateMedication(body.value));
    else if (body.kind === 'investigation') await saveInvestigation(supabase, user.id, validateInvestigation(body.value));
    else return reply({ error: 'Unknown care organiser entry.' }, 400);
    return reply(await getCareDetails(supabase, user.id));
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Could not save this entry.' }, 400); }
}
export async function DELETE(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to update your care organiser.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const body = await request.json() as { kind?: unknown; id?: unknown };
    if ((body.kind !== 'medication' && body.kind !== 'investigation') || typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) return reply({ error: 'Choose a valid entry.' }, 400);
    await removeCareDetail(supabase, user.id, body.kind, body.id);
    return reply(await getCareDetails(supabase, user.id));
  } catch { return reply({ error: 'Could not remove this entry.' }, 503); }
}
