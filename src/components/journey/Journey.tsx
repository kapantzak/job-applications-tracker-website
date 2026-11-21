import { AnimatePresence, motion, motionValue, useReducedMotion, useScroll, type MotionValue } from 'motion/react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { sections } from '../../content/site';
import { AppWindow } from './AppWindow';
import { dashboardReviewCount } from './mockData';
import { SCREENS } from './screens';
import { segment, stepAt } from './timeline';
import type { JourneyStep } from './types';
import { easeSoft } from './ui';
import { useAutoplay } from './useAutoplay';
import { useMediaQuery } from './useMediaQuery';

const STEP_MS = 6000;
// Desktop step shape: a short lead lets the cross-fade finish before the screen moves, and the
// screen completes before the step ends so its final state holds for a moment before the next one.
const LEAD = 0.06;
const SETTLE = 0.82;

/**
 * static: every screen at its final state (server render, no JS, reduced motion).
 * scroll: desktop, each step's progress follows the scroll position.
 * autoplay: narrow, the autoplay timer drives the active step.
 */
type Mode = 'static' | 'scroll' | 'autoplay';

/**
 * The journey island. One markup serves every mode and CSS picks the layout: the step list on
 * desktop (scroll-driven, sticky mock) and the tab strip below 1024px (autoplay).
 */
