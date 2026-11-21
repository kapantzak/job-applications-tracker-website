import { act, render, screen, waitFor, within } from '@testing-library/react';
import { motionValue } from 'motion/react';
import { describe, expect, test } from 'vitest';
import { AppWindow } from '../../src/components/journey/AppWindow';
import { applyTimeCue, dashboard, jobs, proposal } from '../../src/components/journey/mockData';
import { ApplyScreen } from '../../src/components/journey/screens/ApplyScreen';
import { DashboardScreen } from '../../src/components/journey/screens/DashboardScreen';
import { SCREENS } from '../../src/components/journey/screens';
import { ReviewScreen } from '../../src/components/journey/screens/ReviewScreen';

// "Not shown" in the journey means mounted with opacity 0 and visibility hidden, so these
// tests assert with toBeVisible / not.toBeVisible rather than presence in the DOM.

const chosen = jobs[0];

function chosenRow(): HTMLElement {
  const row = screen.getByText(chosen.company).closest<HTMLElement>('[data-row]');
  if (!row) throw new Error('the chosen job has no row');
  return row;
}

function tile(label: string): HTMLElement {
  const el = document.querySelector<HTMLElement>(`[data-tile="${label}"]`);
  if (!el) throw new Error(`no tile ${label}`);
  return el;
}

describe('ApplyScreen', () => {
  test('at 1 the chosen job row shows Applied', () => {
    render(<ApplyScreen progress={motionValue(1)} />);
    const row = chosenRow();
    expect(row).toHaveTextContent(chosen.title);
    expect(within(row).getByText('Applied')).toBeVisible();
    expect(within(row).getByText('Saved')).not.toBeVisible();
  });

  test('at 0 the same row shows Saved', () => {
    render(<ApplyScreen progress={motionValue(0)} />);
    const row = chosenRow();
    expect(within(row).getByText('Saved')).toBeVisible();
    expect(within(row).getByText('Applied')).not.toBeVisible();
  });

  test('the time cue appears at the start and stays to the final state', () => {
    const { unmount } = render(<ApplyScreen progress={motionValue(0)} />);
    expect(screen.getByText(applyTimeCue)).not.toBeVisible();
    unmount();
    render(<ApplyScreen progress={motionValue(1)} />);
    expect(screen.getByText(applyTimeCue)).toBeVisible();
  });

  test('follows progress both ways', async () => {
    const progress = motionValue(0);
    render(<ApplyScreen progress={progress} />);
    const applied = within(chosenRow()).getByText('Applied');
    act(() => progress.set(1));
    await waitFor(() => expect(applied).toBeVisible());
    act(() => progress.set(0));
    await waitFor(() => expect(applied).not.toBeVisible());
  });
});

describe('ReviewScreen', () => {
  test('at 1 shows Interview as the resulting status and the sender', () => {
    render(<ReviewScreen progress={motionValue(1)} />);
    expect(screen.getByText('Interview')).toBeVisible();
    expect(screen.getByText('Applied')).not.toBeVisible();
    expect(screen.getByText(proposal.from)).toBeVisible();
    expect(screen.getByText(proposal.subject)).toBeVisible();
  });

  test('at 0 shows Sync from Gmail and no proposal card', () => {
    render(<ReviewScreen progress={motionValue(0)} />);
    expect(screen.getByText('Sync from Gmail')).toBeVisible();
    expect(screen.getByText(`${proposal.company} - ${proposal.role}`)).not.toBeVisible();
    expect(screen.getByText(proposal.from)).not.toBeVisible();
  });
});

