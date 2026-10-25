import { describe, expect, it } from 'vitest';
import { syncActionsText, ownHeadings, renderFavorite } from '../actionsFile';
import { assignLetters, buildPrompt, filterFavorites } from '../prompt';
import { newFavorite } from '../types';

const fav = (name: string, command: string, extra = {}) => newFavorite({ name, command, ...extra });

/** Mirror of Nimbalyst's parseActionPromptsFile rules, enough to prove our output round-trips. */
function parse(content: string) {
  const KNOWN = new Set(['launch', 'model', 'effort', 'foreground', 'autoSubmit', 'worktree']);
  const out: Array<{ label: string; config: Record<string, string> | null; body: string }> = [];
  let label: string | null = null;
  let body: string[] = [];
  let fenced = false;
  const flush = () => {
    if (label === null) return;
    let i = 0;
    while (i < body.length && body[i]!.trim() === '') i++;
    const first = /^([a-z][a-zA-Z0-9_-]*)\s*:\s*(.+?)\s*$/.exec(body[i] ?? '');
    let config: Record<string, string> | null = null;
    let consumed = 0;
    if (first && KNOWN.has(first[1]!)) {
      config = {};
      for (; i < body.length; i++) {
        if (body[i]!.trim() === '') { i++; break; }
        const m = /^([a-z][a-zA-Z0-9_-]*)\s*:\s*(.+?)\s*$/.exec(body[i]!);
        if (!m) break;
        config[m[1]!] = m[2]!;
      }
      consumed = i;
    }
    out.push({ label: label.trim(), config, body: body.slice(consumed).join('\n').trim() });
  };
  for (const line of content.split(/\r?\n/)) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const h = !fenced && /^##\s+(.+?)\s*$/.exec(line);
    if (h) { flush(); label = h[1]!; body = []; continue; }
    if (label !== null) body.push(line);
  }
  flush();
  return out;
}

describe('buildPrompt', () => {
  it('fills or appends args', () => {
    expect(buildPrompt({ command: '/bmad-code-review {args}' }, '1.2', 'slash')).toBe('/bmad-code-review 1.2');
    expect(buildPrompt({ command: '/compact' }, 'keep tests', 'slash')).toBe('/compact keep tests');
    expect(buildPrompt({ command: '/bmad-code-review {args}' }, '', 'slash')).toBe('/bmad-code-review');
  });
  it('natural mode rewrites a leading slash command', () => {
    expect(buildPrompt({ command: '/bmad-dev-story {args}' }, 'story.md', 'natural')).toBe('Run the `bmad-dev-story` command/skill with this input: story.md.');
    expect(buildPrompt({ command: 'plain text' }, '', 'natural')).toBe('plain text');
  });
});

describe('filter and letters', () => {
  const items = [fav('Code review', '/bmad-code-review'), fav('Compact', '/compact'), fav('Sprint', '/sprint')];
  it('ranks name hits first and ignores misses', () => {
    expect(filterFavorites(items, 'cr').map((i) => i.name)).toEqual(['Code review']);
    expect(filterFavorites(items, 'zzz')).toEqual([]);
    expect(filterFavorites(items, '')).toBe(items);
  });
  it('gives each favorite its own letter', () => {
    expect(assignLetters(['Code review', 'Compact', 'Sprint', '1 2'])).toEqual(['c', 'o', 's', null]);
  });
});

describe('syncActionsText', () => {
  const existing = `# AI Action Prompts\n\nintro\n\n## Mine\nDo my thing.\n\n## Code\n\`\`\`\n## not a heading\n\`\`\`\ntext\n`;

  it('appends owned sections and leaves the rest byte-identical', () => {
    const next = syncActionsText(existing, [fav('Review', '/review {args}', { launch: 'same-session' })], 'slash')!;
    expect(next.startsWith(existing.trimEnd())).toBe(true);
    const actions = parse(next);
    expect(actions.map((a) => a.label)).toEqual(['Mine', 'Code', '★ Review']);
    expect(actions[2]).toEqual({
      label: '★ Review',
      config: { launch: 'same-session', foreground: 'true', autoSubmit: 'true', worktree: 'false' },
      body: '/review',
    });
  });

  it('is idempotent and replaces in place', () => {
    const a = syncActionsText(existing, [fav('A', '/a'), fav('B', '/b')], 'slash')!;
    expect(syncActionsText(a, [fav('A', '/a'), fav('B', '/b')], 'slash')).toBeNull();
    const b = syncActionsText(a, [fav('B', '/b2')], 'slash')!;
    expect(parse(b).map((x) => x.label)).toEqual(['Mine', 'Code', '★ B']);
    expect(parse(b)[2]!.body).toBe('/b2');
  });

  it('keeps position when own sections sit in the middle', () => {
    const text = `## One\nx\n\n## ★ Old\nlaunch: new-session\n\n/old\n\n## Two\ny\n`;
    const next = syncActionsText(text, [fav('New', '/new')], 'slash')!;
    expect(parse(next).map((x) => x.label)).toEqual(['One', '★ New', 'Two']);
  });

  it('removes owned sections when there are no favorites, never creates an empty file', () => {
    const a = syncActionsText(existing, [fav('A', '/a')], 'slash')!;
    expect(syncActionsText(a, [], 'slash')).toBe(existing);
    expect(syncActionsText(null, [], 'slash')).toBeNull();
    expect(syncActionsText(null, [fav('A', '/a')], 'slash')!.startsWith('## ★ A\n')).toBe(true);
  });

  it('survives hostile bodies and bad models', () => {
    const f = fav('Weird', 'first\n## injected\n```\n## inside fence\n```', { model: 'not a model' });
    const text = renderFavorite(f, 'slash')!;
    const actions = parse(text);
    expect(actions).toHaveLength(1);
    expect(actions[0]!.config).not.toHaveProperty('model');
    expect(actions[0]!.body).toContain('### injected');
    expect(actions[0]!.body).toContain('## inside fence');
  });

  it('skips empty and duplicate favorites, reports own headings', () => {
    const next = syncActionsText('', [fav('Dup', '/a'), fav('dup', '/b'), fav('', '/c'), fav('Empty', '')], 'slash')!;
    expect(parse(next).map((x) => x.label)).toEqual(['★ Dup']);
    expect(ownHeadings(next)).toEqual(['★ Dup']);
  });
});
