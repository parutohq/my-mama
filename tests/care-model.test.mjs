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
test('validates questions as personal discussion prompts', () => {
  const question = validateRecord({
    kind: 'question', id: 'question1', question: 'What should I ask at my next visit?', status: 'open',
  }, now);
  assert.equal(question.kind, 'question');
  assert.throws(() => validateRecord({ ...question, question: ' ' }, now));
  assert.throws(() => validateRecord({ ...question, status: 'urgent' }, now));
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
import {
  validatePreferences,
  validateReminder,
  validateTask,
} from '../lib/engagement-model.ts';
test('validates engagement records without accepting medical content as notification payloads', () => {
  const task = validateTask({ id: 'engagement-task', title: 'Write a question for my visit', description: '', category: 'follow_up', status: 'completed' });
  assert.equal(task.status, 'completed');
  assert.throws(() => validateTask({ ...task, category: 'clinical_outcome' }));
  const reminder = validateReminder({ id: 'reminder', title: 'A private care reminder', remindAt: '2026-09-15T10:00:00.000Z', active: true });
  assert.equal(reminder.active, true);
  assert.throws(() => validateReminder({ ...reminder, title: ' ' }));
  const preferences = validatePreferences({ discreetNotifications: false, pointsEnabled: true, timezone: 'Africa/Lagos' });
  assert.equal(preferences.discreetNotifications, false);
  assert.equal(preferences.pointsEnabled, true);
});
import { validateInvestigation, validateMedication } from '../lib/care-details-model.ts';
test('validates private care organiser entries without clinical interpretation', () => {
  const medication = validateMedication({ id: '11111111-1111-4111-8111-111111111111', name: 'My supplement', schedule: 'Personal reference', notes: '', active: true });
  assert.equal(medication.name, 'My supplement');
  assert.throws(() => validateMedication({ ...medication, name: ' ' }));
  const investigation = validateInvestigation({ id: '22222222-2222-4222-8222-222222222222', title: 'Discuss a result', status: 'planned', scheduledOn: '2026-09-10', notes: '' });
  assert.equal(investigation.status, 'planned');
  assert.throws(() => validateInvestigation({ ...investigation, status: 'interpreted' }));
  assert.throws(() => validateInvestigation({ ...investigation, scheduledOn: '2026-02-30' }));
});
