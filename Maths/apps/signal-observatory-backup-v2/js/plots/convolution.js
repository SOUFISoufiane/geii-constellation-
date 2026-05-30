// ═══════════════════════════════════════════════════════════════════
//  CONVOLUTION — Pedagogical animated convolution
//  Shows three sub-plots:
//   1. s(τ) and h(t−τ) overlaid (slider τ)
//   2. Their product s(τ)·h(t−τ) — area = (s∗h)(t)
//   3. Running output (s∗h)(t) — current sample highlighted
// ═══════════════════════════════════════════════════════════════════

import { tRange, DT } from '../math/axes.js';
import { findSignal, ALL_SIGNALS } from '../math/signals.js';
import { baseLayoutLegend, axisTitle, PALETTE, PLOTLY_CONFIG } from './plotly-config.js';

// State for convolution
export const convState = {
    fnA:        'porte',
    fnB:        'porte',
    tau:        0,       // current shift τ
    isAnimating: false,
    animId:     null
};

let cachedOutput = null;
let cachedKey = '';

// Downsampled axes for convolution to keep it interactive (~256² = 65k ops)
const CONV_STRIDE = 4;
const convT = [];
for (let i = 0; i < tRange.length; i += CONV_STRIDE) convT.push(tRange[i]);
const CONV_DT = DT * CONV_STRIDE;
const CONV_N  = convT.length;

/** Compute full convolution (s∗h)(t) by discrete sum on downsampled grid. Cached. */
function computeConvolution() {
    const key = `${convState.fnA}|${convState.fnB}`;
    if (cachedKey === key && cachedOutput) return cachedOutput;

    const sigA = findSignal(convState.fnA);
    const sigB = findSignal(convState.fnB);
    if (!sigA || !sigB) return { x: convT, y: new Float64Array(CONV_N) };

    // Sample on downsampled axis
    const aSamples = convT.map(t => sigA.calcTime(t, {}));
    const bSamples = convT.map(t => sigB.calcTime(t, {}));

    const out = new Float64Array(CONV_N);
    for (let i = 0; i < CONV_N; i++) {
        const t_i = convT[i];
        let s = 0;
        for (let k = 0; k < CONV_N; k++) {
            const diff = t_i - convT[k];
            const j = Math.round((diff - convT[0]) / CONV_DT);
            if (j >= 0 && j < CONV_N) s += aSamples[k] * bSamples[j];
        }
        out[i] = s * CONV_DT;
    }
    cachedKey = key;
    cachedOutput = { x: convT, y: out };
    return cachedOutput;
}

/** Invalidate cache when signal selection changes */
export function resetConvCache() {
    cachedKey = '';
    cachedOutput = null;
}

/** Main render */
export function renderConvolution() {
    const sigA = findSignal(convState.fnA);
    const sigB = findSignal(convState.fnB);
    if (!sigA || !sigB) return;

    // Sample s(τ) and h(t−τ) on downsampled axis for speed
    const tau = convState.tau;
    const sTau = convT.map(t => sigA.calcTime(t, {}));
    const hTauMinus = convT.map(t => sigB.calcTime(tau - t, {}));
    const product = sTau.map((s, i) => s * hTauMinus[i]);
    const integralValue = product.reduce((a, b) => a + b, 0) * CONV_DT;

    // Full convolution curve (cached)
    const conv = computeConvolution();
    const convArr = Array.from(conv.y);

    // Find current τ index for highlight
    const tauIdx = Math.round((tau - convT[0]) / CONV_DT);
    const tauHighlightY = (tauIdx >= 0 && tauIdx < convArr.length) ? convArr[tauIdx] : 0;

    const layout = baseLayoutLegend({
        margin: { t: 38, b: 38, l: 48, r: 14 },
        // Three subplots: top-left, top-right, bottom (spans both)
        grid: { rows: 2, columns: 2, pattern: 'independent', roworder: 'top to bottom' },
        xaxis:  { title: axisTitle('τ (s)'),  gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0, 0.48], anchor: 'y' },
        yaxis:  { title: axisTitle('s, h'),    gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.55, 1] },
        xaxis2: { title: axisTitle('τ (s)'),  gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.52, 1], anchor: 'y2' },
        yaxis2: { title: axisTitle('s·h'),     gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.55, 1], anchor: 'x2' },
        xaxis3: { title: axisTitle('t (s)'),  gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0, 1], anchor: 'y3' },
        yaxis3: { title: axisTitle('(s∗h)(t)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0, 0.42] },
        shapes: [
            // Vertical line at τ on subplot 3 (output)
            { type: 'line', xref: 'x3', yref: 'paper', x0: tau, y0: 0, x1: tau, y1: 0.42, line: { color: PALETTE.purple, dash: 'dot', width: 1.5 } }
        ],
        annotations: [
            { x: 0.5, y: 1.02, xref: 'paper', yref: 'paper', text: `τ = ${tau.toFixed(2)} s  |  ∫ s(τ)·h(t−τ) dτ = <b>${integralValue.toFixed(3)}</b>`,
              showarrow: false, font: { color: PALETTE.cyan, size: 10, family: 'Space Mono,monospace' } }
        ]
    });

    const data = [
        // Top-left: s(τ) blue + h(t−τ) gold
        { x: convT, y: sTau, name: `s(τ) = ${sigA.name}`, type: 'scatter', mode: 'lines',
          line: { color: PALETTE.blue, width: 1.8 }, fill: 'tozeroy', fillcolor: 'rgba(79,140,255,0.08)',
          xaxis: 'x', yaxis: 'y' },
        { x: convT, y: hTauMinus, name: `h(t−τ) = ${sigB.name} (retournée+décalée)`, type: 'scatter', mode: 'lines',
          line: { color: PALETTE.gold, width: 1.8 }, fill: 'tozeroy', fillcolor: 'rgba(255,214,10,0.08)',
          xaxis: 'x', yaxis: 'y' },

        // Top-right: product
        { x: convT, y: product, name: 's(τ)·h(t−τ) — aire = sortie', type: 'scatter', mode: 'lines',
          line: { color: PALETTE.purple, width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(155,93,229,0.18)',
          xaxis: 'x2', yaxis: 'y2' },

        // Bottom: full convolution result
        { x: convT, y: convArr, name: '(s ∗ h)(t)', type: 'scatter', mode: 'lines',
          line: { color: PALETTE.cyan, width: 2 }, fill: 'tozeroy', fillcolor: 'rgba(0,245,212,0.08)',
          xaxis: 'x3', yaxis: 'y3' },
        // Current point on output
        { x: [tau], y: [tauHighlightY], name: 'sortie à τ', type: 'scatter', mode: 'markers',
          marker: { color: PALETTE.red, size: 11, symbol: 'circle', line: { color: '#fff', width: 1 } },
          xaxis: 'x3', yaxis: 'y3', showlegend: false }
    ];
    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);

    // Update info card with current τ value
    updateConvInfo(sigA, sigB, tau, integralValue);
}

