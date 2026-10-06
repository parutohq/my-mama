import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeUsername, usernamePattern, usernameSuggestions } from '../lib/mama-identity.ts';

test('username normalization is case-insensitive and strips one leading @', () => {
  assert.equal(normalizeUsername(' @Alice_Mama '), 'alice_mama');
  assert.equal(normalizeUsername('@@alice'), '@alice');
});

test('username rules reject short, long, Unicode and punctuation variants', () => {
  for (const value of ['ab', 'a'.repeat(21), 'zoë', 'alice.mama', 'a/b']) assert.equal(usernamePattern.test(value), false);
  assert.equal(usernamePattern.test('alice_mama20'), true);
});

test('suggestions stay inside the username format', () => {
  assert.deepEqual(usernameSuggestions('A li-ce!').every((value) => usernamePattern.test(value)), true);
  assert.deepEqual(usernameSuggestions('ab'), []);
});
