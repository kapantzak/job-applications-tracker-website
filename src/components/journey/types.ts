import type { MotionValue } from 'motion/react';

export type { StepId, JourneyStep } from '../../content/site';

/** `progress` runs 0..1 within the step the screen belongs to. */
export interface ScreenProps {
  progress: MotionValue<number>;
}
export type Verification = 'verified' | 'redirected' | 'could-not-verify';
export type Fit = 'match' | 'mismatch' | 'unknown';
// The app's application statuses, in its order (APPLICATION_STATUSES); ids use the CSS token spelling.
export type AppStatus =
  | 'saved'
  | 'applied'
  | 'screening'
  | 'interview'
  | 'offer'
  | 'rejected'
  | 'withdrawn'
  | 'no-response';
