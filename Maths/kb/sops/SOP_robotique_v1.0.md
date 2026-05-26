# SOP_robotique_v1.0

## 1. Objective
To outline the standard operating procedure for maintaining and extending the Robotique app (kinematics, frames, transforms, 6-axis arm, VAL3 geometry sandbox) of the GEII Visual Toolbox.

## 2. Scope
Applies to `Maths/apps/robotique/` (index.html, js/main.js, js/modules/*) and the shared kinematics helper `js/modules/robokit.js`. Built from the "RoboIndus Cinématique TD1/TD2" and "TP_STAUBLI" course documents.

## 3. Prerequisites
- Access to the `Maths` repository.
- Local Python dev server (`python dev_server.py 8123`).
- Familiarity with the app component structure and `shared/js/manifest.js`.
- For kinematics changes: Node available to run the FK/IK unit tests.

## 4. Procedure
1. **Starting the dev server**: `python dev_server.py 8123` in the `Maths` root.
2. **Editing a module**: each tab is one file in `js/modules/` (`arm2r`, `rotation`, `homogeneous`, `frames`, `arm6r`, `val3`). Wire new tabs in `js/main.js` (INIT map + NEEDS_KATEX set) and add the panel + tab button in `index.html`.
3. **Changing kinematics math**: edit `robokit.js` (single source of truth for DH, FK `fk6`, IK `ik6`, pose⇄matrix, VAL3 ops). Never duplicate the DH table in a module.
4. **Verifying math before UI**: run FK∘IK round-trip and pose round-trip tests with `node --input-type=module` against `robokit.js`. Confirm errors < 2·10⁻³ before browser testing.
5. **Plot sizing**: always render Plotly via `renderPlot` from `shared/js/plot-fit.js`, never raw `Plotly.react` (avoids the collapsed-`svg-container` blank-plot bug).
6. **Convention**: poses are `(x,y,z,rx,ry,rz)`, rx/ry/rz are Euler angles `R = Rz·Ry·Rx` (Stäubli / course, TD2 p.12). Keep this labeled in the UI.

## 5. Troubleshooting
- **Blank plot on first tab**: a module used raw `Plotly.react` instead of `renderPlot`. Switch to `renderPlot`.
- **IK disagrees with the drawn arm**: ensure the module imports `fk6`/`ik6` from `robokit.js` rather than reimplementing FK.
- **Cartesian jog lands on a weird config**: numerical IK seeds from current joints; from a cold/far seed it may pick another valid wrist branch. Jog incrementally.
- **KaTeX matrix not rendering**: confirm the tab id is in the `NEEDS_KATEX` set in `main.js`.

## 6. Revision History
- **v1.0**: Initial creation — app built to 6 tabs (2R, rotations, homogeneous, frames & points, 6-axis with joint+cartesian control & singularities, VAL3/trsf sandbox).
