# Course Materials — ground truth for app accuracy

Drop your BUT1 / BUT2 materials here. Claude reads these **selectively, per task**
(not all at once) to align the apps to exactly the notation, formulas, and
conventions your courses use — and to verify the apps against worked examples.

## Where to put what

| Folder | Put here | Maps to app |
|--------|----------|-------------|
| `circuits/` | Électricité / circuits TD-TP, notes | `apps/circuits` (RLC, Kirchhoff, Thévenin) |
| `automatique/` | Automatique / asservissement TD-TP, notes | `apps/automatique` (PID, lieu des racines, Bode) |
| `numerique/` | Logique / électronique numérique TD-TP | `apps/numerique` (table de vérité, Karnaugh, VHDL) |
| `maths/` | Maths TD-TP (EDO, Laplace, fonctions) | `apps/maths` (surface 3D, EDO RK4, Laplace) |
| `_formulaires/` | Formula sheets / "formulaires" — the exact symbols & conventions your program uses | all apps |
| `_programme/` | Syllabus / programme / module list (BUT1 + BUT2) | scope decisions |

## Most useful, ranked

1. **TD / TP sheets WITH solutions** — a known input → known answer is the best
   test case. I check the app reproduces it.
2. **Formulaires** — so the apps use *your* notation (e.g. `p` vs `s`, `ξ` vs `ζ`).
3. **Programme** — so any new module maps to a real course, not a guess.

File names can be anything; the folder is enough. PDF, images, markdown, pasted
text all fine.

## Rules

- **Private — never committed.** This whole folder (except this README) is
  gitignored. It will not end up in any commit, Claude's or Gemini's.
- These materials make the **tools** correct. They are not used to produce graded
  work — the apps build intuition and check answers, they don't do your TP for you.
- Gemini/Antigravity: read-only reference, do not edit or commit.
