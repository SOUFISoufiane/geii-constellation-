---
name: token-checkup
description: One-command token-optimization status. Verifies the dashboard server, runs the wiki lint workflow, reports current savings, and surfaces the next watchlist item. Use when the user types `/token-checkup`, asks "how are we doing on tokens", "run the optimization check", "status report", or "wiki health".
---

# Token Checkup Workflow

A single command that runs the full feedback loop. Use to maintain the optimization discipline without manual orchestration.

## Procedure

### 1. Verify the dashboard server
Check whether `http://localhost:8080/dashboard.html` (or the configured port) returns HTTP 200:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/dashboard.html
```
- If 200: report **Dashboard: live**.
- If not 200: start the dashboard server in the background via the project's task-runner script (e.g. `npm run dashboard`, `poetry run dashboard`). Then report **Dashboard: started**.

### 2. Run the wiki lint workflow
Invoke `lint-wiki` (`.claude/skills/lint-wiki/SKILL.md`). Capture findings counts:
- Broken links
- Orphan pages
- Stale claims
- Missing cross-references
- Frontmatter gaps

### 3. Measure current state
Collect via `wc -c` and `ls`:
- Bytes of root instruction file (e.g. `CLAUDE.md`).
- Bytes of `<VAULT>/index.md`.
- Bytes of `<VAULT>/log.md`.
- Page count in `<VAULT>/concepts/`.
- Page count in `<VAULT>/entities/`.

### 4. Read the cumulative savings
Open `<VAULT>/Token Optimization/Token Optimization Index.md`. Extract the latest **Cumulative** column from the Optimization Log table.

### 5. Read the watchlist
In the same file, find the **Watchlist** section. Identify the first unchecked `- [ ]` item.

### 6. Append the checkup entry
Append to `<VAULT>/log.md`:

```markdown
## [YYYY-MM-DD] lint | token-checkup
- Wiki state: <N concepts, M entities, L log entries>
- Lint findings: <X broken, Y orphans, Z stale, W frontmatter>
- Current savings: <%>
- Next action: <top watchlist item>
```

### 7. Print the status block

```
═══════════════════════════════════════════════════════════
  TOKEN CHECKUP — <YYYY-MM-DD>
═══════════════════════════════════════════════════════════

  Current savings:    <X>%  (relative to pre-optimization baseline)
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

## When NOT To Run

- Mid-implementation flow. Defer to natural break (after next test passes, after next commit).
- Less than 24 hours since the previous checkup (noise threshold).
- If `log.md` already contains a `lint` or `token-checkup` entry in the last 7 entries (redundant).

## Outputs Other Skills Read

- The `Next action` line in the checkup entry feeds back into the watchlist tracking.
- The `Current savings` value updates the `Cumulative` column in the optimization index if it has changed since the last entry.
- The full status block is displayed to the human verbatim. Do not paraphrase.
