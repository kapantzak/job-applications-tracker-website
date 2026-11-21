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
import { useId, type ReactNode } from 'react';
import { segment } from '../timeline';
import { dashboard, JOURNEY_STOPS, STATUS_LABEL, type FunnelStage, type JourneyStage, type JourneyStop } from '../mockData';
import { MockButton, MockPageHeader, Reveal, usePhase, useVisibility } from '../ui';
import type { ScreenProps } from '../types';

// Phases within the step: 0.04–0.54 the tiles count up one after another; 0.14–0.84 the journey
// graph is uncovered left to right, easing into each stage in turn, and every label fades in as
// the flow reaches it (the final "1 offer" last); 0.82–0.95 the needs-attention list starts to
// fill in below. Nothing moves after 0.95.
const TILE_START = 0.04;
const TILE_STEP = 0.05;
const TILE_DURATION = 0.3;
const GRAPH_KNOTS = [0.14, 0.32, 0.5, 0.68, 0.84];
const ATTENTION_START = 0.82;
const ATTENTION_STEP = 0.03;

const TILE_ICON: Record<string, ReactNode> = {
  'In progress': <TrendingUpIcon className="size-4" />,
  Interviews: <MessagesSquareIcon className="size-4" />,
  Offers: <CircleCheckIcon className="size-4" />,
  // Red icon only, as in the app: the number keeps the text colour.
  Rejected: <CircleXIcon className="size-4 text-destructive" />,
  'To review': <InboxIcon className="size-4" />,
};

