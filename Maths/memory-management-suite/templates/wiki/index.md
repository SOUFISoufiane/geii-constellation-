---
tags: [{{PROJECT_NAME}}, index]
date: {{DATE}}
author: {{AUTHOR}}
---

# {{PROJECT_NAME}} — Master Index

> [!info] How to use this file
> Always read this index FIRST before answering any knowledge question. Use it to identify the 2–4 pages relevant to the query, then drill in. Never load the full vault.

## Layers

| Layer | Path | Owner | Purpose |
|-------|------|-------|---------|
| **Schema** | `CLAUDE.md` (project root) | Co-evolved | Navigation rules + pointer table |
| **Wiki** | `{{VAULT_PATH}}/` | **Agent-owned** | Synthesized knowledge — concepts, entities, logs |
| **Raw** | `{{VAULT_PATH}}/Raw/` (or `Project Updates/`) | Human curates | Source documents, immutable |

## Concepts — architectural patterns & strategies

| Page | One-line summary |
|------|------------------|
| *(Add concept pages here. Format: `\| [[concepts/<slug>]] \| <summary> \|`)* | |

## Entities — components, services, tools, places

| Page | One-line summary |
|------|------------------|
| *(Add entity pages here. Format: `\| [[entities/<slug>]] \| <summary> \|`)* | |

## Sources & Project Updates

| Page | Date | Type |
|------|------|------|
| *(Add ingested source records here.)* | | |

## Token Optimization — meta layer (self-tracking)

| Page | Status |
|------|--------|
| [[Token Optimization/Token Optimization Index]] | Active — running log of savings |
| [[Token Optimization/Dashboard]] | Mermaid in-vault view |
| `Token Optimization/dashboard.html` | Standalone HTML — open via `{{COMMAND_PREFIX}} dashboard` |

## How to add new knowledge (Ingest workflow)
Run `/ingest <source>` or follow `.claude/skills/ingest/SKILL.md`:
1. Read source → write summary page in `concepts/` or `entities/`
2. Update this `index.md` with new entry + one-line summary
3. Touch 5–15 related pages (update cross-references)
4. Append to `log.md` with `## [YYYY-MM-DD] ingest | Title`

## How to verify wiki health (Lint workflow)
Run `/lint-wiki` periodically. Checks for:
- Orphan pages (no inbound links)
- Stale claims contradicted by newer sources
- Missing cross-references between related pages
- Index entries pointing to non-existent files
