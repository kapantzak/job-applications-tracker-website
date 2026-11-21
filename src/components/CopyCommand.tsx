import { useEffect, useRef, useState } from 'react';
import { trackCopyInstall, type CopyLocation } from '../lib/analytics';

type Props = { command: string; location: CopyLocation };
type Status = 'idle' | 'copied' | 'manual';

const RESET_MS = 2000;

export default function CopyCommand({ command, location }: Props) {
  const [status, setStatus] = useState<Status>('idle');
  const codeRef = useRef<HTMLElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  // Clipboard can be missing (insecure context, old browser) or denied:
  // select the text so the user can copy it manually.
  function selectCommand() {
    const el = codeRef.current;
    const selection = window.getSelection();
    if (!el || !selection) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  async function copy() {
    let next: Status = 'copied';
    try {
      if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
      await navigator.clipboard.writeText(command);
    } catch {
      selectCommand();
      next = 'manual';
    }
    trackCopyInstall(location);
    setStatus(next);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setStatus('idle'), RESET_MS);
  }

  const hero = location === 'hero';
  return (
    <div className="flex max-w-full flex-col gap-1.5">
      <div
        className={
          hero
            ? 'inline-flex max-w-full items-center gap-3 rounded-xl border border-border bg-card px-5 py-3.5 font-mono text-sm text-card-foreground shadow-sm sm:text-base'
            : 'flex max-w-full items-center gap-3 rounded-lg border border-border bg-background px-4 py-2.5 font-mono text-sm'
        }
      >
        <span className="select-none text-muted-foreground" aria-hidden="true">
          $
        </span>
        <code ref={codeRef} className="min-w-0 break-all">
          {command}
        </code>
        <button
          type="button"
          onClick={copy}
          aria-label="Copy install command"
          className="ml-auto shrink-0 [@media(scripting:none)]:hidden rounded-md border border-border px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted"
        >
          Copy
        </button>
      </div>
      <p role="status" className="min-h-5 text-xs text-muted-foreground">
        {status === 'copied' ? 'Copied' : status === 'manual' ? 'Press Ctrl+C / ⌘C' : ''}
      </p>
    </div>
  );
}
