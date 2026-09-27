import type { Checkin, CareItem, Period } from '@/lib/care-model';
import type { Investigation } from '@/lib/care-details-model';

export type CalendarDay = { date: Date; value: string };
export type CalendarMarker = { period: boolean; spotting: boolean; checkin: boolean; care: boolean; investigation: boolean };

export const calendarIso = (date: Date) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
};

export function calendarDays(month: Date): CalendarDay[] {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, value: calendarIso(date) };
  });
}

export function recordedMarkers(periods: Period[], checkins: Checkin[], care: CareItem[], investigations: Investigation[]) {
  const map = new Map<string, CalendarMarker>();
  const entry = (date: string) => map.get(date) ?? { period: false, spotting: false, checkin: false, care: false, investigation: false };
  periods.forEach((period) => {
    const start = new Date(`${period.start}T12:00:00`);
    const end = new Date(`${period.end || period.start}T12:00:00`);
    for (const cursor = new Date(start); cursor <= end; cursor.setDate(cursor.getDate() + 1)) {
      const date = calendarIso(cursor);
      map.set(date, { ...entry(date), period: true });
    }
  });
  checkins.forEach((item) => map.set(item.date, { ...entry(item.date), checkin: true, spotting: item.bleeding.toLowerCase().includes('spot') }));
  care.filter((item) => item.date).forEach((item) => map.set(item.date, { ...entry(item.date), care: true }));
  investigations.forEach((item) => {
    if (item.scheduledOn) map.set(item.scheduledOn, { ...entry(item.scheduledOn), investigation: true });
  });
  return map;
}
