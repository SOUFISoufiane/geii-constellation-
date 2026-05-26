# SOP_circuits_v1.0

## 1. Objective
To define the maintenance and extension procedure for the Circuits Interactifs app
(RLC step response, Kirchhoff mesh analysis, Thévenin equivalent).

## 2. Scope
Applies to `Maths/apps/circuits/` — `index.html`, `js/main.js`, and the per-tab modules
`js/modules/{rlc,kirchhoff,thevenin}.js`.

## 3. Prerequisites
- Local Python dev server (`python dev_server.py 8123`).
- Familiarity with the tab-module pattern (each tab = one `init*` module wired in `main.js`).

## 4. Procedure
1. **Edit a tab**: change the matching module in `js/modules/`. Each exports an `init*()`
   that wires its sliders and calls an `update()` closure.
2. **Add a tab**: add the panel + tab button in `index.html`, then register the module in
   the `INIT` map in `js/main.js`.
3. **Plots**: render Plotly via `renderPlot` from `shared/js/plot-fit.js` — never raw
   `Plotly.react` (avoids the collapsed-`svg-container` blank-plot bug).
4. **Schematics / equations**: Kirchhoff and Thévenin draw inline SVG and render KaTeX;
   Kirchhoff waits for `window.katex` before init (see `main.js`).

## 5. Troubleshooting
- **Blank plot on first tab**: a module used raw `Plotly.react`. Switch to `renderPlot`.
- **KaTeX equations missing**: confirm KaTeX is loaded before the module runs (Kirchhoff
  has a katex-wait fallback in `main.js`).

## 6. Revision History
- **v1.0**: Rewritten to match the built app (was a stub-era drag-and-drop description).
