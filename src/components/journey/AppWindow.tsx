import {
  BriefcaseIcon,
  CircleHelpIcon,
  FileTextIcon,
  HistoryIcon,
  InboxIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  UserIcon,
  type LucideIcon,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { fitScale } from './timeline';
import type { StepId } from './types';

const DESIGN_WIDTH = 1040;
const DESIGN_HEIGHT = 660;
const NAV_ITEM_HEIGHT = 40;
const NAV_GAP = 2;
// The single proposal the Review step accepts.
const REVIEW_PENDING = 1;

const NAV: { label: string; icon: LucideIcon; counts?: 'review' }[] = [
  { label: 'Dashboard', icon: LayoutDashboardIcon },
  { label: 'Jobs', icon: BriefcaseIcon },
  { label: 'Applications', icon: FileTextIcon },
  { label: 'Review', icon: InboxIcon, counts: 'review' },
  { label: 'Runs', icon: HistoryIcon },
  { label: 'Profile', icon: UserIcon },
];

const ACTIVE_ITEM: Record<StepId, string> = {
  cv: 'Profile',
  jobs: 'Jobs',
  apply: 'Applications',
  review: 'Review',
  dashboard: 'Dashboard',
};

// useLayoutEffect measures before the first paint in the browser; the server render skips it.
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/**
 * The app's window (title bar, sidebar, main area) at a fixed design size, scaled to fit its container.
 * Plain divs only: the mock is decorative and must not add landmarks or focus stops to the page.
 */
export function AppWindow({
  active,
  reviewCount = REVIEW_PENDING,
  children,
}: {
  active: StepId;
  /** Proposals waiting on the Review page, shown as the sidebar badge; hidden at 0. */
  reviewCount?: number;
  children: ReactNode;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number | null>(null);

  useIsomorphicLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    setScale(fitScale(box.clientWidth, DESIGN_WIDTH));
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setScale(fitScale(entry.contentRect.width, DESIGN_WIDTH));
    });
    observer.observe(box);
    return () => observer.disconnect();
  }, []);

  const activeIndex = NAV.findIndex((item) => item.label === ACTIVE_ITEM[active]);

  return (
    <div
      ref={boxRef}
      aria-hidden="true"
      data-active-screen={active}
      className="relative mx-auto w-full max-w-[1040px] select-none [container-type:inline-size]"
      style={{ aspectRatio: `${DESIGN_WIDTH} / ${DESIGN_HEIGHT}` }}
    >
      <div
        // Before the first measurement (server render, no JS) CSS computes the same fit from the
        // container width; once measured, the inline transform takes over.
        className="absolute top-0 left-0 flex origin-top-left flex-col overflow-hidden rounded-xl border border-border bg-background font-sans text-foreground shadow-[0_24px_64px_-16px_rgb(0_0_0/0.28),0_2px_6px_rgb(0_0_0/0.06)] [scale:min(1,tan(atan2(100cqw,1040px)))] dark:shadow-[0_24px_64px_-12px_rgb(0_0_0/0.7),0_0_0_1px_rgb(255_255_255/0.04)]"
        style={{
          width: DESIGN_WIDTH,
          height: DESIGN_HEIGHT,
          ...(scale === null ? {} : { transform: `scale(${scale})`, scale: 'none' }),
        }}
      >
        <TitleBar />
        <div className="flex min-h-0 flex-1">
          <div className="flex w-[212px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar px-3 py-4 text-sidebar-foreground">
            <div className="mb-5 flex items-center gap-2.5 px-2">
              <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <LogoMark className="size-[22px]" />
              </span>
              <span className="text-[16px] font-semibold">Job Tracker</span>
            </div>
            <div className="relative flex flex-col" style={{ gap: NAV_GAP }}>
              <span
                className="absolute inset-x-0 top-0 rounded-md bg-sidebar-accent transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none"
                style={{
                  height: NAV_ITEM_HEIGHT,
                  transform: `translateY(${activeIndex * (NAV_ITEM_HEIGHT + NAV_GAP)}px)`,
                }}
              />
              {NAV.map(({ counts, ...item }, i) => (
                <NavItem
                  key={item.label}
                  {...item}
                  badge={counts === 'review' && reviewCount > 0 ? reviewCount : undefined}
                  current={i === activeIndex}
                />
              ))}
            </div>
            <div className="mt-5">
              <NavItem label="Settings" icon={SettingsIcon} current={false} />
            </div>
            <div className="mt-auto">
              <NavItem label="Help & about" icon={CircleHelpIcon} current={false} />
            </div>
          </div>
          <div className="relative min-w-0 flex-1 overflow-hidden bg-background px-8 pt-7 pb-6">{children}</div>
        </div>
      </div>
    </div>
  );
}

function NavItem({
  label,
  icon: Icon,
  badge,
  current,
}: {
  label: string;
  icon: LucideIcon;
  badge?: number;
  current: boolean;
}) {
  return (
    <div
      aria-current={current ? 'page' : undefined}
      className={`relative flex items-center gap-2.5 rounded-md px-2.5 text-[15px] transition-colors duration-300 ${
        current ? 'font-semibold text-sidebar-accent-foreground' : 'text-sidebar-foreground/80'
      }`}
      style={{ height: NAV_ITEM_HEIGHT }}
    >
      <Icon className="size-[18px] shrink-0" strokeWidth={current ? 2.25 : 2} />
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span
          data-review-count
          className="flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[12px] font-semibold text-white"
        >
          {badge}
        </span>
      )}
    </div>
  );
}

function TitleBar() {
  return (
    <div className="relative flex h-10 shrink-0 items-center border-b border-border bg-sidebar px-4">
      <div className="flex gap-2">
        <span className="size-3 rounded-full bg-[#ff5f57]" />
        <span className="size-3 rounded-full bg-[#febc2e]" />
        <span className="size-3 rounded-full bg-[#28c840]" />
      </div>
      <div className="absolute left-1/2 flex h-6 w-[300px] -translate-x-1/2 items-center justify-center rounded-md bg-muted text-[13px] text-foreground/75">
        127.0.0.1:4173
      </div>
    </div>
  );
}

// The app's "Lens" mark (src/ui/components/LogoMark.tsx in the app repo, same owner, MIT).
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="14" cy="14" r="8.6" strokeWidth="2.6" />
      <path d="M20.6 20.6 26.6 26.6" strokeWidth="3.2" />
      <path d="M10.2 14.3 13 17.1 18.1 11.6" strokeWidth="2.7" />
    </svg>
  );
}
