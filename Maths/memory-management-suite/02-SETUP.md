# Setup — Bootstrap a New Project

This document walks through installing the suite in a fresh project. Estimated time: 10–15 minutes for a small project, 30–60 minutes for a project with existing documentation that must be migrated.

## Prerequisites

- The project root directory exists.
- A notes surface is selected (Obsidian recommended for `[[wiki links]]` rendering, but plain markdown directory works).
- Python 3 or Node.js is available on the local machine.

## Step 1 — Decide the Vault Location

Pick one location for the wiki layer. Options:

| Option | When to use |
|--------|-------------|
| Inside the project repo (e.g. `<project>/docs/wiki/`) | Single-repo projects, wiki is versioned with code |
| Adjacent vault directory (e.g. `<project>/vault/`) | Shared across collaborators via the same repo |
| External vault (e.g. `~/notes/<project>/`) | Personal projects, wiki kept private from collaborators |

Throughout this document the chosen path is referred to as `<VAULT>`.

## Step 2 — Create the Folder Structure

From the project root, run:

```bash
mkdir -p "<VAULT>" \
         "<VAULT>/concepts" \
         "<VAULT>/entities" \
         "<VAULT>/Token Optimization" \
         ".claude/docs" \
         ".claude/skills/ingest" \
         ".claude/skills/lint-wiki" \
         ".claude/skills/token-checkup"
```

The `.claude/docs/` directory holds dereferenced reference files. The `.claude/skills/` directory holds the three workflow skills.

## Step 3 — Copy Templates

Copy these files from the suite into the new project:

| Source | Destination |
|--------|-------------|
| `templates/CLAUDE.md` | `<project>/CLAUDE.md` |
| `templates/.claudeignore` | `<project>/.claudeignore` |
| `templates/wiki/index.md` | `<VAULT>/index.md` |
| `templates/wiki/log.md` | `<VAULT>/log.md` |
| `templates/wiki/concepts/example-concept.md` | `<VAULT>/concepts/example-concept.md` |
| `templates/wiki/entities/example-entity.md` | `<VAULT>/entities/example-entity.md` |
| `skills/ingest/SKILL.md` | `<project>/.claude/skills/ingest/SKILL.md` |
| `skills/lint-wiki/SKILL.md` | `<project>/.claude/skills/lint-wiki/SKILL.md` |
| `skills/token-checkup/SKILL.md` | `<project>/.claude/skills/token-checkup/SKILL.md` |
| `dashboard/dashboard.html` | `<VAULT>/Token Optimization/dashboard.html` |
| `dashboard/Dashboard.md` | `<VAULT>/Token Optimization/Dashboard.md` |

## Step 4 — Fill the Placeholders

Open each copied file and replace the placeholder tokens with project-specific values:

| Placeholder | Replace with |
|-------------|--------------|
| `{{PROJECT_NAME}}` | The project's short name (e.g. `acme-store`) |
| `{{PROJECT_DESCRIPTION}}` | One-sentence description |
| `{{VAULT_PATH}}` | Path from project root to the vault (e.g. `vault/` or `docs/wiki/`) |
| `{{PRIMARY_LANGUAGE}}` | Main programming language (e.g. `TypeScript`, `Python`, `Rust`) |
| `{{PRIMARY_FRAMEWORK}}` | Main framework (e.g. `Next.js 15`, `Django 5`, `Axum`) |
| `{{COMMAND_PREFIX}}` | Build tool prefix (e.g. `npm`, `pnpm`, `cargo`, `poetry`) |
| `{{DEV_PORT}}` | Local development server port |
| `{{DATE}}` | Today's date in `YYYY-MM-DD` format |
| `{{AUTHOR}}` | Author name for frontmatter |

A quick search-and-replace across the project handles most of these. Verify each file individually before committing.

## Step 5 — Extract Heavy Sections (Pointer Refactor)

If the project already has a `CLAUDE.md` or equivalent instruction file longer than ~100 lines, extract heavy sections now.

For each section longer than 15 lines that is **not** universally needed (architecture details, file maps, convention dumps, design system tables, etc.):

1. Cut the section.
2. Save it to `.claude/docs/<topic>.md` (use `templates/docs/reference-doc.md` as the structure).
3. In the original instruction file, replace the section with a pointer row in the **Reference Pointers** table:

