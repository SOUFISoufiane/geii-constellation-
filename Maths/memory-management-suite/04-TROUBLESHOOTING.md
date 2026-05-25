# Troubleshooting

Common failure modes and their fixes. Consult only when something is wrong; do not preload.

## Symptom: instruction file keeps growing

**Cause:** new sections are being added inline instead of dereferenced into `.claude/docs/`.

**Fix:** apply the pointer refactor from `02-SETUP.md` § Step 5 to every section longer than 15 lines that is not universally needed. The instruction file should never grow above ~120 lines for a project of typical size.

**Prevention:** before adding any new section to the instruction file, ask: "is this needed on every turn?" If no, write it as a `.claude/docs/<topic>.md` file and add a pointer row.

---

## Symptom: agent ignores the index-first protocol

**Cause:** the pointer to `index.md` is buried in the middle of the pointer table, or the "Read when…" trigger is too narrow.

**Fix:** make the index pointer the **first** row of the Reference Pointers table. Set its trigger to: *"Any question about project knowledge, concepts, or entities — read first."* Also add an explicit one-line directive above the table:

```markdown
> Read `<VAULT>/index.md` FIRST on any knowledge query, then drill into 2–4 relevant pages.
```

---

## Symptom: wiki becomes a flat list, links go nowhere

**Cause:** ingest workflow is being skipped or shortcut. Pages are being created without the index update or cross-reference step.

**Fix:** run the lint workflow. It will surface orphans and unindexed pages. For each, either add to the index, add inbound links from related pages, or delete.

**Prevention:** never manually create a page in `concepts/` or `entities/`. Always go through `/ingest`. The skill enforces all six steps.

---

## Symptom: dashboard does not load

**Possible causes and fixes:**

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Browser shows "connection refused" | Server not running | Run the task-runner script (e.g. `npm run dashboard`) |
| Browser loads but charts are blank | CDN scripts blocked by firewall or offline mode | Confirm internet access; Chart.js and Mermaid are loaded via CDN |
| Browser loads but Mermaid diagrams show raw text | Mermaid script blocked or version mismatch | Update CDN URL in `dashboard.html` to the current Mermaid version |
| Dashboard loads but checklist state is empty | First run — no `localStorage` data yet | Click items; state will persist on the second load |
| Dashboard checklist persists across projects | `localStorage` is browser-wide, not project-scoped | Use a different browser profile per project, or rename the `localStorage` key in `dashboard.html` |

---

## Symptom: lint reports many false positives for "stale claims"

**Cause:** the lint workflow's stale-claim check is partial by design — it catches obvious cases (paths, file names) but cannot verify every assertion.

**Fix:** treat stale-claim findings as **suggestions**, not facts. Review each manually. If a finding is consistently wrong, narrow the lint rule.

---

## Symptom: `.claudeignore` does not seem to work

**Cause:** the file is at the wrong path, has incorrect glob syntax, or the agent's runtime indexing layer does not respect it.

**Fix:**
1. Confirm the file is at the **project root**, not inside a subdirectory.
2. Confirm syntax — each line is a glob pattern relative to project root, with `#` for comments.
3. Restart the agent runtime if it caches the ignore list.
4. Test by asking the agent to list files matching one of the ignored patterns. It should still find them via direct tools (the ignore file only affects background indexing, not explicit reads).

---

## Symptom: ingest creates a 5,000-word page

**Cause:** the source was long and the agent did not summarize.

**Fix:** instruct the agent to rewrite the page following the 3–5 line summary rule. Split into multiple focused pages if the source genuinely covers multiple concepts.

**Prevention:** the ingest skill explicitly warns against long pages. If the agent ignores it, the skill description needs strengthening — edit `skills/ingest/SKILL.md` to make the constraint more visible.

---

## Symptom: log.md becomes hard to scan

**Cause:** entries are not following the required format, or the file is now hundreds of entries long.

**Fix:** every entry must start with `## [<YYYY-MM-DD>] <type> | <title>`. The type must be one of: `ingest`, `update`, `lint`, `refactor`, `decision`. Run a search to find malformed entries and reformat.

