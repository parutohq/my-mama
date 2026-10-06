import { createClient } from '@/lib/supabase/server';
import { allowPublicRequest } from '@/lib/public-rate-limit';
import { normalizeUsername, usernameSuggestions } from '@/lib/mama-identity';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
export async function GET(request: Request) {
  if (!allowPublicRequest(request, 'username', 25)) return reply({ error: 'Please slow down and try again shortly.' }, 429);
  const username = normalizeUsername(new URL(request.url).searchParams.get('username'));
  if (username.length > 20) return reply({ username, status: 'invalid' });
  const client = await createClient();
  const { data, error } = await client.rpc('mama_username_status', { candidate: username });
  if (error) return reply({ error: 'Availability is temporarily unavailable.' }, 503);
  const status = String(data);
  if (status !== 'unavailable') return reply({ username, status });
  const candidates = usernameSuggestions(username);
  const results = await Promise.all(candidates.map(async (candidate) => {
    const response = await client.rpc('mama_username_status', { candidate });
    return response.data === 'available' ? candidate : null;
  }));
  return reply({ username, status, suggestions: results.filter(Boolean) });
}
