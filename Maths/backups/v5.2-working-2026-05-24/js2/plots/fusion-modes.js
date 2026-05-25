// ═══════════════════════════════════════════════════════════════════
//  FUSION MODES — Main plot area (large)
//  Modes: Parseval / Bode-Nyquist / Winding 3D / STFT / Filter
// ═══════════════════════════════════════════════════════════════════

import { tRange, fRange, fLogRange } from '../math/axes.js';
import { hann, hamming, blackman, stft } from '../math/fft.js';
import { butterworthMag, butterworthPhase, butterworthImpulse, getFilterResponse, getFilterImpulse, FILTER_TYPES } from '../math/filters.js';
import { baseLayout, baseLayoutLegend, axisTitle, PALETTE, COSMIC_COLORSCALE, PLOTLY_CONFIG } from './plotly-config.js';
import { renderConvolution } from './convolution.js';

/**
 * Main fusion plot dispatcher.
 */
export function renderFusion(mode, signal, state, computed) {
    switch (mode) {
        case 'parseval':  return renderParseval(signal, state, computed);
        case 'stability': return renderStability(signal, state, computed);
        case 'winding':   return renderWinding3D(signal, state);
        case 'stft':      return renderSTFT(computed.timeData, state);
        case 'filter':    return renderFilter(signal, state, computed);
        case 'convolution': return renderConvolution();
        case 'bode_pure':   return renderBodePure(signal, state, computed);
        case 'nyquist_pure': return renderNyquistPure(signal, state, computed);
        case 'waterfall':   return renderWaterfall(computed.timeData, state);
        default:          return renderParseval(signal, state, computed);
    }
}

// ─── BODE PURE ─────────────────────────────────────────────────────
function renderBodePure(signal, state, computed) {
    const params = state.params || {};
    const applyFilt = state.applyFilterEverywhere !== false;
    const ftype = state.filterType || 'butterworth';

    const sigFreq = fLogRange.map(f => signal.calcFreq(f, params));
    let sigMag = sigFreq.map(d => d.mag);
    let sigPhase = sigFreq.map(d => d.phase);

    const filtResp = fLogRange.map(f => getFilterResponse(ftype, f, state.cutoffFreq, state.filterOrder));
    const filtMag = filtResp.map(d => d.mag);
    const filtPhase = filtResp.map(d => d.phase);

    const combinedMag = sigMag.map((m, i) => m * filtMag[i]);
    const combinedPhase = sigPhase.map((p, i) => p + filtPhase[i]);

    const sigMagDB  = sigMag.map(m => 20*Math.log10(m + 1e-10));
    const filtMagDB = filtMag.map(m => 20*Math.log10(m + 1e-10));
    const combMagDB = combinedMag.map(m => 20*Math.log10(m + 1e-10));

    const sigPhaseDeg = sigPhase.map(p => p * 180/Math.PI);
    const filtPhaseDeg = filtPhase.map(p => p * 180/Math.PI);
    const combPhaseDeg = combinedPhase.map(p => p * 180/Math.PI);

    const fmeta = FILTER_TYPES[ftype] || FILTER_TYPES.butterworth;
    const layout = baseLayoutLegend({
        margin: { t: 40, b: 40, l: 55, r: 55 },
        xaxis:  { type: 'log', title: axisTitle('f (Hz) — log'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0, 0.46] },
        yaxis:  { title: axisTitle('|H| (dB)'),  gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero },
        xaxis2: { type: 'log', title: axisTitle('f (Hz) — log'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.54, 1], anchor: 'y2' },
        yaxis2: { title: axisTitle('φ (deg)'),  gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, anchor: 'x2' },
    });

    const data = [
        { x: fLogRange, y: sigMagDB,  name: 'Signal |S|', type: 'scatter', line: { color: PALETTE.blue, width: 2 }, xaxis: 'x', yaxis: 'y' },
        { x: fLogRange, y: filtMagDB, name: `Filtre ${fmeta.label}`, type: 'scatter', line: { color: PALETTE.red, width: 2, dash: 'dot' }, xaxis: 'x', yaxis: 'y' },
        ...(applyFilt ? [{ x: fLogRange, y: combMagDB, name: 'Combiné S·H', type: 'scatter', line: { color: PALETTE.purple, width: 2.5 }, xaxis: 'x', yaxis: 'y' }] : []),
        { x: fLogRange, y: sigPhaseDeg,  name: 'Signal φ', type: 'scatter', line: { color: PALETTE.blue, width: 2 }, xaxis: 'x2', yaxis: 'y2', showlegend: false },
        { x: fLogRange, y: filtPhaseDeg, name: `Filtre φ`, type: 'scatter', line: { color: PALETTE.red, width: 2, dash: 'dot' }, xaxis: 'x2', yaxis: 'y2', showlegend: false },
        ...(applyFilt ? [{ x: fLogRange, y: combPhaseDeg, name: 'Combiné φ', type: 'scatter', line: { color: PALETTE.purple, width: 2.5 }, xaxis: 'x2', yaxis: 'y2', showlegend: false }] : [])
    ];
    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);
}

