import { jsxs as h, jsx as i, Fragment as P } from "react/jsx-runtime";
import { useState as N, useRef as R, useMemo as O, useEffect as M } from "react";
function I(e, a, s) {
  const r = a.trim();
  let o = e.command.trim();
  if (/\{args\}/.test(o) ? o = o.replace(/\{args\}/g, r) : r && (o = `${o} ${r}`), o = o.replace(/[ \t]+$/gm, "").trim(), s === "natural") {
    const l = /^\/([A-Za-z0-9_:.-]+)(?:\s+([\s\S]*))?$/.exec(o);
    if (l) {
      const d = (l[2] ?? "").trim();
      return `Run the \`${l[1]}\` command/skill${d ? ` with this input: ${d}` : ""}.`;
    }
  }
  return o;
}
function H(e) {
  const a = e.split(":")[0];
  return a === "claude-code" || a === "claude" || a === "openai" || a === "openai-codex" ? a : void 0;
}
function V(e, a) {
  const s = a.trim().toLowerCase();
  if (!s) return e;
  const r = [];
  return e.forEach((o, l) => {
    const d = Math.max(K(o.name.toLowerCase(), s) * 2, K(o.command.toLowerCase(), s));
    d > 0 && r.push({ item: o, score: d, index: l });
  }), r.sort((o, l) => l.score - o.score || o.index - l.index).map((o) => o.item);
}
function K(e, a) {
  const s = e.indexOf(a);
  if (s >= 0) return 100 - Math.min(s, 50) + (s === 0 ? 20 : 0);
  let r = 0, o = 0;
  for (const l of a) {
    const d = e.indexOf(l, r);
    if (d < 0) return 0;
    o += d - r, r = d + 1;
  }
  return Math.max(1, 40 - o);
}
function Y(e) {
  const a = /* @__PURE__ */ new Set();
  return e.map((s) => {
    for (const r of s.toLowerCase())
      if (/[a-z]/.test(r) && !a.has(r))
        return a.add(r), r;
    return null;
  });
}
const Z = {
  favorites: [],
  launcherModel: "claude-code:sonnet",
  commandMode: "slash",
  syncActions: !0
}, G = "toolkit.v1", z = "favorites.project.v1", _ = "★";
function L(e = {}) {
  return {
    id: `fav-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: "New favorite",
    command: "",
    launch: "new-session",
    model: "",
    autoSubmit: !0,
    worktree: !1,
    ...e
  };
}
function F(e) {
  const a = e ?? {};
  return {
    ...Z,
    ...a,
    favorites: Array.isArray(a.favorites) ? a.favorites.map((s) => ({ ...L(), ...s })) : []
  };
}
const J = [
  { name: "Compact", command: "/compact", launch: "same-session" },
  { name: "BMAD help", command: "/bmad-help", launch: "new-session" },
  { name: "Code review", command: "/bmad-code-review {args}", launch: "new-session" },
  { name: "Sprint status", command: "/bmad-sprint-status", launch: "new-session" }
];
function Q(e) {
  const a = [{ heading: null, lines: [] }];
  let s = !1;
  for (const r of e.split(`
`)) {
    /^\s*```/.test(r) && (s = !s);
    const o = s ? null : /^##\s+(.+?)\s*\r?$/.exec(r);
    o ? a.push({ heading: o[1], lines: [r] }) : a[a.length - 1].lines.push(r);
  }
  return a;
}
const X = (e) => e.heading !== null && e.heading.startsWith(_), ee = /^[a-z][a-z0-9_-]*:\S+$/i;
function te(e) {
  let a = !1;
  return e.split(`
`).map((s) => (/^\s*```/.test(s) && (a = !a), !a && /^##\s/.test(s) ? `#${s}` : s)).join(`
`);
}
function ne(e, a) {
  const s = e.name.replace(/\s+/g, " ").trim(), r = I(e, "", a);
  if (!s || !r) return null;
  const o = [`## ${_} ${s}`, `launch: ${e.launch}`];
  return e.model && ee.test(e.model.trim()) && o.push(`model: ${e.model.trim()}`), o.push("foreground: true", `autoSubmit: ${e.autoSubmit}`, `worktree: ${e.worktree}`, "", te(r), ""), o.join(`
`);
}
function ae(e) {
  return `${_} ${e.name.replace(/\s+/g, " ").trim()}`;
}
function se(e, a, s) {
  const r = [], o = /* @__PURE__ */ new Set();
  for (const f of a) {
    const g = ae(f).toLowerCase();
    if (o.has(g)) continue;
    const k = ne(f, s);
    k && (o.add(g), r.push(k));
  }
  if (e === null && r.length === 0) return null;
  const l = Q(e ?? ""), d = [];
  let v = !1;
  const p = r.join(`
`);
  for (const f of l) {
    if (X(f)) {
      !v && p && (d.push(p), v = !0);
      continue;
    }
    d.push(f.lines.join(`
`));
  }
  let m = d.join(`
`);
  return !v && p && (m = m.replace(/\s*$/, ""), m = (m ? m + `

` : "") + p), m && !m.endsWith(`
`) && (m += `
`), m = m.replace(/\n{3,}/g, `

`), m === e ? null : m;
}
let T = null;
const B = (e) => {
  T = e;
}, x = (e) => e instanceof Error ? e.message : String(e);
function U(e) {
  try {
    return F(e.getGlobal(G));
  } catch {
    return F(void 0);
  }
}
function W(e) {
  try {
    const a = e.get(z);
    return F({ favorites: Array.isArray(a) ? a : [] }).favorites;
  } catch {
    return [];
  }
}
async function oe(e, a) {
  await e.setGlobal(G, a);
}
async function ce(e, a) {
  await e.set(z, a);
}
const re = (e) => `${e.replace(/[\\/]+$/, "")}/nimbalyst-local/ai-actions.md`;
async function q(e, a, s, r = a.syncActions) {
  if (!T) throw new Error("Agent Toolkit is not activated yet.");
  const o = T.filesystem, l = re(e), d = await o.fileExists(l) ? await o.readFile(l) : null, v = r ? [...a.favorites, ...s] : [], p = se(d, v, a.commandMode);
  return p === null ? { changed: !1, path: l } : (await o.writeFile(l, p), { changed: !0, path: l });
}
function ie(e, a, s, r) {
  const o = T?.ai;
  if (!o) throw new Error("The ai permission is not available to this extension.");
  const l = e.model.trim() || s.launcherModel.trim(), d = l ? H(l) : void 0;
  o.sendPrompt({
    prompt: I(e, a, s.commandMode),
    sessionName: e.name,
    ...l ? { model: l } : {},
    ...d ? { provider: d } : {}
  }).catch((v) => r(x(v)));
}
function le({ host: e }) {
  const [a] = N(() => U(e.storage)), [s] = N(() => W(e.storage)), [r, o] = N(""), [l, d] = N(""), [v, p] = N(0), [m, f] = N(null), g = R(null), k = R(null), w = O(() => [...a.favorites, ...s], [a, s]), C = O(() => new Map(w.map((t, u) => [t.id, Y(w.map((y) => y.name))[u] ?? null])), [w]), A = O(() => V(w, r), [w, r]), b = A[Math.min(v, Math.max(0, A.length - 1))];
  M(() => g.current?.focus(), []), M(() => p(0), [r]), M(() => {
    k.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [v, A]), M(() => {
    a.syncActions && q(e.workspacePath, a, s).catch((t) => f({ text: `Actions sync failed: ${x(t)}`, error: !0 }));
  }, [e.workspacePath, a, s]);
  const S = (t) => {
    if (t)
      try {
        ie(t, l, a, (u) => f({ text: u, error: !0 })), e.close();
      } catch (u) {
        f({ text: x(u), error: !0 });
      }
  }, j = async (t) => {
    if (t)
      try {
        return await navigator.clipboard.writeText(I(t, l, a.commandMode)), f({ text: "Copied. Paste it into the current session.", error: !1 }), !0;
      } catch (u) {
        return f({ text: x(u), error: !0 }), !1;
      }
  }, n = (t, u) => {
    if (!t) return;
    t.launch === "same-session" !== u ? j(t).then((E) => E && e.close()) : S(t);
  };
  return /* @__PURE__ */ h("div", { className: "at-root", onKeyDown: (t) => {
    if (t.key === "Escape")
      t.preventDefault(), e.close();
    else if (t.key === "ArrowDown")
      t.preventDefault(), p((u) => Math.min(u + 1, A.length - 1));
    else if (t.key === "ArrowUp")
      t.preventDefault(), p((u) => Math.max(u - 1, 0));
    else if (t.key === "Enter")
      t.preventDefault(), n(b, t.shiftKey);
    else if (t.altKey && /^Key[A-Z]$/.test(t.code)) {
      const u = w.find((y) => C.get(y.id) === t.code.slice(3).toLowerCase());
      u && (t.preventDefault(), n(u, !1));
    }
  }, children: [
    /* @__PURE__ */ i(
      "input",
      {
        ref: g,
        className: "at-search",
        placeholder: "Search favorites…",
        value: r,
        onChange: (t) => o(t.target.value),
        "aria-label": "Search favorites"
      }
    ),
    w.length === 0 ? /* @__PURE__ */ h("div", { className: "at-empty", children: [
      "No favorites yet. Add them in Settings → Agent Toolkit.",
      /* @__PURE__ */ i("button", { className: "at-btn", onClick: () => {
        e.close(), e.openSettings();
      }, children: "Open settings" })
    ] }) : A.length === 0 ? /* @__PURE__ */ h("div", { className: "at-empty", children: [
      "Nothing matches “",
      r,
      "”."
    ] }) : /* @__PURE__ */ i("ul", { ref: k, className: "at-list", role: "listbox", children: A.map((t, u) => {
      const y = C.get(t.id);
      return /* @__PURE__ */ h(
        "li",
        {
          role: "option",
          "aria-selected": t === b,
          className: `at-item${t === b ? " at-on" : ""}`,
          onMouseMove: () => p(u),
          onClick: () => n(t, !1),
          children: [
            /* @__PURE__ */ i("span", { className: "at-name", children: y ? /* @__PURE__ */ i(ue, { text: t.name, letter: y }) : t.name }),
            /* @__PURE__ */ i("span", { className: "at-cmd", children: t.command }),
            y && /* @__PURE__ */ h("kbd", { className: "at-kbd", children: [
              "⌥",
              y.toUpperCase()
            ] })
          ]
        },
        t.id
      );
    }) }),
    /* @__PURE__ */ i(
      "input",
      {
        className: "at-args",
        placeholder: "Arguments (optional, replaces {args})",
        value: l,
        onChange: (t) => d(t.target.value),
        "aria-label": "Arguments"
      }
    ),
    /* @__PURE__ */ i("div", { className: `at-foot${m?.error ? " at-err" : ""}`, children: m ? m.text : b?.launch === "same-session" ? "↵ copy (same session)   ⇧↵ new session   ⌥letter   esc close" : "↵ new session   ⇧↵ copy   ⌥letter   esc close" })
  ] });
}
function ue({ text: e, letter: a }) {
  const s = e.toLowerCase().indexOf(a);
  return s < 0 ? /* @__PURE__ */ i(P, { children: e }) : /* @__PURE__ */ h(P, { children: [
    e.slice(0, s),
    /* @__PURE__ */ i("u", { children: e[s] }),
    e.slice(s + 1)
  ] });
}
const $ = ["", "claude-code:sonnet", "claude-code:opus", "claude-code:haiku"];
function de({ storage: e, workspacePath: a }) {
  const [s, r] = N(() => U(e)), [o, l] = N(() => W(e)), [d, v] = N(null), [p, m] = N(null), f = R(void 0), g = [
    ...s.favorites.map((n) => ({ ...n, scope: "all" })),
    ...o.map((n) => ({ ...n, scope: "project" }))
  ], k = (n, c = !1) => v({ text: n, error: c }), w = (n, c) => {
    r(n), l(c), oe(e, n).then(() => ce(e, c)).catch((t) => k(`Could not save: ${x(t)}`, !0)), window.clearTimeout(f.current), f.current = window.setTimeout(() => {
      C(n, c);
    }, 600);
  };
  M(() => () => window.clearTimeout(f.current), []);
  const C = async (n = s, c = o, t = n.syncActions) => {
    if (!a) return k("No project is open, so there is no ai-actions.md to write.", !0);
    try {
      const u = await q(a, n, c, t);
      k(u.changed ? `Updated ${u.path}` : "ai-actions.md is already up to date.");
    } catch (u) {
      k(`Sync failed: ${x(u)}`, !0);
    }
  }, A = (n) => {
    const c = ({ scope: t, ...u }) => u;
    return {
      favorites: n.filter((t) => t.scope === "all").map(c),
      project: n.filter((t) => t.scope === "project").map(c)
    };
  }, b = (n) => {
    const { favorites: c, project: t } = A(n);
    w({ ...s, favorites: c }, t);
  }, S = (n, c) => b(g.map((t) => t.id === n ? { ...t, ...c } : t)), j = (n, c) => {
    if (n === c) return;
    const t = [...g], u = t.findIndex((D) => D.id === n), y = t.findIndex((D) => D.id === c);
    if (u < 0 || y < 0) return;
    const [E] = t.splice(u, 1);
    t.splice(y, 0, E), b(t);
  };
  return /* @__PURE__ */ h("div", { className: "at-settings", children: [
    /* @__PURE__ */ i("h2", { children: "Agent Toolkit" }),
    /* @__PURE__ */ i("p", { className: "at-hint", children: "Favorites appear in the launcher (⌘⇧B) and, with sync on, in the composer's Actions menu as “★ name”. Sync runs for a project when this page or the launcher is opened there." }),
    /* @__PURE__ */ i("h3", { children: "Favorites" }),
    g.length === 0 && /* @__PURE__ */ i("div", { className: "at-hint", children: "None yet." }),
    g.map((n) => /* @__PURE__ */ h(
      "div",
      {
        className: `at-row${p === n.id ? " at-dragging" : ""}`,
        draggable: !0,
        onDragStart: () => m(n.id),
        onDragEnd: () => m(null),
        onDragOver: (c) => c.preventDefault(),
        onDrop: () => p && j(p, n.id),
        children: [
          /* @__PURE__ */ i("span", { className: "at-grip", title: "Drag to reorder", "aria-hidden": !0, children: "⠿" }),
          /* @__PURE__ */ i("input", { className: "at-input at-w-name", value: n.name, placeholder: "Name", onChange: (c) => S(n.id, { name: c.target.value }) }),
          /* @__PURE__ */ i("input", { className: "at-input at-w-cmd", value: n.command, placeholder: "/command {args}", onChange: (c) => S(n.id, { command: c.target.value }) }),
          /* @__PURE__ */ h("select", { className: "at-input", value: n.scope, onChange: (c) => S(n.id, { scope: c.target.value }), title: "Where it shows up", children: [
            /* @__PURE__ */ i("option", { value: "all", children: "All projects" }),
            /* @__PURE__ */ i("option", { value: "project", children: "This project" })
          ] }),
          /* @__PURE__ */ h("select", { className: "at-input", value: n.launch, onChange: (c) => S(n.id, { launch: c.target.value }), title: "How the Actions menu runs it (the launcher always opens a new session)", children: [
            /* @__PURE__ */ i("option", { value: "new-session", children: "new session" }),
            /* @__PURE__ */ i("option", { value: "same-session", children: "same session" })
          ] }),
          /* @__PURE__ */ i("select", { className: "at-input", value: n.model, onChange: (c) => S(n.id, { model: c.target.value }), title: "Model override", children: ($.includes(n.model) ? $ : [...$, n.model]).map((c) => /* @__PURE__ */ i("option", { value: c, children: c || "inherit" }, c)) }),
          /* @__PURE__ */ h("label", { className: "at-check", title: "Send immediately instead of leaving it in the composer", children: [
            /* @__PURE__ */ i("input", { type: "checkbox", checked: n.autoSubmit, onChange: (c) => S(n.id, { autoSubmit: c.target.checked }) }),
            " send"
          ] }),
          /* @__PURE__ */ h("label", { className: "at-check", title: "Run in a git worktree", children: [
            /* @__PURE__ */ i("input", { type: "checkbox", checked: n.worktree, onChange: (c) => S(n.id, { worktree: c.target.checked }) }),
            " worktree"
          ] }),
          /* @__PURE__ */ i("button", { className: "at-btn", "aria-label": `Delete ${n.name}`, onClick: () => b(g.filter((c) => c.id !== n.id)), children: "✕" })
        ]
      },
      n.id
    )),
    /* @__PURE__ */ h("div", { className: "at-actions", children: [
      /* @__PURE__ */ i("button", { className: "at-btn", onClick: () => b([...g, { ...L(), scope: "all" }]), children: "+ Add favorite" }),
      /* @__PURE__ */ i("button", { className: "at-btn", onClick: () => b([...g, ...J.map((n) => ({ ...L(n), scope: "all" }))]), children: "+ Add starter set" })
    ] }),
    /* @__PURE__ */ i("h3", { children: "Launcher" }),
    /* @__PURE__ */ h("div", { className: "at-form", children: [
      /* @__PURE__ */ h("label", { children: [
        "Model for launcher sessions",
        /* @__PURE__ */ i("select", { className: "at-input", value: s.launcherModel, onChange: (n) => w({ ...s, launcherModel: n.target.value }, o), children: ($.includes(s.launcherModel) ? $ : [...$, s.launcherModel]).map((n) => /* @__PURE__ */ i("option", { value: n, children: n || "provider default" }, n)) })
      ] }),
      /* @__PURE__ */ h("label", { children: [
        "Command mode",
        /* @__PURE__ */ h("select", { className: "at-input", value: s.commandMode, onChange: (n) => w({ ...s, commandMode: n.target.value }, o), children: [
          /* @__PURE__ */ i("option", { value: "slash", children: "/skill, sent as typed" }),
          /* @__PURE__ */ i("option", { value: "natural", children: "natural language (“Run the … command”)" })
        ] })
      ] }),
      /* @__PURE__ */ h("label", { className: "at-check", children: [
        /* @__PURE__ */ i(
          "input",
          {
            type: "checkbox",
            checked: s.syncActions,
            onChange: (n) => {
              const c = { ...s, syncActions: n.target.checked };
              w(c, o);
            }
          }
        ),
        " ",
        "Sync favorites into the Actions menu (nimbalyst-local/ai-actions.md)"
      ] })
    ] }),
    /* @__PURE__ */ h("div", { className: "at-actions", children: [
      /* @__PURE__ */ i("button", { className: "at-btn", onClick: () => {
        C();
      }, children: "Sync now" }),
      /* @__PURE__ */ i("button", { className: "at-btn", onClick: () => {
        C(s, o, !1);
      }, children: "Remove ★ entries from this project" })
    ] }),
    d && /* @__PURE__ */ i("div", { className: `at-status${d.error ? " at-err" : ""}`, role: "status", children: d.text })
  ] });
}
async function pe(e) {
  B(e.services);
}
async function fe() {
  B(null);
}
const ge = {
  launcher: { component: le }
}, ve = {
  ToolkitSettings: de
};
export {
  pe as activate,
  fe as deactivate,
  ge as panels,
  ve as settingsPanel
};
//# sourceMappingURL=index.js.map
