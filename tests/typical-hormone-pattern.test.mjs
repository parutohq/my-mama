import test from 'node:test';
import assert from 'node:assert/strict';
import { canShowCycleDayMarker, typicalHormonePattern, typicalHormones } from '../lib/typical-hormone-pattern-model.ts';

test('typical hormone reference contains four normalized educational series', () => {
  assert.deepEqual(typicalHormones, ['estrogen', 'progesterone', 'lh', 'fsh']);
  assert.equal(typicalHormonePattern[0].day, 1);
  assert.equal(typicalHormonePattern.at(-1).day, 28);
  for (const point of typicalHormonePattern) for (const hormone of typicalHormones) assert.ok(point[hormone] >= 0 && point[hormone] <= 100);
});

test('cycle-day marker is withheld outside supported recorded context', () => {
  assert.equal(canShowCycleDayMarker(8), true);
  assert.equal(canShowCycleDayMarker(null), false);
  assert.equal(canShowCycleDayMarker(29), false);
});