export function Journey({ steps }: { steps: JourneyStep[] }) {
  const count = steps.length;
  const rootRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Until mounted, render exactly what the server did: step 1 at its final state.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isDesktop = useMediaQuery('(min-width: 1024px)', true);
  // useReducedMotion reads the media query on the first client render, which can differ from the
  // server render, so it only takes effect after mount.
  const prefersReduced = useReducedMotion() ?? false;
  const reduced = mounted && prefersReduced;

  const autoplay = useAutoplay({ count, stepMs: STEP_MS, enabled: !reduced && !isDesktop, rootRef });
  const { scrollYProgress } = useScroll({ target: stepsRef, offset: ['start center', 'end center'] });

  const scrollDriven = mounted && isDesktop;
  const mode: Mode = !mounted || reduced ? 'static' : isDesktop ? 'scroll' : 'autoplay';

  const [scrollIndex, setScrollIndex] = useState(0);
  useEffect(() => {
    if (!scrollDriven) return;
    const update = (p: number) => setScrollIndex(stepAt(p, count).index);
    update(scrollYProgress.get());
    return scrollYProgress.on('change', update);
  }, [scrollDriven, scrollYProgress, count]);

  const index = scrollDriven ? scrollIndex : autoplay.index;

  // One progress value per step, so a screen that is fading out keeps its own state instead of
  // following the next step's progress.
  const [values] = useState(() => steps.map(() => motionValue(1)));
  useEffect(() => {
    if (mode === 'static') {
      values.forEach((v) => v.jump(1));
      return;
    }
    if (mode === 'scroll') {
      // Monotonic in scroll position, so scrolling back reverses every screen exactly.
      const apply = (p: number) => {
        const scaled = Math.min(1, Math.max(0, p)) * count;
        values.forEach((v, i) => v.set(segment(scaled - i, LEAD, SETTLE)));
      };
      apply(scrollYProgress.get());
      return scrollYProgress.on('change', apply);
    }
    // useAutoplay's effects run first and reset its progress for the new step; this one then
    // mirrors it into the active step only.
    const target = values[autoplay.index];
    if (!target) return;
    target.set(autoplay.progress.get());
    return autoplay.progress.on('change', (v) => target.set(v));
  }, [mode, autoplay.index, autoplay.progress, scrollYProgress, values, count]);

  const active = steps[index] ?? steps[0];
  if (!active) return null;
  const Screen = SCREENS[active.id];
  const screen = <Screen progress={values[index] ?? values[0]!} />;

  function onTabKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const next =
      event.key === 'ArrowRight'
        ? (index + 1) % count
        : event.key === 'ArrowLeft'
          ? (index - 1 + count) % count
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? count - 1
              : null;
    if (next === null) return;
    event.preventDefault();
    autoplay.select(next);
    tabRefs.current[next]?.focus();
  }

  return (
    <div
      ref={rootRef}
      className="mt-10 flex flex-col lg:mt-0 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.9fr)] lg:gap-x-12"
    >
      <div className="relative hidden lg:col-start-1 lg:row-start-1 lg:block [@media(scripting:none)]:block">
        {/* The rail behind the step numbers, faded out at both ends. */}
        <span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-[17px] w-px bg-border [mask-image:linear-gradient(transparent,black_12%,black_88%,transparent)] max-lg:hidden"
        />
        <ol ref={stepsRef} className="relative">
          {steps.map((step, i) => (
            <DesktopStep
              key={step.id}
              step={step}
              number={i + 1}
              state={i === index ? 'active' : i < index ? 'done' : 'upcoming'}
              dim={mounted && i !== index}
              progress={values[i]!}
              showProgress={mode === 'scroll'}
            />
          ))}
        </ol>
      </div>

      {/* Spans the spacer row too, so the mock stays pinned while the last step holds its final state. */}
      <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:[container-type:inline-size]">
        {/* Centred in the viewport: 31.73cqw is half the window's height (660 / 1040 of its width). */}
        <div className="lg:sticky lg:top-[calc(50vh-31.73cqw)]">
          <AppWindow
            active={active.id}
            reviewCount={active.id === 'dashboard' ? dashboardReviewCount : undefined}
          >
            <div className="grid">
              {reduced ? (
                <div key={active.id} className="min-w-0 [grid-area:1/1]">
                  {screen}
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  <motion.div
                    key={active.id}
                    className="min-w-0 [grid-area:1/1]"
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: easeSoft }}
                  >
                    {screen}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </AppWindow>
        </div>
      </div>

      <div aria-hidden="true" className="hidden lg:col-start-1 lg:row-start-2 lg:block lg:h-[25vh]" />

      <div className="lg:hidden [@media(scripting:none)]:hidden">
        <div role="tablist" aria-label={sections.journey.tabsLabel} className="mt-6 grid grid-cols-5 gap-2">
          {steps.map((step, i) => {
            const selected = i === index;
            return (
              <button
                key={step.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                type="button"
                role="tab"
                id={`journey-tab-${step.id}`}
                aria-selected={selected}
                aria-controls={`journey-panel-${step.id}`}
                tabIndex={selected ? 0 : -1}
                onClick={() => autoplay.select(i)}
                onKeyDown={onTabKeyDown}
                className="flex min-h-11 flex-col gap-2 rounded-md pt-2 pb-1 text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background focus-visible:outline-none"
              >
                <span className="block h-1 overflow-hidden rounded-full bg-border">
                  <motion.span
                    className="block h-full origin-left rounded-full bg-primary"
                    style={{ scaleX: i < index ? 1 : i > index ? 0 : autoplay.progress }}
                  />
                </span>
                <span
                  className={`text-sm font-medium tabular-nums transition-colors duration-300 ${
                    selected ? 'text-foreground' : 'text-muted-foreground'
                  }`}
                >
                  {sections.journey.stepLabel} {i + 1}
                  <span className="sr-only">: {step.title}</span>
                </span>
              </button>
            );
          })}
        </div>
        {/* All panels share one grid cell, so the tallest sets the height and switching never shifts the page. */}
        <div className="mt-4 grid">
          {steps.map((step, i) => (
            <div
              key={step.id}
              role="tabpanel"
              id={`journey-panel-${step.id}`}
              aria-labelledby={`journey-tab-${step.id}`}
              className={`[grid-area:1/1] transition-[opacity,visibility] duration-300 motion-reduce:transition-none ${
                i === index ? '' : 'invisible opacity-0'
              }`}
            >
              <h3 className="text-xl font-semibold tracking-tight text-balance">{step.title}</h3>
              <p className="mt-2 text-pretty text-muted-foreground">{step.line}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DesktopStep({
  step,
  number,
  state,
  dim,
  progress,
  showProgress,
}: {
  step: JourneyStep;
  number: number;
  state: 'active' | 'done' | 'upcoming';
  /** Inactive steps recede once hydrated; without JS every step reads at full strength. */
  dim: boolean;
  progress: MotionValue<number>;
  showProgress: boolean;
}) {
  const marker =
    state === 'active'
      ? 'border-primary bg-primary text-primary-foreground'
      : state === 'done'
        ? 'border-primary bg-background text-foreground'
        : 'border-border bg-background text-muted-foreground';
  return (
    <li
      data-journey-step={step.id}
      aria-current={state === 'active' ? 'step' : undefined}
      className="flex min-h-[80vh] items-center max-lg:min-h-0 max-lg:py-4"
    >
      <div className="relative pl-14">
        <span
          aria-hidden="true"
          className={`absolute top-0 left-0 flex size-9 -translate-y-0.5 xl:translate-y-0 items-center justify-center rounded-full border text-sm font-semibold tabular-nums transition-colors duration-300 ${marker}`}
        >
          {number}
        </span>
        <h3
          className={`text-xl font-semibold tracking-tight text-balance transition-colors duration-300 xl:text-2xl ${
            dim ? 'text-muted-foreground' : 'text-foreground'
          }`}
        >
          {step.title}
        </h3>
        <p className="mt-3 text-pretty text-muted-foreground xl:text-lg">{step.line}</p>
        <span
          aria-hidden="true"
          className={`mt-6 block h-1 w-40 overflow-hidden rounded-full bg-border transition-opacity duration-300 ${
            showProgress && state === 'active' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <motion.span className="block h-full origin-left rounded-full bg-primary" style={{ scaleX: progress }} />
        </span>
      </div>
    </li>
  );
}
