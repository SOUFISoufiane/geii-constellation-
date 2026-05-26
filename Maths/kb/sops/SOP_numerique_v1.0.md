# SOP_numerique_v1.0

## 1. Objective
To document the maintenance and extension procedure for the Digital Lab (numérique) app
(truth table → Karnaugh minimization → VHDL generation).

## 2. Scope
Applies to `Maths/apps/numerique/` — `index.html`, `js/main.js`, and the modules
`js/modules/{karnaugh,quine-mccluskey,vhdl}.js`.

## 3. Prerequisites
- Local Python dev server (`python dev_server.py 8123`).
- Note: this app uses **no Plotly** — its tabs are HTML tables, an SVG/CSS K-map, and a
  `<pre>` code block, so it was never affected by the plot-sizing bug.

## 4. Procedure
1. **Shared state**: the truth table is the single input; Karnaugh and VHDL **derive** from
   it. Changing the minimization logic lives in `quine-mccluskey.js`.
2. **Truth table**: input count (2-4) and per-minterm output toggles build the canonical SOP.
3. **Karnaugh**: `karnaugh.js` renders the K-map and highlights the prime-implicant groups
   from the Quine–McCluskey result.
4. **VHDL**: `vhdl.js` emits the entity + dataflow architecture from the minimal SOP.
5. **Layout**: numérique's `.dashboard` is a centered block (not a flex row), so it is
   already mobile-friendly; the shared `app-responsive.css` rules are no-ops here.

## 5. Troubleshooting
- **Karnaugh/VHDL out of sync with the table**: ensure the derived tabs re-read the shared
  truth-table state on activation (they recompute from the minterm set).

## 6. Revision History
- **v1.0**: Rewritten to match the built app (was a stub-era logic-gate-board description).
