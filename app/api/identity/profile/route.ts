import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function GET() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return reply({ error: 'Sign in to view your profile.' }, 401);
  const { data, error } = await client.from('profiles').select('username,display_name,bio,profile_visibility').eq('id', user.id).maybeSingle();
  return error ? reply({ error: 'Profile could not be loaded.' }, 503) : reply({ profile: data });
}
export async function PATCH(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Request origin is not allowed.' }, 403);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return reply({ error: 'Sign in to edit your profile.' }, 401);
  const raw = await request.text();
  if (raw.length > 1000) return reply({ error: 'Request too large.' }, 413);
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); } catch { return reply({ error: 'Invalid request.' }, 400); }
  if (input.visibility !== 'public' && input.visibility !== 'private') return reply({ error: 'Choose public or private visibility.' }, 400);
  const bio = typeof input.bio === 'string' ? input.bio.trim().slice(0, 280) : null;
  const { error } = await client.from('profiles').update({ profile_visibility: input.visibility, bio }).eq('id', user.id);
  return error ? reply({ error: 'Profile could not be updated.' }, 503) : reply({ ok: true });
}
