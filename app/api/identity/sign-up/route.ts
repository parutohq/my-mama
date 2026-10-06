import { createClient } from '@/lib/supabase/server';
import { ageConfirmationVersion, normalizeUsername, usernamePattern } from '@/lib/mama-identity';
import { allowPublicRequest } from '@/lib/public-rate-limit';
import { parsePublicStartIntent } from '@/lib/public-start-intent';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function POST(request: Request) {
  if (request.headers.get('origin') !== new URL(request.url).origin) return reply({ error: 'Request origin is not allowed.' }, 403);
  if (!allowPublicRequest(request, 'signup', 6, 60 * 60_000)) return reply({ error: 'Please try again later.' }, 429);
  const raw = await request.text();
  if (raw.length > 4096) return reply({ error: 'Request too large.' }, 413);
  let input: Record<string, unknown>;
  try { input = JSON.parse(raw); } catch { return reply({ error: 'Invalid request.' }, 400); }
  if (input.age13Plus !== true) return reply({ error: 'Confirm you are at least 13 to create an account.' }, 400);
  const username = normalizeUsername(input.username);
  if (!usernamePattern.test(username)) return reply({ error: 'Choose a username of 3–20 letters, numbers or underscores.' }, 400);
  if (typeof input.email !== 'string' || input.email.length > 254 || typeof input.password !== 'string' || input.password.length < 8) return reply({ error: 'Enter a valid email and a password of at least eight characters.' }, 400);
  const client = await createClient();
  const status = await client.rpc('mama_username_status', { candidate: username });
  if (status.error) return reply({ error: 'Username availability is temporarily unavailable.' }, 503);
  if (status.data !== 'available') return reply({ error: status.data === 'reserved' ? 'That username is reserved.' : 'That username is not available.' }, 409);
  const { error } = await client.auth.signUp({ email: input.email, password: input.password, options: {
    emailRedirectTo: `${new URL(request.url).origin}/auth/callback?next=${encodeURIComponent('/')}`,
    data: { mama_requested_username: username, mama_age_confirmation_version: ageConfirmationVersion,
      mama_age_13_plus_confirmed: true, mama_start_intent: parsePublicStartIntent(input.startIntent) },
  } });
  if (error) return reply({ error: 'We could not create the account. Please check your details and try again.' }, 400);
  return reply({ ok: true, message: 'Check your email to confirm your account. Your username is not reserved until you complete your MAMA identity.' });
}
