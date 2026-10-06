import type { CareItem, Checkin, Profile } from './care-model';
import type { JourneyTask } from './engagement-model';
import { goalsFromRecords, journeyProgress, pregnancyJourney, pregnancyWeek } from './journey-engine';

export type PregnancyExperienceState = ReturnType<typeof pregnancyExperienceState>;

const trimesterSections = [
  { id: 'first', title: 'The Beginning', label: 'First trimester', start: 1, end: 13 },
  { id: 'second', title: 'Growing Together', label: 'Second trimester', start: 14, end: 27 },
  { id: 'third', title: 'Getting Ready', label: 'Third trimester', start: 28, end: 40 },
] as const;

export function pregnancyExperienceState(
  profile: Profile,
  checkins: Checkin[],
  tasks: JourneyTask[],
  appointments: CareItem[],
  now = new Date(),
) {
  const week = pregnancyWeek(profile, now);
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const goals = goalsFromRecords(tasks, checkins.some((item) => item.date === today), appointments);
  const measures = journeyProgress(week, goals);
  const trimester = week == null ? null : trimesterSections.find((section) => week >= section.start && week <= section.end) ?? null;
  const datedMilestones = pregnancyJourney.milestones.filter((milestone) => milestone.week != null);
  const currentMilestone = week == null ? null : datedMilestones.filter((milestone) => milestone.week! <= week).at(-1) ?? null;
  const nextAppointment = appointments.filter((item) => item.type === 'appointment' && !item.done && item.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null;
  const sections = trimesterSections.map((section) => ({
    ...section,
    weeks: Array.from({ length: section.end - section.start + 1 }, (_, index) => {
      const number = section.start + index;
      return {
        number,
        state: week == null ? 'undated' : number < week ? 'past' : number === week ? 'current' : 'future',
        milestones: datedMilestones.filter((milestone) => milestone.week === number),
      };
    }),
  }));
  return { week, trimester, measures, goals, sections, currentMilestone, nextAppointment };
}
