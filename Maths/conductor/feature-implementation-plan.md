# Comprehensive Feature Implementation Plan — [STATUS: COMPLETED]

## Objective
To implement four new advanced signal processing and visualization features into the Signal Observatory v5 application, enhancing its analytical capabilities and interactivity.

## Pre-requisite: Project Backup [DONE]
Before modifying any source code, a full backup of the current project directory was created.
- **Archive:** `backup_signal_obs_v5.zip` successfully generated.

## Phased Implementation Plan

### Phase 1: Peak Detection Markers [DONE]
*   **Goal:** Automatically identify and highlight the dominant frequencies in the magnitude spectrum.
*   **Implementation:**
    1.  **Math:** Added `findPeaks(data, threshold)` in `js/math/utils.js`.
    2.  **Visualization:** Updated `renderParseval` and `renderRawMag` in `js/plots/fusion-modes.js` and `js/plots/raw-telemetry.js` to overlay markers.
    3.  **UI:** Added "Détection des pics" toggle in the Parameters Board.

### Phase 2: Spectral Envelope Follower [DONE]
*   **Goal:** Draw a smooth envelope curve over the magnitude spectrum.
*   **Implementation:**
    1.  **Math:** Implemented `movingAverage` in `js/math/utils.js`.
    2.  **Visualization:** Modified `renderParseval` and `renderRawMag` to render the envelope trace.
    3.  **UI:** Added "Enveloppe Spectrale" toggle in the Parameters Board.

### Phase 3: Live Audio Analysis [DONE]
*   **Goal:** Capture audio from the microphone and feed it into the analysis pipeline.
*   **Implementation:**
    1.  **Audio Engine:** Created `js/math/audio-engine.js` to handle Web Audio API.
    2.  **Signal Definition:** Created `js/math/signals-live.js` with `live_audio` signal type.
    3.  **UI:** Integrated into `js/math/signals.js` and added "TOGGLE MIC" button in extra controls.

### Phase 4: 3D Waterfall Plot [DONE]
*   **Goal:** Render a 3D surface plot of frequency over time (STFT).
*   **Implementation:**
    1.  **Visualization:** Added `renderWaterfall` in `js/plots/fusion-modes.js` using Plotly `surface`.
    2.  **Logic:** Reused STFT logic from `js/math/fft.js`.
    3.  **UI:** Added "Waterfall 3D" (option ⑨) to the main mode selector.

## Verification & Testing [DONE]
*   All features tested and verified as functional.
*   Performance validated for real-time live audio and 3D rendering.

## Rollback Strategy
The `backup_signal_obs_v5.zip` remains available if restoration is required.