// ═══════════════════════════════════════════════════════════════════
//  SHARED AXES — Pre-computed once for all signals
// ═══════════════════════════════════════════════════════════════════

import { linspace, logspace } from './utils.js';


// Default T_N
export let T_N = 1024;
export let tRange = Object.freeze(Array.from(linspace(-3, 5, T_N)));

export let F_N = 512;
export let fRange = Object.freeze(Array.from(linspace(-20, 20, F_N)));

export let FL_N = 256;
export let fLogRange = Object.freeze(Array.from(logspace(Math.log10(0.05), 2, FL_N)));

export let omegaLinRange = Object.freeze(fRange.map(f => 2*Math.PI*f));
export let omegaLogRange = Object.freeze(fLogRange.map(f => 2*Math.PI*f));

export let DT = (5 - (-3)) / (T_N - 1);
export let FS = 1 / DT;

/** Re-calculate axes if buffer size changes */
export function updateAxes(newTN) {
    T_N = newTN;
    tRange = Object.freeze(Array.from(linspace(-3, 5, T_N)));
    DT = (5 - (-3)) / (T_N - 1);
    FS = 1 / DT;
    
    // F_N is usually T_N/2 for FFT plots but we keep it fixed unless needed
    // fRange = Object.freeze(Array.from(linspace(-20, 20, F_N)));
}
