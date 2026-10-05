import type { CareItem, Profile } from '@/lib/care-model';
import type { JourneyTask } from '@/lib/engagement-model';

export type JourneyGoalStatus = 'pending' | 'completed' | 'skipped' | 'overdue' | 'optional' | 'required';
export type JourneyMilestone = { id: string; title: string; description: string; week?: number; kind: 'stage' | 'visit' | 'preparation' | 'birth'; };
export type JourneyGoal = { id: string; title: string; description: string; status: JourneyGoalStatus; required: boolean; category: 'care' | 'learning' | 'preparation' | 'wellbeing'; };
export type JourneyDefinition = { id: string; title: string; stage: string; milestones: JourneyMilestone[]; goals: JourneyGoal[]; };

export const pregnancyJourney: JourneyDefinition = {
  id: 'pregnancy', title: 'Pregnancy journey', stage: 'pregnancy',
  milestones: [
    { id: 'confirmed', title: 'Pregnancy confirmed', description: 'Start with the dates and care details you choose to record.', kind: 'stage' },
    { id: 'week-8', title: 'Week 8', description: 'Keep your questions and care conversations together.', week: 8, kind: 'stage' },
    { id: 'first-visit', title: 'First antenatal visit', description: 'Prepare questions for your first appointment.', kind: 'visit' },
    { id: 'week-12', title: 'Week 12', description: 'Review your next care conversation.', week: 12, kind: 'stage' },
    { id: 'investigations', title: 'Key investigations', description: 'Track investigations requested by your care team.', kind: 'visit' },
    { id: 'week-20', title: 'Week 20 scan', description: 'Keep the appointment details that matter to you.', week: 20, kind: 'visit' },
    { id: 'week-24', title: 'Week 24', description: 'Continue your chosen care routine.', week: 24, kind: 'stage' },
    { id: 'third-trimester', title: 'Third trimester', description: 'Begin practical preparation at your own pace.', week: 28, kind: 'stage' },
    { id: 'birth-preparation', title: 'Birth preparation', description: 'Save questions and preferences for your care team.', kind: 'preparation' },
    { id: 'hospital-bag', title: 'Hospital bag', description: 'Make a list when it feels useful.', kind: 'preparation' },
    { id: 'birth', title: 'Birth', description: 'Your care team will guide this transition.', kind: 'birth' },
    { id: 'postpartum', title: 'Postpartum transition', description: 'Move into a new journey when you are ready.', kind: 'stage' },
  ],
  goals: [
    { id: 'wellbeing', title: 'Complete a wellbeing check', description: 'Notice how you feel today in your own words.', status: 'required', required: true, category: 'wellbeing' },
    { id: 'medication', title: 'Review prescribed medication', description: 'Use your care plan and clinician instructions.', status: 'optional', required: false, category: 'care' },
    { id: 'learning', title: 'Learn about pregnancy warning signs', description: 'Read clinician-reviewed education when available.', status: 'required', required: true, category: 'learning' },
    { id: 'questions', title: 'Prepare a question for your clinician', description: 'Keep one question ready for your next appointment.', status: 'optional', required: false, category: 'preparation' },
  ],
};

export function pregnancyWeek(profile: Profile, now = new Date()) {
  if (profile.stage !== 'pregnancy' || !profile.date) return null;
  const anchor = new Date(`${profile.date}T12:00:00`);
  const elapsed = profile.anchorKind === 'last_period' ? now.getTime() - anchor.getTime() : 280 * 86400000 - (anchor.getTime() - now.getTime());
  const weeks = Math.floor(elapsed / (7 * 86400000));
  return weeks >= 0 && weeks <= 44 ? weeks : null;
}

export function journeyProgress(week: number | null, goals: JourneyGoal[]) {
  const milestoneProgress = week == null ? 0 : Math.min(100, Math.round((week / 40) * 100));
  const completed = goals.filter((goal) => goal.status === 'completed').length;
  const consistency = goals.length ? Math.round((completed / goals.length) * 100) : 0;
  return { journeyProgress: milestoneProgress, careConsistency: consistency, healthKnowledge: goals.some((goal) => goal.category === 'learning' && goal.status === 'completed') ? 100 : 0, preparedness: goals.filter((goal) => goal.category === 'preparation' && goal.status === 'completed').length * 50 };
}

export function goalsFromRecords(tasks: JourneyTask[], checkinToday: boolean, appointments: CareItem[]): JourneyGoal[] {
  return pregnancyJourney.goals.map((goal) => ({ ...goal, status: goal.id === 'wellbeing' && checkinToday ? 'completed' : goal.id === 'questions' && appointments.some((item) => item.type === 'appointment') ? 'completed' : tasks.some((task) => task.title.toLowerCase().includes(goal.title.toLowerCase().slice(0, 12)) && task.status === 'completed') ? 'completed' : goal.status }));
}