If the log exceeds 500 entries, consider archiving entries older than 6 months to `log-archive-<YYYY>.md` and starting a fresh `log.md`. Keep the latest 6 months active for quick scanning.

---

## Symptom: per-session token usage has not dropped

**Diagnostic order:**

1. Measure the instruction file: `wc -c <project>/CLAUDE.md`. Should be under 4 KB.
2. Check if the agent is actually using the pointers — review recent transcripts for evidence that it reads `.claude/docs/` files only when needed.
3. Confirm `.claudeignore` is present and includes lockfiles.
4. Check vault file count. If `concepts/` and `entities/` are still empty, the index-first protocol cannot save anything because there are no pages to index.

The most common cause: the pointer refactor was incomplete and the instruction file still contains heavy data. Re-run `02-SETUP.md` § Step 5.

---

## Symptom: human collaborators edit the wiki manually

**Cause:** the agent-owned layer was not communicated to the team.

**Fix:** add a note at the top of `index.md`:

```markdown
> [!warning] Agent-Owned Layer
> Files in `concepts/`, `entities/`, `index.md`, and `log.md` are maintained by the LLM agent via the ingest, lint, and checkup workflows.
> Manual edits will be overwritten on the next ingest unless surfaced first.
> To add knowledge: invoke `/ingest <source>` instead of writing directly.
```

For mixed human/agent vaults, consider a sibling `Human Notes/` folder for free-form human writing that the agent treats as raw layer.

---

## Symptom: skills are not being discovered by the agent

**Cause:** the skill file is missing required frontmatter, or the path is wrong.

**Fix:**
1. Confirm each skill file is at `<project>/.claude/skills/<name>/SKILL.md`.
2. Confirm frontmatter contains both `name:` and `description:` keys.
3. Confirm the `description:` field includes trigger phrases the user is likely to type (e.g. "Use when the user types `/ingest` or asks to 'file this' or 'add to wiki'").

The agent matches skills by description. A vague description means no match.

---

## Symptom: wiki grows but token savings plateau

**Cause:** the wiki is healthy but the system has hit the lower bound for its size. The first 60–80% of savings comes from pointer extraction; further savings require pruning, summarization tightening, and avoiding redundant re-reads.

**Diagnostic actions:**

1. Audit `.claude/docs/` reference files. Each should also have a 3–5 line summary block at the top. If not, add one (some agents will read the summary and skip the body when the trigger does not strictly require deep dive).
2. Audit the top 5 most-frequently-read wiki pages. Tighten their summaries.
3. Check whether session-start protocol is forcing reads of files that have not changed in weeks. If so, conditionally skip them (the protocol says: skip if the session summary already contains their content).

Beyond ~85% savings relative to a naive baseline, further gains require more aggressive measures (semantic caching, prompt compression) that are outside this suite's scope.

---

## Symptom: collaborators on a different OS see broken paths

**Cause:** paths in the wiki use Windows backslashes or absolute home directory paths.

**Fix:** use forward slashes everywhere in markdown. Use project-relative paths, never absolute. Never embed `C:/Users/<name>` or `/home/<name>` in any wiki page.

---

## Symptom: agent forgets the methodology between sessions

**Cause:** the methodology is not surfaced in the project's agent-memory layer.

**Fix:** create a short pointer file in the agent's persistent memory (path varies by runtime, e.g. `~/.claude/projects/<project-id>/memory/feedback_methodology.md`) that names this suite as the active methodology and lists the three skills. Reference it from the agent-memory index file.

---

## Last Resort: full reset

If the suite is misconfigured beyond easy repair:

1. Move the current `<VAULT>` to `<VAULT>.backup-<YYYY-MM-DD>`.
2. Move the current `CLAUDE.md` to `CLAUDE.md.backup`.
3. Re-run `02-SETUP.md` from Step 1.
4. Re-ingest the 10 most important pages from the backup vault.
5. Keep the backup for one month before deleting.

A full reset costs roughly 2 hours of focused ingest work and is often worth it if accumulated drift has made the wiki noisy.
