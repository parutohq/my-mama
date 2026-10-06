import { createClient } from '@/lib/supabase/server';
import { normalizeUsername, usernamePattern } from '@/lib/mama-identity';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Request origin is not allowed.' }, 403);
  const client = await createClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return reply({ error: 'Sign in to claim your identity.' }, 401);
  const raw = await request.text();
  if (raw.length > 1500) return reply({ error: 'Request too large.' }, 413);
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); } catch { return reply({ error: 'Invalid request.' }, 400); }
  const username = normalizeUsername(input.username);
  if (!usernamePattern.test(username) || input.age13Plus !== true) return reply({ error: 'Choose a valid username and confirm you are at least 13.' }, 400);
  const { data, error } = await client.rpc('claim_mama_identity', {
    candidate: username, chosen_display_name: typeof input.displayName === 'string' ? input.displayName.slice(0, 60) : '', confirmed_13_plus: true,
  });
  if (error) return reply({ error: error.message.includes('claimed') ? 'That username has just been claimed. Choose another.' : 'Your identity could not be saved. Check the name and try again.' }, 409);
  if (input.publicProfile === true) await client.from('profiles').update({ profile_visibility: 'public' }).eq('id', user.id);
  return reply({ username: data });
}