```markdown
| **<Topic>** | `.claude/docs/<topic>.md` | <Trigger condition — when should this be read?> |
```

A correctly applied pointer refactor drops the root instruction file to roughly 80–100 lines.

## Step 6 — Configure `.claudeignore`

Open `.claudeignore` and add any project-specific large files that should not be indexed. Always include:

- Lockfiles (`package-lock.json`, `pnpm-lock.yaml`, `poetry.lock`, `Cargo.lock`)
- Large seed-data or fixture files
- Build outputs (`dist/`, `build/`, `.next/`, `target/`)
- Binary media assets (images, video, audio)
- Database files (`*.db`, `*.sqlite`)
- Environment files (`.env*` — for safety, though indexing rarely reaches them)

## Step 7 — Bootstrap the Wiki

The wiki starts empty except for the example pages. To populate it:

1. Identify the **5 most fundamental concepts** in the project (architectural patterns, core algorithms, key strategies). For each, run the ingest workflow (`03-WORKFLOWS.md` § Ingest) against the project's source code or documentation.
2. Identify the **5 most fundamental entities** (services, components, third-party tools, external APIs). For each, ingest.
3. Delete the example pages once at least one real page exists in each folder.

The wiki is now seeded. From this point forward, every new piece of knowledge enters via ingest.

## Step 8 — Verify the Dashboard

Add a script entry to the project's task runner so the dashboard can be served with a single command.

For Node.js / npm projects, add to `package.json`:

```json
"scripts": {
  "dashboard": "python -m http.server 8080 --directory \"<VAULT>/Token Optimization\""
}
```

For Python / Poetry projects, add to `pyproject.toml`:

```toml
[tool.poetry.scripts]
dashboard = "python -m http.server 8080 --directory <VAULT>/Token Optimization"
```

For projects without a task runner, document the equivalent shell command in the project README.

Verify by running the script and opening `http://localhost:8080/dashboard.html`. The dashboard should render with placeholder data.

## Step 9 — Establish Session Start Protocol

Add the following block to the root instruction file under a heading such as **Session Start Protocol**:

```markdown
## Session Start Protocol
At the start of every session, before any task work, read in order:
1. `<VAULT>/Memory/Project_Status.md` (if it exists)
2. `<VAULT>/Memory/Technical_Debt.md` (if it exists)

Skip if the session summary already contains their content.
This converts expensive repo exploration into 2 cheap Read calls.
```

The two memory files are optional — create them as the project matures.

## Step 10 — First Token Checkup

Run the `/token-checkup` workflow (`03-WORKFLOWS.md` § Token Checkup) to capture a baseline. Record the result in `<VAULT>/Token Optimization/Token Optimization Index.md`. All future measurements compare against this baseline.

## Migration Notes (Existing Project)

If applying the suite to a project that already has a large instruction file and an unstructured notes folder:

1. **Do not delete the existing notes.** Move them into a `Raw/` or `Project Updates/` folder. They become the raw layer.
2. **Do not migrate all notes into the wiki at once.** Ingest only what is actively needed. The rest stays raw until queried.
3. **Run the lint workflow after the first 5–10 ingests** to catch broken links and orphan pages.
4. **Track the migration in the optimization log.** Each pointer extraction, each wiki seed, each lint pass is a log entry.

## Verification Checklist

- [ ] `<project>/CLAUDE.md` exists and is under 100 lines.
- [ ] `<project>/.claudeignore` exists and excludes lockfiles and build artifacts.
- [ ] `<project>/.claude/docs/` contains at least the dereferenced sections from the original instruction file.
- [ ] `<project>/.claude/skills/{ingest,lint-wiki,token-checkup}/SKILL.md` all exist.
- [ ] `<VAULT>/index.md` and `<VAULT>/log.md` exist.
- [ ] `<VAULT>/concepts/` and `<VAULT>/entities/` each contain at least one real page (example pages deleted).
- [ ] `<VAULT>/Token Optimization/dashboard.html` is reachable via the configured task-runner script.
- [ ] The first token-checkup baseline has been recorded.

Once all boxes are checked, the suite is installed.
