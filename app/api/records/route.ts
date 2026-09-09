import { getChatGPTUser } from '@/app/chatgpt-auth';
import { recordsDb } from '@/db/records';
import { validateRecord } from '@/lib/care-model';
export const dynamic = 'force-dynamic';
const reply = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store' },
  });
export async function GET() {
  const user = await getChatGPTUser();
  if (!user) return reply({ error: 'Sign in to access your care space.' }, 401);
  try {
    const result = await recordsDb()
      .prepare(
        'SELECT payload FROM care_records WHERE owner = ? ORDER BY updated_at DESC',
      )
      .bind(user.userId)
      .all<{ payload: string }>();
    return reply({ records: result.results.map((r) => JSON.parse(r.payload)) });
  } catch {
    return reply(
      { error: 'Your records could not be loaded. Please try again.' },
      503,
    );
  }
}
async function authorize(request: Request) {
  const user = await getChatGPTUser();
  if (!user)
    return { error: reply({ error: 'Sign in to save your records.' }, 401) };
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin)
    return { error: reply({ error: 'Request origin is not allowed.' }, 403) };
  return { user };
}
export async function PUT(request: Request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  try {
    const raw = await request.text();
    if (raw.length > 16000)
      return reply({ error: 'This entry is too long.' }, 413);
    let record;
    try {
      record = validateRecord(JSON.parse(raw));
    } catch (e) {
      return reply(
        { error: e instanceof Error ? e.message : 'Invalid entry.' },
        400,
      );
    }
    const db = recordsDb();
    if (record.kind === 'period') {
      const others = await db
        .prepare(
          "SELECT payload FROM care_records WHERE owner=? AND kind='period' AND id<>?",
        )
        .bind(auth.user!.userId, record.id)
        .all<{ payload: string }>();
      const conflict = others.results.some((row) => {
        const p = JSON.parse(row.payload);
        return (
          record.start <= (p.end || p.start) &&
          (record.end || record.start) >= p.start
        );
      });
      if (conflict)
        return reply(
          {
            error:
              'These dates overlap an existing period. Edit that entry instead.',
          },
          409,
        );
    }
    await db
      .prepare(
        'INSERT INTO care_records (owner,id,kind,payload,updated_at) VALUES (?,?,?,?,?) ON CONFLICT(owner,id) DO UPDATE SET kind=excluded.kind,payload=excluded.payload,updated_at=excluded.updated_at',
      )
      .bind(
        auth.user!.userId,
        record.id,
        record.kind,
        JSON.stringify(record),
        new Date().toISOString(),
      )
      .run();
    return reply({ record });
  } catch {
    return reply(
      { error: 'Your changes were not saved. Please try again.' },
      503,
    );
  }
}
export async function DELETE(request: Request) {
  const auth = await authorize(request);
  if (auth.error) return auth.error;
  try {
    const data = (await request.json()) as { id?: unknown; all?: unknown };
    if (data.all === true) {
      await recordsDb()
        .prepare('DELETE FROM care_records WHERE owner=?')
        .bind(auth.user!.userId)
        .run();
    } else if (
      typeof data.id === 'string' &&
      /^[a-zA-Z0-9_-]{1,80}$/.test(data.id)
    ) {
      await recordsDb()
        .prepare('DELETE FROM care_records WHERE owner=? AND id=?')
        .bind(auth.user!.userId, data.id)
        .run();
    } else {
      return reply({ error: 'Choose a record to delete.' }, 400);
    }
    return reply({ ok: true });
  } catch {
    return reply(
      {
        error: 'Deletion failed. Your records have not been confirmed deleted.',
      },
      503,
    );
  }
}
