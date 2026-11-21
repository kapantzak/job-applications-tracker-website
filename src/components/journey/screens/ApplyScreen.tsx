import { CheckIcon, ChevronDownIcon, ListFilterIcon, MailIcon, PlusIcon, SearchIcon } from 'lucide-react';
import { easeInOut, motion, useTransform, type MotionValue } from 'motion/react';
import type { ReactNode } from 'react';
import { applications, newApplication, STATUS_LABEL } from '../mockData';
import { segment } from '../timeline';
import type { AppStatus, ScreenProps } from '../types';
import { easeSoft, MockButton, MockPageHeader, MockPointer, STATUS_FILL, usePhase, useVisibility } from '../ui';

// Phases within the step: 0–0.25 the pointer opens the status menu, 0.25–0.42 it picks Applied,
// 0.42–0.54 the menu closes, the value and date roll over and the pointer leaves, 0.56–0.87 the
// lifted row drops into the list as the others make room, 0.8–0.98 a soft highlight fades on it.
const PHASE = {
  pointerIn: [0.02, 0.17],
  openPress: [0.15, 0.22],
  menu: [0.2, 0.245],
  toApplied: [0.28, 0.37],
  pickPress: [0.37, 0.42],
  menuClose: [0.42, 0.445],
  swap: [0.425, 0.49],
  date: [0.45, 0.53],
  pointerOut: [0.47, 0.54],
  drop: [0.57, 0.84],
  flash: [0.8, 0.98],
} as const;
const SHIFT_START = 0.56;
const SHIFT_DURATION = 0.25;
const SHIFT_STAGGER = 0.01;

const ROW_HEIGHT = 56;
// How far above its slot the picked row is held, over the table header.
const LIFT_Y = -50;
const MENU_ITEM_HEIGHT = 32;
const MENU_STATUSES = Object.keys(STATUS_LABEL) as AppStatus[];
// Enough rows to run past the bottom of the window, as a longer list would.
const VISIBLE_ROWS = applications.slice(0, 7);

const COLUMNS = 'grid grid-cols-[176px_minmax(0,1fr)_150px_80px] items-center gap-4 px-5';

/** Step 3: the saved job's status goes Saved → Applied and it drops into the Applications list. */
export function ApplyScreen({ progress }: ScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <MockPageHeader
        title="Applications"
        description="Every application you are tracking."
        actions={
          <>
            <MockButton variant="outline">
              <MailIcon />
              Sync from Gmail
            </MockButton>
            <MockButton variant="primary">
              <PlusIcon />
              Add application
            </MockButton>
          </>
        }
      />
      <div className="mb-4 flex items-center gap-2">
        <div className="flex h-9 w-[220px] items-center gap-2 rounded-md border border-input bg-background px-3 text-[14px] text-muted-foreground dark:bg-input/30">
          <SearchIcon className="size-4" />
          Search…
        </div>
        {['Company', 'Role', 'Status', 'Applied from'].map((label) => (
          <span
            key={label}
            className="flex h-9 items-center gap-1.5 rounded-md border border-dashed border-border px-3 text-[14px] font-medium"
          >
            <ListFilterIcon className="size-4 text-muted-foreground" />
            {label}
          </span>
        ))}
      </div>

      <div className="rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className={`${COLUMNS} h-11 text-[14px] font-medium text-muted-foreground`}>
          <span>Company</span>
          <span>Role</span>
          <span>Status</span>
          <span>Applied</span>
        </div>
        <div className="relative" style={{ height: ROW_HEIGHT * (VISIBLE_ROWS.length + 1) }}>
          {VISIBLE_ROWS.map((application, i) => (
            <ListRow key={application.company} application={application} index={i} progress={progress} />
          ))}
          <PickedRow progress={progress} />
        </div>
      </div>
    </div>
  );
}

/** A tracked application; it moves down one slot while the picked row drops in above it. */
function ListRow({
  application,
  index,
  progress,
}: {
  application: (typeof applications)[number];
  index: number;
  progress: MotionValue<number>;
}) {
  const start = SHIFT_START + index * SHIFT_STAGGER;
  const shift = usePhase(progress, start, start + SHIFT_DURATION);
  const y = useTransform(shift, (v) => easeSoft(v) * ROW_HEIGHT);
  return (
    <motion.div
      className={`${COLUMNS} absolute inset-x-0 border-t border-border`}
      style={{ top: index * ROW_HEIGHT, height: ROW_HEIGHT, y }}
    >
      <span className="truncate text-[15px] font-semibold">{application.company}</span>
      <span className="truncate text-[15px]">{application.role}</span>
      <SelectFace>
        <StatusValue status={application.status} />
      </SelectFace>
      <span className="text-[14px] text-muted-foreground">{application.applied ?? '–'}</span>
    </motion.div>
  );
}

