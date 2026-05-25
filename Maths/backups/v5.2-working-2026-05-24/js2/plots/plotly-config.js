// ═══════════════════════════════════════════════════════════════════
//  PLOTLY CONFIG — Shared layouts, palette, helpers
// ═══════════════════════════════════════════════════════════════════

export const PALETTE = {
    blue:    '#4f8cff',
    purple:  '#9b5de5',
    cyan:    '#00f5d4',
    red:     '#ff4d6d',
    gold:    '#ffd60a',
    magenta: '#ff006e',
    green:   '#06ffa5',
    orange:  '#ff8500',
    bgGrid:  'rgba(28,28,68,0.7)',
    bgZero:  'rgba(45,45,90,1)',
    textDim: '#4a5680',
    textMid: '#8899c8'
};

export const COSMIC_COLORSCALE = [
    [0,    '#000008'],
    [0.08, '#050514'],
    [0.18, '#0d0d2e'],
    [0.32, '#1a0a4a'],
    [0.48, '#4f0a7a'],
    [0.62, '#9b5de5'],
    [0.78, '#4f8cff'],
    [0.9,  '#00f5d4'],
    [1,    '#ffd60a']
];

export const FONT = {
    color: PALETTE.textDim,
    size: 9,
    family: 'Space Mono, monospace'
};

const BG = 'rgba(0,0,0,0)';
import { state } from '../state.js';


export function baseLayout(overrides = {}) {
    const show = state.showGrids !== false;
    const gridColor = show ? PALETTE.bgGrid : 'rgba(0,0,0,0)';
    const zeroColor = show ? PALETTE.bgZero : 'rgba(0,0,0,0)';

    return {
        paper_bgcolor: BG,
        plot_bgcolor: BG,
        font: FONT,
        margin: { t: 20, b: 24, l: 36, r: 12 },
        xaxis: {
            gridcolor: gridColor,
            zerolinecolor: zeroColor,
            tickfont: FONT,
            linecolor: zeroColor,
            showgrid: show
        },
        yaxis: {
            gridcolor: gridColor,
            zerolinecolor: zeroColor,
            tickfont: FONT,
            linecolor: zeroColor,
            showgrid: show
        },
        showlegend: false,
        ...overrides
    };
}
export function baseLayoutLegend(overrides = {}) {
    return {
        ...baseLayout(),
        showlegend: true,
        legend: {
            x: 0, y: 1.12,
            font: { size: 9, family: 'Space Mono,monospace', color: PALETTE.textMid },
            bgcolor: 'rgba(0,0,0,0)',
            orientation: 'h'
        },
        margin: { t: 36, b: 36, l: 50, r: 50 },
        ...overrides
    };
}

export const PLOTLY_CONFIG = {
    displayModeBar: false,
    responsive: true,
    staticPlot: false,
    doubleClick: 'reset'
};

/** Axis title helper */
export function axisTitle(text) {
    return {
        text,
        font: { size: 9, color: PALETTE.textMid, family: 'Space Mono, monospace' }
    };
}

/** Domain-aware accent color */
export function domainColor(domain) {
    switch (domain) {
        case 'electrical': return PALETTE.gold;
        case 'ai':         return PALETTE.green;
        case 'automation': return PALETTE.magenta;
        case 'geii':
        default:           return PALETTE.blue;
    }
}
