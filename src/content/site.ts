// All page copy, commands and links. Every factual claim must trace to the app README at the
// pinned commit and describe npm 0.2.0; tests/unit/copy-guard.test.ts enforces the banned phrases.

export type StepId = 'cv' | 'jobs' | 'apply' | 'review' | 'dashboard';
export interface JourneyStep {
  id: StepId;
  title: string;
  line: string;
}

export const INSTALL_NPX = 'npx job-applications-tracker';
export const INSTALL_GLOBAL = 'npm i -g job-applications-tracker';
export const RUN_GLOBAL = 'jobtrack';

const REPO = 'https://github.com/kapantzak/job-applications-tracker';

export const LINKS: { github: string; npm: string; readme: string; license: string } = {
  github: REPO,
  npm: 'https://www.npmjs.com/package/job-applications-tracker',
  readme: `${REPO}#readme`,
  license: `${REPO}/blob/main/LICENSE`,
};

export const meta: { title: string; description: string } = {
  title: 'Job Applications Tracker: find and track jobs with Claude Code',
  description:
    'A local app that uses the Claude Code you already have to find job postings, check every link, track your applications and propose status changes from Gmail.',
};

export const hero: { headline: string; subhead: string } = {
  // Non-breaking space keeps the product name on one line.
  headline: 'Find jobs and track your applications with the Claude\u00a0Code you already use',
  subhead:
    'A local app that has your agent search for postings that match your profile, checks every link itself, and turns Gmail replies into status changes you accept. No agent setup.',
};

export const journeySteps: JourneyStep[] = [
  {
    id: 'cv',
    title: 'Drop your CV, get a profile',
    line: 'Your agent reads the text of your CV and suggests target roles, locations, remote preference and seniority.',
  },
  {
    id: 'jobs',
    title: 'Claude Code finds jobs, the app checks every link',
    line: 'Claude Code searches the web for matching postings; the app checks every link itself and shows how each job fits.',
  },
  {
    id: 'apply',
    title: 'Mark one applied',
    line: 'Mark a job applied and it joins your applications, with its status tracked from there.',
  },
  {
    id: 'review',
    title: 'Sync Gmail, review what it found',
    line: 'Your agent reads the replies in your Gmail and proposes status changes with the evidence. Nothing changes until you accept.',
  },
  {
    id: 'dashboard',
    title: 'See where everything stands',
    line: 'The Dashboard counts what is in progress, shows how far applications get, and lists what needs your attention.',
  },
];

export const trustPoints: { title: string; body: string }[] = [
  {
    title: 'Data stored locally in SQLite',
    body: 'Profiles, jobs, applications and your CV are kept in a data folder on your disk. The app’s server listens on 127.0.0.1 only, so other machines cannot reach it.',
  },
  {
    title: 'Your own agent',
    body: 'The app runs the Claude Code you already use, with your sign-in and your plan. Your profile, the text of your CV and the mail it reads go to that agent, like any other prompt you give it.',
  },
  {
    title: 'Nothing changes until you accept',
    body: 'Gmail sync proposes status changes and new applications, each with the sender, date, subject and a snippet as evidence. You accept or reject them.',
  },
  {
    title: 'It never applies or sends mail',
    body: 'The app never applies to jobs, sends mail, or changes your labels or messages. For Gmail sync, Claude Code is allowed only the search and read tools.',
  },
];

export const claudeCode: {
  title: string;
  intro: string;
  steps: { title: string; body: string; command?: string }[];
} = {
  title: 'No agent setup. Ready in two steps.',
  intro:
    'Claude Code is the app’s default agent. With it installed, the app skips agent Setup and opens on your profiles.',
  steps: [
    {
      title: 'Run it',
      body: 'The first start asks where to keep your data; press Enter for the default. The app then opens in your browser.',
      command: INSTALL_NPX,
    },
    {
      title: 'Connect Gmail in claude.ai (optional)',
      body: 'Gmail sync uses the claude.ai Gmail connector. Connect Gmail once in your claude.ai account, and sync can read replies about your applications and propose status changes.',
    },
  ],
};

export const sections: {
  brand: string;
  journey: { title: string; tabsLabel: string; stepLabel: string };
  trust: { title: string; intro: string };
  install: {
    title: string;
    intro: string;
    npxLabel: string;
    globalLabel: string;
    requirements: string;
    startsOn: string;
  };
  faq: { title: string };
  header: { github: string };
  hero: { github: string; requirements: string };
  footer: { github: string; npm: string; readme: string; license: string };
} = {
  brand: 'Job Applications Tracker',
  journey: { title: 'How it works', tabsLabel: 'Journey steps', stepLabel: 'Step' },
  trust: {
    title: 'Why you can trust it',
    intro: 'It is a single-user tool that runs on your machine and works through your agent.',
  },
  install: {
    title: 'Install',
    intro: 'Run it once with npx, or install it globally for the short command.',
    npxLabel: 'Run without installing',
    globalLabel: 'Or install globally',
    requirements: 'Requires Node 22 or newer.',
    startsOn:
      'The app starts on http://127.0.0.1:4173 (or the next free port) and opens your browser.',
  },
  faq: { title: 'Questions' },
  header: { github: 'GitHub' },
  hero: { github: 'View on GitHub', requirements: 'Requires Node 22 or newer.' },
  footer: { github: 'GitHub', npm: 'npm', readme: 'Documentation', license: 'MIT licence' },
};

export const faq: { q: string; a: string }[] = [
  {
    q: 'Can I use another agent instead of Claude Code?',
    a: 'Yes. Pick Codex or a custom command in Setup, or later in Settings → Agent. For Gmail sync, set up a Gmail MCP server in that agent yourself; the app cannot do it for you.',
  },
  {
    q: 'What does the app send to the agent?',
    a: 'For a CV analysis, the text read from your CV (not the file). For a job search, your profile fields, including Notes, and the links of jobs you already have. For Gmail sync, the agent searches and reads your mail, so it sees the messages it finds. That content reaches your agent’s model the same way your other prompts do.',
  },
  {
    q: 'Where does my data live?',
    a: 'In ~/.job-applications-tracker/ unless you choose another folder on the first start. It holds data.db (SQLite), your CVs and the run logs. Change it later with jobtrack config set data-dir <path>.',
  },
  {
    q: 'Does it work on my phone?',
    a: 'No. The interface is for desktop browsers only: Chrome or Edge 111+, Safari 16.4+, or Firefox 128+.',
  },
  {
    q: 'What does it cost?',
    a: 'The app is MIT-licensed. Searches and syncs run on your Claude Code plan, and each run’s page shows what it used. A Max-effort search uses several times the tokens of a normal one, so it asks before it starts.',
  },
  {
    q: 'What do I need?',
    a: 'Node 22 or newer and an agent CLI: Claude Code by default, or Codex or a custom command. Gmail sync also needs a Gmail tool in that agent; for Claude Code, that is the claude.ai Gmail connector.',
  },
];

function collectStrings(value: unknown, out: string[]): string[] {
  if (typeof value === 'string') out.push(value);
  else if (Array.isArray(value)) value.forEach((item) => collectStrings(item, out));
  else if (value && typeof value === 'object') Object.values(value).forEach((item) => collectStrings(item, out));
  return out;
}

export const ALL_COPY: string[] = collectStrings(
  [INSTALL_NPX, INSTALL_GLOBAL, RUN_GLOBAL, meta, hero, journeySteps, trustPoints, claudeCode, sections, faq],
  [],
);