describe('DashboardScreen', () => {
  const STAGE_TEXT = [
    ['Applied', '11'],
    ['Screening', '6 · 55%'],
    ['Interview', '3 · 50%'],
    ['Offer', '1 · 33%'],
  ];
  const BRANCHES = ['3 waiting', '1 rejected', '1 no response', '2 waiting', '1 offer'];

  test('at 1 every tile shows its final number', () => {
    render(<DashboardScreen progress={motionValue(1)} />);
    for (const { label, value } of dashboard.tiles) {
      expect(within(tile(label)).getByText(String(value))).toBeVisible();
    }
  });

  test('at 1 the journey graph shows every stage, share and branch', () => {
    render(<DashboardScreen progress={motionValue(1)} />);
    expect(screen.getByText("Your applications' journey")).toBeVisible();
    expect(screen.getByText('11 sent · 1 saved, not applied yet')).toBeVisible();
    for (const [name, count] of STAGE_TEXT) {
      expect(screen.getByText(name)).toBeVisible();
      expect(screen.getByText(count)).toBeVisible();
    }
    for (const label of BRANCHES) {
      for (const el of screen.getAllByText(label)) expect(el).toBeVisible();
    }
    // Two stages leave applications waiting; zero-count branches are not drawn.
    expect(screen.getAllByText('2 waiting')).toHaveLength(2);
    expect(screen.queryByText(/withdrawn/)).toBeNull();
    expect(screen.getByText('Needs attention')).toBeVisible();
  });

  test('at 0 every tile shows 0 and the graph is not shown', () => {
    render(<DashboardScreen progress={motionValue(0)} />);
    for (const { label } of dashboard.tiles) {
      expect(within(tile(label)).getByText('0')).toBeVisible();
    }
    expect(document.querySelector('[data-journey] > div')).not.toBeVisible();
    for (const [name, count] of STAGE_TEXT) {
      expect(screen.getByText(name)).not.toBeVisible();
      expect(screen.getByText(count)).not.toBeVisible();
    }
    for (const label of BRANCHES) {
      for (const el of screen.getAllByText(label)) expect(el).not.toBeVisible();
    }
  });

  test('the flow reaches each stage before the next, and "1 offer" comes last', async () => {
    const progress = motionValue(0.4);
    render(<DashboardScreen progress={progress} />);
    expect(screen.getByText('3 waiting')).toBeVisible();
    expect(screen.getByText('Offer')).not.toBeVisible();
    act(() => progress.set(0.7));
    await waitFor(() => expect(screen.getByText('Interview')).toBeVisible());
    expect(screen.getByText('1 offer')).not.toBeVisible();
  });

  test('counts and graph follow progress both ways', async () => {
    const progress = motionValue(0);
    render(<DashboardScreen progress={progress} />);
    const { label, value } = dashboard.tiles.find((t) => t.value > 0)!;
    const offer = screen.getByText('1 offer');
    act(() => progress.set(1));
    await waitFor(() => expect(tile(label)).toHaveTextContent(String(value)));
    await waitFor(() => expect(offer).toBeVisible());
    act(() => progress.set(0));
    await waitFor(() => expect(within(tile(label)).getByText('0')).toBeVisible());
    await waitFor(() => expect(offer).not.toBeVisible());
    expect(screen.getByText('Applied')).not.toBeVisible();
  });
});

describe('SCREENS', () => {
  test('has exactly the five journey steps', () => {
    expect(Object.keys(SCREENS).sort()).toEqual(['apply', 'cv', 'dashboard', 'jobs', 'review']);
  });
});

describe('AppWindow review badge', () => {
  const badge = (container: HTMLElement) => container.querySelector('[data-review-count]');

  test('shows one pending proposal by default', () => {
    const { container } = render(<AppWindow active="review">{null}</AppWindow>);
    expect(badge(container)).toHaveTextContent('1');
  });

  test('follows reviewCount and hides at 0', () => {
    const { container, rerender } = render(
      <AppWindow active="dashboard" reviewCount={3}>
        {null}
      </AppWindow>,
    );
    expect(badge(container)).toHaveTextContent('3');
    rerender(
      <AppWindow active="dashboard" reviewCount={0}>
        {null}
      </AppWindow>,
    );
    expect(badge(container)).toBeNull();
  });
});
