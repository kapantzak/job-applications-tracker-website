import { act, render, screen, waitFor } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, test } from 'vitest';
import { AppWindow } from '../../src/components/journey/AppWindow';
import { cvFileName, jobs, profile, VERIFICATION_LABEL } from '../../src/components/journey/mockData';
import { CvScreen } from '../../src/components/journey/screens/CvScreen';
import { JobsScreen } from '../../src/components/journey/screens/JobsScreen';
import type { StepId } from '../../src/components/journey/types';

// "Not shown" in the journey means mounted with opacity 0 and visibility hidden, so these
// tests assert with toBeVisible / not.toBeVisible rather than presence in the DOM.

describe('CvScreen', () => {
  test('at 1 shows the filled-in profile', () => {
    render(<CvScreen progress={motionValue(1)} />);
    for (const text of [profile.name, ...profile.targetRoles, 'Berlin', 'Senior', 'Staff']) {
      expect(screen.getByText(text)).toBeVisible();
    }
  });

  test('at 0 shows the CV file and an empty form', () => {
    render(<CvScreen progress={motionValue(0)} />);
    expect(screen.getByText(cvFileName)).toBeVisible();
    expect(screen.getByText('Staff Frontend Engineer')).not.toBeVisible();
  });
});

describe('JobsScreen', () => {
  test('at 1 shows every job with its link check and fit marks', () => {
    render(<JobsScreen progress={motionValue(1)} />);
    for (const job of jobs) expect(screen.getByText(job.title)).toBeVisible();
    for (const label of Object.values(VERIFICATION_LABEL)) {
      const badges = screen.getAllByText(label);
      expect(badges).toHaveLength(jobs.filter((j) => VERIFICATION_LABEL[j.verification] === label).length);
      for (const badge of badges) expect(badge).toBeVisible();
    }
    const fits = jobs.flatMap((j) => Object.values(j.fit));
    const glyphs = { match: '✓', mismatch: '✗', unknown: '?' } as const;
    for (const [fit, glyph] of Object.entries(glyphs)) {
      const marks = screen.getAllByText(glyph);
      expect(marks).toHaveLength(fits.filter((f) => f === fit).length);
      for (const mark of marks) expect(mark).toBeVisible();
    }
  });

  test('at 0 shows the Find jobs button and no jobs', () => {
    render(<JobsScreen progress={motionValue(0)} />);
    expect(screen.getByText('Find jobs')).toBeVisible();
    for (const job of jobs) expect(screen.getByText(job.title)).not.toBeVisible();
  });

  test('follows progress both ways', async () => {
    const progress = motionValue(0);
    render(<JobsScreen progress={progress} />);
    const title = screen.getByText(jobs[0].title);
    act(() => progress.set(1));
    await waitFor(() => expect(title).toBeVisible());
    act(() => progress.set(0));
    await waitFor(() => expect(title).not.toBeVisible());
  });
});

describe('AppWindow', () => {
  test('is decorative and marks the active screen', () => {
    const { container } = render(
      <AppWindow active="jobs">
        <p>screen body</p>
      </AppWindow>,
    );
    const root = container.firstElementChild;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root).toHaveAttribute('data-active-screen', 'jobs');
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent('Jobs');
    expect(screen.getByText('screen body')).toBeInTheDocument();
  });

  test('lists the app sidebar items', () => {
    render(<AppWindow active="cv">{null}</AppWindow>);
    for (const label of ['Dashboard', 'Jobs', 'Applications', 'Review', 'Runs', 'Profile', 'Settings']) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  test.each<[StepId, string]>([
    ['cv', 'Profile'],
    ['jobs', 'Jobs'],
    ['apply', 'Applications'],
    ['review', 'Review'],
    ['dashboard', 'Dashboard'],
  ])('step %s highlights %s', (step, label) => {
    const { container } = render(<AppWindow active={step}>{null}</AppWindow>);
    const current = container.querySelectorAll('[aria-current="page"]');
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent(label);
  });

  test('reserves the design aspect ratio', () => {
    const { container } = render(<AppWindow active="cv">{null}</AppWindow>);
    expect((container.firstElementChild as HTMLElement).style.aspectRatio).toBe('1040 / 660');
  });
});
