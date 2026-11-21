import { describe, expect, test } from 'vitest';
import { ALL_COPY, INSTALL_NPX, agents, faq, hero, journeySteps, meta } from '../../src/content/site';

// Global Constraints: phrases that overclaim privacy or imply auto-apply.
const BANNED = [
  'zero setup',
  'nothing leaves your machine',
  'offline',
  'auto-apply',
  'applies for you',
  'applies to jobs for you',
];

describe('site copy', () => {
  test('no banned phrases', () => {
    expect(ALL_COPY.length).toBeGreaterThan(0);
    for (const text of ALL_COPY) {
      for (const phrase of BANNED) {
        expect(text.toLowerCase(), `"${text}" contains "${phrase}"`).not.toContain(phrase);
      }
    }
  });

  test('five journey steps in order', () => {
    expect(journeySteps.map((s) => s.id)).toEqual(['cv', 'jobs', 'apply', 'review', 'dashboard']);
  });

  test('install command exact', () => {
    expect(INSTALL_NPX).toBe('npx job-applications-tracker');
  });

  test('requirements stated', () => {
    expect(faq.some((item) => item.a.includes('Node 22'))).toBe(true);
  });

  test('three-step agent section', () => {
    expect(agents.steps.length).toBe(3);
    expect(agents.steps[0].command).toBe(INSTALL_NPX);
    const texts = agents.steps.map((step) => `${step.title} ${step.body}`);
    expect(texts.some((text) => text.includes('Codex'))).toBe(true);
    const gmail = texts.find((text) => text.includes('Gmail'));
    expect(gmail).toContain('claude.ai');
    expect(gmail).toContain('MCP');
  });

  // Decision 14: the pitch is agent-neutral; "no agent setup" holds only for Claude Code.
  test('headline, title and description are agent-neutral', () => {
    for (const text of [hero.headline, meta.title, meta.description]) {
      expect(text).not.toContain('Claude');
    }
    expect(hero.headline.replace(/\u00a0/g, ' ')).toContain('the AI agent you already use');
  });

  test('"no agent setup" is always scoped to Claude Code', () => {
    for (const text of ALL_COPY) {
      for (const match of text.matchAll(/no agent setup/gi)) {
        expect(text.slice(match.index), `"${text}"`).toMatch(/^no agent setup with Claude Code/i);
      }
    }
  });
});
