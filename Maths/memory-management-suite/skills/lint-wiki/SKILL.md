---
name: lint-wiki
description: Health-check the project wiki. Finds orphan pages, broken links, stale claims, missing cross-references, and frontmatter gaps. Run periodically (every 5–10 ingests or weekly). Use when the user types `/lint-wiki`, asks to "check the wiki", "find broken links", "audit the vault", or "clean up the notes".
---

# Lint Wiki Workflow

Run a health pass over the wiki. Surface findings; never auto-delete without explicit human consent.

## Six Checks

### 1. Orphan pages
For every `.md` file in `<VAULT>/concepts/` and `<VAULT>/entities/`:
- Grep the vault for inbound `[[<slug>]]` links (also try `[[<folder>/<slug>]]`).
- Zero inbound links → flag as **orphan**.
- If listed in `index.md` only, flag as **isolated** (less severe).

### 2. Index integrity (both directions)

**Outbound:** for every `[[<path>]]` link in `<VAULT>/index.md`:
- Resolve the target file. Missing → flag as **broken link**.

**Inbound:** for every page in `<VAULT>/concepts/`, `<VAULT>/entities/`, `<VAULT>/Token Optimization/`:
- Search `<VAULT>/index.md` for an entry pointing to that page.
- Missing → flag as **unindexed**.

### 3. Stale claims
For every claim of the form "X is Y", "X uses Z", or "X lives at <path>" in the wiki:
- Where possible, cross-check against the project source.
- If a referenced file/path no longer exists → flag as **stale**.
- If a named symbol no longer appears in the codebase → flag as **stale**.

Stale-claim detection is partial by design. Catch the obvious cases. Mark uncertain findings as **possibly stale**.

### 4. Missing cross-references
For each page in `<VAULT>/concepts/` and `<VAULT>/entities/`:
- Scan the body for case-insensitive mentions of titles from other wiki pages.
- If the mention is plain text (no `[[wiki link]]`) → flag as **missing cross-ref**.
- Suggest the specific link to add.

### 5. Log freshness
Read the last entry of `<VAULT>/log.md`.
- Older than 14 days → flag as **dormant**.
- Older than 30 days → flag as **stale wiki** (escalate).

### 6. Frontmatter consistency
For every page in `<VAULT>/concepts/` and `<VAULT>/entities/`:
- Required keys: `tags`, `date`, `author`.
- Missing any → flag as **frontmatter incomplete**.

## Report Format

Output a markdown table:

```markdown
| Severity | Issue | File | Suggested action |
|----------|-------|------|------------------|
| high | broken link | index.md → concepts/foo | Create stub or remove entry |
| medium | orphan | entities/bar | Add inbound link or delete |
| medium | missing cross-ref | concepts/baz mentions "Quux" without link | Add [[entities/quux]] |
| low | frontmatter incomplete | entities/qux missing author | Add author key |
```

Severity rubric:
- **high** — broken links, stale claims (confirmed).
- **medium** — orphans, missing cross-refs, dormancy.
- **low** — frontmatter gaps, isolated pages, possibly stale claims.

Then append a summary entry to `<VAULT>/log.md`:

```markdown
## [YYYY-MM-DD] lint | wiki health check
- Scanned: <N concepts, M entities, L log entries>
- Findings: <X broken, Y orphans, Z stale, W frontmatter>
- High-severity items: <count>
- **Result:** <one-line state — "healthy" / "drift detected" / "intervention needed">
```

## Auto-Fix Permissions

The agent **may** auto-fix without asking when:
- A missing wiki link points to a file that unambiguously exists.
- A missing frontmatter key has a sensible default (date = file mtime, author = global default).
- An index entry references a missing file that clearly belongs in the wiki — create a stub with `status: stub` frontmatter and a TODO note.

The agent **must not** auto-fix when:
- An orphan page might be intentional or historical.
- A stale claim documents a deprecated pattern on purpose.
- A page would be deleted.

In all "must not" cases, surface the finding and wait for direction.

## When To Defer Lint

- Right after a fresh ingest (let cross-references settle first).
- User is in deep implementation flow — defer to natural break.
- Last lint pass was less than 24 hours ago (noise threshold).
