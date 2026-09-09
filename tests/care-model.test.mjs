import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateRecord,
  emptyProfile,
  validDate,
  daysBetween,
  journeyMetric,
  cycleStats,
} from '../lib/care-model.ts';
const now = '2026-09-09';
const period = (start, end = '') => ({
  kind: 'period',
  id: 'test-id',
  start,
  end,
  notes: '',
});
test('validates calendar dates rather than accepting rollover', () => {
  assert.equal(validDate('2026-02-30'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-2-09'), false);
  assert.equal(daysBetween('2026-08-31', '2026-09-01'), 1);
});
test('rejects reversed or future menstrual dates', () => {
  assert.throws(() => validateRecord(period('2026-09-09', '2026-09-01'), now));
  assert.throws(() => validateRecord(period('2026-09-10'), now));
  assert.equal(validateRecord(period(now), now).end, '');
});
test('cycle summaries handle insufficient and irregular history without fertility claims', () => {
  assert.equal(cycleStats([]).average, null);
  assert.equal(cycleStats([period('2026-09-01')], now).average, null);
  const result = cycleStats(
    [
      period('2026-07-01', '2026-07-05'),
      period('2026-08-02', '2026-08-07'),
      period('2026-09-01'),
    ],
    now,
  );
  assert.equal(result.average, 31);
  assert.equal(result.range, '30–32');
  assert.equal(result.day, 9);
  assert.equal(result.duration, 6);
  assert.equal('ovulation' in result, false);
});
test('gestation derives from chosen due date and retains its source', () => {
  const p = {
    ...emptyProfile,
    stage: 'pregnancy',
    date: '2026-12-30',
    dateSource: 'clinician',
  };
  const m = journeyMetric(p, now);
  assert.equal(m.value, '24');
  assert.equal(m.label, 'weeks + 0 days');
  assert.match(m.detail, /Clinician-established/);
  assert.equal(journeyMetric({ ...p, date: '' }, now), null);
});
test('recovery hides pregnancy countdown; postpartum date cannot be future', () => {
  assert.equal(
    journeyMetric(
      { ...emptyProfile, stage: 'recovery', date: '2026-12-30' },
      now,
    ),
    null,
  );
  assert.throws(() =>
    validateRecord(
      { ...emptyProfile, stage: 'postpartum', date: '2026-09-10' },
      now,
    ),
  );
  assert.equal(
    journeyMetric({ ...emptyProfile, stage: 'postpartum', date: now }, now)
      .value,
    '1',
  );
});
test('unanswered symptom data is not recast as normal', () => {
  const c = {
    kind: 'checkin',
    id: 'log',
    date: now,
    mood: 'Okay',
    symptoms: [],
    bleeding: 'Not recorded',
    pain: 'Not recorded',
    notes: '',
  };
  assert.equal(validateRecord(c, now).pain, 'Not recorded');
  assert.throws(() => validateRecord({ ...c, mood: 'Diagnosed well' }, now));
  assert.throws(() => validateRecord({ ...c, symptoms: ['invented'] }, now));
});
test('validates care entries and strips untrusted owner fields', () => {
  const c = {
    kind: 'care',
    id: 'care1',
    type: 'appointment',
    title: 'Visit',
    date: now,
    time: '14:30',
    location: '',
    notes: '',
    done: false,
    owner: 'someone-else',
  };
  assert.equal('owner' in validateRecord(c, now), false);
  assert.throws(() => validateRecord({ ...c, time: '25:99' }, now));
  assert.throws(() => validateRecord({ ...c, date: '' }, now));
  assert.throws(() => validateRecord({ ...c, title: ' ' }, now));
  assert.throws(() => validateRecord({ ...c, id: '../profile' }, now));
  assert.throws(() => validateRecord({ ...c, notes: 'a'.repeat(2001) }, now));
});
