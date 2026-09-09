import { env } from 'cloudflare:workers';
export function recordsDb() {
  if (!env.DB) throw new Error('Storage unavailable');
  return env.DB;
}
