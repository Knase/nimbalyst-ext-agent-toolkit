import { useEffect, useMemo, useRef, useState } from 'react';
import type { PanelHostProps } from '@nimbalyst/extension-sdk';
import { assignLetters, buildPrompt, filterFavorites } from '../shared/prompt';
import type { Favorite, ToolkitSettings } from '../shared/types';
import { errorText, launchNewSession, loadProjectFavorites, loadSettings, syncProject } from '../services';

export function LauncherPanel({ host }: PanelHostProps) {
  const [settings] = useState<ToolkitSettings>(() => loadSettings(host.storage));
  const [project] = useState<Favorite[]>(() => loadProjectFavorites(host.storage));
  const [query, setQuery] = useState('');
  const [args, setArgs] = useState('');
  const [index, setIndex] = useState(0);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const all = useMemo(() => [...settings.favorites, ...project], [settings, project]);
  const letters = useMemo(() => new Map(all.map((f, i) => [f.id, assignLetters(all.map((x) => x.name))[i] ?? null])), [all]);
  const shown = useMemo(() => filterFavorites(all, query), [all, query]);
  const current = shown[Math.min(index, Math.max(0, shown.length - 1))];

  useEffect(() => searchRef.current?.focus(), []);
  useEffect(() => setIndex(0), [query]);
  useEffect(() => {
    listRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [index, shown]);

  // Opening the launcher is the one moment this window's project is known and the user is here:
  // bring the project's ai-actions.md up to date with the favorites.
  useEffect(() => {
    if (!settings.syncActions) return;
    syncProject(host.workspacePath, settings, project).catch((e) => setMessage({ text: `Actions sync failed: ${errorText(e)}`, error: true }));
  }, [host.workspacePath, settings, project]);

  const run = (fav: Favorite | undefined) => {
    if (!fav) return;
    try {
      launchNewSession(fav, args, settings, (m) => setMessage({ text: m, error: true }));
      host.close();
    } catch (e) {
      setMessage({ text: errorText(e), error: true });
    }
  };

  const copy = async (fav: Favorite | undefined) => {
    if (!fav) return;
    try {
      await navigator.clipboard.writeText(buildPrompt(fav, args, settings.commandMode));
      setMessage({ text: 'Copied. Paste it into the current session.', error: false });
      return true;
    } catch (e) {
      setMessage({ text: errorText(e), error: true });
      return false;
    }
  };

  /** A same-session favorite (`/compact`) means nothing in a fresh session: Enter copies it, ⇧↵ opens one anyway. */
  const primary = (fav: Favorite | undefined, alternate: boolean) => {
    if (!fav) return;
    const copyIt = (fav.launch === 'same-session') !== alternate;
    if (copyIt) void copy(fav).then((ok) => ok && host.close());
    else run(fav);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      host.close();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(i + 1, shown.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      primary(current, e.shiftKey);
    } else if (e.altKey && /^Key[A-Z]$/.test(e.code)) {
      const target = all.find((f) => letters.get(f.id) === e.code.slice(3).toLowerCase());
      if (target) {
        e.preventDefault();
        primary(target, false);
      }
    }
  };

  return (
    <div className="at-root" onKeyDown={onKeyDown}>
      <input
        ref={searchRef}
        className="at-search"
        placeholder="Search favorites…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        aria-label="Search favorites"
      />
      {all.length === 0 ? (
        <div className="at-empty">
          No favorites yet. Add them in Settings → Agent Toolkit.
          <button className="at-btn" onClick={() => { host.close(); host.openSettings(); }}>Open settings</button>
        </div>
      ) : shown.length === 0 ? (
        <div className="at-empty">Nothing matches “{query}”.</div>
      ) : (
        <ul ref={listRef} className="at-list" role="listbox">
          {shown.map((f, i) => {
            const letter = letters.get(f.id);
            return (
              <li
                key={f.id}
                role="option"
                aria-selected={f === current}
                className={`at-item${f === current ? ' at-on' : ''}`}
                onMouseMove={() => setIndex(i)}
                onClick={() => primary(f, false)}
              >
                <span className="at-name">
                  {letter ? <Highlight text={f.name} letter={letter} /> : f.name}
                </span>
                <span className="at-cmd">{f.command}</span>
                {letter && <kbd className="at-kbd">⌥{letter.toUpperCase()}</kbd>}
              </li>
            );
          })}
        </ul>
      )}
      <input
        className="at-args"
        placeholder="Arguments (optional, replaces {args})"
        value={args}
        onChange={(e) => setArgs(e.target.value)}
        aria-label="Arguments"
      />
      <div className={`at-foot${message?.error ? ' at-err' : ''}`}>
        {message
          ? message.text
          : current?.launch === 'same-session'
            ? '↵ copy (same session)   ⇧↵ new session   ⌥letter   esc close'
            : '↵ new session   ⇧↵ copy   ⌥letter   esc close'}
      </div>
    </div>
  );
}

function Highlight({ text, letter }: { text: string; letter: string }) {
  const at = text.toLowerCase().indexOf(letter);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <u>{text[at]}</u>
      {text.slice(at + 1)}
    </>
  );
}
