import { CheckIcon, ChevronDownIcon, CircleCheckIcon, FileTextIcon, SparklesIcon, UploadIcon, XIcon } from 'lucide-react';
import { easeInOut, motion, useMotionTemplate, useTransform, type MotionValue } from 'motion/react';
import type { ReactNode } from 'react';
import { cvFileName, profile } from '../mockData';
import { segment } from '../timeline';
import type { ScreenProps } from '../types';
import { easeSoft, MockPageHeader, MockPointer, Reveal, usePhase, useVisibility } from '../ui';

const SENIORITY_OPTIONS = ['Junior', 'Mid-level', 'Senior', 'Staff', 'Principal'];

// Phases within the step: 0–0.25 the file drops in, 0.25–0.55 the analysis runs, 0.55–1 the form
// fills field by field (each field gets ~0.085, ending just before 1 so the last frame holds).
const FIELDS = {
  name: [0.56, 0.645],
  roles: [0.645, 0.73],
  locations: [0.73, 0.815],
  remote: [0.815, 0.9],
  seniority: [0.9, 0.985],
} as const;

/** Step 1: drop a CV, the agent analyses it, the profile form fills in. */
export function CvScreen({ progress }: ScreenProps) {
  return (
    <div className="flex h-full flex-col">
      <MockPageHeader title="Profile" description="What you are looking for and your CV. Job searches use these fields." />
      <CvCard progress={progress} />
      <div className="mt-4 rounded-xl border border-border bg-card px-6 py-2 text-card-foreground shadow-sm">
        <NameField t={usePhase(progress, ...FIELDS.name)} />
        <TagField label="Target roles" values={profile.targetRoles} t={usePhase(progress, ...FIELDS.roles)} />
        <TagField label="Locations" values={profile.locations} t={usePhase(progress, ...FIELDS.locations)} />
        <RemoteField t={usePhase(progress, ...FIELDS.remote)} />
        <SeniorityField t={usePhase(progress, ...FIELDS.seniority)} />
      </div>
    </div>
  );
}

