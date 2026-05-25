# GEMINI.md

Multi-AI collaboration guidelines for GEII Visual Toolbox project.

## Scope Boundaries

### Claude (Haiku/Sonnet/Opus)
- **Primary architect & implementer** of the platform shell
- Shell infrastructure: `shared/css/`, `shared/js/`, `index.html` (home page)
- Signal Observatory migration & testing
- Documentation (CONVENTIONS.md, CONCEPTS.md)
- Final QA + deployment

### Gemini CLI
- **Research & exploration** (documentation, best practices, alternatives)
- **Code review & feedback** on Claude's implementations
- **Parallel work on stub app READMEs** (spec writing, feature lists)
- **Knowledge synthesis** (if needed for decision-making)

## Explicit Overlap to Avoid

❌ **Do not both write:**
- `shared/manifest.js` — Claude owns this; Gemini reviews
- `apps/signal-observatory/index.html` — Claude owns migration; Gemini can QA
- `index.html` (home page) — Claude owns design & implementation; Gemini can suggest UX improvements via chat

✅ **Can happen in parallel:**
- Claude builds shell infrastructure
- Gemini writes detailed spec for each stub app (circuits, automatique, numerique, maths) in `apps/<id>/README.md`
- Gemini researches tech stack recommendations for future apps (e.g., what plotting library for Bode diagrams?)

## Communication Protocol

1. **Before major commits:** Brief status in chat (what's done, what's next)
2. **Conflict detected?** Claude pauses, notes the overlap in chat, Gemini responds with findings/suggestions
3. **Code review:** Gemini can review Claude's shell code before it ships; provide feedback via chat
4. **Decision requests:** If stuck, Claude asks Gemini for research/alternative approaches

## Project Memory

- **Claude** updates `.claude/projects/.../memory/` (project status, technical decisions)
- **Gemini** can read memory but should not write to it (avoid sync conflicts)
- **Both read** `CLAUDE.md`, `GEMINI.md`, and project memory at session start

## Files Gemini Should Not Edit (Direct)

```
shared/css/*
shared/js/*
index.html
apps/signal-observatory/*
.claude/
docs/CONVENTIONS.md  (Claude owns structure; Gemini can suggest content)
```

## Files Gemini Can Own

```
apps/circuits/README.md
apps/automatique/README.md
apps/numerique/README.md
apps/maths/README.md
(research documents / decision logs if needed)
```

## General Working Guidelines (Gemini)

1. **Be mindful of file modifications**: Avoid mass refactoring or re-formatting code unnecessarily. Only edit specific lines required for the task.
2. **Respect existing standards**: Follow conventions established by previous AI agents. Do not overwrite Claude-specific configuration files without explicit permission.
3. **Coordinate tasks**: If a task might conflict with ongoing work, clarify the scope before modifying the codebase.
4. **Clean State**: When completing tasks, leave the environment in a clean state (e.g., closing background servers).

## Decision Log

None yet. Add entries as overlaps or key decisions emerge.

---

**Last Updated:** 2026-05-24  
**Status:** Established before platform shell work begins
