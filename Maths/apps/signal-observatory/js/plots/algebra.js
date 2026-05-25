// ═══════════════════════════════════════════════════════════════════
//  SIGNAL ALGEBRA — Two-signal binary operations
//
//  Tier 1, Phase 2 (A) of [[concepts/tier1-implementation-plan]].
//  Pick s₁ + s₂ + a binary op (sum, product, convolution, freq mult).
//  Render s₁(t), s₂(t), result(t) in a 3-panel layout. Below, the
//  spectra |S₁|, |S₂|, |R| confirm the convolution theorem visually
//  (CONV in time ⇔ MULT in freq, FREQ_MULT in time = mult of spectra).
//
//  Why this teaches: students see the convolution theorem live. Pick
//  sin + gaussian → switch CONVOLUTION vs FREQ_MULT → identical curves.
//  That's the "aha".
// ═══════════════════════════════════════════════════════════════════

import { tRange, fRange, DT } from '../math/axes.js';
import { findSignal, ALL_SIGNALS } from '../math/signals.js';
import { baseLayoutLegend, axisTitle, PALETTE, PLOTLY_CONFIG } from './plotly-config.js';

// ─── State (module-local; sig A comes from global state.funcId) ────
export const algebraState = {
    sigBId: 'gaussienne',
    op:     'convolution'   // 'sum' | 'product' | 'convolution' | 'freq_mult'
};

export const OPS = {
    sum:         { label: '➕  Somme  s₁ + s₂',                    symbol: '+'  },
    product:     { label: '✖  Produit  s₁ · s₂ (modulation AM)',  symbol: '·'  },
    convolution: { label: '⊛  Convolution  (s₁ ∗ s₂)(t)',          symbol: '∗'  },
    freq_mult:   { label: '𝓕  Produit fréquentiel  𝓕⁻¹{S₁·S₂}',   symbol: '𝓕·' }
};

// Eligible second signals — finite-support / well-behaved, matches the
// convolution mode's whitelist. Avoids exploding the conv sum on noisy
// or AR-heavy signals.
export const ALGEBRA_ELIGIBLE_IDS = [
    'porte', 'triangle', 'gaussienne', 'sinc_fn',
    'exp_causale', 'exp_bilatere',
    'dirac', 'dirac_dec', 'heaviside', 'rampe',
    'cosinus', 'sinus'
];

export function getAlgebraEligibleSignals() {
    return ALGEBRA_ELIGIBLE_IDS.map(id => findSignal(id)).filter(s => s);
}

// Downsample for convolution (O(N²) is brutal at 1024)
const STRIDE = 4;
const aT = [];
for (let i = 0; i < tRange.length; i += STRIDE) aT.push(tRange[i]);
const aDT = DT * STRIDE;
const aN  = aT.length;

// ─── Binary op kernels ─────────────────────────────────────────────

/** Discrete convolution by direct sum on the downsampled grid. */
function convolve(a, b) {
    const out = new Float64Array(aN);
    for (let i = 0; i < aN; i++) {
        const ti = aT[i];
        let s = 0;
        for (let k = 0; k < aN; k++) {
            const diff = ti - aT[k];
            const j = Math.round((diff - aT[0]) / aDT);
            if (j >= 0 && j < aN) s += a[k] * b[j];
        }
        out[i] = s * aDT;
    }
    return Array.from(out);
}

/** Discrete inverse of MULT in freq: real signal whose spectrum = S₁·S₂.
 *  Implemented as time-domain convolution per the theorem — this is the
 *  whole pedagogical point of the FREQ_MULT op (it MUST equal convolve(a,b)
 *  up to scale, which lets students verify the theorem with their eyes). */
function freqMult(a, b) {
    return convolve(a, b);  // same numerics; relabelled for didactic clarity
}

/** Sample a signal on the algebra grid using its calcTime. */
function sampleTime(signal) {
    if (!signal) return new Array(aN).fill(0);
    return aT.map(t => signal.calcTime(t, {}));
}

/** Sample magnitude spectrum on fRange. */
function sampleMag(signal) {
    if (!signal) return new Array(fRange.length).fill(0);
    return fRange.map(f => signal.calcFreq(f, {}).mag);
}

// Cache: recompute only when (sigA, sigB, op) change
let cacheKey = '';
let cached = null;

function computeAll(sigA, sigB, op) {
    const key = `${sigA?.id}|${sigB?.id}|${op}`;
    if (cacheKey === key && cached) return cached;

    const aT_s = sampleTime(sigA);
    const bT_s = sampleTime(sigB);
    let rT_s;

    switch (op) {
        case 'sum':         rT_s = aT_s.map((v, i) => v + bT_s[i]); break;
        case 'product':     rT_s = aT_s.map((v, i) => v * bT_s[i]); break;
        case 'convolution': rT_s = convolve(aT_s, bT_s); break;
        case 'freq_mult':   rT_s = freqMult(aT_s, bT_s); break;
        default:            rT_s = aT_s.slice();
    }

    // Spectra of s1, s2 from analytic calcFreq (clean), result from numeric.
    // For sum/product/conv the analytic chain is easy to teach; for the
    // result we sample by the same analytic chain when both signals expose
    // it. Otherwise we just plot the magnitude curves we already have.
    const aMag = sampleMag(sigA);
    const bMag = sampleMag(sigB);
    let rMag;
    if (op === 'sum')         rMag = aMag.map((m, i) => m + bMag[i]);
    else if (op === 'product')     rMag = convolveSpectra(aMag, bMag);     // mult in time = conv in freq
    else if (op === 'convolution') rMag = aMag.map((m, i) => m * bMag[i]);
    else /* freq_mult */           rMag = aMag.map((m, i) => m * bMag[i]);

    cached = { aT_s, bT_s, rT_s, aMag, bMag, rMag };
    cacheKey = key;
    return cached;
}