// ─── NYQUIST PURE ──────────────────────────────────────────────────
function renderNyquistPure(signal, state, computed) {
    const params = state.params || {};
    const applyFilt = state.applyFilterEverywhere !== false;
    const ftype = state.filterType || 'butterworth';

    const fNyq = linspace(0.05, 80, 400);
    const sigVals = Array.from(fNyq).map(f => signal.calcFreq(f, params));
    const filtVals = Array.from(fNyq).map(f => getFilterResponse(ftype, f, state.cutoffFreq, state.filterOrder));

    const sigRe = sigVals.map(d => d.re);
    const sigIm = sigVals.map(d => d.im);

    const combRe = sigVals.map((s, i) => s.re * filtVals[i].mag * Math.cos(filtVals[i].phase) - s.im * filtVals[i].mag * Math.sin(filtVals[i].phase));
    const combIm = sigVals.map((s, i) => s.re * filtVals[i].mag * Math.sin(filtVals[i].phase) + s.im * filtVals[i].mag * Math.cos(filtVals[i].phase));

    const layout = baseLayout({
        xaxis: { title: axisTitle('Re(S)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, scaleanchor: 'y', scaleratio: 1 },
        yaxis: { title: axisTitle('Im(S)'), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero }
    });

    const data = [
        { x: sigRe, y: sigIm, name: 'Signal', type: 'scatter', mode: 'lines', line: { color: PALETTE.blue, width: 2 } },
        ...(applyFilt ? [{ x: combRe, y: combIm, name: 'Combiné S·H', type: 'scatter', mode: 'lines', line: { color: PALETTE.purple, width: 2.5 } }] : [])
    ];
    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);
}

// ─── STFT ──────────────────────────────────────────────────────────
function renderSTFT(timeData, state) {
    const winSize = 64, hop = 16;
    const windowFn = getWindowFn(state?.fftWindow);
    const { matrix, nFrames, nBins } = stft(timeData, winSize, hop, windowFn);
    
    const tStart = tRange[0], tEnd = tRange[tRange.length - 1];
    const tAxis  = Array.from({ length: nFrames }, (_, i) => tStart + i*hop*(tEnd - tStart)/tRange.length);
    const fAxis  = Array.from({ length: nBins }, (_, i) => i);
    const zData  = matrix.map(row => Array.from(row));

    const layout = baseLayout({
        margin: { t: 24, b: 38, l: 55, r: 12 },
        xaxis: { title: axisTitle('Temps (s)'), gridcolor: PALETTE.bgGrid },
        yaxis: { title: axisTitle('Bin fréquentiel'), gridcolor: PALETTE.bgGrid }
    });
    Plotly.react('plot-fusion', [{
        z: zData, x: tAxis, y: fAxis, type: 'heatmap',
        colorscale: COSMIC_COLORSCALE, showscale: true, zsmooth: 'best'
    }], layout, PLOTLY_CONFIG);
}

// ─── WATERFALL 3D ──────────────────────────────────────────────────
function renderWaterfall(timeData, state) {
    const winSize = 64, hop = 16;
    const windowFn = getWindowFn(state?.fftWindow);
    const { matrix, nFrames, nBins } = stft(timeData, winSize, hop, windowFn);

    const tStart = tRange[0], tEnd = tRange[tRange.length - 1];
    const tAxis  = Array.from({ length: nFrames }, (_, i) => tStart + i*hop*(tEnd - tStart)/tRange.length);
    const fAxis  = Array.from({ length: nBins }, (_, i) => i);
    
    // Matrix: rows are time frames, cols are frequency bins. 
    // Surface needs matrix[freq][time]
    const zData = Array.from({ length: nBins }, () => new Float32Array(nFrames));
    for (let t = 0; t < nFrames; t++) {
        for (let f = 0; f < nBins; f++) {
            zData[f][t] = matrix[t][f];
        }
    }

    const layout = baseLayout({
        margin: { l: 0, r: 0, b: 0, t: 20 },
        scene: {
            bgcolor: 'rgba(0,0,0,0)',
            xaxis: { title: 'Temps (s)', gridcolor: PALETTE.bgGrid },
            yaxis: { title: 'Fréq (bin)', gridcolor: PALETTE.bgGrid },
            zaxis: { title: 'Mag', gridcolor: PALETTE.bgGrid },
            camera: { eye: { x: -1.8, y: -1.2, z: 0.8 } }
        }
    });
    Plotly.react('plot-fusion', [{
        z: zData, x: tAxis, y: fAxis, type: 'surface',
        colorscale: COSMIC_COLORSCALE, showscale: false
    }], layout, PLOTLY_CONFIG);
}

function getWindowFn(type) {
    return {
        'hann': hann, 'hamming': hamming, 'blackman': blackman,
        'rectangular': (n) => new Float64Array(n).fill(1)
    }[type] || hann;
}

function linspace(start, end, n) {
    const arr = new Float64Array(n);
    const step = (end - start) / (n - 1);
    for (let i = 0; i < n; i++) arr[i] = start + i * step;
    return arr;
}

// ─── PARSEVAL ──────────────────────────────────────────────────────
function renderParseval(signal, state, computed) {
    const layout = baseLayoutLegend({
        margin: { t: 40, b: 40, l: 55, r: 55 },
        xaxis:  { title: axisTitle('t (s)'),  gridcolor: PALETTE.bgGrid, domain: [0, 0.44] },
        yaxis:  { title: axisTitle('s(t)'),   gridcolor: PALETTE.bgGrid },
        xaxis2: { title: axisTitle('f (Hz)'), gridcolor: PALETTE.bgGrid, domain: [0.56, 1], anchor: 'y2' },
        yaxis2: { title: axisTitle('|S(f)|'), gridcolor: PALETTE.bgGrid, anchor: 'x2' },
    });
    const data = [
        { x: tRange, y: computed.timeData, name: 'Temporel s(t)', type: 'scatter', line: { color: PALETTE.blue, width: 2 }, xaxis: 'x', yaxis: 'y' },
        { x: fRange, y: computed.magData,  name: 'Spectral |S(f)|', type: 'scatter', line: { color: PALETTE.cyan, width: 2 }, xaxis: 'x2', yaxis: 'y2' }
    ];
    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);
}

