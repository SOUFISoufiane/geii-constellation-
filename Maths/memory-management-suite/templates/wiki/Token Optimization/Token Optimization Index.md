---
tags: [{{PROJECT_NAME}}, token-optimization, status/active]
date: {{DATE}}
author: {{AUTHOR}}
---

# Token Optimization — Feedback Loop

> [!info] Purpose
> Living document tracking every token-optimization change in this project. Updated after each session where optimizations are made or measured. Maintains a deliberate feedback loop between usage patterns and cost reduction.

## Current Baseline

- **Instruction file size:** *— bytes / — lines (capture via `wc -c`)*
- **Wiki layer:** *— concepts, — entities, — log entries*
- **Reference docs:** *— files in `.claude/docs/`*
- **`.claudeignore`:** *active — exclude list reviewed YYYY-MM-DD*
- **Estimated per-session burn:** *— tokens (capture from first `/token-checkup`)*

## Optimization Log

| Date | Change | Tokens Saved | Cumulative |
|------|--------|-------------|------------|
| {{DATE}} | Initial methodology adoption — pointer architecture + three-layer wiki + skills | TBD | baseline |

## Karpathy / Methodology Alignment

| Status | Count |
|--------|-------|
| 🟢 MATCH (implemented) | *—* |
| 🟡 PARTIAL (in progress) | *—* |
| 🔴 GAP (todo) | *—* |
| 🟣 AHEAD (beyond baseline methodology) | *—* |

Update this matrix after each significant change. The dashboard reads from it.

## Visual Dashboard

- **Interactive HTML:** [`dashboard.html`](dashboard.html) — open via `{{COMMAND_PREFIX}} dashboard`. Chart.js bar graph, interactive checklist (localStorage), color-coded matrix, Mermaid diagrams.
- **Vault-native:** [[Dashboard]] — same content with Mermaid renders for in-vault viewing.

## Watchlist

Items to monitor or optimize next:

- [ ] Validate baseline savings over 5 sessions (measure actual vs estimated)
- [ ] Audit reference docs in `.claude/docs/` for unnecessary length
- [ ] First `/lint-wiki` pass — log findings
- [ ] Seed concept and entity folders to at least 5 pages each
- [ ] Review `.claudeignore` against current project structure (new lockfiles, new heavy files?)
- [ ] Document any custom triggers added to the pointer table

## Principles

> [!tip] Token Optimization Principles
> 1. **Instruction file is a pointer, not a database** — `*p` model, dereference on demand.
> 2. **Every byte has a turn-count multiplier** — the instruction file is loaded once per turn across the whole session.
> 3. **`.claudeignore` is free money** — a few lines can prevent 10K–50K token spikes from background indexing.
> 4. **Measure before and after** — log every change with token estimates.
> 5. **Compound savings** — small per-turn savings multiply across sessions.
> 6. **Lint regularly** — drift is silent and cumulative.
