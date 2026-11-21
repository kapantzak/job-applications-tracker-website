import { track } from '@vercel/analytics';

// 'claude-code' is the agents section; the value predates its rename and stays for analytics continuity.
export type CopyLocation = 'hero' | 'claude-code' | 'install';

// Analytics must never break the copy flow.
export function trackCopyInstall(location: CopyLocation): void {
  try {
    track('copy_install', { location });
  } catch {
    // ignore
  }
}
