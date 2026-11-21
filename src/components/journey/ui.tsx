/*
 * Shared building blocks for the journey screens (Tasks 5 and 6).
 *
 * Animation conventions:
 * - A screen is a pure function of its `progress` MotionValue (0..1). Derive phases with `usePhase`
 *   and map them through `useTransform`; no timers, `animate()` calls or time-driven state, so
 *   scrolling back reverses every animation exactly and reduced motion (progress fixed at 1) shows
 *   the final state.
 * - "Not shown" means still mounted with `opacity: 0` and `visibility: hidden` (`Reveal` and
 *   `useVisibility` do this). Nothing unmounts mid-step, so layout never jumps, and tests assert
 *   with jest-dom `toBeVisible` / `not.toBeVisible`. A shown element gets `visibility: inherit`,
 *   never `visible`, so it cannot override a hidden parent.
 * - Animate transform and opacity; colours only through `color-mix` templates when unavoidable.
 * - The mock is `aria-hidden`: render buttons and inputs as plain elements, never focusable ones.
 */
import { MousePointer2 } from 'lucide-react';
import { backOut, cubicBezier, motion, useTransform, type MotionValue } from 'motion/react';
import type { CSSProperties, ReactNode } from 'react';
import { twMerge } from 'tailwind-merge';
import { segment } from './timeline';
import type { AppStatus } from './types';

/** Soft ease-out used for most entrances. */
export const easeSoft = cubicBezier(0.22, 1, 0.36, 1);

/** Linear 0..1 progress of the phase [start, end] within a screen's progress. */
export function usePhase(progress: MotionValue<number>, start: number, end: number): MotionValue<number> {
  return useTransform(progress, (v) => segment(v, start, end));
}

/** `hidden` while `t` (a phase or an opacity) is 0, so a zero-opacity element is also "not shown". */
export function useVisibility(t: MotionValue<number>): MotionValue<'inherit' | 'hidden'> {
  return useTransform(t, (v) => (v > 0 ? 'inherit' : 'hidden'));
}

interface RevealProps {
  /** Phase progress 0..1 (from `usePhase`). */
  t: MotionValue<number>;
  /** Start offset in px; the element settles at 0. */
  x?: number;
  y?: number;
  /** Start scale; the element settles at 1. */
  scale?: number;
  /** Overshoot slightly on arrival, for badges and tags. */
  pop?: boolean;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}

/** Fades, slides and scales its children in as `t` goes 0 → 1; hidden at 0. */
export function Reveal({ t, x = 0, y = 0, scale = 1, pop = false, className, style, children }: RevealProps) {
  const ease = pop ? backOut : easeSoft;
  const opacity = useTransform(t, (v) => Math.min(1, v * 1.6));
  const visibility = useVisibility(t);
  const tx = useTransform(t, (v) => (1 - ease(v)) * x);
  const ty = useTransform(t, (v) => (1 - ease(v)) * y);
  const s = useTransform(t, (v) => scale + (1 - scale) * ease(v));
  return (
    <motion.div className={className} style={{ ...style, opacity, visibility, x: tx, y: ty, scale: s }}>
      {children}
    </motion.div>
  );
}

export type BadgeTone = 'success' | 'warning' | 'muted' | 'destructive' | 'info' | 'primary';

// Tones follow the app's badge variants (src/ui/components/ui/badge.tsx); `info` is a soft blue
// from the app's status ramp, `primary` the app's default variant (its Interview badge).
const BADGE_TONES: Record<BadgeTone, string> = {
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  muted: 'bg-secondary text-secondary-foreground',
  destructive: 'bg-destructive text-white dark:bg-destructive/60',
  info: 'bg-status-applied/15 text-status-interview dark:text-status-offer',
  primary: 'bg-primary text-primary-foreground',
};

