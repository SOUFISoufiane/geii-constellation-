# Memory Management Suite

A portable methodology for managing LLM agent memory and minimizing token consumption in any software project. Designed to be copied into a fresh project and configured in under fifteen minutes.

## What This Suite Provides

- **A schema-and-pointer architecture** for the project's primary instruction file (typically `CLAUDE.md` or `AGENTS.md`), reducing per-turn token load by 60–80%.
- **A three-layer knowledge wiki** (schema / wiki / raw) the agent reads first and writes back to, replacing repeated re-derivation with persistent synthesis.
- **Three repeatable workflows** as skill files: filing new knowledge (`/ingest`), checking wiki health (`/lint-wiki`), and reporting state (`/token-checkup`).
- **Token-savings tracking** with both a static markdown log and a self-contained HTML dashboard.
- **Indexing exclusions** via `.claudeignore` to prevent heavy build artifacts from inflating context.

## File Index

| Path | Purpose |
|------|---------|
| `00-START-HERE.md` | This file — orientation and reading order |
| `01-METHODOLOGY.md` | Principles, mental models, anti-patterns |
| `02-SETUP.md` | Step-by-step installation in a new project |
| `03-WORKFLOWS.md` | Daily operating protocols (ingest, lint, checkup) |
| `04-TROUBLESHOOTING.md` | Common failure modes and fixes |
| `GLOSSARY.md` | Term definitions used throughout |
| `templates/CLAUDE.md` | Schema file template — copy to project root |
| `templates/.claudeignore` | Indexing exclusion template |
| `templates/wiki/index.md` | Master catalog template |
| `templates/wiki/log.md` | Append-only journal template |
| `templates/wiki/concepts/example-concept.md` | Concept page template |
| `templates/wiki/entities/example-entity.md` | Entity page template |
| `templates/docs/reference-doc.md` | Dereferenced reference doc template |
| `skills/ingest/SKILL.md` | Workflow for filing new knowledge |
| `skills/lint-wiki/SKILL.md` | Workflow for periodic health checks |
| `skills/token-checkup/SKILL.md` | Workflow for status reports |
| `dashboard/dashboard.html` | Standalone HTML dashboard |
| `dashboard/Dashboard.md` | Markdown/Mermaid dashboard for in-vault viewing |

## Recommended Reading Order

1. `01-METHODOLOGY.md` — understand the why before the how.
2. `02-SETUP.md` — bootstrap a new project.
3. `03-WORKFLOWS.md` — learn the daily protocols.
4. `04-TROUBLESHOOTING.md` — consult only when something breaks.

## Required Conditions

- An LLM agent runtime that loads a root instruction file (commonly `CLAUDE.md`, `AGENTS.md`, or equivalent) into every turn.
- A note-taking surface (Obsidian, plain markdown directory, or any tool that renders `[[wiki links]]`).
- Python 3.x or Node.js available on the local machine (for serving the dashboard).
- A shell that supports basic file operations.

## Out of Scope

This suite does not address:
- Vector embeddings, RAG pipelines, or semantic search infrastructure (the methodology explicitly avoids them).
- Multi-agent coordination protocols.
- Source-code-level static analysis or symbol indexing.
- Cloud-based memory services or remote vector stores.

## License & Modification

Treat every file in this suite as a template. Copy it, fork it, rename it, delete sections that do not apply. The structure is a starting point — fitness depends on local project shape.
