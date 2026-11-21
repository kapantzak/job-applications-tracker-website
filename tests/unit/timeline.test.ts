import { describe, expect, it } from 'vitest';
import { fitScale, segment, stepAt } from '../../src/components/journey/timeline';

describe('stepAt', () => {
  it.each([
    [0, { index: 0, local: 0 }],
    [0.5, { index: 2, local: 0.5 }],
    [1, { index: 4, local: 1 }],
    [-0.2, { index: 0, local: 0 }],
    [1.3, { index: 4, local: 1 }],
    [0.4, { index: 2, local: 0 }],
  ])('maps progress %s', (p, expected) => {
    const r = stepAt(p, 5);
    expect(r.index).toBe(expected.index);
    expect(r.local).toBeCloseTo(expected.local, 10);
  });
});

describe('segment', () => {
  it('maps a window of local progress to 0..1', () => {
    expect(segment(0.5, 0.25, 0.75)).toBe(0.5);
    expect(segment(0.1, 0.25, 0.75)).toBe(0);
    expect(segment(0.9, 0.25, 0.75)).toBe(1);
  });
});

describe('fitScale', () => {
  it('scales down but never up', () => {
    expect(fitScale(520, 1040)).toBe(0.5);
    expect(fitScale(2000, 1040)).toBe(1);
  });
});
