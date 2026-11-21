// Invented data only: made-up companies and @example.com addresses.
import type { AppStatus, Fit, Verification } from './types';

export const profile: {
  name: 'Frontend Platform';
  targetRoles: string[];
  locations: string[];
  remote: string;
  seniority: string[];
} = {
  name: 'Frontend Platform',
  targetRoles: ['Senior Frontend Engineer', 'Staff Frontend Engineer'],
  locations: ['Berlin', 'Remote (EU)'],
  remote: 'Remote or hybrid',
  seniority: ['Senior', 'Staff'],
};

export const cvFileName = 'cv-frontend-platform.pdf';

export const jobs: {
  company: string;
  title: string;
  location: string;
  verification: Verification;
  fit: { location: Fit; remote: Fit; seniority: Fit };
}[] = [
  {
    company: 'Northwind Studio',
    title: 'Senior Frontend Engineer',
    location: 'Berlin',
    verification: 'verified',
    fit: { location: 'match', remote: 'match', seniority: 'match' },
  },
  {
    company: 'Acme Robotics',
    title: 'Staff Frontend Engineer',
    location: 'Remote (EU)',
    verification: 'verified',
    fit: { location: 'match', remote: 'match', seniority: 'match' },
  },
  {
    company: 'Umbrella Health',
    title: 'Senior UI Engineer',
    location: 'Munich',
    verification: 'redirected',
    fit: { location: 'mismatch', remote: 'unknown', seniority: 'match' },
  },
  {
    company: 'Brightwell Cloud',
    title: 'Frontend Platform Engineer',
    location: 'Berlin',
    verification: 'verified',
    fit: { location: 'match', remote: 'unknown', seniority: 'match' },
  },
  {
    company: 'Larkspur Systems',
    title: 'Senior Web Engineer',
    location: 'Lisbon',
    verification: 'could-not-verify',
    fit: { location: 'mismatch', remote: 'mismatch', seniority: 'unknown' },
  },
  {
    company: 'Quillmark Software',
    title: 'Principal Frontend Engineer',
    location: 'Remote (EU)',
    verification: 'redirected',
    fit: { location: 'match', remote: 'match', seniority: 'mismatch' },
  },
];

export const runLog: string[] = [
  'Reading your profile',
  'Searching the web for matching postings',
  'Found 6 postings',
  'Checking every link',
  'Saved 6 jobs',
];

/** The job applied in step 3 (Saved → Applied); the proposal in step 4 moves it on. */
export const newApplication: { company: string; role: string; applied: string } = {
  company: jobs[0].company,
  role: jobs[0].title,
  applied: 'Mar 3',
};

/** Step 3 jumps ahead in time, so the list already holds applications from the weeks since step 2. */
export const applyTimeCue = 'A few weeks later';

/** The steps of the Dashboard's Journey graph, in order (the app's FUNNEL_STAGES). */
export type FunnelStage = 'applied' | 'screening' | 'interview' | 'offer';
export const FUNNEL_STAGES: readonly FunnelStage[] = ['applied', 'screening', 'interview', 'offer'];

/**
 * Applications tracked before step 3, newest first. With `newApplication` they are the 12 the
 * Dashboard counts. Applied dates are absent for Saved. `reached` stands in for the app's status
 * history: the furthest step a stopped application got to, when its status does not show it.
 */
export const applications: {
  company: string;
  role: string;
  status: AppStatus;
  applied: string | null;
  reached?: FunnelStage;
}[] = [
  { company: 'Juniper Ferry', role: 'Frontend Engineer, Design Systems', status: 'applied', applied: 'Mar 1' },
  { company: 'Mossgate Labs', role: 'Senior Frontend Engineer', status: 'screening', applied: 'Feb 27' },
  { company: 'Copperline Health', role: 'Staff UI Engineer', status: 'interview', applied: 'Feb 20' },
  { company: 'Brightwell Cloud', role: 'Frontend Platform Engineer', status: 'saved', applied: null },
  { company: 'Driftwood Atlas', role: 'Senior Web Engineer', status: 'rejected', applied: 'Feb 12' },
  { company: 'Harbor & Finch', role: 'Frontend Lead', status: 'offer', applied: 'Feb 6' },
  { company: 'Tallpine Games', role: 'Senior Frontend Engineer', status: 'applied', applied: 'Feb 3' },
  { company: 'Orrery Maps', role: 'UI Engineer', status: 'no-response', applied: 'Jan 22' },
  { company: 'Bramble Pay', role: 'Senior React Engineer', status: 'applied', applied: 'Jan 19' },
  { company: 'Saltglass Studio', role: 'Frontend Engineer', status: 'rejected', applied: 'Jan 14', reached: 'screening' },
  { company: 'Wrenfield Data', role: 'Senior Frontend Engineer', status: 'screening', applied: 'Jan 9' },
];