function SelectFace({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-[140px] items-center justify-between rounded-md border border-input bg-background px-3 text-[14px] dark:bg-input/30">
      {children}
      <ChevronDownIcon className="size-4 text-muted-foreground" />
    </span>
  );
}

function StatusValue({ status }: { status: AppStatus }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`size-2 shrink-0 rounded-full ${STATUS_FILL[status]}`} />
      <span>{STATUS_LABEL[status]}</span>
    </span>
  );
}

/** The saved job, held above the list while its status changes, then dropped into the top slot. */
function PickedRow({ progress }: { progress: MotionValue<number> }) {
  const drop = usePhase(progress, ...PHASE.drop);
  const settle = useTransform(drop, (v) => easeInOut(v));
  const lift = useTransform(settle, (v) => 1 - v);
  const y = useTransform(settle, (v) => (1 - v) * LIFT_Y);
  const scale = useTransform(settle, (v) => 1 + (1 - v) * 0.02);
  const radius = useTransform(lift, (v) => v * 12);
  const liftVisibility = useVisibility(lift);

  const flash = usePhase(progress, ...PHASE.flash);
  const flashOpacity = useTransform(flash, (v) => (v <= 0 || v >= 1 ? 0 : Math.min(1, v * 6) * (1 - v)));
  const flashVisibility = useVisibility(flashOpacity);

  const swap = usePhase(progress, ...PHASE.swap);
  const saved = useTransform(swap, (v) => 1 - v);
  const savedY = useTransform(swap, (v) => easeSoft(v) * -20);
  const appliedY = useTransform(swap, (v) => (1 - easeSoft(v)) * 20);
  const savedVisibility = useVisibility(saved);
  const appliedVisibility = useVisibility(swap);

  const date = usePhase(progress, ...PHASE.date);
  const noDate = useTransform(date, (v) => 1 - v);
  const noDateVisibility = useVisibility(noDate);
  const dateVisibility = useVisibility(date);
  const noDateY = useTransform(date, (v) => easeSoft(v) * -20);
  const dateY = useTransform(date, (v) => (1 - easeSoft(v)) * 20);

  const openPress = usePhase(progress, ...PHASE.openPress);
  const selectScale = useTransform(openPress, [0, 0.4, 1], [1, 0.95, 1]);
  const menu = usePhase(progress, ...PHASE.menu);
  const menuClose = usePhase(progress, ...PHASE.menuClose);
  const focus = useTransform([menu, menuClose], ([a, b]: number[]) => Math.min(a, 1 - b));
  const focusVisibility = useVisibility(focus);

  return (
    <motion.div className="absolute inset-x-0 top-0 z-10" style={{ height: ROW_HEIGHT, y, scale }}>
      <motion.div
        className="pointer-events-none absolute -inset-px rounded-xl border border-border shadow-[0_18px_40px_-12px_rgb(0_0_0/0.28),0_4px_10px_-4px_rgb(0_0_0/0.12)] dark:shadow-[0_18px_40px_-10px_rgb(0_0_0/0.7)]"
        style={{ opacity: lift, visibility: liftVisibility }}
      />
      <motion.div
        data-row
        className={`${COLUMNS} relative h-full overflow-hidden border-t border-border bg-card`}
        style={{ borderRadius: radius }}
      >
        <motion.span
          className="pointer-events-none absolute inset-0 bg-status-applied/12"
          style={{ opacity: flashOpacity, visibility: flashVisibility }}
        />
        <span className="relative truncate text-[15px] font-semibold">{newApplication.company}</span>
        <span className="relative truncate text-[15px]">{newApplication.role}</span>
        <motion.span className="relative flex w-[140px]" style={{ scale: selectScale }}>
          <SelectFace>
            {/* The new value rolls up into the select as the old one rolls out. */}
            <span className="grid h-5 overflow-hidden">
              <motion.span
                className="col-start-1 row-start-1"
                style={{ opacity: saved, visibility: savedVisibility, y: savedY }}
              >
                <StatusValue status="saved" />
              </motion.span>
              <motion.span
                className="col-start-1 row-start-1"
                style={{ opacity: swap, visibility: appliedVisibility, y: appliedY }}
              >
                <StatusValue status="applied" />
              </motion.span>
            </span>
          </SelectFace>
          <motion.span
            className="pointer-events-none absolute -inset-px rounded-md border border-ring ring-[3px] ring-ring/40"
            style={{ opacity: focus, visibility: focusVisibility }}
          />
        </motion.span>
        <span className="relative grid h-5 overflow-hidden text-[14px]">
          <motion.span
            className="col-start-1 row-start-1 text-muted-foreground"
            style={{ opacity: noDate, visibility: noDateVisibility, y: noDateY }}
          >
            –
          </motion.span>
          <motion.span
            className="col-start-1 row-start-1 font-medium"
            style={{ opacity: date, visibility: dateVisibility, y: dateY }}
          >
            {newApplication.applied}
          </motion.span>
        </span>
      </motion.div>
      {/* Same columns as the row, so the menu and the pointer line up with the status select. */}
      <div className={`${COLUMNS} pointer-events-none absolute inset-x-0 top-0 h-full`}>
        <span className="col-start-3 row-start-1 relative h-9">
          <StatusMenu progress={progress} menu={menu} menuClose={menuClose} />
          <SelectPointer progress={progress} />
        </span>
      </div>
    </motion.div>
  );
}

