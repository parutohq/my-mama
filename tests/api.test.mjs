import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
const base = 'http://localhost:3001';
const id = 'test_' + randomUUID();
const headers = {
  Cookie: '__sites_local_auth=1',
  'Content-Type': 'application/json',
  Origin: base,
};
async function request(method, body, custom = headers) {
  const response = await fetch(base + '/api/records', {
    method,
    headers: custom,
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  return {
    status: response.status,
    body: response.headers.get('content-type')?.includes('application/json')
      ? await response.json()
      : await response.text(),
    cache: response.headers.get('cache-control'),
  };
}
try {
  assert.equal((await request('GET', null, {})).status, 401);
  assert.equal(
    (
      await request('GET', null, {
        'oai-authenticated-user-id': 'forged',
        'oai-authenticated-user-email': 'forged@example.test',
      })
    ).status,
    401,
  );
  const record = {
    kind: 'care',
    id,
    type: 'appointment',
    title: 'TEST temporary appointment',
    date: '2026-09-09',
    time: '14:30',
    location: 'Test only',
    notes: 'Question for care team',
    done: false,
  };
  assert.equal(
    (
      await request('PUT', record, {
        ...headers,
        Origin: 'https://other.example',
      })
    ).status,
    403,
  );
  assert.equal((await request('PUT', { ...record, title: '' })).status, 400);
  assert.equal((await request('PUT', record)).status, 200);
  const list = await request('GET');
  assert.match(list.cache, /no-store/);
  assert.equal(list.body.records.find((r) => r.id === id).notes, record.notes);
  assert.equal((await request('PUT', { ...record, done: true })).status, 200);
  assert.equal(
    (await request('GET')).body.records.find((r) => r.id === id).done,
    true,
  );
  assert.equal((await request('DELETE', { id })).status, 200);
  assert.equal(
    (await request('GET')).body.records.some((r) => r.id === id),
    false,
  );
  console.log(
    'PASS: authentication, forged-header rejection, same-origin protection, input validation, save/read/update/delete, cache policy.',
  );
} finally {
  await request('DELETE', { id });
}
