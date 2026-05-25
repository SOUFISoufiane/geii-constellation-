# Methodology

## 1. Mental Model

Treat the LLM agent's runtime like a small computer:

| Component | Role |
|-----------|------|
| LLM weights | **ROM** — burned in at training, static, free to access |
| Context window | **RAM** — scarce, expensive, must be allocated deliberately |
| External files (project tree, vault) | **Disk** — cheap, infinite, requires explicit load |
| Instruction file (`CLAUDE.md` etc.) | **Boot loader** — read on every turn, sets up the OS |
| This methodology | **Operating system** — decides what gets loaded into RAM and when |

The single most expensive byte in the system is a byte inside the instruction file, because it is paid for on every turn. A 9 KB instruction file across a 30-turn session costs roughly 270 KB of context. Reducing it to 4 KB cuts that to 120 KB without losing any capability — provided the agent knows where to find the rest.

## 2. The Three Layers

Organize all project knowledge into three layers with strict ownership:

### Layer 1: Schema
- **File:** the root instruction file (e.g. `CLAUDE.md`)
- **Owner:** co-evolved between human and agent
- **Contents:** role definition, operational constraints, project overview, commands, environment, **pointer table** with trigger conditions
- **Anti-rule:** never embed bulk reference data here. Every byte costs 30× per session.

### Layer 2: Wiki (agent-owned)
- **Location:** a single directory, typically inside a notes vault
- **Owner:** the agent writes and maintains it; the human curates and directs
- **Required files:**
  - `index.md` — master catalog, read **first** on every knowledge query
  - `log.md` — append-only journal of all changes, ingests, and lint passes
- **Required subfolders:**
  - `concepts/` — architectural patterns, strategies, techniques (one page per concept)
  - `entities/` — domain objects: components, services, third-party tools, people, places (one page per entity)

### Layer 3: Raw
- **Location:** an inbox folder, source-document directory, external articles
- **Owner:** human curates; agent reads but never modifies
- **Contents:** imported articles, meeting notes, milestone updates, anything that is a primary source rather than a synthesis

## 3. The Pointer Pattern

The root instruction file follows a strict pattern modeled on a C pointer (`*p`): it holds the *address* of heavy data, not the data itself.

```
Schema file (small, loaded every turn)
   ├─ pointer → architecture reference (loaded when working on routes)
   ├─ pointer → file map (loaded when locating something)
   ├─ pointer → wiki conventions (loaded when writing docs)
   └─ pointer → wiki index (loaded first on any knowledge query)
```

Each pointer carries a **trigger condition** so the agent self-serves without preloading. A pointer table row has this shape:

```
| Pointer Name | File Path | Read when... |
```

The "Read when…" column is the contract. If the agent's current task does not match the trigger, the file is not opened.

## 4. The Index-First Protocol

For any query that touches project knowledge:

1. Read `index.md` first. It is small (target: under 3 KB / under 800 tokens) and lists every wiki page with a one-line summary.
2. From the index, identify the **two to four pages** most relevant to the query.
3. Read those pages. Synthesize an answer with citations to specific pages.
4. If the answer is novel and reusable, file it back into the wiki as a new page (via the ingest workflow).

This replaces the naive pattern of dumping a large folder into context. Token reductions of 90% or more are typical compared to a flat-folder approach.

## 5. The Ingest Pattern

When a new source enters the project, the agent must:

1. Read the source thoroughly.
2. Decide page type (concept or entity).
3. Write a **summary page** under `concepts/` or `entities/` with the required frontmatter and a 3–5 line summary block at the top.
4. Update `index.md` with a new row.
5. Touch **5–15 related pages** to add cross-references via `[[wiki links]]`. This is the step that makes knowledge **compound** rather than accumulate.
6. Append a one-line entry to `log.md` with the date, type, and title.

Without step 5, the wiki becomes an unordered pile. With it, every new source strengthens existing pages and the index becomes more navigable over time.

## 6. The Lint Pattern

Every five to ten ingests, or weekly, the agent runs a health pass:

- **Orphan pages** — files with zero inbound links.
- **Broken links** — `[[wiki link]]` references pointing to files that do not exist.
- **Stale claims** — assertions about code or behavior that the source has refactored away.
- **Missing cross-references** — mentions of an entity by name without a wiki link.
- **Index integrity** — entries pointing to non-existent files; existing files missing from the index.
- **Log freshness** — last entry older than 14 days (signal of dormancy).
- **Frontmatter consistency** — every page in `concepts/` and `entities/` has `tags`, `date`, `author`.

Lint findings are appended to `log.md` as a `lint` entry and surfaced to the human for decisions.

## 7. Anti-Patterns

These mistakes destroy the system. Avoid each explicitly.

| Anti-pattern | Why it fails |
|--------------|--------------|
| Ten-thousand-word catch-all documents | Cannot be selectively loaded; precision degrades; ten focused 1,000-word documents are strictly better |
| Skipping the index update on ingest | New page becomes invisible to the index-first protocol |
| Skipping cross-references on ingest | Knowledge accumulates without compounding |
| Writing raw source material into `concepts/` | The wiki layer must contain synthesis, not transcripts |
| Treating the instruction file as a documentation dump | Every byte multiplies by the turn count of every session |
| Manual human bookkeeping of the wiki | Maintenance burden grows faster than value; humans abandon |
| Indexing build artifacts (`package-lock.json`, lockfiles, generated code) | Inflates search results and burns tokens on noise |
| Loading sources from `raw/` into context to answer questions | Defeats the purpose of the wiki layer; load from synthesis, not source |

## 8. The Compounding Property

A well-maintained wiki has a property no flat documentation system has: **value compounds with use**.

- Every ingest enriches multiple existing pages.
- Every cross-reference makes neighboring pages more discoverable.
- Every valuable query result is filed back as a new page, so the next similar query becomes cheaper.
- Lint passes catch drift before it becomes confusion.

The bookkeeping burden falls on the agent. The curation burden — what to read, what questions to ask, what to file — stays with the human. This division is the system's contract.

## 9. Measurement

A token-optimization feedback loop requires explicit measurement. Maintain a running log of:

- Per-turn token cost of the instruction file (measured by `wc -c` on the file).
- Per-session estimated token cost (turn count × instruction-file cost + sum of dereferenced reads).
- Percentage reduction from baseline.
- Karpathy-target ceiling: roughly 95% reduction relative to naive flat-folder loading.

The measurement log lives in a `Token Optimization/` folder alongside the wiki, with one entry per optimization change.

## 10. References

This methodology builds on the LLM Wiki pattern documented publicly in April 2026, augmented with the pointer-architecture refinement (using the instruction file purely as a navigation skeleton with trigger-condition pointers) and an explicit indexing-exclusion layer for build artifacts.
