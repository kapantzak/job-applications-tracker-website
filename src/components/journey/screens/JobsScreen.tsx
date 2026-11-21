import { CheckIcon, ChevronDownIcon, LoaderCircleIcon, SearchIcon } from 'lucide-react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import type { ReactNode } from 'react';
import { jobs, runLog, VERIFICATION_LABEL } from '../mockData';
import { segment } from '../timeline';
import type { Fit, ScreenProps, Verification } from '../types';
import { MockBadge, MockButton, MockPageHeader, Reveal, usePhase, useVisibility, type BadgeTone } from '../ui';

// Phases within the step: 0–0.15 Find jobs is pressed, 0.15–0.45 the run log streams in (lines by
// 0.4, then the panel steps aside), 0.45–0.85 the rows appear, 0.85–1 link badges and fit marks pop
// in row by row.
const LOG_START = 0.15;
const LOG_STEP = 0.05;
const LOG_DONE = LOG_START + LOG_STEP * runLog.length;
const ROWS_START = 0.45;
const ROW_STEP = 0.06;
const ROW_DURATION = 0.1;
const MARKS_START = 0.85;
const MARK_ROW_STEP = 0.018;
const MARK_DURATION = 0.04;

const COLUMNS = 'grid grid-cols-[178px_minmax(0,1fr)_104px_132px] items-center gap-4 px-5';

const VERIFICATION_TONE: Record<Verification, BadgeTone> = {
  verified: 'success',
  redirected: 'muted',
  'could-not-verify': 'warning',
};

const FIT_MARK: Record<Fit, { glyph: string; className: string }> = {
  match: { glyph: '✓', className: 'bg-success text-success-foreground' },
  mismatch: { glyph: '✗', className: 'bg-destructive text-white dark:bg-destructive/70' },
  unknown: { glyph: '?', className: 'border border-border text-muted-foreground' },
};

/** Step 2: Find jobs runs a search, the log streams, the table fills and every link gets checked. */
export function JobsScreen({ progress }: ScreenProps) {
  const shownRows = useTransform(progress, (v) => jobs.filter((_, i) => v >= ROWS_START + i * ROW_STEP).length);
  const countLabel = useTransform(shownRows, (n) => `Showing ${n} of ${n} jobs`);
  const countOpacity = useTransform(shownRows, (n): number => (n > 0 ? 1 : 0));
  const emptyOpacity = useTransform(progress, (v) => 1 - segment(v, 0.12, 0.18));

  return (
    <div className="flex h-full flex-col">
      <MockPageHeader
        title="Jobs"
        description="Openings found by job searches, with their links checked."
        actions={
          <MockButton variant="primary" press={usePhase(progress, 0, 0.15)} className="gap-0 px-0">
            <span className="flex items-center gap-2 px-4">
              <SearchIcon />
              <span>Find jobs</span>
            </span>
            <span className="flex h-full items-center border-l border-primary-foreground/20 px-2.5">
              <ChevronDownIcon />
            </span>
          </MockButton>
        }
      />
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-[260px] items-center gap-2 rounded-md border border-input bg-background px-3 text-[14px] text-muted-foreground dark:bg-input/30">
          <SearchIcon className="size-4" />
          Search…
        </div>
        <motion.span
          className="text-[14px] text-muted-foreground tabular-nums"
          style={{ opacity: countOpacity, visibility: useVisibility(countOpacity) }}
        >
          {countLabel}
        </motion.span>
      </div>

      <div className="relative overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm">
        <div className={`${COLUMNS} h-11 border-b border-border text-[14px] font-medium text-muted-foreground`}>
          <span>Company</span>
          <span>Title</span>
          <span>Fit</span>
          <span>Link</span>
        </div>
        <div className="relative h-[336px]">
          {jobs.map((job, i) => (
            <JobRow key={job.title} job={job} index={i} progress={progress} />
          ))}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center gap-1 text-center"
            style={{ opacity: emptyOpacity, visibility: useVisibility(emptyOpacity) }}
          >
            <div className="text-[16px] font-medium">No jobs yet</div>
            <div className="max-w-[340px] text-[14px] text-muted-foreground">
              Find jobs asks your agent to search for openings that fit this profile.
            </div>
          </motion.div>
          <RunLog progress={progress} />
        </div>
      </div>
    </div>
  );
}

