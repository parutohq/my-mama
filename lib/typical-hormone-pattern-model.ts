export const typicalHormonePattern = [
  { day: 1, estrogen: 22, progesterone: 18, lh: 18, fsh: 42 },
  { day: 4, estrogen: 28, progesterone: 17, lh: 18, fsh: 30 },
  { day: 8, estrogen: 52, progesterone: 20, lh: 22, fsh: 22 },
  { day: 12, estrogen: 76, progesterone: 22, lh: 30, fsh: 20 },
  { day: 14, estrogen: 62, progesterone: 25, lh: 86, fsh: 38 },
  { day: 16, estrogen: 44, progesterone: 38, lh: 30, fsh: 22 },
  { day: 21, estrogen: 52, progesterone: 75, lh: 20, fsh: 18 },
  { day: 28, estrogen: 25, progesterone: 24, lh: 18, fsh: 38 },
] as const;

export const typicalHormones = ['estrogen', 'progesterone', 'lh', 'fsh'] as const;

export function canShowCycleDayMarker(cycleDay?: number | null) {
  return typeof cycleDay === 'number' && cycleDay >= 1 && cycleDay <= 28;
}
