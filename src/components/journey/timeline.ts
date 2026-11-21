const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/** Splits overall progress into a step index and 0..1 progress inside it; a boundary belongs to the next step. */
export function stepAt(progress: number, count: number): { index: number; local: number } {
  const scaled = clamp01(progress) * count;
  const index = Math.min(count - 1, Math.floor(scaled));
  return { index, local: clamp01(scaled - index) };
}

/** Maps `local` within [start, end] to 0..1, clamped. */
export function segment(local: number, start: number, end: number): number {
  if (end <= start) return local >= end ? 1 : 0;
  return clamp01((local - start) / (end - start));
}

/** Scale that fits the design width into the container; never upscales. */
export function fitScale(containerWidth: number, designWidth: number): number {
  if (designWidth <= 0) return 1;
  return Math.min(1, containerWidth / designWidth);
}
