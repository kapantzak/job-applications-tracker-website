import { describe, expect, test } from 'vitest';
import { ALL_COPY, INSTALL_NPX, claudeCode, faq, journeySteps } from '../../src/content/site';

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

  test('two-step Claude Code section', () => {
    expect(claudeCode.steps.length).toBe(2);
    expect(claudeCode.steps[0].command).toBe(INSTALL_NPX);
    const second = `${claudeCode.steps[1].title} ${claudeCode.steps[1].body}`;
    expect(second).toContain('Gmail');
    expect(second).toContain('claude.ai');
  });
});
