/**
 * Agent Toolkit: favorites, a Cmd+Shift+B launcher, and sync into the composer's Actions menu.
 * Renderer-only: it needs no backend module, so it asks for no extra consent.
 */
import './styles.css';
import type { ExtensionContext } from '@nimbalyst/extension-sdk';
import { LauncherPanel } from './components/LauncherPanel';
import { ToolkitSettings } from './components/ToolkitSettings';
import { setServices } from './services';

export async function activate(context: ExtensionContext): Promise<void> {
  setServices(context.services);
}

export async function deactivate(): Promise<void> {
  setServices(null);
}

export const panels = {
  launcher: { component: LauncherPanel },
};

export const settingsPanel = {
  ToolkitSettings,
};
