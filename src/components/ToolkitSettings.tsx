import { useEffect, useRef, useState } from 'react';
import type { SettingsPanelProps } from '@nimbalyst/extension-sdk';
import {
  STARTER_FAVORITES,
  newFavorite,
  type CommandMode,
  type Favorite,
  type LaunchMode,
  type ToolkitSettings as Settings,
} from '../shared/types';
import { errorText, loadProjectFavorites, loadSettings, saveProjectFavorites, saveSettings, syncProject } from '../services';

type Scope = 'all' | 'project';
interface Row extends Favorite {
  scope: Scope;
}

const MODELS = ['', 'claude-code:sonnet', 'claude-code:opus', 'claude-code:haiku'];

export function ToolkitSettings({ storage, workspacePath }: SettingsPanelProps) {
  const [settings, setSettings] = useState<Settings>(() => loadSettings(storage));
  const [project, setProject] = useState<Favorite[]>(() => loadProjectFavorites(storage));
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const timer = useRef<number | undefined>(undefined);

  const rows: Row[] = [
    ...settings.favorites.map((f) => ({ ...f, scope: 'all' as const })),
    ...project.map((f) => ({ ...f, scope: 'project' as const })),
  ];

  const say = (text: string, error = false) => setStatus({ text, error });

  /** Persist everything, then (debounced) sync this project's Actions file. */
  const commit = (nextSettings: Settings, nextProject: Favorite[]) => {
    setSettings(nextSettings);
    setProject(nextProject);
    saveSettings(storage, nextSettings)
      .then(() => saveProjectFavorites(storage, nextProject))
      .catch((e) => say(`Could not save: ${errorText(e)}`, true));
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => void sync(nextSettings, nextProject), 600);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);

  const sync = async (s = settings, p = project, enabled = s.syncActions) => {
    if (!workspacePath) return say('No project is open, so there is no ai-actions.md to write.', true);
    try {
      const r = await syncProject(workspacePath, s, p, enabled);
      say(r.changed ? `Updated ${r.path}` : 'ai-actions.md is already up to date.');
    } catch (e) {
      say(`Sync failed: ${errorText(e)}`, true);
    }
  };

  const fromRows = (list: Row[]) => {
    const strip = ({ scope: _scope, ...f }: Row): Favorite => f;
    return {
      favorites: list.filter((r) => r.scope === 'all').map(strip),
      project: list.filter((r) => r.scope === 'project').map(strip),
    };
  };
  const setRows = (list: Row[]) => {
    const { favorites, project: p } = fromRows(list);
    commit({ ...settings, favorites }, p);
  };
  const patchRow = (id: string, patch: Partial<Row>) => setRows(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const move = (from: string, to: string) => {
    if (from === to) return;
    const list = [...rows];
    const a = list.findIndex((r) => r.id === from);
    const b = list.findIndex((r) => r.id === to);
    if (a < 0 || b < 0) return;
    const [item] = list.splice(a, 1);
    list.splice(b, 0, item!);
    setRows(list);
  };

  return (
    <div className="at-settings">
      <h2>Agent Toolkit</h2>
      <p className="at-hint">
        Favorites appear in the launcher (⌘⇧B) and, with sync on, in the composer's Actions menu as “★ name”.
        Sync runs for a project when this page or the launcher is opened there.
      </p>

      <h3>Favorites</h3>
      {rows.length === 0 && <div className="at-hint">None yet.</div>}
      {rows.map((r) => (
        <div
          key={r.id}
          className={`at-row${dragId === r.id ? ' at-dragging' : ''}`}
          draggable
          onDragStart={() => setDragId(r.id)}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => e.preventDefault()}
          onDrop={() => dragId && move(dragId, r.id)}
        >
          <span className="at-grip" title="Drag to reorder" aria-hidden>⠿</span>
          <input className="at-input at-w-name" value={r.name} placeholder="Name" onChange={(e) => patchRow(r.id, { name: e.target.value })} />
          <input className="at-input at-w-cmd" value={r.command} placeholder="/command {args}" onChange={(e) => patchRow(r.id, { command: e.target.value })} />
          <select className="at-input" value={r.scope} onChange={(e) => patchRow(r.id, { scope: e.target.value as Scope })} title="Where it shows up">
            <option value="all">All projects</option>
            <option value="project">This project</option>
          </select>
          <select className="at-input" value={r.launch} onChange={(e) => patchRow(r.id, { launch: e.target.value as LaunchMode })} title="How the Actions menu runs it (the launcher always opens a new session)">
            <option value="new-session">new session</option>
            <option value="same-session">same session</option>
          </select>
          <select className="at-input" value={r.model} onChange={(e) => patchRow(r.id, { model: e.target.value })} title="Model override">
            {(MODELS.includes(r.model) ? MODELS : [...MODELS, r.model]).map((m) => <option key={m} value={m}>{m || 'inherit'}</option>)}
          </select>
          <label className="at-check" title="Send immediately instead of leaving it in the composer"><input type="checkbox" checked={r.autoSubmit} onChange={(e) => patchRow(r.id, { autoSubmit: e.target.checked })} /> send</label>
          <label className="at-check" title="Run in a git worktree"><input type="checkbox" checked={r.worktree} onChange={(e) => patchRow(r.id, { worktree: e.target.checked })} /> worktree</label>
          <button className="at-btn" aria-label={`Delete ${r.name}`} onClick={() => setRows(rows.filter((x) => x.id !== r.id))}>✕</button>
        </div>
      ))}
      <div className="at-actions">
        <button className="at-btn" onClick={() => setRows([...rows, { ...newFavorite(), scope: 'all' }])}>+ Add favorite</button>
        <button className="at-btn" onClick={() => setRows([...rows, ...STARTER_FAVORITES.map((f) => ({ ...newFavorite(f), scope: 'all' as const }))])}>+ Add starter set</button>
      </div>

      <h3>Launcher</h3>
      <div className="at-form">
        <label>Model for launcher sessions
          <select className="at-input" value={settings.launcherModel} onChange={(e) => commit({ ...settings, launcherModel: e.target.value }, project)}>
            {(MODELS.includes(settings.launcherModel) ? MODELS : [...MODELS, settings.launcherModel]).map((m) => <option key={m} value={m}>{m || 'provider default'}</option>)}
          </select>
        </label>
        <label>Command mode
          <select className="at-input" value={settings.commandMode} onChange={(e) => commit({ ...settings, commandMode: e.target.value as CommandMode }, project)}>
            <option value="slash">/skill, sent as typed</option>
            <option value="natural">natural language (“Run the … command”)</option>
          </select>
        </label>
        <label className="at-check">
          <input
            type="checkbox"
            checked={settings.syncActions}
            onChange={(e) => {
              const next = { ...settings, syncActions: e.target.checked };
              commit(next, project);
            }}
          />{' '}
          Sync favorites into the Actions menu (nimbalyst-local/ai-actions.md)
        </label>
      </div>
      <div className="at-actions">
        <button className="at-btn" onClick={() => void sync()}>Sync now</button>
        <button className="at-btn" onClick={() => void sync(settings, project, false)}>Remove ★ entries from this project</button>
      </div>
      {status && <div className={`at-status${status.error ? ' at-err' : ''}`} role="status">{status.text}</div>}
    </div>
  );
}
