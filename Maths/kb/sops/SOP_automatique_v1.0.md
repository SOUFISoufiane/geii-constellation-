# SOP_automatique_v1.0

## 1. Objective
To document the maintenance and extension procedure for the Servo Lab (automatique) app
(PID step response, root locus, Bode + stability margins).

## 2. Scope
Applies to `Maths/apps/automatique/` — `index.html`, `js/main.js`, and the per-tab modules
`js/modules/{pid,rootlocus,bode}.js`.

## 3. Prerequisites
- Local Python dev server (`python dev_server.py 8123`).
- Familiarity with the tab-module pattern.

## 4. Procedure
1. **PID tab**: a 2nd-order plant is simulated by Euler integration; the controller is
   Kp·e + Ki·∫e + Kd·ė. Edit `pid.js` to change the plant or controller law.
2. **Root locus tab**: closed-loop poles are found by Durand–Kerner over a K-sweep in
   `rootlocus.js`. Keep the complex-arithmetic helpers if extending.
3. **Bode tab**: open-loop G(jω) magnitude/phase + gain/phase margins in `bode.js`.
4. **Plots**: always render via `renderPlot` from `shared/js/plot-fit.js`.
5. **Add a tab**: panel + button in `index.html`, module in the `INIT` map in `main.js`.

## 5. Troubleshooting
- **Blank plot**: raw `Plotly.react` used instead of `renderPlot`.
- **Root locus looks wrong**: check the cubic coefficients fed to the Durand–Kerner solver
  (monic `[1, c2, c1, c0+K]`).

## 6. Revision History
- **v1.0**: Rewritten to match the built app (was a generic stub-era description).
