// ═══════════════════════════════════════════════════════════════════
//  FREQ INDICATORS — Magenta markers on frequency plots
//  Shows the current windingFreq position on |S(f)| and φ(f) plots
//  during freq sweep playback. Independent of the time playheads.
// ═══════════════════════════════════════════════════════════════════

import { fRange } from '../math/axes.js';
import { PALETTE } from '../plots/plotly-config.js';

const TAG = '__freq_indicator__';
// Theme-aware: resolved live via PALETTE.magenta → --accent-magenta

const installed = {
    'plot-raw-mag': false,
    'plot-raw-phase': false,
    'plot-fusion': false
};
const phIndices = {};

export function updateFreqIndicators(signal, state, computed) {
    if (!state.freqPlayerActive) return clearFreqIndicators();

    installAll();

    const f = state.windingFreq;
    const fIdx = Math.round((f - fRange[0]) / (fRange[1] - fRange[0]));
    const magAt = computed?.magData ? (computed.magData[fIdx] || 0) : 0;
    const phaseAt = computed?.phaseData ? (computed.phaseData[fIdx] || 0) : 0;

    const magMax = computed?.magData ? Math.max(0.5, ...computed.magData) : 1;
    restyleMarker('plot-raw-mag', f, magAt, 0, magMax);
    restyleMarker('plot-raw-phase', f, phaseAt, -Math.PI, Math.PI);

    // Fusion plot markers
    updateFusion(state.activeCombo, f, signal, state);
}

function installAll() {
    install('plot-raw-mag');
    install('plot-raw-phase');
    installFusionIndicators();
}

function installFusionIndicators() {
    const plot = document.getElementById('plot-fusion');
    if (!plot || !plot.data) return;
    const existing = plot.data.map((tr, i) => tr.name === TAG ? i : -1).filter(i => i >= 0);
    if (existing.length >= 2) {
        phIndices['plot-fusion'] = existing;
        installed['plot-fusion'] = true;
        return;
    }
    const newTraces = [
        { x: [0, 0], y: [-1, 1], type: 'scatter', mode: 'lines',
          line: { color: PALETTE.magenta, width: 1.4, dash: 'dash' },
          xaxis: 'x', yaxis: 'y',
          name: TAG, hoverinfo: 'skip', showlegend: false },
        { x: [0], y: [0], type: 'scatter', mode: 'markers',
          marker: { color: PALETTE.magenta, size: 9, line: { color: '#fff', width: 1.5 }, symbol: 'diamond' },
          xaxis: 'x2', yaxis: 'y2',
          name: TAG, hoverinfo: 'skip', showlegend: false }
    ];
    try {
        Plotly.addTraces('plot-fusion', newTraces);
        const newPlot = document.getElementById('plot-fusion');
        phIndices['plot-fusion'] = newPlot.data.map((tr, i) => tr.name === TAG ? i : -1).filter(i => i >= 0);
        installed['plot-fusion'] = true;
    } catch (e) {}
}

function updateFusion(mode, f, signal, state) {
    const idx = phIndices['plot-fusion'];
    if (!idx || idx.length < 2) return;

    let x1, y1, x2, y2, ax1='x', ay1='y', ax2='x2', ay2='y2', m1='lines', m2='lines';

    switch (mode) {
        case 'parseval': {
            x1 = [null]; y1 = [null];
            x2 = [f, f]; y2 = [0, 5];
            break;
        }
        case 'stability': {
            const lx = Math.log10(Math.max(f, 0.1));
            x1 = [lx, lx]; y1 = [-80, 30];
            x2 = [null]; y2 = [null];
            break;
        }
        case 'bode_pure': {
            const lx = Math.log10(Math.max(f, 0.05));
            x1 = [lx, lx]; y1 = [-100, 40];
            x2 = [lx, lx]; y2 = [-360, 360];
            break;
        }
        case 'nyquist_pure': {
            const fResp = signal.calcFreq(f, state.params || {});
            x1 = [fResp.re]; y1 = [fResp.im];
            x2 = [null]; y2 = [null];
            m1 = 'markers';
            break;
        }
        case 'filter': {
            x1 = [f, f]; y1 = [0, 1.1];
            x2 = [null]; y2 = [null];
            break;
        }
        default:
            x1 = [null]; y1 = [null];
            x2 = [null]; y2 = [null];
            break;
    }

    try {
        Plotly.restyle('plot-fusion', { x: [x1], y: [y1], xaxis: ax1, yaxis: ay1, mode: m1 }, [idx[0]]);
        Plotly.restyle('plot-fusion', { x: [x2], y: [y2], xaxis: ax2, yaxis: ay2, mode: m2 }, [idx[1]]);
    } catch (e) {}
}

function install(plotId) {
    const plot = document.getElementById(plotId);
    if (!plot || !plot.data) return;
    const existing = plot.data.map((tr, i) => tr.name === TAG ? i : -1).filter(i => i >= 0);
    if (existing.length >= 2) {
        phIndices[plotId] = existing;
        installed[plotId] = true;
        return;
    }
    const newTraces = [
        { x: [0, 0], y: [-1, 1], type: 'scatter', mode: 'lines',
          line: { color: PALETTE.magenta, width: 1.4, dash: 'dash' },
          name: TAG, hoverinfo: 'skip', showlegend: false },
        { x: [0], y: [0], type: 'scatter', mode: 'markers',
          marker: { color: PALETTE.magenta, size: 9, line: { color: '#fff', width: 1.5 }, symbol: 'diamond' },
          name: TAG, hoverinfo: 'skip', showlegend: false }
    ];
    try {
        Plotly.addTraces(plotId, newTraces);
        const newPlot = document.getElementById(plotId);
        phIndices[plotId] = newPlot.data.map((tr, i) => tr.name === TAG ? i : -1).filter(i => i >= 0);
        installed[plotId] = true;
    } catch (e) {}
}

function restyleMarker(plotId, x, y, yMin, yMax) {
    const idx = phIndices[plotId];
    if (!idx || idx.length < 2) return;
    try {
        Plotly.restyle(plotId, { x: [[x, x]], y: [[yMin, yMax]] }, [idx[0]]);
        Plotly.restyle(plotId, { x: [[x]], y: [[y]] }, [idx[1]]);
    } catch (e) {}
}

export function clearFreqIndicators() {
    Object.keys(installed).forEach(id => {
        const plot = document.getElementById(id);
        if (!plot || !plot.data) return;
        const indices = plot.data.map((tr, i) => tr.name === TAG ? i : -1).filter(i => i >= 0);
        if (indices.length) {
            try { Plotly.deleteTraces(id, indices); } catch (e) {}
        }
        installed[id] = false;
        phIndices[id] = [];
    });
}

export function reinstallFreqAfterRender() {
    Object.keys(installed).forEach(id => installed[id] = false);
    Object.keys(phIndices).forEach(id => phIndices[id] = []);
}