function CvCard({ progress }: ScreenProps) {
  const drop = usePhase(progress, 0, 0.25);
  const landed = useTransform(drop, (v) => easeSoft(v));
  // The file is held up and to the right, tilted, then settles into the drop zone.
  const fileX = useTransform(landed, (v) => (1 - v) * 56);
  const fileY = useTransform(landed, (v) => (1 - v) * -64);
  const fileRotate = useTransform(landed, (v) => (1 - v) * -5);
  const fileScale = useTransform(landed, (v) => 1 + (1 - v) * 0.04);
  const lift = useTransform(landed, (v) => 1 - v);
  const fileShadow = useMotionTemplate`0 calc(${lift} * 18px) calc(${lift} * 40px) calc(${lift} * -8px) rgb(0 0 0 / calc(${lift} * 0.3))`;
  const pointerOpacity = useTransform(drop, (v) => 1 - segment(v, 0.8, 1));
  const zoneHighlight = useTransform(drop, (v) => Math.min(segment(v, 0.3, 0.7), 1 - segment(v, 0.85, 1)));
  const zoneOpacity = useTransform(drop, (v) => 1 - segment(v, 0.85, 1));
  const hintOpacity = useTransform(drop, (v) => 1 - segment(v, 0.45, 0.75));

  const analysisIn = usePhase(progress, 0.22, 0.3);
  const fill = useTransform(usePhase(progress, 0.25, 0.55), (v) => easeInOut(v));
  const percent = useTransform(fill, (v) => `${Math.round(v * 100)}%`);
  const done = usePhase(progress, 0.55, 0.6);
  const running = useTransform(done, (v) => 1 - v);

  return (
    <div className="relative rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm">
      <div className="relative h-[76px]">
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-dashed border-border"
          style={{ opacity: zoneOpacity, visibility: useVisibility(zoneOpacity) }}
        />
        <motion.div
          className="absolute inset-0 rounded-lg border-2 border-dashed border-ring bg-muted/70"
          style={{ opacity: zoneHighlight, visibility: useVisibility(zoneHighlight) }}
        />
        <motion.div
          className="absolute inset-y-0 right-0 flex w-[330px] items-center justify-center gap-3 text-muted-foreground"
          style={{ opacity: hintOpacity, visibility: useVisibility(hintOpacity) }}
        >
          <UploadIcon className="size-5" />
          <div>
            <div className="text-[15px] font-medium text-foreground">Drop your CV here</div>
            <div className="text-[13px]">PDF, Word, .txt or .md</div>
          </div>
        </motion.div>

        <motion.div
          className="absolute inset-y-0 left-0 z-10 flex w-[372px] items-center gap-3.5 rounded-lg border border-border bg-card px-3.5"
          style={{ x: fileX, y: fileY, rotate: fileRotate, scale: fileScale, boxShadow: fileShadow }}
        >
          <span className="relative flex size-12 shrink-0 items-center justify-center rounded-md bg-destructive/10 text-destructive">
            <FileTextIcon className="size-6" strokeWidth={1.75} />
            <span className="absolute -bottom-1 rounded-sm bg-destructive px-1 text-[9px] leading-3.5 font-bold text-white">
              PDF
            </span>
          </span>
          <div className="min-w-0">
            <div className="truncate text-[15px] font-semibold">{cvFileName}</div>
            <div className="text-[13px] text-muted-foreground">PDF · 2 pages</div>
          </div>
          <motion.span
            className="pointer-events-none absolute top-[58%] left-[78%] drop-shadow-md"
            style={{ opacity: pointerOpacity, visibility: useVisibility(pointerOpacity) }}
          >
            <MockPointer />
          </motion.span>
        </motion.div>

        <Reveal t={analysisIn} x={12} className="absolute inset-y-0 right-1 flex w-[310px] flex-col justify-center gap-2.5">
          <div className="flex items-center justify-between text-[15px]">
            <span className="grid">
              <Swap t={running}>
                <SparklesIcon className="size-4 text-muted-foreground" />
                Analysing CV
              </Swap>
              <Swap t={done}>
                <CircleCheckIcon className="size-4 text-success" />
                Suggestions ready
              </Swap>
            </span>
            <motion.span className="text-[14px] text-muted-foreground tabular-nums">{percent}</motion.span>
          </div>
          <div className="relative h-2 overflow-hidden rounded-full bg-muted">
            <motion.div className="absolute inset-0 origin-left rounded-full bg-primary" style={{ scaleX: fill }} />
            <motion.div
              className="absolute inset-0 rounded-full bg-success"
              style={{ opacity: done, visibility: useVisibility(done) }}
            />
          </div>
        </Reveal>
      </div>
    </div>
  );
}

/** One of two labels stacked in the same grid cell; `t` is its opacity. */
function Swap({ t, children }: { t: MotionValue<number>; children: ReactNode }) {
  return (
    <motion.span
      className="col-start-1 row-start-1 flex items-center gap-2 font-medium"
      style={{ opacity: t, visibility: useVisibility(t) }}
    >
      {children}
    </motion.span>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[136px_1fr] items-center gap-4 border-b border-border py-2.5 last:border-b-0">
      <div className="text-[15px] font-medium">{label}</div>
      {children}
    </div>
  );
}

/** An input-like box that shows a focus ring while its field is being filled (0 < t < 1). */
function Box({ t, className = '', children }: { t: MotionValue<number>; className?: string; children: ReactNode }) {
  const focus = useTransform(t, (v) => (v <= 0 || v >= 1 ? 0 : Math.min(1, v * 8, (1 - v) * 8)));
  return (
    <div
      className={`relative flex h-10 items-center gap-2 rounded-md border border-input bg-background px-3 text-[15px] dark:bg-input/30 ${className}`}
    >
      {children}
      <motion.span
        className="pointer-events-none absolute -inset-px rounded-md border border-ring ring-[3px] ring-ring/40"
        style={{ opacity: focus, visibility: useVisibility(focus) }}
      />
    </div>
  );
}

