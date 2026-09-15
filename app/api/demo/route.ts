import { createClient } from '@/lib/supabase/server';
import { clearDemoData, getDemoState, seedDemoData } from '@/lib/repositories/demo';

export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } });
const allowedOrigin = (request: Request) => { const origin = request.headers.get('origin'); return !origin || origin === new URL(request.url).origin; };
async function auth() { const supabase = await createClient(); const { data: { user } } = await supabase.auth.getUser(); return { supabase, user }; }

export async function GET() {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to access sample data.' }, 401);
  try {
    const isDemo = await seedDemoData(supabase, user.id);
    const state = await getDemoState(supabase, user.id);
    return reply({ isDemo, cleared: Boolean(state?.cleared_at) });
  } catch { return reply({ error: 'Sample data could not be prepared.' }, 503); }
}

export async function DELETE(request: Request) {
  const { supabase, user } = await auth();
  if (!user) return reply({ error: 'Sign in to manage sample data.' }, 401);
  if (!allowedOrigin(request)) return reply({ error: 'Request origin is not allowed.' }, 403);
  try { await clearDemoData(supabase, user.id); return reply({ ok: true }); }
  catch { return reply({ error: 'Sample data could not be removed.' }, 503); }
}
