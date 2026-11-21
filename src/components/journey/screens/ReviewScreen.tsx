import { CheckIcon, CircleCheckIcon, ExternalLinkIcon, LoaderCircleIcon, MailIcon, XIcon } from 'lucide-react';
import { motion, useTransform, type MotionValue } from 'motion/react';
import type { ReactNode } from 'react';
import { proposal, STATUS_LABEL } from '../mockData';
import type { ScreenProps } from '../types';
import { MockBadge, MockButton, MockPageHeader, Reveal, usePhase, useVisibility } from '../ui';

// Phases within the step: 0–0.2 Sync from Gmail is pressed and the sync runs, 0.2–0.6 the proposal
// card slides in and its evidence (From, Date, Subject, snippet) fills line by line, 0.6–0.8 Accept
// is pressed, 0.8–1 the application's status badge becomes Interview.
const PHASE = {
  syncPress: [0, 0.2],
  emptyOut: [0.1, 0.17],
  syncChip: [0.1, 0.16],
  syncDone: [0.19, 0.23],
  section: [0.2, 0.28],
  card: [0.22, 0.38],
  evidence: [0.34, 0.06, 0.12],
  snippet: [0.5, 0.6],
  acceptPress: [0.6, 0.8],
  statusOut: [0.8, 0.86],
  statusIn: [0.82, 0.95],
  settled: [0.82, 0.92],
} as const;

const EVIDENCE: [string, string][] = [
  ['From', proposal.from],
  ['Date', proposal.date],
  ['Subject', proposal.subject],
];

/** Step 4: Gmail sync finds the interview invitation; accepting it moves the application to Interview. */
export function ReviewScreen({ progress }: ScreenProps) {
  const syncPress = usePhase(progress, ...PHASE.syncPress);
  const emptyOut = usePhase(progress, ...PHASE.emptyOut);
  const empty = useTransform(emptyOut, (v) => 1 - v);
  const emptyVisibility = useVisibility(empty);
  const emptyScale = useTransform(emptyOut, (v) => 1 - v * 0.02);
  const section = usePhase(progress, ...PHASE.section);

  return (
    <div className="flex h-full flex-col">
      <MockPageHeader
        title="Review"
        description="Status changes found in your mail. Nothing changes until you accept."
        actions={
          <MockButton variant="outline" press={syncPress}>
            <MailIcon />
            Sync from Gmail
          </MockButton>
        }
      />
      <SyncChip progress={progress} />
      <div className="relative">
        <motion.div
          className="absolute inset-x-0 top-0 flex h-[180px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-center"
          style={{ opacity: empty, visibility: emptyVisibility, scale: emptyScale }}
        >
          <div className="text-[16px] font-medium">Nothing to review</div>
          <div className="max-w-[380px] text-[14px] text-muted-foreground">
            Sync from Gmail to find your applications and the replies to them.
          </div>
        </motion.div>
        <Reveal t={section} y={8} className="mb-3 text-[18px] font-semibold">
          Status changes
        </Reveal>
        <ProposalCard progress={progress} />
      </div>
    </div>
  );
}

/** The sync run as a small status line: searching, then what it found. */
function SyncChip({ progress }: { progress: MotionValue<number> }) {
  const chip = usePhase(progress, ...PHASE.syncChip);
  const done = usePhase(progress, ...PHASE.syncDone);
  const running = useTransform(done, (v) => 1 - v);
  const runningVisibility = useVisibility(running);
  const doneVisibility = useVisibility(done);
  const doneScale = useTransform(done, (v) => 0.6 + 0.4 * v);
  const rotate = useTransform(progress, (v) => v * 2400);
  return (
    <div className="mb-4 h-8">
      <Reveal
        t={chip}
        y={-6}
        className="inline-flex h-8 items-center gap-2.5 rounded-full border border-border bg-card pr-3.5 pl-2 text-[14px] shadow-xs"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-muted">
          <MailIcon className="size-3.5" />
        </span>
        <span className="font-medium">Gmail sync</span>
        <span className="h-4 w-px bg-border" />
        <span className="grid">
          <motion.span
            className="col-start-1 row-start-1 flex items-center gap-1.5 text-muted-foreground"
            style={{ opacity: running, visibility: runningVisibility }}
          >
            <motion.span className="flex" style={{ rotate }}>
              <LoaderCircleIcon className="size-3.5" />
            </motion.span>
            Searching your mail
          </motion.span>
          <motion.span
            className="col-start-1 row-start-1 flex items-center gap-1.5"
            style={{ opacity: done, visibility: doneVisibility }}
          >
            <motion.span className="flex text-success" style={{ scale: doneScale }}>
              <CircleCheckIcon className="size-3.5" />
            </motion.span>
            1 status change found
          </motion.span>
        </span>
      </Reveal>
    </div>
  );
}

