import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const reply = (body: unknown, status = 200) => Response.json(body, status === 204 ? { status } : { status, headers: { 'Cache-Control': 'private, no-store' } });
const hasAllowedOrigin = (request: Request) => {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
};

async function auth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

function subscriptionFrom(input: unknown) {
  if (!input || typeof input !== 'object') throw new Error('Invalid browser subscription.');
  const value = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };
  const endpoint = typeof value.endpoint === 'string' ? value.endpoint : '';
  const p256dh = typeof value.keys?.p256dh === 'string' ? value.keys.p256dh : '';
  const auth = typeof value.keys?.auth === 'string' ? value.keys.auth : '';
  if (!endpoint.startsWith('https://') || endpoint.length > 2048 || !p256dh || p256dh.length > 512 || !auth || auth.length > 512) {
    throw new Error('Invalid browser subscription.');
  }
  return { endpoint, p256dh, auth };
}

export async function PUT(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to manage browser notifications.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const raw = await request.text();
    if (raw.length > 5_000) return reply({ error: 'This browser subscription is too long.' }, 413);
    const subscription = subscriptionFrom(JSON.parse(raw));
    const result = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      endpoint: subscription.endpoint,
      p256dh: subscription.p256dh,
      auth: subscription.auth,
      user_agent: request.headers.get('user-agent')?.slice(0, 512) ?? null,
      revoked_at: null,
      last_seen_at: new Date().toISOString(),
    }, { onConflict: 'user_id,endpoint' });
    if (result.error) throw new Error(result.error.message);
    return reply({ subscribed: true });
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Could not save browser notification permission.' }, 400);
  }
}

export async function DELETE(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to manage browser notifications.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const body = subscriptionFrom(await request.json());
    const result = await supabase.from('push_subscriptions').update({ revoked_at: new Date().toISOString() }).eq('user_id', user.id).eq('endpoint', body.endpoint);
    if (result.error) throw new Error(result.error.message);
    return reply({}, 204);
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Could not remove browser notification permission.' }, 400);
  }
}
