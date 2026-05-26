# KB02050001: Circuits Interactifs

## 1. Feature Description
The Circuits app analyzes classic GEII circuits with live slider control and annotated
schematics. Three tabs: RLC step response, Kirchhoff mesh analysis, and Thévenin equivalent.

## 2. How-To Use
1. Open the GEII Visual Toolbox Galaxy, click the **Circuits Interactifs** star.
2. **⚡ RLC**: set R, L, C with the sliders. The plot shows the capacitor step response
   Vc(t) to a 10 V step; the readout gives ω₀, ζ, and the regime (apériodique / critique /
   pseudo-périodique).
3. **🔀 Kirchhoff**: set the source E and R1/R2/R3 of a 2-mesh network. The app solves the
   mesh currents (Cramer) and shows them on an annotated SVG schematic, with the system of
   equations rendered in KaTeX.
4. **🔋 Thévenin**: set E, R1 (series), R2 (parallel). The app computes Vth, Rth and plots
   the load line (I_charge and V_charge vs R_charge).

## 3. Expected Outcome
Plots and readouts update in real time as you move the sliders, so you see how each
component value changes the response — no manual calculation needed.

## 4. Related Articles
- KB05050001: Signal Observatory (frequency analysis of a filtered signal).
- SOP_circuits_v1.0 (maintenance & conventions).
