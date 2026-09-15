// Deploy only after VAPID/web-push credentials are stored as Supabase Edge Function secrets.
// This endpoint intentionally does not accept health content from the browser.
import { createClient } from 'npm:@supabase/supabase-js@2';

const headers = { 'Content-Type': 'application/json' };
Deno.serve(async (request) => {
  const schedulerToken = Deno.env.get('MAMA_NOTIFICATION_SCHEDULER_TOKEN');
  if (!schedulerToken || request.headers.get('x-mama-scheduler-token') !== schedulerToken) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers });
  }
  // Delivery provider integration is intentionally deployment-gated. The database outbox
  // and in-app delivery remain safe while VAPID credentials and clinical/privacy review are pending.
  const keyMap = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}') as Record<string, string>;
  const secretKey = keyMap.default;
  if (!secretKey) return new Response(JSON.stringify({ error: 'Server key unavailable' }), { status: 500, headers });
  const supabase = createClient(Deno.env.get('SUPABASE_URL')!, secretKey);
  const { error } = await supabase.rpc('queue_due_mama_notifications');
  if (error) return new Response(JSON.stringify({ error: 'Queue processing failed' }), { status: 500, headers });
  return Response.json({ ok: true, delivery: 'in_app_only' }, { headers });
});
