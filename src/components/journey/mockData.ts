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
    company: 'Globex Labs',
    title: 'Frontend Platform Engineer',
    location: 'Berlin',
    verification: 'verified',
    fit: { location: 'match', remote: 'unknown', seniority: 'match' },
  },
  {
    company: 'Initech Cloud',
    title: 'Senior Web Engineer',
    location: 'Lisbon',
    verification: 'could-not-verify',
    fit: { location: 'mismatch', remote: 'mismatch', seniority: 'unknown' },
  },
  {
    company: 'Hooli Systems',
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

export const proposal: {
  company: string;
  role: string;
  from: string;
  date: string;
  subject: string;
  snippet: string;
  fromStatus: AppStatus;
  toStatus: AppStatus;
} = {
  company: 'Northwind Studio',
  role: 'Senior Frontend Engineer',
  from: 'no-reply@ats.example.com',
  date: 'Mar 12',
  subject: 'Next steps: interview with Northwind Studio',
  snippet: 'We enjoyed your application and would like to invite you to an interview next week.',
  fromStatus: 'applied',
  toStatus: 'interview',
};

export const dashboard: {
  tiles: { label: string; value: number }[];
  statusBar: { status: AppStatus | 'withdrawn' | 'no-response'; count: number }[];
  funnel: { stage: string; count: number }[];
} = {
  tiles: [
    { label: 'Applications', value: 12 },
    { label: 'Active', value: 7 },
    { label: 'Interviews', value: 3 },
    { label: 'Offers', value: 1 },
  ],
  statusBar: [
    { status: 'applied', count: 4 },
    { status: 'screening', count: 2 },
    { status: 'interview', count: 3 },
    { status: 'offer', count: 1 },
    { status: 'rejected', count: 1 },
    { status: 'no-response', count: 1 },
  ],
  funnel: [
    { stage: 'Applied', count: 12 },
    { stage: 'Screening', count: 8 },
    { stage: 'Interview', count: 4 },
    { stage: 'Offer', count: 1 },
  ],
};

export const STATUS_LABEL: Record<AppStatus, string> = {
  saved: 'Saved',
  applied: 'Applied',
  screening: 'Screening',
  interview: 'Interview',
  offer: 'Offer',
  rejected: 'Rejected',
};

export const VERIFICATION_LABEL: Record<Verification, string> = {
  verified: 'Verified',
  redirected: 'Redirected',
  'could-not-verify': 'Could not verify',
};
