import test from 'node:test';
import assert from 'node:assert/strict';
import { calendarDays, recordedMarkers } from '../lib/care-calendar-model.ts';

test('calendarDays returns a Monday-first six-week grid', () => {
  const days = calendarDays(new Date('2026-09-15T12:00:00'));
  assert.equal(days.length, 42);
  assert.equal(days[0].value, '2026-08-31');
  assert.equal(days[6].value, '2026-09-06');
  assert.equal(days[41].value, '2026-10-11');
});

test('recordedMarkers aggregates supported recorded sources without inference', () => {
  const markers = recordedMarkers(
    [{ id: 'p', start: '2026-09-10', end: '2026-09-12', flow: 'Medium', notes: '' }],
    [{ id: 'c', date: '2026-09-11', mood: 'Okay', symptoms: ['Cramps'], pain: 'Mild', bleeding: 'Not recorded', notes: '' }],
    [{ id: 't', type: 'task', title: 'Call clinic', date: '2026-09-13', notes: '', status: 'open' }],
    [{ id: 'i', title: 'Blood test', status: 'planned', scheduledOn: '2026-09-14', notes: '' }],
  );
  assert.deepEqual(markers.get('2026-09-10'), { period: true, spotting: false, checkin: false, care: false, investigation: false });
  assert.deepEqual(markers.get('2026-09-11'), { period: true, spotting: false, checkin: true, care: false, investigation: false });
  assert.deepEqual(markers.get('2026-09-13'), { period: false, spotting: false, checkin: false, care: true, investigation: false });
  assert.deepEqual(markers.get('2026-09-14'), { period: false, spotting: false, checkin: false, care: false, investigation: true });
  assert.equal(markers.has('2026-09-15'), false);
});
