# SOP_signal-observatory_v1.0

## 1. Objective
To document the maintenance procedure for Signal Observatory — the toolbox's flagship
Fourier/signal app (32 signals, 9 fusion modes, 8 filters).

## 2. Scope
Applies to `Maths/apps/signal-observatory/`. Key folders under `js/`: 
- `plots/` (fusion-modes, plotly-config, convolution, raw-telemetry, algebra, audio-viz)
- `audio/` (file-audio-engine, dsp-worklet) — handles multithreaded DSP
- `math/`, `ui/`, `derivations/`
- `state.js` (reactive store) and `main.js`.

## 3. Prerequisites
- Local Python dev server (`python dev_server.py 8123`).
- This is the most mature, separately-architected app — treat it carefully. It is the
  source of the shared `plots/plotly-config.js` (`PALETTE`, `baseLayout`) that the other
  apps import.
- When working on `js/audio/dsp-worklet.js`, beware that it runs in a separate background thread without access to DOM/Window objects.

## 4. Procedure
1. **Fusion modes**: the analytical views live in `js/plots/fusion-modes.js` (dispatcher).
   Add a mode by extending the dropdown in `index.html` and the dispatcher. Mode 14 (Audio DSP) bypasses standard processing in favor of its own multithreaded pipeline in `main.js`.
2. **Signals**: defined in the `math/` catalogues; derivations (formula panel) in
   `derivations/`. Keep a signal's derivation in sync with its definition.
3. **Audio Engine**: uses an `AudioContext` and an `AudioWorkletNode` (`dsp-worklet.js`) to offload FFT computations via `postMessage`. It employs zero-copy streaming via an `<audio>` tag (`MediaElementAudioSourceNode`) for playback to save RAM, and uses a custom `DataView` parser to stream `.wav` files in 1MB chunks for offline spectrogram generation. Temporal smoothing is applied inside the worklet to prevent visual jitter.
4. **Theme-aware colors**: never hardcode hex — read via the `PALETTE` Proxy in
   `plotly-config.js` (resolves CSS vars from `document.body` so themes propagate).
5. **State**: `state.js` is a pub/sub store; UI reads/writes through it. (Audio mode uses its own `audioAnalyzerState` in `file-audio-engine.js`).

## 5. Troubleshooting
- **Plotly "Cannot set property color"**: a shared font/layout object was mutated — return a
  fresh object per call (see `getFont()` in `plotly-config.js`).
- **Theme not propagating to plots**: code read a CSS var from `documentElement` instead of
  `document.body` (themes target `body.theme-X`).
- **Lagging UI on fast sliders**: `renderAll` full-recomputes every change (see Technical
  Debt #3) — debounce or memoize if it bites.

## 6. Revision History
- **v1.0**: Rewritten to match the built app (added theme-aware palette + fusion-mode facts).
