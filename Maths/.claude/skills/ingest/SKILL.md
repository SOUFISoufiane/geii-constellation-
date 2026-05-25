---
name: ingest
description: File new knowledge into the project wiki following the three-layer methodology. Use when the user types `/ingest <source>`, provides a URL, article, file path, or pasted document, or asks to "file this", "add to wiki", "summarize and store", or otherwise indicates that a finding should be preserved.
---

# Ingest Workflow

Follow this protocol when bringing new knowledge into the wiki. Skipping any step degrades the system.

## Six Steps

### 1. Read the source thoroughly
Extract: key claims, named entities, related concepts, contradictions with existing wiki content. Identify whether the source describes one topic or many.

### 2. Determine page type
- **Concept** (architectural pattern, strategy, technique, decision) → `<VAULT>/concepts/<slug>.md`
- **Entity** (component, service, tool, API, person, place) → `<VAULT>/entities/<slug>.md`
- If the source describes both, create separate pages and link them.

### 3. Generate a slug
Lowercase, hyphenated, no spaces, under 40 characters. Examples: `event-driven-jobs`, `auth-middleware`, `redis-cache-layer`.

### 4. Write the summary page

Use this exact structure:

```markdown
---
tags: [<project>, <type: concept|entity>, <topic>]
date: YYYY-MM-DD
author: <author>
---

# <Title>

## Summary
<Three to five dense lines. State what the concept/entity is, why it exists, and the one fact most important to know. Do not exceed five lines. This is what other pages will cite.>

## <Additional sections as needed>

## Related
- [[concepts/<slug>]] — <one-line reason>
- [[entities/<slug>]] — <one-line reason>
- <External reference path if applicable>

## Source
- <URL or file path>
```

Constraints:
- Page total length under 1,500 words. Split if longer.
- Summary section is the most important block — keep it dense.
- Frontmatter is required for lint compliance.

### 5. Update the index

Open `<VAULT>/index.md`. Add a row in the correct category table (Concepts or Entities):

```markdown
| [[<folder>/<slug>]] | <one-line summary, 5–15 words> |
```

The one-line summary in the index is shorter than the Summary block of the page. The index version signals relevance for selection; the page version delivers content after selection.

### 6. Touch related pages

Identify 5–15 existing pages that should reference the new page. For each:
- Add a `[[<folder>/<slug>]]` link in the **Related** section.
- Where appropriate, add an inline mention in the body, using the wiki link.
- If a claim in the existing page is contradicted by the new source, update the claim.

**This step is non-negotiable.** Skipping it makes the wiki a flat list instead of a graph. Compounding requires cross-references.

### 7. Append to log

Open `<VAULT>/log.md`. Append at the bottom — never edit existing entries:

```markdown
## [YYYY-MM-DD] ingest | <Title>
- Source: <URL or path>
- Created [[<folder>/<slug>]]
- Updated [[index]] + cross-linked: [[<page-1>]], [[<page-2>]], ...
- **Result:** <one-line takeaway>
```

### 8. Confirm to the human

Print:
- Page created (path).
- Index updated (which category, which row).
- Pages touched (list with wiki links).
- Suggested next ingest, if any.

## Anti-Patterns

| Anti-pattern | Why it fails |
|--------------|--------------|
| Page longer than 1,500 words | Cannot be selectively loaded; precision degrades |
| Skipping the index update | New page becomes invisible to the index-first protocol |
| Skipping cross-references | Knowledge accumulates without compounding |
| Copying raw source content verbatim | Wiki layer must contain synthesis, not transcripts |
| Creating a page outside `/ingest` | Bypasses all six steps; produces orphans |

## When To Defer Ingest

- Mid-implementation flow that has not reached a natural pause.
- Source is a transient discussion that may not survive the next session.
- Source duplicates an existing page that should be updated, not replaced.

In all three cases, note the deferral in the log with type `decision`.