/** Step 5: the Dashboard counts up and the journey graph flows from Applied to Offer. */
export function DashboardScreen({ progress }: ScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <MockPageHeader
        title="Dashboard"
        description="How this profile's applications are doing."
        actions={<HeaderActions />}
      />
      <div className="mb-4 grid shrink-0 grid-cols-5 gap-3">
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
      <JourneyCard progress={progress} />
      <AttentionCard progress={progress} />
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

function Card({
  title,
  description,
  className = '',
  children,
}: {
  title: ReactNode;
  description?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`shrink-0 rounded-xl border border-border bg-card px-5 py-4 text-card-foreground shadow-sm ${className}`}>
      <div className="mb-3 space-y-0.5">
        <div className="text-[17px] leading-6 font-semibold">{title}</div>
        {description && <div className="text-[14px] text-muted-foreground">{description}</div>}
      </div>
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

// --- Journey graph -------------------------------------------------------------------------------
// A simplified copy of the app's JourneyCard (src/ui/components/dashboard/JourneyCard.tsx, v0.3.0):
// stage bars sized by count, ribbons to the next stage, and the stops branching off below each
// stage. Geometry is in viewBox units, equal to px in the 1040 px window; text is larger than the
// app's so it stays readable when the window is scaled down.
const VIEW_W = 722;
const TOP = 40; // top of the bars; stage names and counts sit above
const TRUNK_H = 120; // height of the Applied bar
const MIN_H = 3;
const NODE_W = 14;
const NODE_X0 = 26;
const NODE_GAP = 176;
const EXIT_DX = 100;
const LAST_EXIT_DX = 72;
const EXIT_DROP = 22; // first exit's drop below the point it leaves
const EXIT_STEP = 14; // extra drop per following exit, so labels never collide
const CAP_W = 4;
const LABEL_GAP = 7;
const PAD_BOTTOM = 2;
const FADE = 40; // how far past an element the flow travels while it fades in
const EDGE = 28; // soft leading edge of the uncovered flow

type Exit = JourneyStop;

interface ExitShape {
  exit: Exit;
  count: number;
  y: number;
  h: number;
  capX: number;
  capY: number;
}

interface StageShape extends JourneyStage {
  x: number;
  nodeH: number;
  moved: number; // ribbon height to the next stage, 0 when none moved on
  exits: ExitShape[];
}

function layout(stages: JourneyStage[]): { shapes: StageShape[]; height: number } {
  const scale = stages[0].count > 0 ? TRUNK_H / stages[0].count : 0;
  const size = (n: number) => (n > 0 ? Math.max(MIN_H, n * scale) : 0);
  let bottom = TOP;
  const shapes = stages.map((s, i) => {
    const x = NODE_X0 + i * NODE_GAP;
    const moved = size(stages[i + 1]?.count ?? 0);
    const capX = x + NODE_W + (i === stages.length - 1 ? LAST_EXIT_DX : EXIT_DX);
    let y = TOP + moved;
    let drop = EXIT_DROP;
    const exits: ExitShape[] = [];
    for (const exit of JOURNEY_STOPS) {
      const count = s.stops[exit];
      if (count <= 0) continue;
      const h = size(count);
      exits.push({ exit, count, y, h, capX, capY: y + drop });
      bottom = Math.max(bottom, y + drop + Math.max(h, h / 2 + 8));
      y += h;
      drop += EXIT_STEP;
    }
    const nodeH = s.count > 0 ? Math.max(size(s.count), y - TOP) : 0;
    bottom = Math.max(bottom, TOP + nodeH);
    return { ...s, x, nodeH, moved, exits };
  });
  return { shapes, height: Math.ceil(bottom + PAD_BOTTOM) };
}

const { shapes, height: VIEW_H } = layout(dashboard.journey.stages);

// Status colours as the app's STATUS_COLOR_VAR; waiting takes its stage's colour, held back.
const STAGE_COLOR: Record<FunnelStage, string> = {
  applied: 'var(--status-applied)',
  screening: 'var(--status-screening)',
  interview: 'var(--status-interview)',
  offer: 'var(--status-offer)',
};
const STOP_COLOR: Record<Exit, string | null> = {
  waiting: null,
  rejected: 'var(--status-rejected)',
  noResponse: 'var(--status-no-response)',
  withdrawn: 'var(--status-withdrawn)',
};
const WAITING_ALPHA = 0.6;
const STOP_WORD: Record<Exit, string> = {
  waiting: 'waiting',
  rejected: STATUS_LABEL.rejected.toLowerCase(),
  noResponse: STATUS_LABEL['no-response'].toLowerCase(),
  withdrawn: STATUS_LABEL.withdrawn.toLowerCase(),
};

const exitColor = (s: StageShape, exit: Exit) => STOP_COLOR[exit] ?? STAGE_COLOR[s.stage];
// At the last step, still waiting means holding the offer.
const isOffer = (s: StageShape, exit: Exit) => s.stage === 'offer' && exit === 'waiting';
const exitLabel = (s: StageShape, e: ExitShape) =>
  isOffer(s, e.exit) ? `${e.count} ${e.count === 1 ? 'offer' : 'offers'}` : `${e.count} ${STOP_WORD[e.exit]}`;

const round = (n: number) => Math.round(n * 100) / 100;

function ribbon(x0: number, top0: number, bottom0: number, x1: number, top1: number, bottom1: number): string {
  const m = round((x0 + x1) / 2);
  const [a, b, c, d, e, f] = [x0, top0, bottom0, x1, top1, bottom1].map(round);
  return `M${a},${b} C${m},${b} ${m},${e} ${d},${e} L${d},${f} C${m},${f} ${m},${c} ${a},${c} Z`;
}

const { sent, saved } = dashboard.journey;
const caption = saved > 0 ? `${sent} sent · ${saved} saved, not applied yet` : `${sent} sent`;

function JourneyCard({ progress }: { progress: MotionValue<number> }) {
  // How far, in viewBox units, the flow has travelled; it eases into each stage in turn and ends
  // past the right edge, so the soft edge leaves the drawing whole.
  const reach = useTransform(
    progress,
    GRAPH_KNOTS,
    [0, ...shapes.slice(1).map((s) => s.x), VIEW_W + EDGE],
    { ease: easeInOut },
  );
  const solid = useTransform(reach, (v) => ((v - EDGE) / VIEW_W) * 100);
  const clear = useTransform(reach, (v) => (v / VIEW_W) * 100);
  const maskImage = useMotionTemplate`linear-gradient(to right, #000 ${solid}%, transparent ${clear}%)`;
  const visibility = useVisibility(reach);
  const viewBox = `0 0 ${VIEW_W} ${VIEW_H}`;
  return (
    <Card title="Your applications' journey" description={caption}>
      <div data-journey className="relative">
        <motion.div style={{ maskImage, visibility }}>
          <FlowDrawing viewBox={viewBox} />
        </motion.div>
        <svg viewBox={viewBox} className="absolute inset-0 block h-auto w-full overflow-visible">
          {shapes.map((s) => (
            <StageLabels key={s.stage} shape={s} reach={reach} />
          ))}
        </svg>
      </div>
    </Card>
  );
}

/** The bars and ribbons; static, uncovered by the clip in JourneyCard. */
function FlowDrawing({ viewBox }: { viewBox: string }) {
  const uid = useId().replace(/[^\w-]/g, '');
  const gradient = (key: string) => `${uid}-${key}`;
  return (
    <svg viewBox={viewBox} className="block h-auto w-full">
      <defs>
        {shapes.map((s, i) => {
          const next = shapes[i + 1];
          return [
            next && s.moved > 0 && (
              <linearGradient key={`${s.stage}-moved`} id={gradient(`${s.stage}-moved`)}>
                <stop offset="0" style={{ stopColor: STAGE_COLOR[s.stage], stopOpacity: 0.45 }} />
                <stop offset="1" style={{ stopColor: STAGE_COLOR[next.stage], stopOpacity: 0.45 }} />
              </linearGradient>
            ),
            ...s.exits.map((e) => (
              <linearGradient key={`${s.stage}-${e.exit}`} id={gradient(`${s.stage}-${e.exit}`)}>
                <stop offset="0" style={{ stopColor: STAGE_COLOR[s.stage], stopOpacity: 0.35 }} />
                <stop
                  offset="1"
                  style={{ stopColor: exitColor(s, e.exit), stopOpacity: e.exit === 'waiting' ? WAITING_ALPHA : 0.9 }}
                />
              </linearGradient>
            )),
          ];
        })}
      </defs>
      {shapes.map((s, i) => {
        const right = s.x + NODE_W;
        const next = shapes[i + 1];
        return (
          <g key={s.stage} data-stage={s.stage}>
            {next && s.moved > 0 && (
              <path
                d={ribbon(right, TOP, TOP + s.moved, next.x, TOP, TOP + s.moved)}
                fill={`url(#${gradient(`${s.stage}-moved`)})`}
              />
            )}
            {s.exits.map((e) => (
              <g key={e.exit}>
                <path
                  d={ribbon(right, e.y, e.y + e.h, e.capX, e.capY, e.capY + e.h)}
                  fill={`url(#${gradient(`${s.stage}-${e.exit}`)})`}
                />
                <rect
                  x={e.capX}
                  y={round(e.capY)}
                  width={CAP_W}
                  height={round(e.h)}
                  rx={CAP_W / 2}
                  style={{ fill: exitColor(s, e.exit), fillOpacity: e.exit === 'waiting' ? WAITING_ALPHA : 1 }}
                />
              </g>
            ))}
            {s.nodeH > 0 && (
              <rect x={s.x} y={TOP} width={NODE_W} height={round(s.nodeH)} rx={4} style={{ fill: STAGE_COLOR[s.stage] }} />
            )}
          </g>
        );
      })}
    </svg>
  );
}

/** A stage's name and count, and its stop labels, each fading in as the flow reaches it. */
function StageLabels({ shape: s, reach }: { shape: StageShape; reach: MotionValue<number> }) {
  const center = s.x + NODE_W / 2;
  return (
    <g data-stage-labels={s.stage}>
      <FadeIn reach={reach} at={s.x}>
        <text x={center} y={TOP - 23} textAnchor="middle" fontSize={15} fontWeight={700} fill="currentColor">
          {STATUS_LABEL[s.stage]}
        </text>
        <text x={center} y={TOP - 7} textAnchor="middle" fontSize={13} className="fill-muted-foreground">
          {s.share === null ? `${s.count}` : `${s.count} · ${s.share}%`}
        </text>
      </FadeIn>
      {s.exits.map((e) => {
        const offer = isOffer(s, e.exit);
        return (
          <FadeIn key={e.exit} reach={reach} at={e.capX}>
            <text
              data-exit={e.exit}
              x={e.capX + CAP_W + LABEL_GAP}
              y={round(e.capY + e.h / 2 + 5)}
              fontSize={14}
              fontWeight={offer ? 700 : undefined}
              // The offer colour is light in dark mode and dark in light mode, so it stays readable.
              style={{ fill: offer ? STAGE_COLOR.offer : 'currentColor' }}
            >
              {exitLabel(s, e)}
            </text>
          </FadeIn>
        );
      })}
    </g>
  );
}

function FadeIn({ reach, at, children }: { reach: MotionValue<number>; at: number; children: ReactNode }) {
  const opacity = useTransform(reach, (v) => segment(v, at, at + FADE));
  const visibility = useVisibility(opacity);
  return <motion.g style={{ opacity, visibility }}>{children}</motion.g>;
}

// --- Needs attention -----------------------------------------------------------------------------

function AttentionCard({ progress }: { progress: MotionValue<number> }) {
  return (
    <Card title="Needs attention" className="mt-4">
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
  const t = usePhase(progress, start, start + 0.07);
  return (
    <Reveal t={t} x={-8} className="flex flex-col py-1.5 first:pt-0">
      {children}
    </Reveal>
  );
}