function updateConvInfo(sigA, sigB, tau, integralValue) {
    const el = document.getElementById('conv-info');
    if (!el) return;
    el.innerHTML = `
        <div class="highlight">Pédagogie :</div>
        <div style="margin-top:6px;line-height:1.6">
            • <b style="color:var(--accent-blue)">s(τ)</b> = ${sigA.name}<br>
            • <b style="color:var(--accent-gold)">h(t−τ)</b> = ${sigB.name} <i>retournée + décalée</i><br>
            • Aire du produit en τ = ${tau.toFixed(2)} → <b style="color:var(--accent-cyan)">${integralValue.toFixed(3)}</b><br>
        </div>
        <div style="margin-top:10px;padding-top:6px;border-top:1px solid var(--rim);color:var(--text-dim);font-size:0.6rem;line-height:1.5">
            Théorème : <b style="color:var(--accent-cyan)">𝓕{s∗h} = S(f)·H(f)</b><br>
            La convolution dans le temps devient un produit en fréquence.
        </div>
    `;
}

/** Animate τ from frameStart to frameEnd */
export function animateConvolution(fromT, toT, durationMs = 4000) {
    if (convState.animId) cancelAnimationFrame(convState.animId);
    convState.isAnimating = true;
    const t0 = performance.now();
    const span = toT - fromT;

    function step(now) {
        const elapsed = now - t0;
        const frac = Math.min(1, elapsed / durationMs);
        convState.tau = fromT + frac * span;
        document.getElementById('conv-tau-val').value = convState.tau.toFixed(2);
        document.getElementById('conv-tau-slider').value = convState.tau;
        renderConvolution();
        if (frac < 1 && convState.isAnimating) {
            convState.animId = requestAnimationFrame(step);
        } else {
            convState.isAnimating = false;
        }
    }
    convState.animId = requestAnimationFrame(step);
}

export function stopAnimation() {
    convState.isAnimating = false;
    if (convState.animId) cancelAnimationFrame(convState.animId);
}

/** Filter list of signals available for convolution.
 *  Only include "nice" finite-support signals to keep computation reasonable. */
export const CONV_ELIGIBLE_IDS = [
    'porte',           // Π(t)
    'triangle',        // Λ(t)
    'gaussienne',      // gaussian
    'sinc_fn',         // sinc
    'exp_causale',     // RC kernel
    'exp_bilatere',    // lorentzian
    'dirac',           // δ(t)
    'dirac_dec',       // δ(t-1)
    'heaviside',       // u(t)
    'rampe',           // r(t)
    'cosinus',         // cos
    'sinus'            // sin
];

export function getConvEligibleSignals() {
    return CONV_ELIGIBLE_IDS.map(id => findSignal(id)).filter(s => s);
}
