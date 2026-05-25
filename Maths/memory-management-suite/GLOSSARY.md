# Glossary

Terms used throughout this suite. Definitions are local to the methodology — broader industry usage may differ.

| Term | Definition |
|------|------------|
| **Agent** | The LLM-based assistant operating in the project. May be a coding agent, a documentation agent, or any LLM that reads project files. |
| **Anti-pattern** | A practice that appears reasonable but produces failure modes the methodology explicitly prevents. Enumerated in `01-METHODOLOGY.md` § 7. |
| **Append-only** | A file is only ever extended at the bottom; existing entries are never edited or reordered. Applies to `log.md`. |
| **Bookkeeping** | The maintenance work of keeping the wiki consistent: updating the index, adding cross-references, appending log entries, fixing broken links. The agent owns this. |
| **Compounding** | The property by which each new ingest enriches multiple existing pages, increasing the value of the wiki faster than its size. |
| **Concept page** | A wiki page describing a pattern, strategy, technique, or architectural decision. Lives in `<VAULT>/concepts/`. Describes *how* something is done. |
| **Cross-reference** | A `[[wiki link]]` from one wiki page to another. The mechanism by which knowledge compounds. |
| **Curation** | The human activity of choosing what to ingest, what questions to ask, what to keep, and what to discard. The human owns this. |
| **Dereference** | To follow a pointer from the schema layer to a heavier file in `.claude/docs/`. Done only when the trigger condition is met. |
| **Entity page** | A wiki page describing a domain object: a component, service, third-party tool, person, place, or named artifact. Lives in `<VAULT>/entities/`. Describes *what* something is. |
| **Frontmatter** | The YAML block at the top of every wiki page, containing `tags`, `date`, `author`, and optional fields. Required for lint compliance. |
| **Index** | The master catalog file at `<VAULT>/index.md`. Lists every wiki page with a one-line summary, organized by category. Read first on every knowledge query. |
| **Index-first protocol** | The rule: always read `index.md` before reading any other wiki page. Identify 2–4 relevant pages from the index, then drill in. |
| **Ingest** | The workflow for filing new knowledge into the wiki. Six steps: read source → write summary → update index → cross-reference → log → confirm. |
| **Instruction file** | The file the agent runtime loads on every turn. Typically `CLAUDE.md` or `AGENTS.md`. Holds the schema layer. |
| **Lint** | The workflow for checking wiki health. Surfaces orphans, broken links, stale claims, missing cross-references, and frontmatter gaps. |
| **Log** | The append-only journal at `<VAULT>/log.md`. One entry per ingest, update, lint, refactor, or decision. |
| **Orphan** | A wiki page with zero inbound `[[wiki links]]`. Often a sign of skipped cross-referencing. |
| **Pointer architecture** | The pattern of treating the instruction file as a navigation skeleton (`*p` in C) holding addresses of heavier content, not the content itself. |
| **Pointer table** | The **Reference Pointers** section of the instruction file. A markdown table with columns: pointer name, file path, trigger condition. |
| **Raw layer** | The third layer of the wiki architecture. Contains immutable source documents: imported articles, meeting notes, milestone reports. The agent reads but never modifies. |
| **Schema layer** | The first layer. The root instruction file. Defines navigation rules, conventions, and workflows. |
| **Skill** | A markdown file at `<project>/.claude/skills/<name>/SKILL.md` that the agent invokes by name. Contains a workflow protocol. |
| **Slug** | The filesystem-safe identifier for a wiki page. Lowercase, hyphenated, no spaces, under 40 characters. |
| **Stale claim** | An assertion in the wiki about code or behavior that the source has since refactored away. Surfaced by lint. |
| **Summary block** | The first content section of every wiki page, labeled `## Summary`. Three to five lines, dense, oriented to relevance signaling. |
| **Token feedback loop** | The discipline of measuring per-session token cost before and after each optimization, logging the result in `<VAULT>/Token Optimization/`. |
| **Trigger condition** | The "Read when…" column of the pointer table. A short phrase describing the task type that warrants dereferencing the pointer. |
| **Vault** | The directory holding the wiki layer. Often an Obsidian vault, but any markdown directory works. Path referred to as `<VAULT>`. |
| **Watchlist** | The list of pending optimization tasks in `<VAULT>/Token Optimization/Token Optimization Index.md`. The token-checkup workflow surfaces the first unchecked item. |
| **Wiki layer** | The second layer. The agent-owned collection of `concepts/`, `entities/`, `index.md`, `log.md`. |
| **Wiki link** | The `[[<path>]]` syntax used for cross-references between wiki pages. Renders as a clickable link in Obsidian and most markdown editors. |
