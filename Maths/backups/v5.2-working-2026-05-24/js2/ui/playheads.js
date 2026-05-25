// ═══════════════════════════════════════════════════════════════════
//  PLAYHEADS v2 — Persistent marker traces, updated via restyle
//
//  Approach:
//   - When player activates, we INSTALL one marker trace per plot
//     (a single point + a line that we treat as a vertical bar)
//   - On each tick, we use Plotly.restyle to update only x/y values
//     of those traces (super fast — no DOM rebuild)
//   - On deactivation, we remove the traces
//
//  Marker traces are indexed and tracked so multiple renderAll() calls
//  don't disrupt them. We re-install after each renderAll if active.
// ═══════════════════════════════════════════════════════════════════

import { tRange, fRange, DT } from '../math/axes.js';
import { playerState } from './player.js';

const PH_NAME = '__playhead__';
const GREEN = '#06ffa5';

// Track which plots have playhead traces installed
const installed = {
    'plot-raw-time':  false,
    'plot-raw-mag':   false,
    'plot-raw-phase': false,
    'plot-raw-circle':false,
    'plot-fusion':    false
};

// Map: plotId → array of trace indices that are playheads
const phIndices = {};

/** Public: install or update playheads on every plot */
export function updateAllPlayheads(signal, state, computed) {
    if (!state.playerActive) return clearAllPlayheads();

    // Ensure all playhead traces exist (re-install if a renderAll wiped them)
    installAll();

    const t = playerState.currentTime;
    const params = state.params || {};

    // Frequency probe
    const span = playerState.frameEnd - playerState.frameStart;
    const cyclic = span > 0 ? ((t - playerState.frameStart) / span) % 1 : 0;
    const fMax = fRange[fRange.length - 1];
    const fProbe = cyclic * fMax;
    const fProbeIdx = Math.round((fProbe - fRange[0]) / (fRange[1] - fRange[0]));

    // ─── ① Temporel ──
    const yTime = signal.calcTime(t, params);
    restyleVerticalAndDot('plot-raw-time', t, yTime, -2, 2);

    // ─── ② Amplitude ──
    const magAt = computed?.magData ? computed.magData[fProbeIdx] || 0 : 0;
    const magMax = computed?.magData ? Math.max(0.5, ...computed.magData) : 1;
    restyleVerticalAndDot('plot-raw-mag', fProbe, magAt, 0, magMax);

    // ─── ③ Phase ──
    const phaseAt = computed?.phaseData ? computed.phaseData[fProbeIdx] || 0 : 0;
    restyleVerticalAndDot('plot-raw-phase', fProbe, phaseAt, -Math.PI, Math.PI);

    // ─── ④ Enroulement ──
    const sVal = signal.calcTime(t, params);
    const angle = -2 * Math.PI * state.windingFreq * t;
    const xW = sVal * Math.cos(angle);
    const yW = sVal * Math.sin(angle);
    restyleDotOnly('plot-raw-circle', xW, yW);

    // ─── ⑤ Fusion ──
    updateFusion(state.activeCombo, t, fProbe, signal, state, params);
}

function installAll() {
    installPlayheadVertical('plot-raw-time');
    installPlayheadVertical('plot-raw-mag');
    installPlayheadVertical('plot-raw-phase');
    installPlayheadDot('plot-raw-circle');
    installFusionPlayheads();
}

