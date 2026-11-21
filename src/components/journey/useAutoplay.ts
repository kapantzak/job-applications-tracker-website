import { animate, useMotionValue, type MotionValue } from 'motion/react';
import { useCallback, useEffect, useState } from 'react';

interface Options {
  count: number;
  stepMs: number;
  enabled: boolean;
  rootRef: React.RefObject<Element | null>;
}

export function useAutoplay({ count, stepMs, enabled, rootRef }: Options): {
  index: number;
  progress: MotionValue<number>;
  select(i: number): void;
  stopped: boolean;
} {
  const [index, setIndex] = useState(0);
  const [stopped, setStopped] = useState(false);
  const [inView, setInView] = useState(true);
  const [pageVisible, setPageVisible] = useState(true);
  const progress = useMotionValue(enabled ? 0 : 1);

  useEffect(() => {
    const root = rootRef.current;
    if (!enabled || !root || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      const last = entries[entries.length - 1];
      if (last) setInView(last.isIntersecting);
    });
    io.observe(root);
    return () => io.disconnect();
  }, [enabled, rootRef]);

  useEffect(() => {
    if (!enabled) return;
    const update = () => setPageVisible(document.visibilityState !== 'hidden');
    update();
    document.addEventListener('visibilitychange', update);
    return () => document.removeEventListener('visibilitychange', update);
  }, [enabled]);

  const running = enabled && !stopped && inView && pageVisible;

  useEffect(() => {
    if (!enabled) {
      progress.set(1);
      return;
    }
    if (!running) return;
    // The timer owns step changes so they stay deterministic; Motion only drives the visual progress.
    progress.set(0);
    const controls = animate(progress, 1, { duration: stepMs / 1000, ease: 'linear' });
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), stepMs);
    return () => {
      controls.stop();
      clearTimeout(timer);
    };
  }, [enabled, running, index, count, stepMs, progress]);

  const select = useCallback(
    (i: number) => {
      setStopped(true);
      setIndex(i);
      progress.set(1);
    },
    [progress],
  );

  return { index, progress, select, stopped };
}
