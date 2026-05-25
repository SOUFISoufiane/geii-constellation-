// ═══════════════════════════════════════════════════════════════════
//  STATE — Reactive store with pub/sub
// ═══════════════════════════════════════════════════════════════════

export const state = {
    funcId:      'exp_causale',
    windingFreq: 1.0,
    cutoffFreq:  0.5,
    filterOrder: 1,
    injectNoise: false,
    showPeaks:   false, // Phase 1: Peak Detection feature
    showEnvelope: false, // Phase 2: Spectral Envelope feature
    showHarmonics: false, // Tier 2 Phase 2: Harmonics Explorer
    activeCombo: 'parseval',
    filterType:  'butterworth',  // Active filter type
    applyFilterEverywhere: true, // Apply filter response in every mode
    params:      {}, // Signal-specific parameters (e.g. RLC R, L, C)
    
    // Pillar 1: Visual Customization
    theme:           'cosmic',
    bloomIntensity:  1.0,
    scanlineOpacity: 1.0,

    // Pillar 2: Advanced Signal Orchestration
    fftWindow:       'rectangular', // 'rect' | 'hann' | 'hamming' | 'blackman'
    noiseType:       'white',       // 'white' | 'pink' | 'brown'
    unwrapPhase:     false,

    // Pillar 3: Plot Interface
    showGrids:       true,
    traceStyle:      'solid',       // 'solid' | 'dashed' | 'gradient'
    camera3D:        'iso',         // 'iso' | 'top' | 'side'

    // Pillar 4: Performance & Telemetry
    fpsLimit:        60,
    bufferSize:      1024           // n samples for axes
};

const subscribers = new Set();

export function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
}

export function notify() {
    subscribers.forEach(fn => {
        try { fn(state); } catch (e) { console.error('Subscriber error', e); }
    });
}
