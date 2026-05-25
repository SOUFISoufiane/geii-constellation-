# Tier 2 Implementation Plan

## Objective
Introduce data export capabilities and advanced harmonic analysis into the Signal Observatory v5 application.

## Phases

### Phase 1: CSV Export
* **Goal:** Allow users to export the current signal's time-domain and frequency-domain data as a CSV file.
* **Implementation:**
  1. Add a Download CSV button near the recorder button in `index.html`.
  2. Create `js/csv-exporter.js` to format arrays into CSV strings and trigger download.
  3. Wire the button in `main.js` to export `computed.timeData`, `computed.magData`.

### Phase 2: Harmonics Explorer
* **Goal:** Visually highlight the integer harmonics of the fundamental frequency on the magnitude spectrum.
* **Implementation:**
  1. Add a toggle in the parameters board or main controls for "Harmonics".
  2. Update `state.js` to track `showHarmonics`.
  3. Modify `js/plots/raw-telemetry.js` (`renderRawMag`) to draw vertical lines at multiples of `state.windingFreq` when enabled.