function JobRow({ job, index, progress }: { job: (typeof jobs)[number]; index: number; progress: MotionValue<number> }) {
  const start = ROWS_START + index * ROW_STEP;
  const row = usePhase(progress, start, start + ROW_DURATION);
  const marksStart = MARKS_START + index * MARK_ROW_STEP;
  const badge = usePhase(progress, marksStart + 0.02, marksStart + 0.02 + MARK_DURATION);
  const fits = [job.fit.location, job.fit.remote, job.fit.seniority];
  return (
    <Reveal t={row} y={14} className={`${COLUMNS} h-14 ${index < jobs.length - 1 ? 'border-b border-border' : ''}`}>
      <div className="min-w-0">
        <div className="truncate text-[15px] font-semibold">{job.company}</div>
        <div className="truncate text-[13px] text-muted-foreground">{job.location}</div>
      </div>
      <div className="truncate text-[15px]">{job.title}</div>
      <div className="flex gap-1.5">
        {fits.map((fit, j) => (
          <FitMark key={j} fit={fit} progress={progress} start={marksStart + j * 0.008} />
        ))}
      </div>
      <Pending t={badge} skeleton={<span className="h-5 w-20 rounded-full bg-muted" />}>
        <MockBadge tone={VERIFICATION_TONE[job.verification]}>{VERIFICATION_LABEL[job.verification]}</MockBadge>
      </Pending>
    </Reveal>
  );
}

/** A grey placeholder until `t` starts, then `children` pop in over it. */
function Pending({ t, skeleton, children }: { t: MotionValue<number>; skeleton: ReactNode; children: ReactNode }) {
  const waiting = useTransform(t, (v) => 1 - Math.min(1, v * 2.5));
  return (
    <div className="grid items-center justify-items-start">
      <motion.div
        className="col-start-1 row-start-1 flex"
        style={{ opacity: waiting, visibility: useVisibility(waiting) }}
      >
        {skeleton}
      </motion.div>
      <Reveal t={t} scale={0.5} pop className="col-start-1 row-start-1 flex">
        {children}
      </Reveal>
    </div>
  );
}

function FitMark({ fit, progress, start }: { fit: Fit; progress: MotionValue<number>; start: number }) {
  const { glyph, className } = FIT_MARK[fit];
  return (
    <Pending t={usePhase(progress, start, start + MARK_DURATION)} skeleton={<span className="size-6 rounded-full bg-muted" />}>
      <span className={`flex size-6 items-center justify-center rounded-full text-[13px] font-bold ${className}`}>
        {glyph}
      </span>
    </Pending>
  );
}

function RunLog({ progress }: { progress: MotionValue<number> }) {
  const enter = usePhase(progress, 0.12, 0.19);
  const exit = usePhase(progress, 0.43, 0.48);
  const opacity = useTransform([enter, exit], ([a, b]: number[]) => Math.min(a, 1 - b));
  const y = useTransform([enter, exit], ([a, b]: number[]) => (1 - a) * 16 - b * 12);
  const scale = useTransform([enter, exit], ([a, b]: number[]) => 0.97 + 0.03 * a - 0.03 * b);
  const finished = usePhase(progress, LOG_DONE - 0.01, LOG_DONE + 0.02);
  const running = useTransform(finished, (v) => 1 - v);
  return (
    <motion.div
      className="absolute top-6 left-1/2 z-10 -ml-[230px] w-[460px] rounded-xl border border-border bg-popover p-5 text-popover-foreground shadow-xl"
      style={{ opacity, visibility: useVisibility(opacity), y, scale }}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <SearchIcon className="size-4" />
          </span>
          <span className="text-[16px] font-semibold">Job search</span>
        </div>
        <span className="grid justify-items-end">
          <Reveal t={running} className="col-start-1 row-start-1">
            <MockBadge tone="muted">Running</MockBadge>
          </Reveal>
          <Reveal t={finished} scale={0.7} pop className="col-start-1 row-start-1">
            <MockBadge tone="success">Succeeded</MockBadge>
          </Reveal>
        </span>
      </div>
      <div className="space-y-1.5">
        {runLog.map((line, i) => (
          <LogLine key={line} progress={progress} start={LOG_START + i * LOG_STEP} end={LOG_START + (i + 1) * LOG_STEP}>
            {line}
          </LogLine>
        ))}
      </div>
    </motion.div>
  );
}

// A line shows a spinner (turned by progress, not time) until the next line starts, then a check.
function LogLine({
  progress,
  start,
  end,
  children,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  children: string;
}) {
  const appear = usePhase(progress, start, start + 0.035);
  const complete = usePhase(progress, end - 0.005, end + 0.01);
  const working = useTransform(complete, (v) => 1 - v);
  const rotate = useTransform(progress, (v) => v * 1800);
  return (
    <Reveal t={appear} x={-10} className="flex h-7 items-center gap-2.5 text-[15px]">
      <span className="grid size-4 place-items-center">
        <motion.span
          className="col-start-1 row-start-1 flex text-muted-foreground"
          style={{ opacity: working, visibility: useVisibility(working), rotate }}
        >
          <LoaderCircleIcon className="size-4" />
        </motion.span>
        <motion.span
          className="col-start-1 row-start-1 flex text-success"
          style={{ opacity: complete, visibility: useVisibility(complete), scale: complete }}
        >
          <CheckIcon className="size-4" strokeWidth={3} />
        </motion.span>
      </span>
      <span>{children}</span>
    </Reveal>
  );
}
