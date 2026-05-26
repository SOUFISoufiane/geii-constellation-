# SOP_maths_v1.0

## 1. Objective
To document the maintenance and extension procedure for the Math Visualizer (maths) app
(3D surface plotting, 2nd-order ODE via RK4, Laplace transform + pole-zero map).

## 2. Scope
Applies to `Maths/apps/maths/` — `index.html`, `js/main.js`, and the modules
`js/modules/{surface,ode,laplace}.js`.

## 3. Prerequisites
- Local Python dev server (`python dev_server.py 8123`).
- Familiarity with the tab-module pattern.

## 4. Procedure
1. **Surface tab**: `surface.js` evaluates a user JS expression z = f(x, y) over a grid and
   draws a Plotly 3D `surface` trace. Validate user input before `eval`/`Function`.
2. **ODE tab**: `ode.js` integrates a·y'' + b·y' + c·y = f(t) by classic RK4 (state form
   x1=y, x2=y'). Keep the step small enough for stiff coefficients.
3. **Laplace tab**: `laplace.js` does table-lookup transforms with a step-by-step KaTeX
   derivation + a pole-zero scatter. Add new transforms in the lookup `transform()` switch.
4. **Plots**: render via `renderPlot` from `shared/js/plot-fit.js` (incl. the 3D surface).

## 5. Troubleshooting
- **Surface blank / errors**: a bad user expression. Guard the evaluator and show a message.
- **ODE diverges**: coefficients make the system stiff; reduce dt or warn the user.
- **Blank plot**: raw `Plotly.react` instead of `renderPlot`.

## 6. Revision History
- **v1.0**: Rewritten to match the built app (was a stub-era "calculator" description).
