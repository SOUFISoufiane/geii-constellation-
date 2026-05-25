# Workflows

This document specifies the three daily operating protocols. Each maps to a skill file under `skills/` that the agent invokes by name.

---

## Workflow 1 — Ingest

**Trigger phrases:** `/ingest <source>`, "file this", "add this to the wiki", "summarize and store".

**Inputs:** a URL, a file path, a pasted document, a finding from a recent task, or an architectural decision worth preserving.

**Outputs:**
- One new summary page in `concepts/` or `entities/`.
- One updated row in `index.md`.
- Cross-references added to 5–15 related pages.
- One appended entry in `log.md`.

### Procedure

**Step 1 — Read the source thoroughly.**
Extract: key claims, named entities, related concepts, contradictions with existing wiki content.

**Step 2 — Determine page type.**
- A **concept** is a pattern, strategy, technique, principle, or architectural decision. It describes *how* something is done.
- An **entity** is a domain object: a component, service, third-party tool, person, place, or named artifact. It describes *what* something is.

If the source describes both, create separate pages for each and link them.

**Step 3 — Generate a slug.**
Lowercase, hyphenated, no spaces. Keep under 40 characters. Example: `pointer-architecture`, `auth-middleware`, `redis-cache-layer`.

**Step 4 — Write the summary page.**

Path: `<VAULT>/concepts/<slug>.md` or `<VAULT>/entities/<slug>.md`.

Required structure:

```markdown
---
tags: [<project>, <type>, <topic>]
date: <YYYY-MM-DD>
author: <author>
---

# <Title>

## Summary
<Three to five lines. State what the concept/entity is, why it exists, and the one fact most important to know. Do not exceed five lines.>

## <Additional sections as needed: Properties, Behavior, Trade-offs, Implementation, History>

## Related
- [[concepts/<slug>]] — <one-line reason>
- [[entities/<slug>]] — <one-line reason>
- <External path if applicable, e.g. `.claude/docs/architecture.md` §Section>

## Source
- <URL or file path>
```

The **Summary** section is the most important block. It is what other pages will cite. Keep it dense.

**Step 5 — Update the index.**

Open `<VAULT>/index.md`. Add a row in the correct category table (Concepts or Entities). Format:

```markdown
| [[<folder>/<slug>]] | <one-line summary, 5–15 words> |
```

The one-line summary in the index is **not** identical to the summary block in the page. The index version is shorter (single line) and oriented to relevance signaling. The page summary is denser (3–5 lines) and oriented to content delivery.

**Step 6 — Touch related pages.**

Identify 5–15 existing pages that should reference the new page. For each:
- Add a `[[<folder>/<slug>]]` link in the **Related** section.
- Where appropriate, add an inline mention in the body with the wiki link.
- If a claim in the existing page is contradicted by the new source, update the claim and note the change in `log.md`.

This step is non-negotiable. Skipping it makes the wiki a flat list rather than a graph.

**Step 7 — Append to log.**

Open `<VAULT>/log.md`. Append at the bottom (never edit existing entries):

```markdown
## [<YYYY-MM-DD>] ingest | <Title>
- Source: <URL or path>
- Created [[concepts/<slug>]] (or entities/<slug>)
- Updated [[index]] + cross-linked: [[<page-1>]], [[<page-2>]], ...
- **Result:** <one-line takeaway>
```

**Step 8 — Confirm to the human.**

Report:
- Page created (path).
- Index updated (which row).
- Pages touched (list).
- Suggested next ingest, if any.

### Anti-Patterns

- Writing a page longer than 1,500 words. Split into multiple focused pages instead.
- Skipping the index update. The page becomes invisible to the index-first protocol.
- Adding zero cross-references. Knowledge accumulates without compounding.
- Copying raw source content into `concepts/` verbatim. Synthesize.

---

## Workflow 2 — Lint Wiki

**Trigger phrases:** `/lint-wiki`, "check the wiki", "find broken links", "audit the vault".

**Cadence:** every 5–10 ingests, or weekly, or before any significant restructuring.

**Outputs:**
- A findings table (orphans, broken links, stale claims, missing cross-refs, frontmatter gaps).
- One appended `lint` entry in `log.md` with counts.

### Procedure

**Check 1 — Orphan pages.**

For every `.md` file in `concepts/` and `entities/`:
- Search the vault for inbound `[[<slug>]]` links.
- Zero inbound links → flag as **orphan**.

Exception: a page may have zero inbound links if it is explicitly listed in `index.md`. Flag those as **isolated** (less severe).

**Check 2 — Index integrity (both directions).**

Outbound: for every `[[<path>]]` link in `index.md`, resolve the target file. Missing target → flag as **broken link**.

Inbound: for every page in `concepts/`, `entities/`, and other tracked folders, search `index.md` for an entry. Missing entry → flag as **unindexed**.

**Check 3 — Stale claims.**

For every claim of the form "X is Y" or "X uses Z" or "X lives at <path>" in the wiki:
- Cross-check against the project source where possible.
- If the referenced path no longer exists, or the pattern has been refactored away, flag as **stale**.

This check is partial — perfect detection requires whole-codebase analysis. Catch the obvious cases (paths, file names, named symbols).

