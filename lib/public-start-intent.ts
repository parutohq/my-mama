import type { Stage } from '@/lib/care-model';

export const publicJourneyChoices: Array<{ stage: Stage; title: string; copy: string }> = [
  { stage: 'first_period', title: 'Growing up', copy: 'A quiet place to understand your first period and questions.' },
  { stage: 'cycle', title: 'My cycle', copy: 'Keep dates and observations that matter to you.' },
  { stage: 'preconception', title: 'Planning ahead', copy: 'Prepare for future care conversations at your own pace.' },
  { stage: 'trying_to_conceive', title: 'Trying for a baby', copy: 'Keep your questions, dates and care preparations together.' },
  { stage: 'pregnancy', title: 'Pregnancy', copy: 'Keep your chosen dates and care conversations close.' },
  { stage: 'postpartum', title: 'After birth', copy: 'A personal space for support, recovery and what helps.' },
  { stage: 'perimenopause', title: 'Midlife', copy: 'Record only the changes and questions that feel useful.' },
];

export type PublicStartIntent = { stage: Stage; name: string };
export const publicStartIntentKey = 'mama-public-start-intent';

export function parsePublicStartIntent(value: unknown): PublicStartIntent | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as { stage?: unknown; name?: unknown };
  const stage = publicJourneyChoices.find((item) => item.stage === candidate.stage)?.stage;
  if (!stage) return null;
  return { stage, name: typeof candidate.name === 'string' ? candidate.name.slice(0, 60) : '' };
}