/** Install vertical line + dot pair on a 2D plot */
function installPlayheadVertical(plotId) {
    const plot = document.getElementById(plotId);
    if (!plot || !plot.data) return;
    // Check existing
    const existing = plot.data.map((tr, i) => tr.name === PH_NAME ? i : -1).filter(i => i >= 0);
    if (existing.length >= 2) {
        phIndices[plotId] = existing;
        installed[plotId] = true;
        return;
    }

    const newTraces = [
        // Vertical line — thinner
        { x: [0, 0], y: [-1, 1], type: 'scatter', mode: 'lines',
          line: { color: GREEN, width: 1.2, dash: 'dot' },
          name: PH_NAME, hoverinfo: 'skip', showlegend: false },
        // Dot — smaller, refined
        { x: [0], y: [0], type: 'scatter', mode: 'markers',
          marker: { color: GREEN, size: 8, line: { color: '#fff', width: 1.5 }, symbol: 'circle' },
          name: PH_NAME, hoverinfo: 'skip', showlegend: false }
    ];
    try {
        Plotly.addTraces(plotId, newTraces);
        const newPlot = document.getElementById(plotId);
        phIndices[plotId] = newPlot.data.map((tr, i) => tr.name === PH_NAME ? i : -1).filter(i => i >= 0);
        installed[plotId] = true;
    } catch (e) {}
}

/** Install just a dot (for winding 2D and 3D contexts) */
function installPlayheadDot(plotId) {
    const plot = document.getElementById(plotId);
    if (!plot || !plot.data) return;
    const existing = plot.data.map((tr, i) => tr.name === PH_NAME ? i : -1).filter(i => i >= 0);
    if (existing.length >= 1) {
        phIndices[plotId] = existing;
        installed[plotId] = true;
        return;
    }
    const newTraces = [{
        x: [0], y: [0], type: 'scatter', mode: 'markers',
        marker: { color: GREEN, size: 9, line: { color: '#fff', width: 1.5 }, symbol: 'circle' },
        name: PH_NAME, hoverinfo: 'skip', showlegend: false
    }];
    try {
        Plotly.addTraces(plotId, newTraces);
        const newPlot = document.getElementById(plotId);
        phIndices[plotId] = newPlot.data.map((tr, i) => tr.name === PH_NAME ? i : -1).filter(i => i >= 0);
        installed[plotId] = true;
    } catch (e) {}
}

function installFusionPlayheads() {
    const plot = document.getElementById('plot-fusion');
    if (!plot || !plot.data) return;
    const existing = plot.data.map((tr, i) => tr.name === PH_NAME ? i : -1).filter(i => i >= 0);
    if (existing.length >= 1) {
        phIndices['plot-fusion'] = existing;
        installed['plot-fusion'] = true;
        return;
    }
    // Two generic placeholder traces (we'll set their axis dynamically via restyle if needed)
    const newTraces = [
        { x: [0, 0], y: [-5, 5], type: 'scatter', mode: 'lines',
          line: { color: GREEN, width: 1.2, dash: 'dot' },
          xaxis: 'x', yaxis: 'y',
          name: PH_NAME, hoverinfo: 'skip', showlegend: false },
        { x: [0, 0], y: [-5, 5], type: 'scatter', mode: 'lines',
          line: { color: GREEN, width: 1.2, dash: 'dot' },
          xaxis: 'x2', yaxis: 'y2',
          name: PH_NAME, hoverinfo: 'skip', showlegend: false }
    ];
    try {
        Plotly.addTraces('plot-fusion', newTraces);
        const newPlot = document.getElementById('plot-fusion');
        phIndices['plot-fusion'] = newPlot.data.map((tr, i) => tr.name === PH_NAME ? i : -1).filter(i => i >= 0);
        installed['plot-fusion'] = true;
    } catch (e) {}
}

function restyleVerticalAndDot(plotId, x, y, yMin, yMax) {
    const idx = phIndices[plotId];
    if (!idx || idx.length < 2) return;
    try {
        Plotly.restyle(plotId, { x: [[x, x]], y: [[yMin, yMax]] }, [idx[0]]);
        Plotly.restyle(plotId, { x: [[x]], y: [[y]] }, [idx[1]]);
    } catch (e) {}
}

function restyleDotOnly(plotId, x, y) {
    const idx = phIndices[plotId];
    if (!idx || !idx.length) return;
    try {
        Plotly.restyle(plotId, { x: [[x]], y: [[y]] }, [idx[0]]);
    } catch (e) {}
}

