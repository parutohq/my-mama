import { createHash, randomBytes } from 'node:crypto';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const allowedScopes = ['week','progress','edd','appointment'];
const hasOrigin = (request: Request) => request.headers.get('origin') === new URL(request.url).origin;
async function owner() {
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  return { client, user };
}
export async function GET() {
  const { client, user } = await owner();
  if (!user) return reply({ error: 'Sign in to manage support links.' }, 401);
  const { data, error } = await client.from('pregnancy_share_links').select('id,label,scopes,created_at,expires_at,revoked_at,last_accessed_at').eq('user_id',user.id).order('created_at',{ascending:false});
  return error ? reply({ error: 'Links could not be loaded.' }, 503) : reply({ links: data ?? [] });
}
export async function POST(request: Request) {
  if (!hasOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  const { client, user } = await owner();
  if (!user) return reply({ error: 'Sign in to create a support link.' }, 401);
  const raw = await request.text();
  if (raw.length > 1500) return reply({ error: 'Request too large.' }, 413);
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); } catch { return reply({ error: 'Invalid request.' }, 400); }
  const scopes = Array.isArray(input.scopes) ? [...new Set(input.scopes)] : [];
  if (!scopes.length || scopes.some((scope) => typeof scope !== 'string' || !allowedScopes.includes(scope))) return reply({ error: 'Choose only the information you want to share.' }, 400);
  const days = Number(input.days);
  if (![1,7,30].includes(days)) return reply({ error: 'Choose 24 hours, 7 days or 30 days.' }, 400);
  const label = typeof input.label === 'string' ? input.label.trim().slice(0,60) : null;
  const { data: journey } = await client.from('user_journeys').select('id').eq('user_id',user.id).eq('stage','pregnancy').eq('is_current',true).maybeSingle();
  if (!journey) return reply({ error: 'Pregnancy sharing is available only in an active Pregnancy Journey.' }, 403);
  const { data: pregnancy } = await client.from('pregnancies').select('id').eq('user_id',user.id).eq('journey_id',String(journey.id)).eq('status','active').maybeSingle();
  if (!pregnancy) return reply({ error: 'Add your pregnancy date before sharing progress.' }, 400);
  const rotateId = input.rotateId;
  if (typeof rotateId === 'string') {
    const previous = await client.from('pregnancy_share_links').update({ revoked_at: new Date().toISOString() }).eq('id',rotateId).eq('user_id',user.id).is('revoked_at',null).select('id').maybeSingle();
    if (previous.error || !previous.data) return reply({ error: 'Previous active link could not be revoked.' }, 409);
  }
  const token = randomBytes(32).toString('base64url');
  const tokenHash = createHash('sha256').update(token).digest('hex');
  const expiresAt = new Date(Date.now()+days*86_400_000).toISOString();
  const { error } = await client.from('pregnancy_share_links').insert({ user_id:user.id,created_by:user.id,pregnancy_id:pregnancy.id,token_hash:tokenHash,label,scopes,expires_at:expiresAt });
  if (error) return reply({ error: 'A support link could not be created.' }, 503);
  return reply({ url: `${new URL(request.url).origin}/pregnancy/share/${token}`, expiresAt }, 201);
}
export async function DELETE(request: Request) {
  if (!hasOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  const { client, user } = await owner();
  if (!user) return reply({ error: 'Sign in to revoke support links.' }, 401);
  const input = await request.json().catch(() => null) as { id?: unknown } | null;
  if (typeof input?.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(input.id)) return reply({ error: 'Invalid link.' }, 400);
  const { data, error } = await client.from('pregnancy_share_links').update({ revoked_at:new Date().toISOString() }).eq('id',input.id).eq('user_id',user.id).is('revoked_at',null).select('id').maybeSingle();
  return error || !data ? reply({ error: 'Active link could not be revoked.' }, 404) : reply({ revoked:true });
}
