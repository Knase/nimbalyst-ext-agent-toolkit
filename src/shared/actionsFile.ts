/**
 * Sync favorites into `nimbalyst-local/ai-actions.md`.
 *
 * Format (from Nimbalyst's ActionPromptParser): `## Heading` starts an action
 * (not inside a code fence); optional config is contiguous `key: value` lines right
 * under the heading, ended by a blank line; everything after is the prompt.
 *
 * Only sections whose heading starts with the `★` prefix are ours. Every other byte of
 * the file stays as it was. Our sections are written where the first one used to be
 * (else at the end), so repeated syncs do not shuffle the file.
 */
import { buildPrompt } from './prompt';
import { OWN_PREFIX, type CommandMode, type Favorite } from './types';

interface Section {
  /** Heading text without `## `, or null for the preamble. */
  heading: string | null;
  /** Raw lines including the heading line. */
  lines: string[];
}

function split(text: string): Section[] {
  const sections: Section[] = [{ heading: null, lines: [] }];
  let fenced = false;
  for (const line of text.split('\n')) {
    if (/^\s*```/.test(line)) fenced = !fenced;
    const m = !fenced ? /^##\s+(.+?)\s*\r?$/.exec(line) : null;
    if (m) sections.push({ heading: m[1]!, lines: [line] });
    else sections[sections.length - 1]!.lines.push(line);
  }
  return sections;
}

const isOwn = (s: Section): boolean => s.heading !== null && s.heading.startsWith(OWN_PREFIX);

const MODEL_RE = /^[a-z][a-z0-9_-]*:\S+$/i;

/** Body lines that would open a new action (`## x`) are demoted so the entry stays one entry. */
function safeBody(body: string): string {
  let fenced = false;
  return body
    .split('\n')
    .map((line) => {
      if (/^\s*```/.test(line)) fenced = !fenced;
      return !fenced && /^##\s/.test(line) ? `#${line}` : line;
    })
    .join('\n');
}

export function renderFavorite(f: Favorite, mode: CommandMode): string | null {
  const name = f.name.replace(/\s+/g, ' ').trim();
  // {args} has no meaning inside the Actions menu: it is filled in the launcher only.
  const body = buildPrompt(f, '', mode);
  if (!name || !body) return null;
  const lines = [`## ${OWN_PREFIX} ${name}`, `launch: ${f.launch}`];
  if (f.model && MODEL_RE.test(f.model.trim())) lines.push(`model: ${f.model.trim()}`);
  lines.push('foreground: true', `autoSubmit: ${f.autoSubmit}`, `worktree: ${f.worktree}`, '', safeBody(body), '');
  return lines.join('\n');
}

export function headingOf(f: Favorite): string {
  return `${OWN_PREFIX} ${f.name.replace(/\s+/g, ' ').trim()}`;
}

/**
 * New file content, or null when nothing needs writing (no change, or nothing to write
 * to a file that does not exist).
 */
export function syncActionsText(existing: string | null, favorites: Favorite[], mode: CommandMode): string | null {
  const blocks: string[] = [];
  const seen = new Set<string>();
  for (const f of favorites) {
    const key = headingOf(f).toLowerCase();
    if (seen.has(key)) continue; // duplicate heading: the parser would drop it anyway
    const block = renderFavorite(f, mode);
    if (block) {
      seen.add(key);
      blocks.push(block);
    }
  }
  if (existing === null && blocks.length === 0) return null;

  const sections = split(existing ?? '');
  const out: string[] = [];
  let placed = false;
  const own = blocks.join('\n');
  for (const s of sections) {
    if (isOwn(s)) {
      if (!placed && own) {
        out.push(own);
        placed = true;
      }
      continue;
    }
    out.push(s.lines.join('\n'));
  }
  let text = out.join('\n');
  if (!placed && own) {
    text = text.replace(/\s*$/, '');
    text = (text ? text + '\n\n' : '') + own;
  }
  if (text && !text.endsWith('\n')) text += '\n';
  // Collapse the blank runs left behind where our sections were removed.
  text = text.replace(/\n{3,}/g, '\n\n');
  return text === existing ? null : text;
}

/** Headings of our own sections currently in a file. */
export function ownHeadings(existing: string): string[] {
  return split(existing).filter(isOwn).map((s) => s.heading!);
}
