import { jsxs as p, jsx as r, Fragment as W } from "react/jsx-runtime";
import { useState as k, useRef as L, useMemo as F, useEffect as T } from "react";
function K(e, t, s) {
  const c = t.trim();
  let o = e.command.trim();
  if (/\{args\}/.test(o) ? o = o.replace(/\{args\}/g, c) : c && (o = `${o} ${c}`), o = o.replace(/[ \t]+$/gm, "").trim(), s === "natural") {
    const l = /^\/([A-Za-z0-9_:.-]+)(?:\s+([\s\S]*))?$/.exec(o);
    if (l) {
      const d = (l[2] ?? "").trim();
      return `Run the \`${l[1]}\` command/skill${d ? ` with this input: ${d}` : ""}.`;
    }
  }
  return o;
}
function J(e) {
  const t = e.split(":")[0];
  return t === "claude-code" || t === "claude" || t === "openai" || t === "openai-codex" ? t : void 0;
}
function Q(e, t) {
  const s = t.trim().toLowerCase();
  if (!s) return e;
  const c = [];
  return e.forEach((o, l) => {
    const d = Math.max(B(o.name.toLowerCase(), s) * 2, B(o.command.toLowerCase(), s));
    d > 0 && c.push({ item: o, score: d, index: l });
  }), c.sort((o, l) => l.score - o.score || o.index - l.index).map((o) => o.item);
}
function B(e, t) {
  const s = e.indexOf(t);
  if (s >= 0) return 100 - Math.min(s, 50) + (s === 0 ? 20 : 0);
  let c = 0, o = 0;
  for (const l of t) {
    const d = e.indexOf(l, c);
    if (d < 0) return 0;
    o += d - c, c = d + 1;
  }
  return Math.max(1, 40 - o);
}
function X(e) {
  const t = /* @__PURE__ */ new Set();
  return e.map((s) => {
    for (const c of s.toLowerCase())
      if (/[a-z]/.test(c) && !t.has(c))
        return t.add(c), c;
    return null;
  });
}
const ee = (e) => /\{args\}/.test(e), te = {
  favorites: [],
  launcherModel: "claude-code:sonnet",
  commandMode: "slash",
  syncActions: !0
}, U = "toolkit.v1", q = "favorites.project.v1", G = "★";
function I(e = {}) {
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
function _(e) {
  const t = e ?? {};
  return {
    ...te,
    ...t,
    favorites: Array.isArray(t.favorites) ? t.favorites.map((s) => ({ ...I(), ...s })) : []
  };
}
const ne = [
  { name: "Compact", command: "/compact", launch: "same-session" },
  { name: "BMAD help", command: "/bmad-help", launch: "new-session" },
  { name: "Code review", command: "/bmad-code-review {args}", launch: "new-session" },
  { name: "Sprint status", command: "/bmad-sprint-status", launch: "new-session" }
];
function ae(e) {
  const t = [{ heading: null, lines: [] }];
  let s = !1;
  for (const c of e.split(`
`)) {
    /^\s*```/.test(c) && (s = !s);
    const o = s ? null : /^##\s+(.+?)\s*\r?$/.exec(c);
    o ? t.push({ heading: o[1], lines: [c] }) : t[t.length - 1].lines.push(c);
  }
  return t;
}
const se = (e) => e.heading !== null && e.heading.startsWith(G);
function oe(e) {
  let t = !1;
  return e.split(`
`).map((s) => (/^\s*```/.test(s) && (t = !t), !t && /^##\s/.test(s) ? `#${s}` : s)).join(`
`);
}
function re(e, t) {
  const s = e.name.replace(/\s+/g, " ").trim(), c = K(e, "", t);
  return !s || !c ? null : [`## ${G} ${s}`, "launch: same-session", "foreground: true", "autoSubmit: false", "", oe(c), ""].join(`
`);
}
function ce(e) {
  return `${G} ${e.name.replace(/\s+/g, " ").trim()}`;
}
function ie(e, t, s) {
  const c = [], o = /* @__PURE__ */ new Set();
  for (const w of t) {
    const u = ce(w).toLowerCase();
    if (o.has(u)) continue;
    const y = re(w, s);
    y && (o.add(u), c.push(y));
  }
  if (e === null && c.length === 0) return null;
  const l = ae(e ?? ""), d = [];
  let b = !1;
  const g = c.join(`
`);
  for (const w of l) {
    if (se(w)) {
      !b && g && (d.push(g), b = !0);
      continue;
    }
    d.push(w.lines.join(`
`));
  }
  let f = d.join(`
`);
  return !b && g && (f = f.replace(/\s*$/, ""), f = (f ? f + `

` : "") + g), f && !f.endsWith(`
`) && (f += `
`), f = f.replace(/\n{3,}/g, `

`), f === e ? null : f;
}
let P = null;
const z = (e) => {
  P = e;
}, E = (e) => e instanceof Error ? e.message : String(e);
function V(e) {
  try {
    return _(e.getGlobal(U));
  } catch {
    return _(void 0);
  }
}
function Y(e) {
  try {
    const t = e.get(q);
    return _({ favorites: Array.isArray(t) ? t : [] }).favorites;
  } catch {
    return [];
  }
}
async function le(e, t) {
  await e.setGlobal(U, t);
}
async function ue(e, t) {
  await e.set(q, t);
}
const de = (e) => `${e.replace(/[\\/]+$/, "")}/nimbalyst-local/ai-actions.md`;
async function Z(e, t, s, c = t.syncActions) {
  if (!P) throw new Error("Agent Toolkit is not activated yet.");
  const o = P.filesystem, l = de(e), d = await o.fileExists(l) ? await o.readFile(l) : null, b = c ? [...t.favorites, ...s] : [], g = ie(d, b, t.commandMode);
  return g === null ? { changed: !1, path: l } : (await o.writeFile(l, g), { changed: !0, path: l });
}
function me(e, t, s, c) {
  const o = P?.ai;
  if (!o) throw new Error("The ai permission is not available to this extension.");
  const l = e.model.trim() || s.launcherModel.trim(), d = l ? J(l) : void 0;
  o.sendPrompt({
    prompt: K(e, t, s.commandMode),
    sessionName: e.name,
    ...l ? { model: l } : {},
    ...d ? { provider: d } : {}
  }).catch((b) => c(E(b)));
}
function he({ host: e }) {
  const [t] = k(() => V(e.storage)), [s] = k(() => Y(e.storage)), [c, o] = k(""), [l, d] = k(""), [b, g] = k(0), [f, w] = k(null), [u, y] = k(null), C = L(null), $ = L(null), j = L(null), N = F(() => [...t.favorites, ...s], [t, s]), S = F(() => {
    const a = X(N.map((m) => m.name));
    return new Map(N.map((m, v) => [m.id, a[v] ?? null]));
  }, [N]), M = F(() => Q(N, c), [N, c]), n = M[Math.min(b, Math.max(0, M.length - 1))];
  T(() => C.current?.focus(), []), T(() => g(0), [c]), T(() => {
    j.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [b, M]), T(() => {
    u ? $.current?.focus() : C.current?.focus();
  }, [u]), T(() => {
    t.syncActions && Z(e.workspacePath, t, s).catch((a) => w({ text: `Actions sync failed: ${E(a)}`, error: !0 }));
  }, [e.workspacePath, t, s]);
  const i = (a, m) => {
    try {
      me(a, m, t, (v) => w({ text: v, error: !0 })), e.close();
    } catch (v) {
      w({ text: E(v), error: !0 });
    }
  }, h = async (a, m) => {
    try {
      return await navigator.clipboard.writeText(K(a, m, t.commandMode)), w({ text: "Copied. Paste it into the current session.", error: !1 }), !0;
    } catch (v) {
      return w({ text: E(v), error: !0 }), !1;
    }
  }, A = (a, m, v) => {
    a.launch === "same-session" !== m ? h(a, v).then((H) => H && e.close()) : i(a, v);
  }, x = (a, m) => {
    if (a) {
      if (ee(a.command) && !l.trim()) {
        y({ fav: a, alternate: m, value: "" });
        return;
      }
      A(a, m, l);
    }
  }, R = () => {
    if (!u) return;
    const a = u.value.trim();
    if (!a) return;
    const { fav: m, alternate: v } = u;
    y(null), d(a), A(m, v, a);
  };
  return /* @__PURE__ */ p("div", { className: "at-root", onKeyDown: (a) => {
    if (!u) {
      if (a.key === "Escape")
        a.preventDefault(), e.close();
      else if (a.key === "ArrowDown")
        a.preventDefault(), g((m) => Math.min(m + 1, M.length - 1));
      else if (a.key === "ArrowUp")
        a.preventDefault(), g((m) => Math.max(m - 1, 0));
      else if (a.key === "Enter")
        a.preventDefault(), x(n, a.shiftKey);
      else if (a.altKey && /^Key[A-Z]$/.test(a.code)) {
        const m = N.find((v) => S.get(v.id) === a.code.slice(3).toLowerCase());
        m && (a.preventDefault(), x(m, !1));
      }
    }
  }, children: [
    /* @__PURE__ */ r(
      "input",
      {
        ref: C,
        className: "at-search",
        placeholder: "Search favorites…",
        value: c,
        onChange: (a) => o(a.target.value),
        "aria-label": "Search favorites"
      }
    ),
    N.length === 0 ? /* @__PURE__ */ p("div", { className: "at-empty", children: [
      "No favorites yet. Add them in Settings → Agent Toolkit.",
      /* @__PURE__ */ r("button", { className: "at-btn", onClick: () => {
        e.close(), e.openSettings();
      }, children: "Open settings" })
    ] }) : M.length === 0 ? /* @__PURE__ */ p("div", { className: "at-empty", children: [
      "Nothing matches “",
      c,
      "”."
    ] }) : /* @__PURE__ */ r("ul", { ref: j, className: "at-list", role: "listbox", children: M.map((a, m) => {
      const v = S.get(a.id);
      return /* @__PURE__ */ p(
        "li",
        {
          role: "option",
          "aria-selected": a === n,
          className: `at-item${a === n ? " at-on" : ""}`,
          onMouseMove: () => g(m),
          onClick: () => x(a, !1),
          children: [
            /* @__PURE__ */ r("span", { className: "at-name", children: v ? /* @__PURE__ */ r(pe, { text: a.name, letter: v }) : a.name }),
            /* @__PURE__ */ r("span", { className: "at-cmd", children: a.command }),
            v && /* @__PURE__ */ p("kbd", { className: "at-kbd", children: [
              "⌥",
              v.toUpperCase()
            ] })
          ]
        },
        a.id
      );
    }) }),
    /* @__PURE__ */ r(
      "input",
      {
        className: "at-args",
        placeholder: "Arguments (optional, replaces {args})",
        value: l,
        onChange: (a) => d(a.target.value),
        "aria-label": "Arguments"
      }
    ),
    /* @__PURE__ */ r("div", { className: `at-foot${f?.error ? " at-err" : ""}`, children: f ? f.text : n?.launch === "same-session" ? "↵ copy   ⇧↵ new session   ⌥letter   esc close" : "↵ new session   ⇧↵ copy   ⌥letter   esc close" }),
    u && /* @__PURE__ */ r("div", { className: "at-modal-backdrop", onMouseDown: () => y(null), children: /* @__PURE__ */ p(
      "div",
      {
        className: "at-modal",
        role: "dialog",
        "aria-label": `Arguments for ${u.fav.name}`,
        onMouseDown: (a) => a.stopPropagation(),
        onKeyDown: (a) => {
          a.key === "Escape" ? (a.preventDefault(), a.stopPropagation(), y(null)) : a.key === "Enter" && (a.preventDefault(), a.stopPropagation(), R());
        },
        children: [
          /* @__PURE__ */ r("div", { className: "at-modal-title", children: u.fav.name }),
          /* @__PURE__ */ r("div", { className: "at-cmd at-modal-cmd", children: u.fav.command }),
          /* @__PURE__ */ r(
            "input",
            {
              ref: $,
              className: "at-search",
              placeholder: "Arguments (required)",
              value: u.value,
              onChange: (a) => y({ ...u, value: a.target.value }),
              "aria-label": "Arguments"
            }
          ),
          /* @__PURE__ */ p("div", { className: "at-modal-actions", children: [
            /* @__PURE__ */ r("button", { className: "at-btn", onClick: () => y(null), children: "Cancel" }),
            /* @__PURE__ */ r("button", { className: "at-btn at-btn-primary", disabled: !u.value.trim(), onClick: R, children: u.fav.launch === "same-session" !== u.alternate ? "Copy" : "Run" })
          ] })
        ]
      }
    ) })
  ] });
}
function pe({ text: e, letter: t }) {
  const s = e.toLowerCase().indexOf(t);
  return s < 0 ? /* @__PURE__ */ r(W, { children: e }) : /* @__PURE__ */ p(W, { children: [
    e.slice(0, s),
    /* @__PURE__ */ r("u", { children: e[s] }),
    e.slice(s + 1)
  ] });
}
const D = ["", "claude-code:sonnet", "claude-code:opus", "claude-code:haiku"];
function fe({ storage: e, workspacePath: t }) {
  const [s, c] = k(() => V(e)), [o, l] = k(() => Y(e)), [d, b] = k(null), [g, f] = k(null), w = L(void 0), u = [
    ...s.favorites.map((n) => ({ ...n, scope: "all" })),
    ...o.map((n) => ({ ...n, scope: "project" }))
  ], y = (n, i = !1) => b({ text: n, error: i }), C = (n, i) => {
    c(n), l(i), le(e, n).then(() => ue(e, i)).catch((h) => y(`Could not save: ${E(h)}`, !0)), window.clearTimeout(w.current), w.current = window.setTimeout(() => {
      $(n, i);
    }, 600);
  };
  T(() => () => window.clearTimeout(w.current), []);
  const $ = async (n = s, i = o, h = n.syncActions) => {
    if (!t) return y("No project is open, so there is no ai-actions.md to write.", !0);
    try {
      const A = await Z(t, n, i, h);
      y(A.changed ? `Updated ${A.path}` : "ai-actions.md is already up to date.");
    } catch (A) {
      y(`Sync failed: ${E(A)}`, !0);
    }
  }, j = (n) => {
    const i = ({ scope: h, ...A }) => A;
    return {
      favorites: n.filter((h) => h.scope === "all").map(i),
      project: n.filter((h) => h.scope === "project").map(i)
    };
  }, N = (n) => {
    const { favorites: i, project: h } = j(n);
    C({ ...s, favorites: i }, h);
  }, S = (n, i) => N(u.map((h) => h.id === n ? { ...h, ...i } : h)), M = (n, i) => {
    if (n === i) return;
    const h = [...u], A = h.findIndex((O) => O.id === n), x = h.findIndex((O) => O.id === i);
    if (A < 0 || x < 0) return;
    const [R] = h.splice(A, 1);
    h.splice(x, 0, R), N(h);
  };
  return /* @__PURE__ */ p("div", { className: "at-settings", children: [
    /* @__PURE__ */ r("h2", { children: "Agent Toolkit" }),
    /* @__PURE__ */ p("p", { className: "at-hint", children: [
      "Favorites appear in the launcher (⌘⇧B) and, with sync on, in the composer's Actions menu as “★ name”. Choosing one in Actions puts the command into the current session's input without sending it; you add to it and send yourself. In the launcher, a command with ",
      "{args}",
      " asks for arguments when none are typed. Sync runs for a project when this page or the launcher is opened there."
    ] }),
    /* @__PURE__ */ r("h3", { children: "Favorites" }),
    u.length === 0 && /* @__PURE__ */ r("div", { className: "at-hint", children: "None yet." }),
    u.map((n) => /* @__PURE__ */ p(
      "div",
      {
        className: `at-row${g === n.id ? " at-dragging" : ""}`,
        draggable: !0,
        onDragStart: () => f(n.id),
        onDragEnd: () => f(null),
        onDragOver: (i) => i.preventDefault(),
        onDrop: () => g && M(g, n.id),
        children: [
          /* @__PURE__ */ r("span", { className: "at-grip", title: "Drag to reorder", "aria-hidden": !0, children: "⠿" }),
          /* @__PURE__ */ r("input", { className: "at-input at-w-name", value: n.name, placeholder: "Name", onChange: (i) => S(n.id, { name: i.target.value }) }),
          /* @__PURE__ */ r("input", { className: "at-input at-w-cmd", value: n.command, placeholder: "/command {args}", onChange: (i) => S(n.id, { command: i.target.value }) }),
          /* @__PURE__ */ p("select", { className: "at-input", value: n.scope, onChange: (i) => S(n.id, { scope: i.target.value }), title: "Where it shows up", children: [
            /* @__PURE__ */ r("option", { value: "all", children: "All projects" }),
            /* @__PURE__ */ r("option", { value: "project", children: "This project" })
          ] }),
          /* @__PURE__ */ p("select", { className: "at-input", value: n.launch, onChange: (i) => S(n.id, { launch: i.target.value }), title: "What Enter does in the launcher. The Actions menu always puts the command into the current session without sending it.", children: [
            /* @__PURE__ */ r("option", { value: "new-session", children: "launcher: new session" }),
            /* @__PURE__ */ r("option", { value: "same-session", children: "launcher: copy" })
          ] }),
          /* @__PURE__ */ r("select", { className: "at-input", value: n.model, onChange: (i) => S(n.id, { model: i.target.value }), title: "Model for the launcher's new session (the Actions menu uses the current session's model)", children: (D.includes(n.model) ? D : [...D, n.model]).map((i) => /* @__PURE__ */ r("option", { value: i, children: i || "inherit" }, i)) }),
          /* @__PURE__ */ r("button", { className: "at-btn", "aria-label": `Delete ${n.name}`, onClick: () => N(u.filter((i) => i.id !== n.id)), children: "✕" })
        ]
      },
      n.id
    )),
    /* @__PURE__ */ p("div", { className: "at-actions", children: [
      /* @__PURE__ */ r("button", { className: "at-btn", onClick: () => N([...u, { ...I(), scope: "all" }]), children: "+ Add favorite" }),
      /* @__PURE__ */ r("button", { className: "at-btn", onClick: () => N([...u, ...ne.map((n) => ({ ...I(n), scope: "all" }))]), children: "+ Add starter set" })
    ] }),
    /* @__PURE__ */ r("h3", { children: "Launcher" }),
    /* @__PURE__ */ p("div", { className: "at-form", children: [
      /* @__PURE__ */ p("label", { children: [
        "Model for launcher sessions",
        /* @__PURE__ */ r("select", { className: "at-input", value: s.launcherModel, onChange: (n) => C({ ...s, launcherModel: n.target.value }, o), children: (D.includes(s.launcherModel) ? D : [...D, s.launcherModel]).map((n) => /* @__PURE__ */ r("option", { value: n, children: n || "provider default" }, n)) })
      ] }),
      /* @__PURE__ */ p("label", { children: [
        "Command mode",
        /* @__PURE__ */ p("select", { className: "at-input", value: s.commandMode, onChange: (n) => C({ ...s, commandMode: n.target.value }, o), children: [
          /* @__PURE__ */ r("option", { value: "slash", children: "/skill, sent as typed" }),
          /* @__PURE__ */ r("option", { value: "natural", children: "natural language (“Run the … command”)" })
        ] })
      ] }),
      /* @__PURE__ */ p("label", { className: "at-check", children: [
        /* @__PURE__ */ r(
          "input",
          {
            type: "checkbox",
            checked: s.syncActions,
            onChange: (n) => {
              const i = { ...s, syncActions: n.target.checked };
              C(i, o);
            }
          }
        ),
        " ",
        "Sync favorites into the Actions menu (nimbalyst-local/ai-actions.md)"
      ] })
    ] }),
    /* @__PURE__ */ p("div", { className: "at-actions", children: [
      /* @__PURE__ */ r("button", { className: "at-btn", onClick: () => {
        $();
      }, children: "Sync now" }),
      /* @__PURE__ */ r("button", { className: "at-btn", onClick: () => {
        $(s, o, !1);
      }, children: "Remove ★ entries from this project" })
    ] }),
    d && /* @__PURE__ */ r("div", { className: `at-status${d.error ? " at-err" : ""}`, role: "status", children: d.text })
  ] });
}
async function ye(e) {
  z(e.services);
}
async function Ne() {
  z(null);
}
const be = {
  launcher: { component: he }
}, Ae = {
  ToolkitSettings: fe
};
export {
  ye as activate,
  Ne as deactivate,
  be as panels,
  Ae as settingsPanel
};
//# sourceMappingURL=index.js.map