export const proposal: {
  company: string;
  role: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  reason: string;
  confidence: number;
  fromStatus: AppStatus;
  toStatus: AppStatus;
} = {
  company: newApplication.company,
  role: newApplication.role,
  from: 'no-reply@ats.example.com',
  date: 'Mar 12',
  subject: 'Next steps: interview with Northwind Studio',
  snippet: 'We enjoyed your application and would like to invite you to an interview next week.',
  reason: 'An interview invitation for this application.',
  confidence: 0.92,
  fromStatus: 'applied',
  toStatus: 'interview',
};

export const STATUS_LABEL: Record<AppStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  'no-response': 'No response',
};

// The Dashboard step follows the accepted proposal: the applied job is now at its proposed status.
const dashboardApps: { status: AppStatus; reached?: FunnelStage }[] = [...applications, { status: proposal.toStatus }];
const statusCount = (status: AppStatus) => dashboardApps.filter((a) => a.status === status).length;

/** How applications that stopped at a step ended there; `waiting` is any other status. */
export type JourneyStop = 'waiting' | 'rejected' | 'noResponse' | 'withdrawn';
export const JOURNEY_STOPS: readonly JourneyStop[] = ['waiting', 'rejected', 'noResponse', 'withdrawn'];
const STOP_OF: Partial<Record<AppStatus, JourneyStop>> = {
  rejected: 'rejected',
  'no-response': 'noResponse',
  withdrawn: 'withdrawn',
};

// The app's funnel depth: 1..4 for Applied..Offer; Rejected and No response only show that an
// application was sent, and Withdrawn alone shows nothing, so `reached` must say more.
function rank(status: AppStatus | FunnelStage): number {
  const i = FUNNEL_STAGES.indexOf(status as FunnelStage);
  if (i >= 0) return i + 1;
  return status === 'rejected' || status === 'no-response' ? 1 : 0;
}

function journeyStages(): JourneyStage[] {
  const counts = FUNNEL_STAGES.map(() => 0);
  const stops = FUNNEL_STAGES.map(() => ({ waiting: 0, rejected: 0, noResponse: 0, withdrawn: 0 }));
  for (const a of dashboardApps) {
    const reach = Math.max(rank(a.status), a.reached ? rank(a.reached) : 0);
    for (let i = 0; i < reach; i++) counts[i] += 1;
    if (reach > 0) stops[reach - 1][STOP_OF[a.status] ?? 'waiting'] += 1;
  }
  return FUNNEL_STAGES.map((stage, i) => ({
    stage,
    count: counts[i],
    share: i > 0 && counts[i - 1] > 0 ? Math.round((counts[i] / counts[i - 1]) * 100) : null,
    stops: stops[i],
  }));
}

export interface JourneyStage {
  stage: FunnelStage;
  /** Applications that reached this step. */
  count: number;
  /** Percent of the step before, rounded; null for Applied. */
  share: number | null;
  /** Applications whose furthest step is this one, by how they stopped. */
  stops: Record<JourneyStop, number>;
}

/** Proposals left after the Review step accepted the only one; drives the sidebar badge there. */
export const dashboardReviewCount = 0;

/**
 * The Dashboard as the app computes it: tiles count the statuses above; the journey counts how far
 * each sent application got and how it stopped there (Saltglass Studio was rejected after
 * screening; the applied job went from Applied to Interview, so it reached Screening as well).
 */
export const dashboard: {
  tiles: { label: string; value: number }[];
  journey: { sent: number; saved: number; stages: JourneyStage[] };
  attention: { company: string; role: string; note: string }[];
} = {
  tiles: [
    { label: 'In progress', value: statusCount('applied') + statusCount('screening') + statusCount('interview') },
    { label: 'Interviews', value: statusCount('interview') },
    { label: 'Offers', value: statusCount('offer') },
    { label: 'Rejected', value: statusCount('rejected') },
    { label: 'To review', value: dashboardReviewCount },
  ],
  journey: (() => {
    const stages = journeyStages();
    return { sent: stages[0].count, saved: statusCount('saved'), stages };
  })(),
  // Applied, screening or interview applications with no change in 14 days, as of the proposal's day.
  attention: [
    { company: 'Bramble Pay', role: 'Senior React Engineer', note: 'Applied 52 days ago, no reply' },
    { company: 'Tallpine Games', role: 'Senior Frontend Engineer', note: 'Applied 37 days ago, no reply' },
    { company: 'Wrenfield Data', role: 'Senior Frontend Engineer', note: 'Screening, no change in 21 days' },
  ],
};

export const VERIFICATION_LABEL: Record<Verification, string> = {
  verified: 'Verified',
  redirected: 'Redirected',
  'could-not-verify': 'Could not verify',
};