export function MockBadge({ tone, children }: { tone: BadgeTone; children: ReactNode }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-[13px] leading-5 font-medium whitespace-nowrap ${BADGE_TONES[tone]}`}
    >
      {children}
    </span>
  );
}

/**
 * Status fills from the app's dashboard (status-colors.ts); full class names so Tailwind finds them.
 */
export const STATUS_FILL: Record<AppStatus, string> = {
  saved: 'bg-status-saved',
  applied: 'bg-status-applied',
  screening: 'bg-status-screening',
  interview: 'bg-status-interview',
  offer: 'bg-status-offer',
  rejected: 'bg-status-rejected',
  withdrawn: 'bg-status-withdrawn',
  'no-response': 'bg-status-no-response',
};

export type ButtonVariant = 'primary' | 'outline';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground shadow-sm',
  outline: 'border border-border bg-background shadow-xs dark:border-input dark:bg-input/30',
};

interface MockButtonProps {
  variant: ButtonVariant;
  children: ReactNode;
  /** Press phase 0..1: a pointer glides in, presses and leaves. Omit for a static button. */
  press?: MotionValue<number>;
  className?: string;
}

/** The app's button look as a plain element (the mock is decorative and must not take focus). */
export function MockButton({ press, ...rest }: MockButtonProps) {
  return press ? <PressedButton press={press} {...rest} /> : <ButtonFace {...rest} />;
}

function ButtonFace({ variant, children, className }: Omit<MockButtonProps, 'press'>) {
  return (
    <span
      className={twMerge(
        'inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md px-4 text-[15px] font-medium whitespace-nowrap [&_svg]:size-4 [&_svg]:shrink-0',
        BUTTON_VARIANTS[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}

// Press timeline within `press`: the pointer arrives by 0.5, pushes 0.5–0.8, a soft halo spreads
// 0.58–1 and the pointer fades out at the end, so the final state shows no pointer.
function PressedButton({ press, ...face }: MockButtonProps & { press: MotionValue<number> }) {
  const scale = useTransform(press, [0, 0.5, 0.62, 0.8], [1, 1, 0.94, 1]);
  const halo = useTransform(press, (v) => segment(v, 0.58, 1));
  const haloOpacity = useTransform(halo, (v) => (v > 0 && v < 1 ? 0.8 * Math.min(1, v * 5) * (1 - v) : 0));
  const haloScaleX = useTransform(halo, (v) => 1 + 0.12 * easeSoft(v));
  const haloScaleY = useTransform(halo, (v) => 1 + 0.45 * easeSoft(v));
  const glide = useTransform(press, (v) => easeSoft(segment(v, 0, 0.5)));
  const cursorX = useTransform(glide, (v) => (1 - v) * 64);
  const cursorY = useTransform(glide, (v) => (1 - v) * 48);
  const cursorScale = useTransform(press, [0, 0.5, 0.62, 0.8], [1, 1, 0.85, 1]);
  const cursorOpacity = useTransform(press, (v) => Math.min(segment(v, 0, 0.2), 1 - segment(v, 0.85, 1)));
  const cursorVisibility = useVisibility(cursorOpacity);
  return (
    <span className="relative inline-flex">
      <motion.span
        className="pointer-events-none absolute inset-0 rounded-lg bg-primary/30 blur-[6px]"
        style={{ opacity: haloOpacity, visibility: useVisibility(haloOpacity), scaleX: haloScaleX, scaleY: haloScaleY }}
      />
      <motion.span className="relative inline-flex" style={{ scale }}>
        <ButtonFace {...face} />
      </motion.span>
      <motion.span
        className="pointer-events-none absolute top-1/2 left-[62%] z-10 drop-shadow-md"
        style={{ x: cursorX, y: cursorY, scale: cursorScale, opacity: cursorOpacity, visibility: cursorVisibility }}
      >
        <MockPointer />
      </motion.span>
    </span>
  );
}

/** The mouse pointer used wherever the mock "clicks" or "drags". */
export function MockPointer() {
  return <MousePointer2 className="size-6 fill-foreground stroke-background" strokeWidth={1.5} />;
}

/** Page title and description as the app's PageHeader shows them, slightly larger for legibility. */
export function MockPageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-6">
      <div className="space-y-1">
        <div className="text-[28px] leading-9 font-semibold tracking-tight">{title}</div>
        <div className="text-[15px] text-muted-foreground">{description}</div>
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
