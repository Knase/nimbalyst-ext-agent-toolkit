export type LaunchMode = 'same-session' | 'new-session';
export type CommandMode = 'slash' | 'natural';

export interface Favorite {
  id: string;
  name: string;
  /** What to send, usually a slash command (`/bmad-code-review`). `{args}` marks where launcher arguments go. */
  command: string;
  /** How the composer's Actions menu should launch it (synced entries). */
  launch: LaunchMode;
  /** `provider:variant`, e.g. `claude-code:opus`. Empty: inherit. */
  model: string;
  autoSubmit: boolean;
  worktree: boolean;
}

export interface ToolkitSettings {
  /** Favorites shown in every project. */
  favorites: Favorite[];
  /** Model for sessions started from the launcher. Empty: provider default. */
  launcherModel: string;
  /** `slash`: send the command as typed. `natural`: turn a leading `/skill` into a plain sentence. */
  commandMode: CommandMode;
  /** Write favorites into each project's nimbalyst-local/ai-actions.md. */
  syncActions: boolean;
}

export const DEFAULT_TOOLKIT_SETTINGS: ToolkitSettings = {
  favorites: [],
  launcherModel: 'claude-code:sonnet',
  commandMode: 'slash',
  syncActions: true,
};

export const STORAGE_GLOBAL_KEY = 'toolkit.v1';
export const STORAGE_PROJECT_KEY = 'favorites.project.v1';
/** Prefix of every Actions entry this extension owns. Nothing else is ever rewritten. */
export const OWN_PREFIX = '★';

export function newFavorite(partial: Partial<Favorite> = {}): Favorite {
  return {
    id: `fav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: 'New favorite',
    command: '',
    launch: 'new-session',
    model: '',
    autoSubmit: true,
    worktree: false,
    ...partial,
  };
}

export function mergeToolkitSettings(stored: Partial<ToolkitSettings> | undefined): ToolkitSettings {
  const s = stored ?? {};
  return {
    ...DEFAULT_TOOLKIT_SETTINGS,
    ...s,
    favorites: Array.isArray(s.favorites) ? s.favorites.map((f) => ({ ...newFavorite(), ...f })) : [],
  };
}

export const STARTER_FAVORITES: Array<Partial<Favorite>> = [
  { name: 'Compact', command: '/compact', launch: 'same-session' },
  { name: 'BMAD help', command: '/bmad-help', launch: 'new-session' },
  { name: 'Code review', command: '/bmad-code-review {args}', launch: 'new-session' },
  { name: 'Sprint status', command: '/bmad-sprint-status', launch: 'new-session' },
];
