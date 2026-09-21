import { createClient } from '@/lib/supabase/server';
import { validateRecord } from '@/lib/care-model';
import { resolveCareMode } from '@/lib/repositories/demo';
import {
  deleteAllCareData,
  deleteCareRecord,
  getCareRecords,
  saveCareRecord,
} from '@/lib/repositories/care';

export const dynamic = 'force-dynamic';

const reply = (body: unknown, status = 200) => Response.json(body, {
  status,
  headers: { 'Cache-Control': 'private, no-store' },
});

function hasAllowedOrigin(request: Request) {
  const origin = request.headers.get('origin');
  return !origin || origin === new URL(request.url).origin;
}

async function authenticatedClient() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function GET(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return reply({ error: 'Sign in to access your care space.' }, 401);

  try {
    const mode = await resolveCareMode(supabase, user.id, new URL(request.url).searchParams.get('mode'));
    return reply({ records: await getCareRecords(supabase, user.id, mode), mode });
  } catch {
    return reply({ error: 'Your records could not be loaded. Please try again.' }, 503);
  }
}

export async function PUT(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return reply({ error: 'Sign in to save your records.' }, 401);
  if (!hasAllowedOrigin(request)) {
    return reply({ error: 'Request origin is not allowed.' }, 403);
  }

  try {
    const raw = await request.text();
    if (raw.length > 16_000) return reply({ error: 'This entry is too long.' }, 413);
    const record = validateRecord(JSON.parse(raw));
    await saveCareRecord(supabase, user.id, record);
    return reply({ record });
  } catch (error) {
    return reply({ error: error instanceof Error ? error.message : 'Invalid entry.' }, 400);
  }
}

export async function DELETE(request: Request) {
  const { supabase, user } = await authenticatedClient();
  if (!user) return reply({ error: 'Sign in to manage your records.' }, 401);
  if (!hasAllowedOrigin(request)) {
    return reply({ error: 'Request origin is not allowed.' }, 403);
  }

  try {
    const data = await request.json() as { id?: string; all?: boolean };
    if (data.all === true) await deleteAllCareData(supabase, user.id);
    else if (typeof data.id === 'string') await deleteCareRecord(supabase, user.id, data.id);
    else return reply({ error: 'Choose a record to delete.' }, 400);
    return reply({ ok: true });
  } catch {
    return reply({ error: 'Deletion failed. Your records have not been confirmed deleted.' }, 503);
  }
}
