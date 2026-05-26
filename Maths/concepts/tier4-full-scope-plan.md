# Tier 4 — Full-Scope Build Plan  [STATUS: COMPLETED 2026-05-26]

The four "MVP" apps shipped as single-feature stubs. This plan brought each to its
manifest-described scope. All four are now `status: 'stable'` in the manifest, each
with 3 working tabs, headless-tested with math-correctness assertions, committed
per-app (circuits 23306bd, automatique 6e0aa85, numerique a3082e1, maths 67078ca). Pattern for all: a left `.controls` panel + a main content
area, a tab bar to switch modules, vanilla JS, Plotly (CDN) + KaTeX (CDN), and
`PALETTE`/`baseLayout` imported from `../../signal-observatory/js/plots/plotly-config.js`.
Each app gets a small per-module JS file under `apps/<id>/js/modules/` and a thin
`main.js` that wires the tab bar.

## circuits — "Circuits Interactifs" (Kirchhoff · Thévenin · RLC)
Tabs:
1. **RLC** (existing) — keep the step-response module.
2. **Kirchhoff** — interactive SVG of a 2-loop resistor network with a source.
   Sliders for R1..R4 and E. Solve node voltages via mesh analysis (2x2 linear
   system, Cramer's rule). Live-annotate the SVG with currents (I1, I2) and the
   branch voltage. Show the KVL/KCL equations in KaTeX.
3. **Thévenin** — a source + resistor network; compute Vth and Rth seen from a
   port, draw the equivalent circuit, and plot load-line: I_load vs R_load.

## automatique — "Servo Lab" (PID · Root locus · Réponses)
Tabs:
1. **PID step** (existing) — keep.
2. **Root Locus** — for an open-loop G(s)=K/((s+a)(s+b)) (poles from sliders),
   sweep K and plot the closed-loop pole trajectories in the s-plane.
3. **Stability / Bode** — Bode magnitude+phase of the open loop; compute and
   display gain margin and phase margin with markers.

## numerique — "Digital Lab" (Karnaugh · FSM · VHDL)
Tabs:
1. **Truth table** (existing) — keep; it feeds the others.
2. **Karnaugh** — render a 2/3/4-variable K-map from the truth-table outputs,
   run Quine–McCluskey (or grouping) to produce the minimal SOP, show it in KaTeX.
3. **VHDL** — generate a synthesizable VHDL entity+architecture (dataflow) from
   the minimal SOP, in a copyable code block.
   (FSM: a compact Moore 2-state FSM diagram + transition table as a stretch goal.)

## maths — "Math Visualizer" (EDO · Laplace · Algèbre)
Tabs:
1. **3D Surface** (existing) — keep.
2. **ODE solver** — 1st/2nd-order linear ODE solved numerically (RK4), user sets
   coefficients + initial conditions, plot y(t). Overlay the analytic form when simple.
3. **Laplace** — step-by-step transform table lookup for common signals
   (step, ramp, exp, sin, cos) with KaTeX derivation, and pole-zero plot of F(s).

## Verification
Per app: headless puppeteer — load page, click each tab, assert the module's plot
or table renders (Plotly `.data` non-empty / DOM populated) with no console errors.
Commit per app. Final: flip manifest `status` stub→stable for completed apps and run
one full audit across all 6 pages.
