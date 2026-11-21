import { describe, expect, it } from 'vitest';
import {
  applications,
  dashboard,
  dashboardReviewCount,
  JOURNEY_STOPS,
  jobs,
  newApplication,
  proposal,
  runLog,
  STATUS_LABEL,
  VERIFICATION_LABEL,
} from '../../src/components/journey/mockData';
import type { JourneyStop } from '../../src/components/journey/mockData';
import type { AppStatus } from '../../src/components/journey/types';

const ALLOWED_COMPANIES = [
  'Acme Robotics',
  'Umbrella Health',
  'Northwind Studio',
  'Brightwell Cloud',
  'Larkspur Systems',
  'Quillmark Software',
  'Juniper Ferry',
  'Mossgate Labs',
  'Copperline Health',
  'Driftwood Atlas',
  'Harbor & Finch',
  'Tallpine Games',
  'Orrery Maps',
  'Bramble Pay',
  'Saltglass Studio',
  'Wrenfield Data',
];

describe('mockData', () => {
  it('uses only example.com addresses (subdomains allowed, e.g. ats.example.com) in the proposal', () => {
    const emails = Object.values(proposal).flatMap((v) => String(v).match(/[^\s<>"]+@[^\s<>"]+/g) ?? []);
    expect(emails.length).toBeGreaterThan(0);
    for (const e of emails) expect(e).toMatch(/@([a-z0-9-]+\.)*example\.com$/);
  });

  it('covers every verification and fit value', () => {
    expect(new Set(jobs.map((j) => j.verification))).toEqual(new Set(['verified', 'redirected', 'could-not-verify']));
    const fits = jobs.flatMap((j) => Object.values(j.fit));
    for (const f of ['match', 'mismatch', 'unknown']) expect(fits).toContain(f);
  });

  it('has 6 jobs, all from invented companies', () => {
    expect(jobs).toHaveLength(6);
  });

  it('shows only allow-listed companies, and the allow-list is exactly the names used', () => {
    const used = new Set([
      ...jobs.map((j) => j.company),
      ...applications.map((a) => a.company),
      ...dashboard.attention.map((a) => a.company),
      proposal.company,
      newApplication.company,
    ]);
    for (const c of used) expect(ALLOWED_COMPANIES).toContain(c);
    for (const c of ALLOWED_COMPANIES) expect(used).toContain(c);
  });

  it('proposal refers to a job in the list (Applied -> Interview)', () => {
    expect(jobs.some((j) => j.company === proposal.company && j.title === proposal.role)).toBe(true);
    expect(proposal.fromStatus).toBe('applied');
    expect(proposal.toStatus).toBe('interview');
  });

  it('has labels and run log', () => {
    expect(runLog.length).toBeGreaterThan(0);
    expect(dashboard.tiles.length).toBeGreaterThan(0);
    expect(STATUS_LABEL.interview).toBe('Interview');
    expect(VERIFICATION_LABEL['could-not-verify']).toBe('Could not verify');
  });

  it('applies the first job found (Saved -> Applied) and the proposal names it', () => {
    expect(newApplication.company).toBe(jobs[0].company);
    expect(newApplication.role).toBe(jobs[0].title);
    expect(proposal.company).toBe(newApplication.company);
    expect(proposal.role).toBe(newApplication.role);
  });
});

describe('dashboard', () => {
  // The Dashboard step comes after the accepted proposal: every tracked application plus the
  // applied job, which is now at the proposal's status.
  const statuses: AppStatus[] = [...applications.map((a) => a.status), proposal.toStatus];
  const count = (s: AppStatus) => statuses.filter((x) => x === s).length;
  const tile = (label: string) => dashboard.tiles.find((t) => t.label === label)?.value;
  const { journey } = dashboard;
  const stage = Object.fromEntries(journey.stages.map((s) => [s.stage, s]));
  const stopTotal = (stop: JourneyStop) => journey.stages.reduce((n, s) => n + s.stops[stop], 0);

  it('tiles are the app tiles and count the statuses', () => {
    expect(dashboard.tiles.map((t) => t.label)).toEqual(['In progress', 'Interviews', 'Offers', 'Rejected', 'To review']);
    expect(tile('In progress')).toBe(count('applied') + count('screening') + count('interview'));
    expect(tile('Interviews')).toBe(count('interview'));
    expect(tile('Offers')).toBe(count('offer'));
    expect(tile('Rejected')).toBe(count('rejected'));
    // The only proposal was accepted on the Review step.
    expect(tile('To review')).toBe(dashboardReviewCount);
    expect(dashboardReviewCount).toBe(0);
  });

  it('journey runs Applied -> Offer with the expected counts and shares', () => {
    expect(journey.stages.map((s) => s.stage)).toEqual(['applied', 'screening', 'interview', 'offer']);
    expect(journey.stages.map((s) => [s.count, s.share])).toEqual([
      [11, null],
      [6, 55],
      [3, 50],
      [1, 33],
    ]);
    expect(stage.applied.stops).toEqual({ waiting: 3, rejected: 1, noResponse: 1, withdrawn: 0 });
    expect(stage.screening.stops).toEqual({ waiting: 2, rejected: 1, noResponse: 0, withdrawn: 0 });
    expect(stage.interview.stops).toEqual({ waiting: 2, rejected: 0, noResponse: 0, withdrawn: 0 });
    expect(stage.offer.stops).toEqual({ waiting: 1, rejected: 0, noResponse: 0, withdrawn: 0 });
    expect(journey.saved).toBe(1);
  });

  it('journey conserves applications at every stage: in = continuing + stops', () => {
    journey.stages.forEach((s, i) => {
      const continuing = journey.stages[i + 1]?.count ?? 0;
      const stopped = JOURNEY_STOPS.reduce((n, stop) => n + s.stops[stop], 0);
      expect(s.count).toBe(continuing + stopped);
    });
    // Everything except Saved was sent (nothing is withdrawn), and every sent application stops once.
    expect(journey.sent).toBe(stage.applied.count);
    expect(journey.sent + journey.saved).toBe(statuses.length);
    expect(JOURNEY_STOPS.reduce((n, stop) => n + stopTotal(stop), 0)).toBe(journey.sent);
  });

  it('journey agrees with the tiles', () => {
    // Waiting before Offer is what is in progress; waiting at Offer holds the offers.
    expect(stopTotal('waiting') - stage.offer.stops.waiting).toBe(tile('In progress'));
    expect(stage.interview.stops.waiting).toBe(tile('Interviews'));
    expect(stage.offer.count).toBe(tile('Offers'));
    expect(stopTotal('rejected')).toBe(tile('Rejected'));
    expect(stopTotal('noResponse')).toBe(count('no-response'));
    expect(stopTotal('withdrawn')).toBe(count('withdrawn'));
  });

  it('applications are distinct and do not yet include the applied job', () => {
    expect(new Set(applications.map((a) => a.company)).size).toBe(applications.length);
    expect(applications.some((a) => a.company === newApplication.company)).toBe(false);
  });
});

