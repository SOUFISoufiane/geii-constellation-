---
tags: [{{PROJECT_NAME}}, token-optimization, dashboard]
date: {{DATE}}
author: {{AUTHOR}}
---

# Token Optimization Dashboard

> [!info] Two views available
> **This file** = vault-native (Mermaid renders inline in editors that support it).
> **`dashboard.html`** = standalone interactive HTML with charts and persistent checklist. Open in browser via `{{COMMAND_PREFIX}} dashboard`.

## At-a-Glance

| Metric | Value |
|--------|-------|
| **Per-session savings (current)** | *— update after first measurement* |
| **Projected target** | -85% (post full adoption) |
| **Instruction file size** | *— bytes* |
| **Wiki state** | *— concepts, — entities, — log entries* |

## Architecture — Before vs After

### Before (monolithic instruction file)

```mermaid
graph TD
  A["Instruction file<br/>(monolithic)<br/>loaded every turn"] --> F((Working Memory))
  A -.contains.-> X["Role + protocols"]
  A -.contains.-> Y["Architecture details"]
  A -.contains.-> Z["File maps + conventions"]
  A -.contains.-> W["Vault structure dump"]

  style A fill:#ef4444,color:#fff
  style F fill:#06B6D4,color:#000
```

### After (pointer + three-layer wiki)

```mermaid
graph TD
  subgraph Schema[Schema Layer]
    S[CLAUDE.md]
    D[".claude/docs/"]
  end
  subgraph Wiki[Wiki Layer - agent owns]
    I[index.md<br/>read FIRST]
    L[log.md<br/>append-only]
    C1[concepts/]
    E1[entities/]
    T[Token Optimization/]
  end
  subgraph Raw[Raw Layer - immutable]
    R[Sources<br/>Project Updates]
  end

  S -->|read first| I
  S -.pointer.-> D
  I -->|drill into 2-4| C1
  I -->|drill into 2-4| E1
  I -->|drill into 2-4| T
  C1 -.cross-link.-> E1
  E1 -.cross-link.-> C1
  R -->|/ingest| C1
  R -->|/ingest| E1
  Wiki -->|append| L

  style S fill:#8B5CF6,color:#fff
  style D fill:#8B5CF6,color:#fff
  style I fill:#06B6D4,color:#000
  style R fill:#52525b,color:#fff
```

## Methodology Adoption Status

| # | Principle | Status |
|---|---|---|
| 1 | Instruction file as schema (pointer skeleton) | 🟢 DONE |
| 2 | Index-first protocol | 🟢 DONE |
| 3 | Three-layer separation (raw / wiki / schema) | 🟡 ACTIVE |
| 4 | `index.md` with summaries + categories | 🟢 DONE |
| 5 | `log.md` append-only audit | 🟢 DONE |
| 6 | Agent owns wiki layer | 🟡 ACTIVE |
| 7 | Ingest workflow (touches 5-15 pages) | 🟢 DONE |
| 8 | Periodic lint pass | 🟡 ACTIVE |
| 9 | Machine-readable schemas (tables, frontmatter) | 🟢 DONE |
| 10 | `.claudeignore` for indexing layer | 🟢 DONE |
| 11 | Token-savings feedback loop | 🟢 DONE |
| 12 | Trigger-condition pointer table | 🟢 DONE |

**Legend:** 🟢 DONE · 🟡 ACTIVE · 🔴 TODO

## Token Math — Projected Stages

```mermaid
graph LR
    A[Baseline<br/>~100K tokens/session] -->|pointer arch<br/>-70%| B[~30K tokens/session]
    B -->|index-first<br/>-25%| C[~22K tokens/session]
    C -->|full wiki<br/>-32%| D[~15K tokens/session<br/>-85% total]

    style A fill:#ef4444,color:#fff
    style B fill:#f59e0b,color:#000
    style C fill:#10b981,color:#fff
    style D fill:#8B5CF6,color:#fff
```

Numbers are projections — replace with measured values once a baseline has been captured.

## Implementation Checklist

### ✓ Installed
- [x] Suite installed in project root
- [x] CLAUDE.md refactored to pointer skeleton
- [x] `.claudeignore` configured
- [x] `.claude/docs/` contains dereferenced sections
- [x] `/ingest` skill registered
- [x] `/lint-wiki` skill registered
- [x] `/token-checkup` skill registered
- [x] `index.md` created
- [x] `log.md` created
- [x] `dashboard.html` serving locally

### ◐ In Progress
- [ ] Seed first 5 concept pages via `/ingest`
- [ ] Seed first 5 entity pages via `/ingest`
- [ ] Capture baseline token measurement
- [ ] Add Session Start Protocol to instruction file

### ○ TODO
- [ ] Add `Project_Status.md` to vault `Memory/` folder
- [ ] Add `Technical_Debt.md` to vault `Memory/` folder
- [ ] First `/lint-wiki` pass
- [ ] First `/token-checkup` run
- [ ] Document custom triggers in instruction file if needed
- [ ] Verify dashboard renders all sections

## Related

- [[Token Optimization Index]] — running savings log
- [[concepts/]] — architectural patterns
- [[entities/]] — components, services, tools
- `dashboard.html` — interactive HTML version (open in browser)
