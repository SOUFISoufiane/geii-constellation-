# KB04050001: Digital Lab (Logique numérique)

## 1. Feature Description
The Numérique app takes a Boolean function from a truth table to a minimized expression to
synthesizable VHDL. Three tabs that all derive from one shared truth table: Table de vérité,
Karnaugh, and VHDL.

## 2. How-To Use
1. Open the GEII Visual Toolbox Galaxy, click the **Digital Lab** star.
2. **📋 Table de vérité**: choose the number of inputs (2-4), then click the output cells (S)
   to toggle 0/1. The canonical sum-of-products equation updates live.
3. **🗺️ Karnaugh**: the K-map fills from the truth table, groups the 1-cells (Quine–McCluskey),
   and shows the minimal SOP form (e.g. S = ĀC + B̄C).
4. **⌨ VHDL**: generates the entity + dataflow architecture matching the minimal form, with a
   Copy button.

## 3. Expected Outcome
Set outputs once in the truth table; the Karnaugh minimization and the VHDL code derive
automatically and stay consistent.

## 4. Related Articles
- SOP_numerique_v1.0 (maintenance & conventions).
