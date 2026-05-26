# KB03050001: Math Visualizer

## 1. Feature Description
The Maths app visualizes the core BUT GEII mathematics in three tabs: 3D surface plotting,
2nd-order ODE solving (Runge–Kutta 4), and the Laplace transform with a pole-zero map.

## 2. How-To Use
1. Open the GEII Visual Toolbox Galaxy, click the **Math Visualizer** star.
2. **🌐 Surface 3D**: type a JavaScript expression in x and y (e.g. `Math.sin(x)*Math.cos(y)`)
   and a domain; the app draws the surface z = f(x, y) you can rotate.
3. **📉 EDO (RK4)**: set a, b, c of a·y'' + b·y' + c·y = f(t), the forcing f(t), and initial
   conditions y(0), y'(0). The app integrates by RK4 and plots y(t), naming the regime.
4. **∫ Laplace**: pick a signal type and parameters; the app shows a step-by-step derivation
   (KaTeX) of F(s) and plots the pole-zero map.

## 3. Expected Outcome
A 3D surface, an ODE solution curve, or a Laplace derivation + pole-zero map — updating as
you change the inputs.

## 4. Related Articles
- KB05050001: Signal Observatory (Fourier / frequency-domain companion).
- KB06050001: Robotique (uses the same matrix/transform background).
- SOP_maths_v1.0 (maintenance & conventions).