**Check 4 — Missing cross-references.**

For each page, scan the body for case-insensitive mentions of titles from other wiki pages.
- If the mention is plain text (no `[[wiki link]]`), flag as **missing cross-ref**.
- Suggest the specific link to add.

**Check 5 — Log freshness.**

Read the last entry of `log.md`.
- Older than 14 days → flag as **dormant**.
- Older than 30 days → flag as **stale wiki**.

**Check 6 — Frontmatter consistency.**

For every page in `concepts/` and `entities/`:
- Required keys: `tags`, `date`, `author`.
- Missing any → flag as **frontmatter incomplete**.

### Report Format

Output a markdown table to the agent's response:

```markdown
| Severity | Issue | File | Suggested action |
|----------|-------|------|------------------|
| high | broken link | index.md → concepts/foo | Create stub or remove entry |
| medium | orphan | entities/bar | Add inbound link or delete |
| medium | missing cross-ref | concepts/baz mentions "Quux" without link | Add [[entities/quux]] |
| low | frontmatter incomplete | entities/qux missing author | Add author key |
```

Then append a summary entry to `log.md`:

```markdown
## [<YYYY-MM-DD>] lint | wiki health check
- Scanned: <N concepts, M entities, L log entries>
- Findings: <X broken, Y orphans, Z stale, W frontmatter>
- High-severity items: <count>
- **Result:** <one-line state>
```

### Decisions Belong to the Human

The lint workflow surfaces findings; it does not auto-delete or auto-create. Orphan pages might be intentional. Stale claims might reflect a known-deprecated pattern that is documented for historical reasons. Always present the table and wait for direction.

Exceptions where the agent may auto-fix without asking:
- Adding a missing wiki link where the target file unambiguously exists.
- Stubbing a missing target referenced from the index, when the stub clearly belongs in the wiki.
- Filling missing frontmatter keys with sensible defaults (date = file mtime, author = global default).

---

## Workflow 3 — Token Checkup

**Trigger phrases:** `/token-checkup`, "how are we doing on tokens", "run the optimization check", "status".

**Cadence:** weekly, or after any significant structural change, or before a long planning session.

**Outputs:**
- A formatted status block printed to the human.
- One appended entry in `log.md`.
- An updated row in `<VAULT>/Token Optimization/Token Optimization Index.md` if savings have changed.

### Procedure

**Step 1 — Verify the dashboard server.**

Check whether `http://localhost:8080/dashboard.html` (or the configured port) responds with HTTP 200.

- If yes: report **Dashboard: live**.
- If no: start the server via the project's task-runner script (`npm run dashboard`, `poetry run dashboard`, etc.) in the background, then report **Dashboard: started**.

**Step 2 — Run the lint workflow.**

Invoke the lint procedure. Capture the findings counts (broken, orphan, stale, missing cross-ref, frontmatter).

**Step 3 — Measure current state.**

Collect:
- Size of root instruction file in bytes (`wc -c`).
- Size of `<VAULT>/index.md` in bytes.
- Size of `<VAULT>/log.md` in bytes.
- File counts in `<VAULT>/concepts/`, `<VAULT>/entities/`, and the broader vault.
- Latest cumulative savings percentage from `<VAULT>/Token Optimization/Token Optimization Index.md`.

**Step 4 — Read the watchlist.**

Open `<VAULT>/Token Optimization/Token Optimization Index.md`. Find the **Watchlist** section. Identify the first unchecked item.

**Step 5 — Append the checkup entry to the log.**

```markdown
## [<YYYY-MM-DD>] lint | token-checkup
- Wiki state: <N concepts, M entities, L log entries>
- Lint findings: <X broken, Y orphans, Z stale, W frontmatter>
- Current savings: <%>
- Next action: <top watchlist item>
```

**Step 6 — Print the status block.**

```
═══════════════════════════════════════════════════════════
  TOKEN CHECKUP — <YYYY-MM-DD>
═══════════════════════════════════════════════════════════

  Current savings:    <X>%  (relative to pre-pointer baseline)
  Projected target:   <Y>%  (full adoption)

  Dashboard:          http://localhost:<PORT>/dashboard.html

  Wiki state:
    • Concepts:       <N> pages
    • Entities:       <M> pages
    • Index size:     <KB>
    • Log entries:    <L>

  Health (lint):
    • Broken links:   <count>
    • Orphans:        <count>
    • Stale claims:   <count>
    • Frontmatter:    <count> incomplete

  Next action:
    → <first unchecked watchlist item>

═══════════════════════════════════════════════════════════
```

### When NOT to Run

- Mid-implementation flow. Defer to a natural break (after the next test passes, after the next commit).
- Less than 24 hours since the previous checkup (noise threshold).
- If `log.md` already contains a lint or checkup entry in the last 7 entries (redundant).

---

## Workflow Interactions

The three workflows form a maintenance cycle:

```
ingest  →  ingest  →  ingest  →  lint  →  ingest  →  ingest  →  checkup
                                  ↓                                  ↓
                              find issues                     report state
                                  ↓                                  ↓
                              fix or surface                   update watchlist
```

Roughly: ingest is continuous, lint is periodic, checkup is rhythmic. Skipping lint is the most common failure mode — schedule it.
