import type { ComponentType } from 'react';
import type { ScreenProps, StepId } from '../types';
import { ApplyScreen } from './ApplyScreen';
import { CvScreen } from './CvScreen';
import { DashboardScreen } from './DashboardScreen';
import { JobsScreen } from './JobsScreen';
import { ReviewScreen } from './ReviewScreen';

/** The mock screen for each journey step. */
export const SCREENS: Record<StepId, ComponentType<ScreenProps>> = {
  cv: CvScreen,
  jobs: JobsScreen,
  apply: ApplyScreen,
  review: ReviewScreen,
  dashboard: DashboardScreen,
};
