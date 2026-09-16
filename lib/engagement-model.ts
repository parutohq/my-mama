export type EngagementCategory = 'tracking' | 'learning' | 'preparation' | 'follow_up';
export type EngagementTaskStatus = 'available' | 'completed' | 'dismissed';

export type EngagementPreferences = {
  timezone: string;
  locale: string;
  discreetNotifications: boolean;
  journeyUpdatesEnabled: boolean;
  appointmentRemindersEnabled: boolean;
  consultationRemindersEnabled: boolean;
  weeklyRecapEnabled: boolean;
  userRemindersEnabled: boolean;
  pointsEnabled: boolean;
};

export const defaultEngagementPreferences: EngagementPreferences = {
  timezone: 'Africa/Lagos', locale: 'en-NG', discreetNotifications: true,
  journeyUpdatesEnabled: true, appointmentRemindersEnabled: true,
  consultationRemindersEnabled: true, weeklyRecapEnabled: true,
  userRemindersEnabled: true, pointsEnabled: false,
};

export type JourneyTask = {
  id: string;
  title: string;
  description: string;
  category: EngagementCategory;
  status: EngagementTaskStatus;
  pointsAwarded: number;
  completedAt: string | null;
};
export type UserReminder = {
  id: string; title: string; remindAt: string; active: boolean; completedAt: string | null;
};
export type Achievement = { code: string; title: string; description: string; category: EngagementCategory; awardedAt: string };
export type InAppNotification = { id: string; kind: string; title: string; body: string; scheduledFor: string; readAt: string | null };
export type JourneyTransition = { id: string; fromStage: string | null; toStage: string; occurredAt: string; sensitive: boolean };
export type EngagementData = {
  preferences: EngagementPreferences;
  tasks: JourneyTask[];
  reminders: UserReminder[];
  achievements: Achievement[];
  notifications: InAppNotification[];
  transitions: JourneyTransition[];
};

export function validateTask(input: unknown): JourneyTask {
  if (!input || typeof input !== 'object') throw new Error('Invalid task.');
  const value = input as Partial<JourneyTask>;
  if (typeof value.id !== 'string' || value.id.length > 100) throw new Error('Invalid task id.');
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 150) throw new Error('Task title must be between 1 and 150 characters.');
  if (typeof value.description !== 'string' || value.description.length > 500) throw new Error('Task description is too long.');
  if (!['tracking', 'learning', 'preparation', 'follow_up'].includes(String(value.category))) throw new Error('Invalid task category.');
  if (!['available', 'completed', 'dismissed'].includes(String(value.status))) throw new Error('Invalid task status.');
  return { id: value.id, title: value.title.trim(), description: value.description.trim(), category: value.category as EngagementCategory,
    status: value.status as EngagementTaskStatus, pointsAwarded: 0, completedAt: value.status === 'completed' ? new Date().toISOString() : null };
}

export function validateReminder(input: unknown): UserReminder {
  if (!input || typeof input !== 'object') throw new Error('Invalid reminder.');
  const value = input as Partial<UserReminder>;
  if (typeof value.id !== 'string' || value.id.length > 100) throw new Error('Invalid reminder id.');
  if (typeof value.title !== 'string' || !value.title.trim() || value.title.length > 120) throw new Error('Reminder title must be between 1 and 120 characters.');
  if (typeof value.remindAt !== 'string' || Number.isNaN(Date.parse(value.remindAt))) throw new Error('Choose a valid reminder time.');
  return { id: value.id, title: value.title.trim(), remindAt: new Date(value.remindAt).toISOString(), active: value.active !== false, completedAt: value.completedAt ?? null };
}

export function validatePreferences(input: unknown): EngagementPreferences {
  if (!input || typeof input !== 'object') throw new Error('Invalid preferences.');
  const value = input as Partial<EngagementPreferences>;
  const bool = (key: keyof EngagementPreferences, fallback: boolean) => typeof value[key] === 'boolean' ? value[key] as boolean : fallback;
  return {
    timezone: typeof value.timezone === 'string' && value.timezone.length <= 80 ? value.timezone : 'Africa/Lagos',
    locale: typeof value.locale === 'string' && value.locale.length <= 20 ? value.locale : 'en-NG',
    discreetNotifications: bool('discreetNotifications', true), journeyUpdatesEnabled: bool('journeyUpdatesEnabled', true),
    appointmentRemindersEnabled: bool('appointmentRemindersEnabled', true), consultationRemindersEnabled: bool('consultationRemindersEnabled', true),
    weeklyRecapEnabled: bool('weeklyRecapEnabled', true), userRemindersEnabled: bool('userRemindersEnabled', true), pointsEnabled: bool('pointsEnabled', false),
  };
}
