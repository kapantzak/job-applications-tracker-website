import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  InboxIcon,
  MailIcon,
  MessagesSquareIcon,
  SearchIcon,
  TrendingUpIcon,
} from 'lucide-react';
import { easeInOut, easeOut, motion, useMotionTemplate, useTransform, type MotionValue } from 'motion/react';
import type { ReactNode } from 'react';
import { dashboard, STATUS_LABEL } from '../mockData';
import { MockButton, MockPageHeader, Reveal, STATUS_FILL, usePhase } from '../ui';
import type { ScreenProps } from '../types';

// Phases within the step: 0.04–0.54 the tiles count up one after another, 0.22–0.6 the status bar
// fills left to right while its legend appears, 0.5–0.9 the funnel bars grow step by step, and
// 0.62–0.94 the needs-attention list fills in. Nothing moves after 0.95.
const TILE_START = 0.04;
const TILE_STEP = 0.05;
const TILE_DURATION = 0.3;
const BAR = [0.22, 0.6] as const;
const LEGEND_START = 0.3;
const LEGEND_STEP = 0.035;
const FUNNEL_START = 0.5;
const FUNNEL_STEP = 0.06;
const FUNNEL_DURATION = 0.2;
const FOOTNOTES = [0.82, 0.92] as const;
const ATTENTION_START = 0.62;
const ATTENTION_STEP = 0.06;

const TILE_ICON: Record<string, ReactNode> = {
  'In progress': <TrendingUpIcon className="size-4" />,
  Interviews: <MessagesSquareIcon className="size-4" />,
  Offers: <CircleCheckIcon className="size-4" />,
  // Red icon only, as in the app: the number keeps the text colour.
  Rejected: <CircleXIcon className="size-4 text-destructive" />,
  'To review': <InboxIcon className="size-4" />,
};

// Completes "Rejected after …" for each funnel step (the app's AFTER_STEP).
const AFTER_STEP: Record<(typeof dashboard.funnel)[number]['stage'], string> = {
  applied: 'applying',
  screening: 'screening',
  interview: 'the interview',
  offer: 'the offer',
};

const shownSegments = dashboard.statusBar.filter((s) => s.count > 0);
const funnelTop = dashboard.funnel[0]?.count ?? 0;
const rejections = dashboard.funnel.filter((f) => f.rejected > 0);

/** Step 5: the Dashboard counts up, the status bar and the funnel fill in. */
export function DashboardScreen({ progress }: ScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <MockPageHeader
        title="Dashboard"
        description="How this profile's applications are doing."
        actions={<HeaderActions />}
      />
      <div className="mb-4 grid grid-cols-5 gap-3">
        {dashboard.tiles.map((tile, i) => (
          <Tile
            key={tile.label}
            label={tile.label}
            value={tile.value}
            icon={TILE_ICON[tile.label]}
            progress={progress}
            start={TILE_START + i * TILE_STEP}
          />
        ))}
      </div>
      <StatusBarCard progress={progress} />
      <div className="mt-4 grid grid-cols-[1.4fr_1fr] gap-4">
        <FunnelCard progress={progress} />
        <AttentionCard progress={progress} />
      </div>
    </div>
  );
}

function HeaderActions() {
  return (
    <>
      <MockButton variant="primary" className="gap-0 px-0">
        <span className="flex items-center gap-2 px-4">
          <SearchIcon />
          <span>Find jobs</span>
        </span>
        <span className="flex h-full items-center border-l border-primary-foreground/20 px-2.5">
          <ChevronDownIcon />
        </span>
      </MockButton>
      <MockButton variant="outline">
        <MailIcon />
        Sync from Gmail
      </MockButton>
    </>
  );
}

function Card({ title, className = '', children }: { title: ReactNode; className?: string; children: ReactNode }) {
  return (
    <div className={`rounded-xl border border-border bg-card px-5 py-4 text-card-foreground shadow-sm ${className}`}>
      <div className="mb-3.5 text-[16px] font-semibold">{title}</div>
      {children}
    </div>
  );
}

function Tile({
  label,
  value,
  icon,
  progress,
  start,
}: {
  label: string;
  value: number;
  icon: ReactNode;
  progress: MotionValue<number>;
  start: number;
}) {
  const t = usePhase(progress, start, start + TILE_DURATION);
  const count = useTransform(t, (v) => Math.round(easeOut(v) * value));
  return (
    <div data-tile={label} className="rounded-xl border border-border bg-card px-4 py-3 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between text-[14px] text-muted-foreground">
        <span className="truncate">{label}</span>
        {icon}
      </div>
      <motion.div className="mt-1.5 text-[30px] leading-9 font-semibold tabular-nums">{count}</motion.div>
    </div>
  );
}

