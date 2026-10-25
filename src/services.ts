/**
 * Renderer services captured in `activate()`. Panels and settings live in the same
 * bundle, so a module-level holder is how they reach `filesystem` and `ai`.
 */
import type { ExtensionServices, ExtensionStorage } from '@nimbalyst/extension-sdk';
import { syncActionsText } from './shared/actionsFile';
import { buildPrompt, providerOf } from './shared/prompt';
import {
  STORAGE_GLOBAL_KEY,
  STORAGE_PROJECT_KEY,
  mergeToolkitSettings,
  type Favorite,
  type ToolkitSettings,
} from './shared/types';

let services: ExtensionServices | null = null;

export const setServices = (s: ExtensionServices | null): void => {
  services = s;
};

export const errorText = (e: unknown): string => (e instanceof Error ? e.message : String(e));

export function loadSettings(storage: ExtensionStorage): ToolkitSettings {
  try {
    return mergeToolkitSettings(storage.getGlobal<Partial<ToolkitSettings>>(STORAGE_GLOBAL_KEY));
  } catch {
    return mergeToolkitSettings(undefined);
  }
}

export function loadProjectFavorites(storage: ExtensionStorage): Favorite[] {
  try {
    const raw = storage.get<Favorite[]>(STORAGE_PROJECT_KEY);
    return mergeToolkitSettings({ favorites: Array.isArray(raw) ? raw : [] }).favorites;
  } catch {
    return [];
  }
}

export async function saveSettings(storage: ExtensionStorage, s: ToolkitSettings): Promise<void> {
  await storage.setGlobal(STORAGE_GLOBAL_KEY, s);
}

export async function saveProjectFavorites(storage: ExtensionStorage, f: Favorite[]): Promise<void> {
  await storage.set(STORAGE_PROJECT_KEY, f);
}

const actionsPath = (workspacePath: string): string => `${workspacePath.replace(/[\\/]+$/, '')}/nimbalyst-local/ai-actions.md`;

export interface SyncResult {
  changed: boolean;
  path: string;
}

/**
 * Write this project's favorites (global first, then project-only) into its ai-actions.md.
 * With `enabled` false, our ★ entries are removed instead.
 */
export async function syncProject(workspacePath: string, settings: ToolkitSettings, projectFavorites: Favorite[], enabled = settings.syncActions): Promise<SyncResult> {
  if (!services) throw new Error('Agent Toolkit is not activated yet.');
  const fs = services.filesystem;
  const path = actionsPath(workspacePath);
  const existing = (await fs.fileExists(path)) ? await fs.readFile(path) : null;
  const favorites = enabled ? [...settings.favorites, ...projectFavorites] : [];
  const next = syncActionsText(existing, favorites, settings.commandMode);
  if (next === null) return { changed: false, path };
  await fs.writeFile(path, next);
  return { changed: true, path };
}

/**
 * Start a new session with a favorite. Does not wait for the agent: `sendPrompt` resolves
 * only after the whole response, so the promise is left running and its failure reported.
 */
export function launchNewSession(fav: Favorite, args: string, settings: ToolkitSettings, onError: (message: string) => void): void {
  const ai = services?.ai;
  if (!ai) throw new Error('The ai permission is not available to this extension.');
  const model = fav.model.trim() || settings.launcherModel.trim();
  const provider = model ? providerOf(model) : undefined;
  void ai
    .sendPrompt({
      prompt: buildPrompt(fav, args, settings.commandMode),
      sessionName: fav.name,
      ...(model ? { model } : {}),
      ...(provider ? { provider } : {}),
    })
    .catch((e: unknown) => onError(errorText(e)));
}
