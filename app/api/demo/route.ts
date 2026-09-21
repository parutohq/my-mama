import { createClient } from '@/lib/supabase/server';
import { clearDemoData, demoAvailable, getDemoState, seedDemoData, setDemoHidden, setDemoMode } from '@/lib/repositories/demo';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const hasAllowedOrigin = (request: Request) => { const origin = request.headers.get('origin'); return !origin || origin === new URL(request.url).origin; };
async function auth() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user }; }

function view(state: Awaited<ReturnType<typeof getDemoState>>) {
  return {
    available: demoAvailable(state),
    hidden: Boolean(state?.hidden_at),
    deleted: Boolean(state?.cleared_at),
    activeMode: state?.active_mode === 'demo' && demoAvailable(state) && !state.hidden_at ? 'demo' : 'account',
  };
}

export async function GET() {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to access the demo.' }, 401);
  try { return reply(view(await getDemoState(supabase, user.id))); }
  catch { return reply({ error: 'Could not load the demo settings.' }, 503); }
}

export async function POST(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to start the demo.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const body = await request.json().catch(() => ({})) as { action?: unknown };
    if (body.action !== 'start') return reply({ error: 'Unknown demo action.' }, 400);
    if (!await seedDemoData(supabase, user.id)) return reply({ error: 'This demo was deleted and cannot be restored.' }, 409);
    return reply(view(await getDemoState(supabase, user.id)));
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Could not start the demo.' }, 400); }
}

export async function PATCH(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to update the demo.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try {
    const body = await request.json() as { action?: unknown };
    if (body.action === 'account') await setDemoMode(supabase, user.id, 'account');
    else if (body.action === 'demo') await setDemoMode(supabase, user.id, 'demo');
    else if (body.action === 'hide') await setDemoHidden(supabase, user.id, true);
    else if (body.action === 'show') await setDemoHidden(supabase, user.id, false);
    else return reply({ error: 'Unknown demo action.' }, 400);
    return reply(view(await getDemoState(supabase, user.id)));
  } catch (error) { return reply({ error: error instanceof Error ? error.message : 'Could not update the demo.' }, 400); }
}

export async function DELETE(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to remove the demo.' }, 401);
  if (!hasAllowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try { await clearDemoData(supabase, user.id); return reply(view(await getDemoState(supabase, user.id))); }
  catch { return reply({ error: 'Could not remove the demo.' }, 503); }
}
