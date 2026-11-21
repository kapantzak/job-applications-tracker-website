import { track } from '@vercel/analytics';

export type CopyLocation = 'hero' | 'claude-code' | 'install';

// Analytics must never break the copy flow.
export function trackCopyInstall(location: CopyLocation): void {
  try {
    track('copy_install', { location });
  } catch {
    // ignore
  }
}
