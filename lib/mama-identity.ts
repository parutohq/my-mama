export const usernamePattern = /^[a-z0-9_]{3,20}$/;
export const ageConfirmationVersion = '2026-10-identity-v1';
export function normalizeUsername(value: unknown): string {
  return typeof value === 'string' ? value.trim().replace(/^@/, '').toLowerCase() : '';
}
export function validUsername(value: unknown): value is string {
  return usernamePattern.test(normalizeUsername(value));
}
export function usernameSuggestions(value: string) {
  const base = normalizeUsername(value).replace(/[^a-z0-9_]/g, '').slice(0, 14);
  if (base.length < 3) return [];
  return [`${base}_o`, `${base}24`, `its${base}`].filter((name) => usernamePattern.test(name));
}
