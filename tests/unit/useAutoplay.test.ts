import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useAutoplay } from '../../src/components/journey/useAutoplay';

type IOCallback = (entries: { isIntersecting: boolean }[]) => void;
let observers: { cb: IOCallback }[] = [];

class FakeIO {
  cb: IOCallback;
  constructor(cb: IOCallback) {
    this.cb = cb;
    observers.push(this);
  }
  observe() {
    this.cb([{ isIntersecting: true }]);
  }
  disconnect() {}
  unobserve() {}
}

const STEP = 1000;
const root = { current: document.createElement('div') };

function setup(enabled = true) {
  return renderHook(({ enabled }) => useAutoplay({ count: 5, stepMs: STEP, enabled, rootRef: root }), {
    initialProps: { enabled },
  });
}
const tick = (ms: number) => act(() => void vi.advanceTimersByTime(ms));

beforeEach(() => {
  observers = [];
  vi.useFakeTimers();
  vi.stubGlobal('IntersectionObserver', FakeIO);
  Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'visible' });
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('useAutoplay', () => {
  it('advances every stepMs and wraps', () => {
    const { result } = setup();
    expect(result.current.index).toBe(0);
    tick(STEP);
    expect(result.current.index).toBe(1);
    // Each step schedules the next timer after React re-renders, so tick one step at a time.
    for (let i = 0; i < 3; i++) tick(STEP);
    expect(result.current.index).toBe(4);
    tick(STEP);
    expect(result.current.index).toBe(0);
  });

  it('select stops autoplay and shows the final state', () => {
    const { result } = setup();
    act(() => result.current.select(3));
    expect(result.current.index).toBe(3);
    expect(result.current.progress.get()).toBe(1);
    expect(result.current.stopped).toBe(true);
    tick(STEP * 3);
    expect(result.current.index).toBe(3);
  });

  it('does nothing when disabled', () => {
    const { result } = setup(false);
    tick(STEP * 3);
    expect(result.current.index).toBe(0);
    expect(result.current.progress.get()).toBe(1);
  });

  it('pauses while not intersecting', () => {
    const { result } = setup();
    act(() => observers[0].cb([{ isIntersecting: false }]));
    tick(STEP * 3);
    expect(result.current.index).toBe(0);
    act(() => observers[0].cb([{ isIntersecting: true }]));
    tick(STEP);
    expect(result.current.index).toBe(1);
  });

  it('pauses while the document is hidden', () => {
    const { result } = setup();
    Object.defineProperty(document, 'visibilityState', { configurable: true, value: 'hidden' });
    act(() => void document.dispatchEvent(new Event('visibilitychange')));
    tick(STEP * 3);
    expect(result.current.index).toBe(0);
  });
});
