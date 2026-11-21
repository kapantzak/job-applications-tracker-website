import { describe, expect, it } from 'vitest';
import {
  applications,
  dashboard,
  dashboardReviewCount,
  jobs,
  newApplication,
  proposal,
  runLog,
  STATUS_LABEL,
  VERIFICATION_LABEL,
} from '../../src/components/journey/mockData';
import type { AppStatus } from '../../src/components/journey/types';

const ALLOWED_COMPANIES = [
  'Acme Robotics',
  'Umbrella Health',
  'Northwind Studio',
  'Brightwell Cloud',
  'Larkspur Systems',
  'Quillmark Software',
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
    for (const j of jobs) expect(ALLOWED_COMPANIES).toContain(j.company);
    expect(ALLOWED_COMPANIES).toContain(proposal.company);
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
  const bar = Object.fromEntries(dashboard.statusBar.map((s) => [s.status, s.count]));
  const tile = (label: string) => dashboard.tiles.find((t) => t.label === label)?.value;
  const funnel = Object.fromEntries(dashboard.funnel.map((f) => [f.stage, f]));

  it('status bar lists every status once and counts the applications', () => {
    expect(dashboard.statusBar.map((s) => s.status).sort()).toEqual(Object.keys(STATUS_LABEL).sort());
    for (const s of Object.keys(STATUS_LABEL) as AppStatus[]) expect(bar[s]).toBe(count(s));
    expect(dashboard.total).toBe(statuses.length);
    expect(dashboard.statusBar.reduce((n, s) => n + s.count, 0)).toBe(dashboard.total);
  });

  it('tiles are the app tiles and agree with the status bar', () => {
    expect(dashboard.tiles.map((t) => t.label)).toEqual(['In progress', 'Interviews', 'Offers', 'Rejected', 'To review']);
    expect(tile('In progress')).toBe(bar.applied + bar.screening + bar.interview);
    expect(tile('Interviews')).toBe(bar.interview);
    expect(tile('Offers')).toBe(bar.offer);
    expect(tile('Rejected')).toBe(bar.rejected);
    // The only proposal was accepted on the Review step.
    expect(tile('To review')).toBe(dashboardReviewCount);
    expect(dashboardReviewCount).toBe(0);
  });

  it('funnel runs Applied -> Offer, never grows and matches the statuses', () => {
    expect(dashboard.funnel.map((f) => f.stage)).toEqual(['applied', 'screening', 'interview', 'offer']);
    for (let i = 1; i < dashboard.funnel.length; i++) {
      expect(dashboard.funnel[i].count).toBeLessThanOrEqual(dashboard.funnel[i - 1].count);
    }
    // Everything except Saved and Withdrawn was sent.
    expect(funnel.applied.count).toBe(dashboard.total - bar.saved - bar.withdrawn);
    // Applications still at a step reached it; rejections are counted at the step they reached.
    expect(funnel.screening.count).toBeGreaterThanOrEqual(bar.screening + bar.interview + bar.offer);
    expect(funnel.interview.count).toBeGreaterThanOrEqual(bar.interview + bar.offer);
    expect(funnel.offer.count).toBe(bar.offer);
    expect(dashboard.funnel.reduce((n, f) => n + f.rejected, 0)).toBe(bar.rejected);
    for (const f of dashboard.funnel) expect(f.rejected).toBeLessThanOrEqual(f.count);
  });

  it('applications are distinct and do not yet include the applied job', () => {
    expect(new Set(applications.map((a) => a.company)).size).toBe(applications.length);
    expect(applications.some((a) => a.company === newApplication.company)).toBe(false);
  });
});

