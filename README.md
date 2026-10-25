# Agent Toolkit for Nimbalyst

Favorite agent commands for [Nimbalyst](https://nimbalyst.com), in three parts:

- **Favorites**: a list of commands (`/compact`, `/bmad-code-review {args}`, …) managed on one settings page.
- **Quick launcher** (`⌘⇧B`): fuzzy search, arrow keys, Enter, and your command runs in a **new session**.
- **Actions sync**: favorites are written into your project's `nimbalyst-local/ai-actions.md` as `## ★ Name` entries, so they also appear in the composer's **Actions** menu.

Renderer-only: no backend module, so there is no consent prompt. Permissions: `filesystem`, `ai`.

> Early version (0.1.0). Built against Extension SDK 0.7.1 and covered by unit tests and a browser harness. Not yet verified across many real setups. Issues welcome.

## Install

1. In Nimbalyst open **Settings → Extensions → Marketplace**.
2. Paste this repository's URL at the bottom of the Discover page.
3. Check **Settings → Extensions → Installed**: the extension is listed and enabled.

Local development: enable **Extension Dev Tools** (Settings → Advanced), run `npm install && npm run build`, then ask Claude: *"Build and install my extension from /path/to/agent-toolkit"*.

## Usage

### Favorites
Open the extension's settings page (Settings → Agent Toolkit).

| Field | Meaning |
|---|---|
| Name / Command | What you see and what is sent. `{args}` marks where the launcher argument goes; without it, arguments are appended |
| Scope | All projects, or this project only |
| Launch | `new-session` or `same-session`, used by the Actions menu |
| Model | `provider:variant` (e.g. `claude-code:opus`), or inherit |
| send / worktree | `autoSubmit` and `worktree` for the Actions entry |

Reorder by dragging. **+ Add starter set** adds `/compact`, `/bmad-help`, `/bmad-code-review {args}`, `/bmad-sprint-status`.

### Launcher (`⌘⇧B`)

| Key | Action |
|---|---|
| type | filter favorites |
| `↑` `↓` | move selection |
| `↵` | start a **new session** with the command |
| `⇧↵` | copy the command to the clipboard |
| `⌥` + letter | run the favorite with that underlined letter |
| `Esc` | close |

The argument field fills `{args}`. For `same-session` favorites (like `/compact`) the keys are inverted: `↵` copies, `⇧↵` opens a new session, because running `/compact` in an empty session does nothing.

### Actions sync
Entries use the format Nimbalyst's Actions parser expects:

```markdown
## ★ Code review
launch: new-session
model: claude-code:sonnet
foreground: true
autoSubmit: true
worktree: false

/bmad-code-review
```

- Only sections whose heading starts with `★` are managed; the rest of the file is left byte-for-byte.
- Sync runs for a project when its launcher or settings page is opened, and after edits (debounced).
- **Remove ★ entries from this project** deletes them; turning sync off stops further writes.

### Command mode
- `/skill`: send the command as typed (default).
- `natural`: turn a leading `/skill rest` into *"Run the \`skill\` command/skill with this input: rest."* Use it if slash commands aren't expanded as the first message of a session.

## Limitations

- Cannot add a separate dropdown next to Actions, clear the current session, or change the `/` menu: the public SDK has no hooks for them.
- The launcher always creates a new session; it cannot type into the current one (use `⇧↵` to copy).
- The launcher doesn't wait for the agent's reply; errors are shown in its footer.
- Actions sync for a project runs only once its launcher or settings page has been opened in that window.

## Development

```bash
npm install
npm run typecheck
npm test
npm run build      # vite build + SDK bundle validation
```

`dist/` is committed so Nimbalyst can install straight from GitHub.

```
src/shared/       pure logic: prompt building, filtering, ai-actions.md sync (tested)
src/services.ts   filesystem / ai services captured in activate()
src/components/   LauncherPanel, ToolkitSettings
```

## License

MIT License — see [LICENSE](LICENSE) for details.