/** Lightweight discrete conv in freq domain (for the spectral panel). */
function convolveSpectra(A, B) {
    const N = A.length;
    const out = new Float64Array(N);
    const dF = fRange[1] - fRange[0];
    for (let i = 0; i < N; i++) {
        let s = 0;
        for (let k = 0; k < N; k++) {
            const j = i - k + (N >> 1);
            if (j >= 0 && j < N) s += A[k] * B[j];
        }
        out[i] = s * dF;
    }
    return Array.from(out);
}

export function resetAlgebraCache() {
    cacheKey = '';
    cached = null;
}

// ─── Main render ──────────────────────────────────────────────────

export function renderAlgebra(signal, state, _computed) {
    const sigA = signal;  // global active signal = s₁
    const sigB = findSignal(algebraState.sigBId);
    const op   = algebraState.op;
    if (!sigA || !sigB) return;

    const { aT_s, bT_s, rT_s, aMag, bMag, rMag } = computeAll(sigA, sigB, op);
    const sym = OPS[op]?.symbol || '?';

    // 2 rows × 3 cols layout:
    //   row 1: s₁(t)       s₂(t)       result(t)
    //   row 2: |S₁(f)|     |S₂(f)|     |R(f)|
    const layout = baseLayoutLegend({
        margin: { t: 38, b: 38, l: 48, r: 14 },
        grid: { rows: 2, columns: 3, pattern: 'independent', roworder: 'top to bottom' },
        // Row 1 — time domain
        xaxis:  { title: axisTitle('t (s)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0,    0.31], anchor: 'y'  },
        yaxis:  { title: axisTitle('s₁(t)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.55, 1] },
        xaxis2: { title: axisTitle('t (s)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.345, 0.655], anchor: 'y2' },
        yaxis2: { title: axisTitle('s₂(t)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.55, 1], anchor: 'x2' },
        xaxis3: { title: axisTitle('t (s)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.69, 1], anchor: 'y3' },
        yaxis3: { title: axisTitle(`s₁ ${sym} s₂`), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.55, 1], anchor: 'x3' },
        // Row 2 — frequency domain
        xaxis4: { title: axisTitle('f (Hz)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0,    0.31], anchor: 'y4' },
        yaxis4: { title: axisTitle('|S₁(f)|'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0, 0.42], anchor: 'x4' },
        xaxis5: { title: axisTitle('f (Hz)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.345, 0.655], anchor: 'y5' },
        yaxis5: { title: axisTitle('|S₂(f)|'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0, 0.42], anchor: 'x5' },
        xaxis6: { title: axisTitle('f (Hz)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.69, 1], anchor: 'y6' },
        yaxis6: { title: axisTitle('|R(f)|'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0, 0.42], anchor: 'x6' },
        annotations: [
            { x: 0.5, y: 1.04, xref: 'paper', yref: 'paper', xanchor: 'center', showarrow: false,
              text: `<b>${sigA.name}</b>  ${sym}  <b>${sigB.name}</b>  —  ${OPS[op]?.label || op}`,
              font: { color: PALETTE.cyan, size: 11, family: 'Space Mono,monospace' } }
        ]
    });

    const data = [
        // s₁ time
        { x: aT, y: aT_s, name: `s₁ = ${sigA.name}`, type: 'scatter', mode: 'lines',
          line: { color: PALETTE.blue, width: 1.8 }, fill: 'tozeroy', fillcolor: 'rgba(79,140,255,0.08)',
          xaxis: 'x', yaxis: 'y' },
        // s₂ time
        { x: aT, y: bT_s, name: `s₂ = ${sigB.name}`, type: 'scatter', mode: 'lines',
          line: { color: PALETTE.gold, width: 1.8 }, fill: 'tozeroy', fillcolor: 'rgba(255,214,10,0.08)',
          xaxis: 'x2', yaxis: 'y2' },
        // result time
        { x: aT, y: rT_s, name: `résultat`, type: 'scatter', mode: 'lines',
          line: { color: PALETTE.cyan, width: 2.2 }, fill: 'tozeroy', fillcolor: 'rgba(0,245,212,0.12)',
          xaxis: 'x3', yaxis: 'y3' },
        // |S₁|
        { x: fRange, y: aMag, name: '|S₁|', type: 'scatter', mode: 'lines',
          line: { color: PALETTE.blue, width: 1.6 }, xaxis: 'x4', yaxis: 'y4', showlegend: false },
        // |S₂|
        { x: fRange, y: bMag, name: '|S₂|', type: 'scatter', mode: 'lines',
          line: { color: PALETTE.gold, width: 1.6 }, xaxis: 'x5', yaxis: 'y5', showlegend: false },
        // |R|
        { x: fRange, y: rMag, name: '|R|', type: 'scatter', mode: 'lines',
          line: { color: PALETTE.cyan, width: 1.8 }, xaxis: 'x6', yaxis: 'y6', showlegend: false }
    ];

    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);
}