function ProposalCard({ progress }: { progress: MotionValue<number> }) {
  const card = usePhase(progress, ...PHASE.card);
  const snippet = usePhase(progress, ...PHASE.snippet);
  const acceptPress = usePhase(progress, ...PHASE.acceptPress);
  const settled = usePhase(progress, ...PHASE.settled);
  const actionsOpacity = useTransform(settled, (v) => 1 - v * 0.5);
  const ringVisibility = useVisibility(settled);
  const [evidenceStart, evidenceStep, evidenceDuration] = PHASE.evidence;

  return (
    <Reveal
      t={card}
      y={28}
      scale={0.98}
      className="relative rounded-xl border border-border bg-card text-card-foreground shadow-sm"
    >
      <motion.span
        className="pointer-events-none absolute -inset-px rounded-xl ring-2 ring-status-interview/35"
        style={{ opacity: settled, visibility: ringVisibility }}
      />
      <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-3">
        <div className="space-y-0.5">
          <div className="text-[17px] font-semibold">{`${proposal.company} - ${proposal.role}`}</div>
          <div className="text-[14px] text-muted-foreground">
            {`${STATUS_LABEL[proposal.fromStatus]} → ${STATUS_LABEL[proposal.toStatus]} (${Math.round(proposal.confidence * 100)}%)`}
          </div>
        </div>
        <StatusChange progress={progress} />
      </div>
      <div className="flex flex-col gap-3 px-6 pb-5">
        <p className="text-[15px]">{proposal.reason}</p>
        <div className="rounded-md border-l-4 border-border bg-muted/50 px-4 py-3 text-[15px]">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {EVIDENCE.map(([label, value], i) => (
              <EvidenceLine
                key={label}
                progress={progress}
                start={evidenceStart + i * evidenceStep}
                end={evidenceStart + i * evidenceStep + evidenceDuration}
                label={label}
                strong={label === 'Subject'}
              >
                {value}
              </EvidenceLine>
            ))}
          </div>
          <Reveal t={snippet} y={6} className="mt-2 text-muted-foreground">
            {proposal.snippet}
          </Reveal>
        </div>
      </div>
      <motion.div
        className="flex items-center gap-2 border-t border-border px-6 py-4"
        style={{ opacity: actionsOpacity }}
      >
        <MockButton variant="primary" press={acceptPress}>
          <CheckIcon />
          Accept
        </MockButton>
        <MockButton variant="outline">
          <XIcon />
          Reject
        </MockButton>
        <span className="ml-auto flex items-center gap-2 px-2 text-[15px] font-medium">
          Open in Gmail
          <ExternalLinkIcon className="size-4" />
        </span>
      </motion.div>
    </Reveal>
  );
}

/** Each evidence row slides in on its own; label and value share one phase. */
function EvidenceLine({
  progress,
  start,
  end,
  label,
  strong,
  children,
}: {
  progress: MotionValue<number>;
  start: number;
  end: number;
  label: string;
  strong: boolean;
  children: ReactNode;
}) {
  const t = usePhase(progress, start, end);
  return (
    <>
      <Reveal t={t} x={-8} className="text-muted-foreground">
        {label}
      </Reveal>
      <Reveal t={t} x={-8} className={`truncate ${strong ? 'font-semibold' : ''}`}>
        {children}
      </Reveal>
    </>
  );
}

/** The application's current status: Applied until the proposal is accepted, then Interview. */
function StatusChange({ progress }: { progress: MotionValue<number> }) {
  const out = usePhase(progress, ...PHASE.statusOut);
  const before = useTransform(out, (v) => 1 - v);
  const beforeVisibility = useVisibility(before);
  const beforeY = useTransform(out, (v) => v * -10);
  const after = usePhase(progress, ...PHASE.statusIn);
  return (
    <div className="flex shrink-0 flex-col items-end gap-1 pt-0.5">
      <span className="text-[12px] font-medium tracking-wide text-muted-foreground uppercase">Status</span>
      <span className="grid origin-right scale-[1.15] justify-items-end">
        <motion.span
          className="col-start-1 row-start-1"
          style={{ opacity: before, visibility: beforeVisibility, y: beforeY }}
        >
          <MockBadge tone="muted">{STATUS_LABEL[proposal.fromStatus]}</MockBadge>
        </motion.span>
        <Reveal t={after} y={10} scale={0.6} pop className="col-start-1 row-start-1">
          <MockBadge tone="primary">{STATUS_LABEL[proposal.toStatus]}</MockBadge>
        </Reveal>
      </span>
    </div>
  );
}
