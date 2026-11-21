import { describe, expect, it } from 'vitest';
import { dashboard, jobs, proposal, runLog, STATUS_LABEL, VERIFICATION_LABEL } from '../../src/components/journey/mockData';

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
    const emails = Object.values(proposal).flatMap((v) => v.match(/[^\s<>"]+@[^\s<>"]+/g) ?? []);
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
});
