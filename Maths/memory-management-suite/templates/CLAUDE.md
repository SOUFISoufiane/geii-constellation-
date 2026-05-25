# CLAUDE.md

This file is the **nervous system** — minimal instructions + pointers. Heavy data lives in `.claude/docs/` and is read only when needed.

## Role
You are an expert engineer assisting on **{{PROJECT_NAME}}**. Prioritize architectural integrity, clear reasoning, and durable project memory. Explain before doing.

## Memory Protocol
- **Wiki:** `{{VAULT_PATH}}/` follows the three-layer pattern (schema / wiki / raw). See pointer table below.
- **Sync rule:** Update the wiki at natural session ends — batch changes from a phase into a single ingest, not after every individual edit.
- **Summaries:** Every change to wiki state must include **What** (the change), **Why** (the reasoning), **How** (the implementation detail).

## Operational Constraints (Token Efficiency)
- **No waste:** Do not read files unless strictly necessary for the current task.
- **Compactness:** Suggest `/compact` if conversation exceeds 15 turns.
- **Ignore bloat:** Never index or search `node_modules`, `dist`, `.git`, `target`, or anything in `.claudeignore`.
- **Karpathy protocol:** For any knowledge query, read `{{VAULT_PATH}}/index.md` FIRST, then drill into 2–4 relevant pages.

## Task Execution Protocol
1. **Explain first:** State the reasoning before providing code. The "why" matters more than the "do."
2. **Reuse before invent:** Search existing functions and patterns before proposing new ones.
3. **Refactor over patch:** Flag hacks. Propose the long-term fix even when slower.

## Output Style
- Didactic, concise, professional.
- Use diagrams (Mermaid) for complex logic flows when helpful.
- Use investment terminology (ROI, technical debt, compounding) for decisions about performance or scalability.

---

## Project Overview
**{{PROJECT_NAME}}** — {{PROJECT_DESCRIPTION}}

## Commands
```bash
{{COMMAND_PREFIX}} dev          # Start dev server on port {{DEV_PORT}}
{{COMMAND_PREFIX}} build        # Production build
{{COMMAND_PREFIX}} test         # Run test suite
{{COMMAND_PREFIX}} lint         # Linter check
{{COMMAND_PREFIX}} dashboard    # Serve the optimization dashboard on :8080
```

## Tech Stack
- **{{PRIMARY_LANGUAGE}}** with **{{PRIMARY_FRAMEWORK}}**
- *(Add additional stack lines here, one per line, with one sentence each)*

## Environment
Required variables in `.env` or equivalent:
```
{{ENV_VAR_1}}=<value>
{{ENV_VAR_2}}=<value>
```

## Session Start Protocol
At the start of every session, before any task work, read in order (skip if session summary already contains their content):
1. `{{VAULT_PATH}}/Memory/Project_Status.md`
2. `{{VAULT_PATH}}/Memory/Technical_Debt.md`

This converts expensive repo exploration into 2 cheap Read calls.

---

## Reference Pointers
> Read these files **ONLY** when the task requires their content. Do not preload.
> **Karpathy protocol:** for any knowledge query, read `index.md` FIRST, then drill into 2–4 relevant pages.

| Pointer | File | Read when... |
|---------|------|-------------|
| **Wiki Index (read FIRST)** | `{{VAULT_PATH}}/index.md` | Any question about project knowledge, concepts, or entities |
| **Wiki Log** | `{{VAULT_PATH}}/log.md` | Need historical context on changes or decisions |
| **Architecture** | `.claude/docs/architecture.md` | Working on routes, APIs, schema, or core logic |
| **File Map** | `.claude/docs/project-map.md` | Need to locate a specific file or understand project structure |
| **Conventions** | `.claude/docs/conventions.md` | Writing docs, vault updates, or following style rules |
| **Token Optimization** | `{{VAULT_PATH}}/Token Optimization/` | Logging token savings, reviewing optimization history |

## Skills
- **`/ingest <source>`** — file new knowledge into the wiki. See `.claude/skills/ingest/SKILL.md`.
- **`/lint-wiki`** — health-check the wiki. See `.claude/skills/lint-wiki/SKILL.md`.
- **`/token-checkup`** — wraps dashboard + lint + savings + next watchlist item. See `.claude/skills/token-checkup/SKILL.md`.

## Vault Arborescence
```
{{VAULT_PATH}}/
  index.md             # Master catalog — read FIRST on any knowledge query
  log.md               # Append-only journal of all changes / ingests / lints
  concepts/            # Agent-owned: architectural patterns & strategies (one per file)
  entities/            # Agent-owned: components, services, tools, places (one per file)
  Token Optimization/  # Token usage tracking, dashboard, savings log
  Memory/              # Status + technical debt for session start protocol
  Raw/                 # Immutable source documents (or Project Updates/)
```
