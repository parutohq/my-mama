import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const hasAllowedOrigin = (request: Request) => { const origin = request.headers.get('origin'); return !origin || origin === new URL(request.url).origin; };

async function auth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET() {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to view sharing permissions.' }, 401);
  const result = await supabase.from('sharing_permissions').select('id, provider_user_id, scopes, granted_at, expires_at, revoked_at').eq('patient_id', user.id).order('granted_at', { ascending: false });
  if (result.error) return reply({ error: 'Sharing permissions could not be loaded.' }, 503);
  return reply({ permissions: result.data ?? [] });
}

export async function DELETE(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to manage sharing permissions.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const body = await request.json() as { id?: unknown };
    if (typeof body.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(body.id)) return reply({ error: 'Invalid sharing permission.' }, 400);
    const result = await supabase.from('sharing_permissions').update({ revoked_at: new Date().toISOString() }).eq('id', body.id).eq('patient_id', user.id).is('revoked_at', null);
    if (result.error) throw new Error(result.error.message);
    return reply({ revoked: true });
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Could not revoke sharing permission.' }, 400); }
}