function NameField({ t }: { t: MotionValue<number> }) {
  const typed = useTransform(t, (v) => profile.name.slice(0, Math.round(easeSoft(v) * profile.name.length)));
  const typing = useTransform(t, (v): number => (v > 0 && v < 1 ? 1 : 0));
  const placeholder = useTransform(t, (v): number => (v > 0 ? 0 : 1));
  return (
    <Field label="Name">
      <Box t={t} className="w-[340px]">
        <motion.span
          className="absolute left-3 text-muted-foreground"
          style={{ opacity: placeholder, visibility: useVisibility(placeholder) }}
        >
          Name this profile
        </motion.span>
        <span className="flex items-center">
          <motion.span>{typed}</motion.span>
          <motion.span
            className="ml-px h-5 w-[1.5px] bg-foreground"
            style={{ opacity: typing, visibility: useVisibility(typing) }}
          />
        </span>
      </Box>
    </Field>
  );
}

function TagField({ label, values, t }: { label: string; values: string[]; t: MotionValue<number> }) {
  const step = 1 / values.length;
  return (
    <Field label={label}>
      <Box t={t} className="px-1.5">
        {values.map((value, i) => (
          <Tag key={value} t={t} start={i * step * 0.8} end={i * step * 0.8 + step * 1.2}>
            {value}
          </Tag>
        ))}
      </Box>
    </Field>
  );
}

function Tag({ t, start, end, children }: { t: MotionValue<number>; start: number; end: number; children: string }) {
  const own = useTransform(t, (v) => segment(v, start, Math.min(1, end)));
  return (
    <Reveal t={own} scale={0.6} pop className="flex items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1 text-[14px] text-secondary-foreground">
      <span>{children}</span>
      <XIcon className="size-3.5 text-muted-foreground" />
    </Reveal>
  );
}

function RemoteField({ t }: { t: MotionValue<number> }) {
  const placeholder = useTransform(t, (v) => 1 - segment(v, 0, 0.3));
  return (
    <Field label="Remote">
      <Box t={t} className="w-[260px] justify-between">
        <span className="grid">
          <motion.span
            className="col-start-1 row-start-1 text-muted-foreground"
            style={{ opacity: placeholder, visibility: useVisibility(placeholder) }}
          >
            Choose…
          </motion.span>
          <Reveal t={useTransform(t, (v) => segment(v, 0.2, 0.7))} y={6} className="col-start-1 row-start-1">
            {profile.remote}
          </Reveal>
        </span>
        <ChevronDownIcon className="size-4 text-muted-foreground" />
      </Box>
    </Field>
  );
}

function SeniorityField({ t }: { t: MotionValue<number> }) {
  return (
    <Field label="Seniority">
      <div className="flex h-10 items-center gap-2">
        {SENIORITY_OPTIONS.map((option) => {
          const order = profile.seniority.indexOf(option);
          return order < 0 ? (
            <Chip key={option} label={option} />
          ) : (
            <SelectedChip key={option} label={option} t={t} start={order * 0.4} end={order * 0.4 + 0.6} />
          );
        })}
      </div>
    </Field>
  );
}

const CHIP = 'flex h-9 items-center rounded-full border px-3.5 text-[14px] font-medium';

function Chip({ label }: { label: string }) {
  return (
    <span className={`${CHIP} border-border text-foreground`}>
      <span>{label}</span>
    </span>
  );
}

// Colours cross-fade through color-mix so one element (and one text node) changes state.
function SelectedChip({ label, t, start, end }: { label: string; t: MotionValue<number>; start: number; end: number }) {
  const on = useTransform(t, (v) => easeSoft(segment(v, start, end)) * 100);
  const background = useMotionTemplate`color-mix(in oklch, var(--primary) ${on}%, transparent)`;
  const color = useMotionTemplate`color-mix(in oklch, var(--primary-foreground) ${on}%, var(--foreground))`;
  const borderColor = useMotionTemplate`color-mix(in oklch, var(--primary) ${on}%, var(--border))`;
  const checkWidth = useTransform(on, (v) => (v / 100) * 20);
  const checkScale = useTransform(on, (v) => v / 100);
  return (
    <motion.span className={CHIP} style={{ background, color, borderColor }}>
      <motion.span className="flex overflow-hidden" style={{ width: checkWidth }}>
        <motion.span className="flex" style={{ scale: checkScale }}>
          <CheckIcon className="size-4" strokeWidth={2.5} />
        </motion.span>
      </motion.span>
      <span>{label}</span>
    </motion.span>
  );
}
