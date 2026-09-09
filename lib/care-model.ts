export const stages = {
  none: 'Choose your journey',
  cycle: 'Track my cycle',
  preconception: 'Prepare for pregnancy',
  pregnancy: 'Pregnancy',
  postpartum: 'Postpartum & early motherhood',
  recovery: 'Recovery & a pause',
} as const;
export type Stage = keyof typeof stages;
export type Profile = {
  kind: 'profile';
  id: 'profile';
  name: string;
  stage: Stage;
  date: string;
  dateSource: 'estimate' | 'clinician';
  contactName: string;
  phone: string;
};
export type Checkin = {
  kind: 'checkin';
  id: string;
  date: string;
  mood: string;
  symptoms: string[];
  bleeding: string;
  pain: string;
  notes: string;
};
export type Period = {
  kind: 'period';
  id: string;
  start: string;
  end: string;
  notes: string;
};
export type CareItem = {
  kind: 'care';
  id: string;
  type: 'appointment' | 'task';
  title: string;
  date: string;
  time: string;
  location: string;
  notes: string;
  done: boolean;
};
export type CareRecord = Profile | Checkin | Period | CareItem;
export const emptyProfile: Profile = {
  kind: 'profile',
  id: 'profile',
  name: '',
  stage: 'none',
  date: '',
  dateSource: 'estimate',
  contactName: '',
  phone: '',
};
export const moodOptions = ['Good', 'Okay', 'Mixed', 'Low', 'Struggling'];
export const symptomOptions = [
  'Cramps',
  'Headache',
  'Nausea',
  'Back pain',
  'Tiredness',
  'Breast discomfort',
  'Bloating',
  'Sleep changes',
];
export function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
export function validDate(v: unknown): v is string {
  return (
    typeof v === 'string' &&
    /^\d{4}-\d{2}-\d{2}$/.test(v) &&
    !Number.isNaN(Date.parse(v)) &&
    new Date(v + 'T12:00:00Z').toISOString().slice(0, 10) === v
  );
}
export function daysBetween(a: string, b: string) {
  return Math.round(
    (Date.parse(b + 'T12:00:00Z') - Date.parse(a + 'T12:00:00Z')) / 86400000,
  );
}
export function prettyDate(v: string) {
  return validDate(v)
    ? new Date(v + 'T12:00:00').toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'Not set';
}
export function journeyMetric(p: Profile, now = today()) {
  if (!validDate(p.date)) return null;
  if (p.stage === 'pregnancy') {
    const elapsed = 280 - daysBetween(now, p.date);
    return elapsed >= 0 && elapsed <= 308
      ? {
          value: String(Math.floor(elapsed / 7)),
          label: `weeks + ${elapsed % 7} days`,
          detail: `${p.dateSource === 'clinician' ? 'Clinician-established' : 'Estimated'} due date · ${prettyDate(p.date)}`,
        }
      : {
          value: '—',
          label: 'Check your dates',
          detail: 'Discuss your due date with your care team.',
        };
  }
  if (p.stage === 'postpartum') {
    const days = daysBetween(p.date, now);
    return days >= 0
      ? {
          value: String(days + 1),
          label: 'day of recovery',
          detail: `Birth date · ${prettyDate(p.date)}`,
        }
      : null;
  }
  return null;
}
export function cycleStats(periods: Period[], now = today()) {
  const sorted = [...periods].sort((a, b) => a.start.localeCompare(b.start));
  const lengths = sorted
    .slice(1)
    .map((p, i) => daysBetween(sorted[i].start, p.start));
  const durations = sorted
    .filter((p) => p.end)
    .map((p) => daysBetween(p.start, p.end) + 1);
  return {
    count: sorted.length,
    day: sorted.length ? daysBetween(sorted.at(-1)!.start, now) + 1 : null,
    average: lengths.length
      ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
      : null,
    range: lengths.length
      ? `${Math.min(...lengths)}–${Math.max(...lengths)}`
      : null,
    duration: durations.length
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null,
  };
}
function str(v: unknown, max: number, required = false) {
  if (typeof v !== 'string' || v.length > max || (required && !v.trim()))
    throw new Error('Please check the text fields.');
  return v.trim();
}
function date(v: unknown, required = false) {
  if (v === '' && !required) return '';
  if (!validDate(v)) throw new Error('Please enter a valid date.');
  return v;
}
function choice<T extends string>(v: unknown, values: readonly T[]): T {
  if (typeof v !== 'string' || !values.includes(v as T))
    throw new Error('Please choose one of the available options.');
  return v as T;
}
export function validateRecord(raw: unknown, now = today()): CareRecord {
  if (!raw || typeof raw !== 'object') throw new Error('Invalid record.');
  const r = raw as Record<string, unknown>;
  const id = str(r.id, 80, true);
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) throw new Error('Invalid record ID.');
  if (r.kind === 'profile') {
    if (id !== 'profile') throw new Error('Invalid profile.');
    const stage = choice(r.stage, Object.keys(stages) as Stage[]);
    const d = date(r.date);
    if (stage === 'postpartum' && d > now)
      throw new Error('Birth date cannot be in the future.');
    return {
      kind: 'profile',
      id: 'profile',
      name: str(r.name, 60),
      stage,
      date: d,
      dateSource: choice(r.dateSource, ['estimate', 'clinician']),
      contactName: str(r.contactName, 100),
      phone: str(r.phone, 30),
    };
  }
  if (id === 'profile') throw new Error('Reserved record ID.');
  if (r.kind === 'checkin') {
    const d = date(r.date, true);
    if (d > now) throw new Error('A check-in cannot be in the future.');
    if (!Array.isArray(r.symptoms) || r.symptoms.length > 8)
      throw new Error('Invalid symptoms.');
    return {
      kind: 'checkin',
      id,
      date: d,
      mood: choice(r.mood, moodOptions),
      symptoms: [...new Set(r.symptoms.map((x) => choice(x, symptomOptions)))],
      bleeding: choice(r.bleeding, [
        'Not recorded',
        'None',
        'Spotting',
        'Light',
        'Moderate',
        'Heavy',
      ]),
      pain: choice(r.pain, [
        'Not recorded',
        'None',
        'Mild',
        'Moderate',
        'Severe',
      ]),
      notes: str(r.notes, 2000),
    };
  }
  if (r.kind === 'period') {
    const start = date(r.start, true),
      end = date(r.end);
    if (start > now || end > now)
      throw new Error('Period dates cannot be in the future.');
    if (end && end < start)
      throw new Error('The end must be on or after the start.');
    return { kind: 'period', id, start, end, notes: str(r.notes, 2000) };
  }
  if (r.kind === 'care') {
    const d = date(r.date),
      type = choice(r.type, ['appointment', 'task']);
    if (type === 'appointment' && !d)
      throw new Error('Choose an appointment date.');
    const time = str(r.time, 5);
    if (time && !/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
      throw new Error('Invalid time.');
    if (typeof r.done !== 'boolean')
      throw new Error('Invalid completion state.');
    return {
      kind: 'care',
      id,
      type,
      title: str(r.title, 150, true),
      date: d,
      time,
      location: str(r.location, 200),
      notes: str(r.notes, 2000),
      done: r.done,
    };
  }
  throw new Error('Unknown record type.');
}
