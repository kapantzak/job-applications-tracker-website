import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@vercel/analytics', () => ({ track: vi.fn() }));

import { track } from '@vercel/analytics';
import CopyCommand from '../../src/components/CopyCommand';

const COMMAND = 'npx job-applications-tracker';
const BUTTON = { name: 'Copy install command' };

function setClipboard(value: unknown) {
  Object.defineProperty(navigator, 'clipboard', { value, configurable: true });
}

describe('CopyCommand', () => {
  beforeEach(() => {
    vi.mocked(track).mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
    window.getSelection()?.removeAllRanges();
  });

  it('copies and confirms', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    render(<CopyCommand command={COMMAND} location="hero" />);

    await user.click(screen.getByRole('button', BUTTON));

    expect(writeText).toHaveBeenCalledWith(COMMAND);
    expect(await screen.findByText('Copied')).toBeInTheDocument();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('copy_install', { location: 'hero' });
  });

  it('confirmation resets', async () => {
    vi.useFakeTimers();
    setClipboard({ writeText: vi.fn().mockResolvedValue(undefined) });
    render(<CopyCommand command={COMMAND} location="hero" />);

    await act(async () => {
      screen.getByRole('button', BUTTON).click();
    });
    expect(screen.getByText('Copied')).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.queryByText('Copied')).not.toBeInTheDocument();
  });

  it('fallback when clipboard missing', async () => {
    const user = userEvent.setup();
    setClipboard(undefined);
    render(<CopyCommand command={COMMAND} location="install" />);

    await user.click(screen.getByRole('button', BUTTON));

    expect(window.getSelection()?.toString()).toBe(COMMAND);
    expect(await screen.findByText('Press Ctrl+C / ⌘C')).toBeInTheDocument();
    expect(track).toHaveBeenCalledTimes(1);
    expect(track).toHaveBeenCalledWith('copy_install', { location: 'install' });
  });

  it('fallback when writeText rejects', async () => {
    const user = userEvent.setup();
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    render(<CopyCommand command={COMMAND} location="claude-code" />);

    await user.click(screen.getByRole('button', BUTTON));

    expect(window.getSelection()?.toString()).toBe(COMMAND);
    expect(await screen.findByText('Press Ctrl+C / ⌘C')).toBeInTheDocument();
    expect(track).toHaveBeenCalledTimes(1);
  });

  it('accessible name', () => {
    setClipboard({ writeText: vi.fn() });
    const { container } = render(<CopyCommand command={COMMAND} location="hero" />);

    expect(screen.getByRole('button', BUTTON)).toBeInTheDocument();
    expect(container.querySelector('code')).toHaveTextContent(COMMAND);
  });
});
