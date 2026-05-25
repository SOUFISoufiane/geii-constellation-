# Signal Observatory v5.2 — Working Backup
**Date:** 2026-05-24 02:08
**Status:** ✅ Stable, all features verified in preview
**Server:** Python http.server on port 8123
**Entry:** http://localhost:8123/tfc_dashboard.html

---

## Restore Procedure

To restore this version:
```bash
cd C:/Users/ssouf/Documents/Projects/IUT/STUDY/Maths
# Backup current state if needed
mv tfc_dashboard.html tfc_dashboard.html.bak
mv css css.bak
mv js2 js2.bak
# Restore
cp -r backups/v5.2-working-2026-05-24/tfc_dashboard.html .
cp -r backups/v5.2-working-2026-05-24/css .
cp -r backups/v5.2-working-2026-05-24/js2 .
```

Or unzip `backups/v5.2-working-2026-05-24.zip`.

---

## Feature Inventory (verified working)

### 9 Fusion Modes
1. **Parseval** — Energy equivalence (time²/freq²)
2. **Stability** — Bode + Nyquist combined
3. **Winding 3D** — Complex 3D winding
4. **STFT** — Spectrogram (cosmic colormap)
5. **Filter** — Frequency response |H(f)| + impulse h(t)
6. **Convolution** — Pedagogical s∗h with picker for two functions
7. **Bode pur** — Magnitude + Phase side-by-side, no Nyquist
8. **Nyquist pur** — Polar plot with critical point (-1,0)
9. **Waterfall 3D** — Time-evolving spectrum

### Signal Catalogue (32 signals)

**GEII BUT2 (20 signals)** — programme officiel:
- **Distributions:** Dirac, Dirac décalé, Peigne de Dirac
- **Continus:** Heaviside, Constante DC, Rampe
- **Exponentielles:** Causale, Bilatérale, Complexe
- **Formes:** Porte, Sinc, Triangle, Gaussienne
- **Oscillations:** Cosinus, Sinus, Carré, Chirp
- **Théorèmes:** Parseval, Convolution, Modulation, Dérivation

**Extras (12 signals):**
- **Electrical:** RLC série, Impédance, THD, Smith chart
- **AI/ML:** Spectral centroid, ZCR, MFCC, Autocorrélation
- **Automation:** Shannon, Quantification, FIR/IIR, Reconstruction

### 8 Filter Types
Analogiques: Butterworth, Chebyshev I/II, Bessel, RC, RLC
Numériques: FIR sinc-Hann, IIR biquad
Each with full `getFilterResponse(type, f, fc, n)` → {mag, phase}.

### Interactive Players

**Time Player (PLAY chip):**
- Play/Pause/Reset/Scrubber
- Speed: cubic mapping −10x → +10x with fine 0-1x precision
- Period T, frameStart/End, Loop
- Green playheads sync on ALL plots

**Frequency Player (FREQ chip):**
- Sweeps windingFreq between fMin/fMax
- Modes: linear, log, sine
- Speed: same cubic mapping
- Magenta diamond indicators on freq plots

### Hovering Parameters Board (⚙ PARAMS chip)
Draggable panel with sections:
- Filter (type, fc log slider, order, apply-everywhere toggle)
- Frequency (rotation, sampling fs)
- Signal (noise, peak detection, envelope)
- Visuals (theme: Cosmic/Amber/Solarized, bloom, scanlines)
- Advanced (FFT windowing)
- Computed (τ, fNyquist, period)
Two-way binding with topbar controls.

### Aliasing Detector (Shannon)
- Live badge top-left: green "SHANNON OK" / red animated "ALIASING DÉTECTÉ"
- Shows fSignal, fNyquist, folded freq
- Sample dots overlay on temporal plot (gold normal, red when aliasing)

### Resizable Formula Panel (sidebar bottom)
9 sections: s(t), S(f), |S(f)|, φ(f), H(f), Y(f), Parseval, Constants, Theorem
- Top edge cyan handle to drag-resize height
- Font scales 0.6→1.6rem proportionally with height
- Persists across reloads

### Collapsible Sidebar
- Button top-right of sidebar header
- Smooth 300ms transition
- Ctrl+B keyboard shortcut
- Collapses to 38px rail with vertical "SIGNAL OBS · v5" label
- Persists state in localStorage

### Pedagogical Tooltips
- Hover any signal name → KaTeX derivation popover with:
  - Step-by-step LaTeX derivations
  - Physical intuition
  - GEII application context
- 25+ derivations in `js2/derivations/derivations.js`

### Themes (3)
- Cosmic (default — black void + accretion disk)
- Amber CRT (retro terminal orange)
- Solarized (high-contrast scientific)

---

## Architecture

```
tfc_dashboard.html          (510 lines — DOM shell only)
css/
├── theme.css               (variables, cosmic bg, scanlines)
└── components.css          (all UI components ~1500 lines)
js2/
├── main.js                 (orchestrator, render pipeline)
├── state.js                (pub/sub store)
├── math/
│   ├── axes.js             (precomputed frequency/time axes)
│   ├── fft.js              (Cooley-Tukey + STFT + autocorr)
│   ├── filters.js          (8 filter types)
│   ├── utils.js            (sinc, throttle, debounce, mel)
│   ├── signals.js          (catalogue hub + TREE)
│   ├── signals-geii.js
│   ├── signals-electrical.js
│   ├── signals-ai.js
│   └── signals-automation.js
├── plots/
│   ├── plotly-config.js
│   ├── raw-telemetry.js
│   ├── fusion-modes.js     (all 9 modes)
│   └── convolution.js
├── ui/
│   ├── sidebar.js          (tree)
│   ├── sidebar-toggle.js
│   ├── controls.js
│   ├── formula-strip.js    (bottom strip + sidebar formula panel)
│   ├── tooltips.js
│   ├── player.js           (time player)
│   ├── freq-player.js
│   ├── playheads.js        (green markers on all plots)
│   ├── freq-indicators.js  (magenta diamonds)
│   ├── aliasing.js         (Shannon detector)
│   ├── params-board.js     (hovering board)
│   └── convolution-ui.js
└── derivations/
    └── derivations.js      (25+ pedagogical derivations)
```

---

## Known Quirks (not bugs, just things to be aware of)

1. **ES module cache** can hold stale code on `localhost:<port>`. If a module update doesn't take effect, restart server on a NEW port (e.g. 8765 → 8123). The HTML uses `import('./js2/main.js?v=...')` but sub-imports are NOT cache-busted.
2. **CSS cache** also persistent — addressed with inline JS cache-buster on stylesheets in HTML.
3. **Sidebar localStorage:** `signal-obs-sidebar-collapsed` (0/1)
4. **Formula panel localStorage:** `signal-obs-formula-panel-height` (px)
5. **Modes 'winding' and 'waterfall'** are 3D — playheads don't show on them (Plotly limitation with shapes in 3D).

---

## What Still Works (full end-to-end checklist)

- [x] All 9 fusion modes render
- [x] 32 signals selectable from tree
- [x] 8 filter types applied to all relevant modes
- [x] Time player → green playheads on 5 plots
- [x] Freq player → magenta diamonds + winding 2D animation
- [x] Aliasing alert reactive to rotation/fs sliders
- [x] Convolution mode with picker (Porte∗Porte = Triangle verified)
- [x] Params board with two-way slider binding
- [x] Sidebar collapse + Ctrl+B
- [x] Formula panel drag-resize + font scale
- [x] KaTeX derivations on tooltip hover
- [x] 3 themes (Cosmic/Amber/Solarized)

---

**Snapshot ready for any restructuring rollback.**
