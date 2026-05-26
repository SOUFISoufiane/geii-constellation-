# KB06050001: Robotique — Cinématique & VAL3

## 1. Feature Description
The Robotique app visualizes the maths behind industrial-robot programming, so you
can trial a concept at home before typing it into the school simulator. Six tabs:
Bras 2R, Rotations, Transformations homogènes, Repères & points, Bras 6 axes, and
the VAL3/trsf sandbox.

## 2. How-To Use
1. Open the GEII Visual Toolbox Galaxy, click the **Robotique** star.
2. **Bras 2R**: drag θ₁/θ₂ for forward kinematics (MGD), or switch to MGI and set a
   target (x, y) to see both elbow-up / elbow-down solutions.
3. **Rotations**: pick Rx/Ry/Rz and an angle; compose two rotations; read the 3×3
   matrix and det(R)=1.
4. **Transf. homogènes**: build T = [R|p], apply it to a point, read T⁻¹.
5. **Repères & points**: place a REF frame, teach a point in it, see it in World
   plus an approach point offset along the frame's z-axis.
6. **Bras 6 axes**: toggle Articulaire (jog q₁..q₆) or Cartésien (command the tool
   pose X/Y/Z + RX/RY/RZ — inverse kinematics moves the 6 joints). Singularities
   are flagged (wrist / elbow / shoulder).
7. **VAL3 / trsf**: run `compose`, `appro`, `setFrame` on poses; copy the result
   `(x,y,z,rx,ry,rz)` straight into the real simulator.

## 3. Expected Outcome
You see the robot pose / frame / arm update live, with the result pose and 4×4
matrix shown — the same numbers the controller uses, ready to reuse in VAL3.

## 4. Related Articles
- KB03050001: Maths Calculator (matrix / linear-algebra background).
- SOP_robotique_v1.0 (maintenance & conventions).

## 5. Notes
Convention: pose `(x,y,z,rx,ry,rz)`, angles are Euler `R = Rz·Ry·Rx` (Stäubli /
course). Source: RoboIndus Cinématique TD1/TD2, TP_STAUBLI.