// ─── STABILITY ─────────────────────────────────────────────────────
function renderStability(signal, state) {
    // Basic Bode Magnitude + Nyquist mix
    const params = state.params || {};
    const fNyq = linspace(0.1, 100, 200);
    const resp = Array.from(fNyq).map(f => signal.calcFreq(f, params));
    
    const layout = baseLayout({
        xaxis: { type: 'log', title: axisTitle('f (log)'), domain: [0, 0.44] },
        yaxis: { title: axisTitle('Mag (dB)') },
        xaxis2: { title: axisTitle('Re'), domain: [0.56, 1], anchor: 'y2' },
        yaxis2: { title: axisTitle('Im'), anchor: 'x2' }
    });
    const data = [
        { x: fNyq, y: resp.map(d => 20*Math.log10(d.mag + 1e-10)), type: 'scatter', xaxis: 'x', yaxis: 'y' },
        { x: resp.map(d => d.re), y: resp.map(d => d.im), type: 'scatter', xaxis: 'x2', yaxis: 'y2' }
    ];
    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);
}

// ─── WINDING 3D ────────────────────────────────────────────────────
function renderWinding3D(signal, state) {
    const params = state.params || {};
    const w = state.windingFreq;
    const x = [], y = [], z = [];
    for (let i = 0; i < tRange.length; i++) {
        const t = tRange[i];
        const s = signal.calcTime(t, params);
        x.push(t);
        y.push(s * Math.cos(-2*Math.PI*w*t));
        z.push(s * Math.sin(-2*Math.PI*w*t));
    }
    const layout = baseLayout({
        scene: {
            xaxis: { title: 'Temps' }, yaxis: { title: 'Re' }, zaxis: { title: 'Im' },
            camera: { eye: { x: 1.5, y: 1.5, z: 1.2 } }
        }
    });
    Plotly.react('plot-fusion', [{ x, y, z, type: 'scatter3d', mode: 'lines', line: { color: PALETTE.purple, width: 4 } }], layout, PLOTLY_CONFIG);
}

// ─── FILTER ────────────────────────────────────────────────────────
function renderFilter(signal, state, { magData }) {
    const ftype = state.filterType || 'butterworth';
    const fmeta = FILTER_TYPES[ftype] || FILTER_TYPES.butterworth;
    const H_mag  = fRange.map(f => getFilterResponse(ftype, f, state.cutoffFreq, state.filterOrder).mag);
    const sigOut = magData.map((m, i) => m * H_mag[i]);
    const h_time = tRange.map(t => getFilterImpulse(ftype, t, state.cutoffFreq, state.filterOrder));

    const layout = baseLayoutLegend({
        xaxis:  { title: axisTitle('f (Hz)'), domain: [0, 0.44] },
        yaxis:  { title: axisTitle('|H(f)|') },
        xaxis2: { title: axisTitle('t (s)'), domain: [0.56, 1], anchor: 'y2' },
        yaxis2: { title: axisTitle('h(t)'), anchor: 'x2' },
    });
    const data = [
        { x: fRange, y: H_mag,  name: `|H(f)| ${fmeta.label}`, type: 'scatter', fill: 'tozeroy', line: { color: PALETTE.red, width: 2 }, xaxis: 'x', yaxis: 'y' },
        { x: fRange, y: sigOut, name: 'Signal filtré', type: 'scatter', line: { color: PALETTE.purple, width: 1.5, dash: 'dot' }, xaxis: 'x', yaxis: 'y' },
        { x: tRange, y: h_time, name: 'Impulse h(t)', type: 'scatter', fill: 'tozeroy', line: { color: PALETTE.cyan, width: 2 }, xaxis: 'x2', yaxis: 'y2' }
    ];
    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);
}

// ─── CONVOLUTION MODE ──────────────────────────────────────────────
function renderConvMode(signal, state, computed) {
    // Convolution rendering logic is in convolution.js
    renderConvolution();
}