function StatusBarCard({ progress }: { progress: MotionValue<number> }) {
  const fill = usePhase(progress, ...BAR);
  const hidden = useTransform(fill, (v) => (1 - easeInOut(v)) * 100);
  const clipPath = useMotionTemplate`inset(0 ${hidden}% 0 0)`;
  return (
    <Card title={`Where your ${dashboard.total} applications stand`}>
      <div className="relative h-3.5 overflow-hidden rounded bg-muted">
        <motion.div className="absolute inset-0 flex gap-0.5" style={{ clipPath }}>
          {shownSegments.map((s, i) => (
            <span
              key={s.status}
              className={`block h-full basis-0 ${STATUS_FILL[s.status]} ${i === 0 ? 'rounded-l' : ''} ${
                i === shownSegments.length - 1 ? 'rounded-r' : ''
              }`}
              style={{ flexGrow: s.count }}
            />
          ))}
        </motion.div>
      </div>
      {/* Every status is listed, zeros included, as in the app. */}
      <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1 text-[12px] text-muted-foreground">
        {dashboard.statusBar.map((s, i) => (
          <LegendItem key={s.status} progress={progress} start={LEGEND_START + i * LEGEND_STEP}>
            <span className={`inline-block size-2.5 rounded-sm ${STATUS_FILL[s.status]}`} />
            {STATUS_LABEL[s.status]} <span className="text-foreground">{s.count}</span>
          </LegendItem>
        ))}
      </div>
    </Card>
  );
}

function LegendItem({ progress, start, children }: { progress: MotionValue<number>; start: number; children: ReactNode }) {
  const t = usePhase(progress, start, start + 0.1);
  return (
    <Reveal t={t} y={4} className="inline-flex items-center gap-1.5">
      {children}
    </Reveal>
  );
}

function FunnelCard({ progress }: { progress: MotionValue<number> }) {
  const footnotes = usePhase(progress, ...FOOTNOTES);
  return (
    <Card title="How far applications get">
      <div className="flex flex-col gap-2 text-[14px]">
        {dashboard.funnel.map((step, i) => (
          <FunnelRow
            key={step.stage}
            step={step}
            above={i > 0 ? dashboard.funnel[i - 1].count : null}
            progress={progress}
            start={FUNNEL_START + i * FUNNEL_STEP}
          />
        ))}
      </div>
      <Reveal t={footnotes} y={4} className="mt-3 space-y-1 text-[12px] text-muted-foreground">
        <p>% = share of the step above</p>
        {rejections.length > 0 && (
          <p className="flex items-center gap-1.5">
            <span className="inline-block size-2 shrink-0 rounded-full bg-status-rejected" />
            Rejected after: {rejections.map((f) => `${AFTER_STEP[f.stage]} ${f.rejected}`).join(' · ')}
          </p>
        )}
      </Reveal>
    </Card>
  );
}

function FunnelRow({
  step,
  above,
  progress,
  start,
}: {
  step: (typeof dashboard.funnel)[number];
  above: number | null;
  progress: MotionValue<number>;
  start: number;
}) {
  const grow = usePhase(progress, start, start + FUNNEL_DURATION);
  const hidden = useTransform(grow, (v) => (1 - easeInOut(v)) * 100);
  const clipPath = useMotionTemplate`inset(0 ${hidden}% 0 0)`;
  const label = usePhase(progress, start + FUNNEL_DURATION * 0.5, start + FUNNEL_DURATION);
  const pct = (n: number) => `${funnelTop > 0 ? (n / funnelTop) * 100 : 0}%`;
  const reached = step.count - step.rejected;
  const share = above ? Math.round((step.count / above) * 100) : null;
  return (
    <div className="grid grid-cols-[80px_1fr_68px] items-center gap-3">
      <span>{STATUS_LABEL[step.stage]}</span>
      <span className="block h-4 overflow-hidden rounded bg-muted">
        <motion.span
          className={`flex h-full ${step.rejected > 0 && reached > 0 ? 'gap-0.5' : ''}`}
          style={{ clipPath }}
        >
          <span className="block h-full rounded bg-status-interview" style={{ width: pct(reached) }} />
          {step.rejected > 0 && (
            <span className="block h-full rounded bg-status-rejected" style={{ width: pct(step.rejected) }} />
          )}
        </motion.span>
      </span>
      <Reveal t={label} x={-6} className="flex items-baseline justify-end gap-1.5">
        <span>{step.count}</span>
        {share !== null && <span className="text-[12px] text-muted-foreground">{share}%</span>}
      </Reveal>
    </div>
  );
}

function AttentionCard({ progress }: { progress: MotionValue<number> }) {
  return (
    <Card title="Needs attention">
      <div className="flex flex-col divide-y divide-border text-[14px]">
        {dashboard.attention.map((item, i) => (
          <AttentionItem key={item.company} progress={progress} start={ATTENTION_START + i * ATTENTION_STEP}>
            <span className="truncate font-medium">
              {item.company} · {item.role}
            </span>
            <span className="truncate text-[13px] text-muted-foreground">{item.note}</span>
          </AttentionItem>
        ))}
      </div>
    </Card>
  );
}

function AttentionItem({ progress, start, children }: { progress: MotionValue<number>; start: number; children: ReactNode }) {
  const t = usePhase(progress, start, start + 0.12);
  return (
    <Reveal t={t} x={-8} className="flex flex-col py-1.5 first:pt-0">
      {children}
    </Reveal>
  );
}
