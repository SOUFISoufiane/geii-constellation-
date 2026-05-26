# GEMINI.md

Multi-AI collaboration guidelines for GEII Visual Toolbox project.

Two agents work this repo: **Claude Code** and **Gemini (Google Antigravity)**,
often running at the same time on the same working tree. This file defines lanes
so we don't overwrite each other or pollute git history.

## Current Project State (2026-05-26)

All five apps are **built**, not stubs:
- `signal-observatory` — mature reference app
- `circuits` — RLC / Kirchhoff / Thévenin
- `automatique` — PID / root locus / Bode
- `maths` — 3D surface / ODE (RK4) / Laplace
- `numerique` — truth table / Karnaugh / VHDL

The old "Gemini writes specs for stub apps" model is retired — there are no stubs
left to spec. Work now is fixes, polish, new modules, and the `kb/` knowledge base.

## Scope Boundaries

### Claude (Code)
- **Primary architect & implementer** of the platform shell
- Shell infrastructure: `shared/css/`, `shared/js/`, `index.html` (home page)
- Plotly rendering layer (`shared/js/plot-fit.js`), responsive layer
  (`shared/css/app-responsive.css`)
- App module JS (`apps/*/js/`), signal-observatory
- Final QA + deployment

### Gemini (Antigravity)
- **Research & exploration** (documentation, best practices, alternatives)
- **Code review & feedback** on Claude's implementations
- **App READMEs** (`apps/<id>/README.md`) and the `kb/` knowledge base content
- **Knowledge synthesis** for decision-making

## Explicit Overlap to Avoid

❌ **Do not both edit at the same time:**
- `shared/css/*` and `shared/js/*` — Claude owns; Gemini reviews
- `apps/*/index.html` and `apps/*/js/*` — Claude owns; Gemini can QA / suggest
- `index.html` (home page) — Claude owns; Gemini suggests UX via chat
- `apps/signal-observatory/*` — Claude owns

✅ **Safe to run in parallel:**
- Claude on shell / app JS / CSS
- Gemini on `apps/<id>/README.md`, `kb/` docs, research notes

## Git Hygiene (important — this bit us)

Both agents commit to the same local `master` (no remote). To avoid the mislabeled,
debris-laden commits seen on 2026-05-26:

1. **Stage intentionally.** Never `git add -A` / `git add .` — it sweeps the other
   agent's in-flight files and scratch output into your commit. Stage only the
   specific paths you changed.
2. **Honest commit messages.** The message must describe the actual diff. Do not
   reuse a stale template title (e.g. "implement circuit analysis tool" on a commit
   that only changes CSS).
3. **Debris is gitignored** (`.gitignore` at repo root): `.playwright-mcp/`,
   root-level `*.png` / `audit-*.png`, `node_modules/`, `.claude/scheduled_tasks.lock`.
   Do not force-add these. They are scratch output, never source.
4. **Don't commit the other agent's working files.** If `git status` shows files
   you didn't touch, leave them unstaged.

## Communication Protocol

1. **Before major commits:** brief status in chat (what's done, what's next)
2. **Conflict detected?** Pause, note the overlap in chat, let the owner resolve
3. **Code review:** Gemini can review Claude's shell code before it ships
4. **Decision requests:** if stuck, ask the other agent for research / alternatives

## Project Memory

- **Claude** updates `.claude/projects/.../memory/` (project status, decisions)
- **Gemini** can read memory but should not write to it (avoid sync conflicts)
- **Both read** `CLAUDE.md`, `GEMINI.md`, and project memory at session start

## Files Gemini Should Not Edit (Direct)

```
shared/css/*
shared/js/*
index.html
apps/*/index.html
apps/*/js/*
apps/signal-observatory/*
.claude/
```

## Files Gemini Can Own

```
apps/circuits/README.md
apps/automatique/README.md
apps/numerique/README.md
apps/maths/README.md
kb/**            (SOPs, KBAs, knowledge base content)
research documents / decision logs
```

## General Working Guidelines (Gemini)

1. **Minimal edits**: no mass refactor / reformat. Touch only lines the task needs.
2. **Respect existing standards**: follow conventions set by prior agents. Don't
   overwrite Claude-owned config without explicit permission.
3. **Coordinate**: if a task might conflict with ongoing work, clarify scope first.
4. **Clean state**: close background servers; leave no scratch files committed.

## Decision Log

- **2026-05-26** — Parallel auto-commits from Antigravity mislabeled their diffs and
  committed `.playwright-mcp/` + audit screenshots. Resolution: added root
  `.gitignore`, untracked `scheduled_tasks.lock`, tightened git-hygiene rules above.

---

**Last Updated:** 2026-05-26
**Status:** All apps built; both agents active on shared local tree
