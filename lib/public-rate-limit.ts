// Per-instance fast guard. The opaque share token remains the authorization boundary.
const windows = new Map<string, { count: number; until: number }>();
export function allowPublicRequest(request: Request, category: string, maximum: number, periodMs = 60_000) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const key = `${category}:${forwarded}`;
  const now = Date.now();
  const current = windows.get(key);
  if (windows.size > 5000) for (const [item, value] of windows) if (value.until <= now) windows.delete(item);
  if (!current || current.until <= now) { windows.set(key, { count: 1, until: now + periodMs }); return true; }
  if (current.count >= maximum) return false;
  current.count += 1;
  return true;
}
