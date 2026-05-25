// ═══════════════════════════════════════════════════════════════════
//  RAW TELEMETRY — 4 mini-plots (time, mag, phase, winding)
// ═══════════════════════════════════════════════════════════════════

import { tRange, fRange } from '../math/axes.js';
import { findPeaks, movingAverage } from '../math/utils.js';
import { baseLayout, axisTitle, PALETTE, PLOTLY_CONFIG, domainColor } from './plotly-config.js';

export function renderRawTime(signal, timeData, domain, state) {
    const color = domainColor(domain);
    const fillRgb = hexToRgba(color, 0.08);
    const style = state?.traceStyle || 'solid';
    const dash = style === 'dashed' ? 'dash' : 'solid';

    const layout = baseLayout({ xaxis: { ...baseLayout().xaxis, title: axisTitle('t (s)') } });
    Plotly.react('plot-raw-time', [{
        x: tRange, y: timeData, type: 'scatter', mode: 'lines',
        line: { color, width: 1.5, dash },
        fill: 'tozeroy', fillcolor: fillRgb
    }], layout, PLOTLY_CONFIG);
}

export function renderRawMag(signal, magData, domain, state) {
    const layout = baseLayout({ xaxis: { ...baseLayout().xaxis, title: axisTitle('f (Hz)') } });
    const style = state?.traceStyle || 'solid';
    const dash = style === 'dashed' ? 'dash' : 'solid';

    const traces = [{
        x: fRange, y: magData, type: 'scatter', mode: 'lines',
        line: { color: PALETTE.cyan, width: 1.5, dash },
        fill: 'tozeroy', fillcolor: hexToRgba(PALETTE.cyan, 0.08),
        name: 'Magnitude'
    }];

    if (state && state.showEnvelope) {
        const envelope = movingAverage(magData, 15);
        traces.push({
            x: fRange, y: Array.from(envelope), type: 'scatter', mode: 'lines',
            line: { color: PALETTE.orange, width: 2, dash: 'dash' },
            name: 'Enveloppe', hoverinfo: 'none'
        });
    }

    if (state && state.showPeaks) {
        const peakIndices = findPeaks(magData, 0.1);
        if (peakIndices.length > 0) {
            traces.push({
                x: peakIndices.map(i => fRange[i]),
                y: peakIndices.map(i => magData[i]),
                type: 'scatter', mode: 'markers',
                marker: { color: PALETTE.gold, size: 5, symbol: 'circle-open', line: {width: 1.5} },
                name: 'Peaks', hoverinfo: 'none'
            });
        }
    }

    Plotly.react('plot-raw-mag', traces, layout, PLOTLY_CONFIG);
}

export function renderRawPhase(signal, phaseData, state) {
    const layout = baseLayout({ xaxis: { ...baseLayout().xaxis, title: axisTitle('f (Hz)') } });
    const style = state?.traceStyle || 'solid';
    const dash = style === 'dashed' ? 'dash' : 'solid';

    Plotly.react('plot-raw-phase', [{
        x: fRange, y: phaseData, type: 'scatter', mode: 'lines',
        line: { color: PALETTE.gold, width: 1.5, dash }
    }], layout, PLOTLY_CONFIG);
}

export function renderWinding(signal, params, windingFreq, state) {
    const xC = [], yC = [];
    let sumX = 0, sumY = 0;
    for (let i = 0; i < tRange.length; i++) {
        const t = tRange[i];
        const s = signal.calcTime(t, params);
        const a = -2 * Math.PI * windingFreq * t;
        const re = s * Math.cos(a);
        const im = s * Math.sin(a);
        xC.push(re); yC.push(im);
        sumX += re; sumY += im;
    }
    const cgX = sumX / tRange.length;
    const cgY = sumY / tRange.length;
    const layout = baseLayout({
        xaxis: { range: [-1.6, 1.6], gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, scaleanchor: 'y', scaleratio: 1 },
        yaxis: { range: [-1.6, 1.6], gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero }
    });
    Plotly.react('plot-raw-circle', [
        { x: xC, y: yC, type: 'scatter', mode: 'lines', line: { color: PALETTE.purple, width: 1, opacity: 0.55 } },
        {
            x: [0, cgX*16], y: [0, cgY*16],
            type: 'scatter', mode: 'lines+markers',
            line: { color: PALETTE.red, width: 2 },
            marker: { color: PALETTE.red, size: 6 }
        }
    ], layout, PLOTLY_CONFIG);
}

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}