function updateFusion(mode, t, fProbe, signal, state, params) {
    const idx = phIndices['plot-fusion'];
    if (!idx || idx.length < 2) return;

    let x1, y1, x2, y2, ax1='x', ay1='y', ax2='x2', ay2='y2';

    switch (mode) {
        case 'parseval': {
            x1 = [t, t]; y1 = [0, 5];
            x2 = [fProbe, fProbe]; y2 = [0, 5];
            break;
        }
        case 'stability': {
            x1 = [Math.log10(Math.max(fProbe, 0.1)), Math.log10(Math.max(fProbe, 0.1))]; y1 = [-80, 30];
            x2 = [null]; y2 = [null]; // hide trace 2
            break;
        }
        case 'stft': {
            x1 = [t, t]; y1 = [0, 32];
            x2 = [null]; y2 = [null];
            break;
        }
        case 'filter': {
            x1 = [fProbe, fProbe]; y1 = [0, 1.1];
            x2 = [t, t]; y2 = [0, 5];
            break;
        }
        case 'bode_pure': {
            // Log axis vertical lines
            const lx = Math.log10(Math.max(fProbe, 0.05));
            x1 = [lx, lx]; y1 = [-100, 40];
            x2 = [lx, lx]; y2 = [-360, 360];
            break;
        }
        case 'nyquist_pure': {
            // Marker dot on the complex plane
            const fResp = signal.calcFreq(fProbe, params);
            // Single marker on main axis
            x1 = [fResp.re]; y1 = [fResp.im];
            x2 = [null]; y2 = [null];
            // Change trace 1 to be a marker dot instead of vertical line
            try {
                Plotly.restyle('plot-fusion', { mode: 'markers', marker: { color: GREEN, size: 10, line: { color: '#fff', width: 2 } } }, [idx[0]]);
            } catch (e) {}
            break;
        }
        case 'waterfall': {
            // 3D Waterfall — marker dot or plane? For now hide.
            x1 = [null]; y1 = [null];
            x2 = [null]; y2 = [null];
            break;
        }
        case 'convolution': {
            x1 = [null]; y1 = [null];
            x2 = [null]; y2 = [null];
            // Third subplot is x3/y3 — need separate trace; for simplicity use trace 1 with x3
            ax1 = 'x3'; ay1 = 'y3';
            x1 = [t, t]; y1 = [-5, 5];
            break;
        }
        case 'winding':
        default:
            x1 = [null]; y1 = [null];
            x2 = [null]; y2 = [null];
            break;
    }

    try {
        // Reset mode if it was changed by Nyquist
        if (mode !== 'nyquist_pure') {
            Plotly.restyle('plot-fusion', { mode: 'lines', marker: { size: 0 } }, [idx[0]]);
        }

        Plotly.restyle('plot-fusion', { x: [x1], y: [y1], xaxis: ax1, yaxis: ay1 }, [idx[0]]);
        if (idx.length > 1) {
            Plotly.restyle('plot-fusion', { x: [x2], y: [y2], xaxis: ax2, yaxis: ay2 }, [idx[1]]);
        }
    } catch (e) {}
}

export function clearAllPlayheads() {
    const ids = Object.keys(installed);
    ids.forEach(id => {
        const plot = document.getElementById(id);
        if (!plot || !plot.data) return;
        const indices = plot.data.map((tr, i) => tr.name === PH_NAME ? i : -1).filter(i => i >= 0);
        if (indices.length) {
            try { Plotly.deleteTraces(id, indices); } catch (e) {}
        }
        installed[id] = false;
        phIndices[id] = [];
    });
}

/** Called when renderAll completes — re-install since react() wiped traces */
export function reinstallAfterRender() {
    Object.keys(installed).forEach(id => installed[id] = false);
    Object.keys(phIndices).forEach(id => phIndices[id] = []);
}