function StatusMenu({
  progress,
  menu,
  menuClose,
}: {
  progress: MotionValue<number>;
  menu: MotionValue<number>;
  menuClose: MotionValue<number>;
}) {
  const opacity = useTransform([menu, menuClose], ([a, b]: number[]) => Math.min(Math.min(1, a * 3), 1 - b));
  const visibility = useVisibility(opacity);
  const scale = useTransform([menu, menuClose], ([a, b]: number[]) => 0.96 + 0.04 * easeSoft(a) - 0.03 * b);
  const y = useTransform([menu, menuClose], ([a, b]: number[]) => (1 - easeSoft(a)) * -6 - b * 4);
  const toApplied = usePhase(progress, PHASE.toApplied[0] + 0.02, PHASE.toApplied[1] - 0.01);
  const highlightY = useTransform(toApplied, (v) => easeSoft(v) * MENU_ITEM_HEIGHT);
  const pickPress = usePhase(progress, ...PHASE.pickPress);
  const highlightScale = useTransform(pickPress, [0, 0.5, 1], [1, 0.97, 1]);
  return (
    <motion.div
      className="absolute top-[42px] left-0 w-[176px] origin-top rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-xl"
      style={{ opacity, visibility, scale, y }}
    >
      <motion.span
        className="absolute inset-x-1 top-1 rounded-md bg-accent"
        style={{ height: MENU_ITEM_HEIGHT, y: highlightY, scale: highlightScale }}
      />
      {MENU_STATUSES.map((status) => (
        <span
          key={status}
          className="relative flex items-center justify-between px-2 text-[14px]"
          style={{ height: MENU_ITEM_HEIGHT }}
        >
          <StatusValue status={status} />
          {status === 'saved' && <CheckIcon className="size-4 text-muted-foreground" />}
        </span>
      ))}
    </motion.div>
  );
}

// The pointer clicks the select, moves down to Applied in the menu, clicks and leaves.
function SelectPointer({ progress }: { progress: MotionValue<number> }) {
  const x = useTransform(progress, (v) => {
    const glide = easeSoft(segment(v, ...PHASE.pointerIn));
    const toApplied = easeInOut(segment(v, ...PHASE.toApplied));
    const away = easeSoft(segment(v, ...PHASE.pointerOut));
    return 150 - 64 * glide - 14 * toApplied + 26 * away;
  });
  const y = useTransform(progress, (v) => {
    const glide = easeSoft(segment(v, ...PHASE.pointerIn));
    const toApplied = easeInOut(segment(v, ...PHASE.toApplied));
    const away = easeSoft(segment(v, ...PHASE.pointerOut));
    // Ends over Applied: menu offset 42, padding 4, one item down, half an item in.
    return 74 - 56 * glide + (42 + 4 + MENU_ITEM_HEIGHT * 1.5 - 18) * toApplied + 18 * away;
  });
  const [open0, open1] = PHASE.openPress;
  const [pick0, pick1] = PHASE.pickPress;
  const scale = useTransform(progress, [open0, open0 + 0.03, open1, pick0, pick0 + 0.025, pick1], [1, 0.85, 1, 1, 0.85, 1]);
  const opacity = useTransform(progress, (v) =>
    Math.min(segment(v, PHASE.pointerIn[0], PHASE.pointerIn[0] + 0.05), 1 - segment(v, ...PHASE.pointerOut)),
  );
  const visibility = useVisibility(opacity);
  return (
    <motion.span
      className="absolute top-0 left-0 z-20 drop-shadow-md"
      style={{ x, y, scale, opacity, visibility }}
    >
      <MockPointer />
    </motion.span>
  );
}
