import type { CommandMode, Favorite } from './types';

/**
 * Build the text a favorite sends.
 *  - `{args}` is replaced by the launcher argument; without it, arguments are appended.
 *  - natural mode rewrites a leading `/skill rest` as a sentence, for setups where slash
 *    commands typed as the first message are not expanded.
 */
export function buildPrompt(favorite: Pick<Favorite, 'command'>, args: string, mode: CommandMode): string {
  const a = args.trim();
  let text = favorite.command.trim();
  if (/\{args\}/.test(text)) text = text.replace(/\{args\}/g, a);
  else if (a) text = `${text} ${a}`;
  text = text.replace(/[ \t]+$/gm, '').trim();

  if (mode === 'natural') {
    const m = /^\/([A-Za-z0-9_:.-]+)(?:\s+([\s\S]*))?$/.exec(text);
    if (m) {
      const rest = (m[2] ?? '').trim();
      return `Run the \`${m[1]}\` command/skill${rest ? ` with this input: ${rest}` : ''}.`;
    }
  }
  return text;
}

/** Provider for `sendPrompt`, taken from a `provider:model` id. */
export function providerOf(model: string): 'claude-code' | 'claude' | 'openai' | 'openai-codex' | undefined {
  const p = model.split(':')[0];
  return p === 'claude-code' || p === 'claude' || p === 'openai' || p === 'openai-codex' ? p : undefined;
}

/** Subsequence match, best score first. Empty query keeps the order. */
export function filterFavorites<T extends { name: string; command: string }>(items: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return items;
  const scored: Array<{ item: T; score: number; index: number }> = [];
  items.forEach((item, index) => {
    const score = Math.max(score1(item.name.toLowerCase(), q) * 2, score1(item.command.toLowerCase(), q));
    if (score > 0) scored.push({ item, score, index });
  });
  return scored.sort((a, b) => b.score - a.score || a.index - b.index).map((s) => s.item);
}

function score1(text: string, q: string): number {
  const at = text.indexOf(q);
  if (at >= 0) return 100 - Math.min(at, 50) + (at === 0 ? 20 : 0);
  let pos = 0;
  let gaps = 0;
  for (const ch of q) {
    const found = text.indexOf(ch, pos);
    if (found < 0) return 0;
    gaps += found - pos;
    pos = found + 1;
  }
  return Math.max(1, 40 - gaps);
}

/**
 * Letter shortcut per favorite: the first letter of its name that nobody has taken yet.
 * Shortcuts are used as Alt+letter, matched by physical key (`KeyA`), because on macOS
 * Alt+letter produces a different character in `event.key`.
 */
export function assignLetters(names: string[]): Array<string | null> {
  const taken = new Set<string>();
  return names.map((name) => {
    for (const ch of name.toLowerCase()) {
      if (/[a-z]/.test(ch) && !taken.has(ch)) {
        taken.add(ch);
        return ch;
      }
    }
    return null;
  });
}
