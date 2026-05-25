// ═══════════════════════════════════════════════════════════════════
//  PLOTLY CONFIG — Shared layouts, palette, helpers
//  Palette is THEME-AWARE: resolved from CSS variables at runtime so
//  switching the body theme (cosmic/amber/solarized) automatically
//  propagates to all Plotly markers, lines, and overlays.
// ═══════════════════════════════════════════════════════════════════

import { state } from '../state.js';

// Fallback hex values — used if CSS vars aren't yet resolved (very first paint)
// MUST stay in sync with shared/css/theme.css :root
const FALLBACK = {
    blue:    '#4f8cff',
    purple:  '#9b5de5',
    cyan:    '#00f5d4',
    red:     '#ff4d6d',
    gold:    '#ffd60a',
    magenta: '#ff006e',
    green:   '#06ffa5',
    orange:  '#ff8500',
    textDim: '#4a5680',
    textMid: '#8899c8'
};

/**
 * Read a CSS custom property with a hex fallback.
 * Reads from <body> (NOT <html>): theme overrides target
 * `body.theme-amber` / `body.theme-solarized`, so variables computed on
 * documentElement would never see the override.
 */
function cssVar(name, fallback) {
    if (typeof window === 'undefined') return fallback;
    const target = document?.body || document?.documentElement;
    if (!target) return fallback;
    const val = getComputedStyle(target).getPropertyValue(name).trim();
    return val || fallback;
}

/**
 * PALETTE is a live getter object — every property read resolves the current
 * theme's CSS variable. Consumers can keep writing PALETTE.green and it will
 * automatically follow theme changes without any subscription wiring.
 */
export const PALETTE = new Proxy({}, {
    get(_, key) {
        switch (key) {
            case 'blue':    return cssVar('--accent-blue',    FALLBACK.blue);
            case 'purple':  return cssVar('--accent-purple',  FALLBACK.purple);
            case 'cyan':    return cssVar('--accent-cyan',    FALLBACK.cyan);
            case 'red':     return cssVar('--accent-red',     FALLBACK.red);
            case 'gold':    return cssVar('--accent-gold',    FALLBACK.gold);
            case 'magenta': return cssVar('--accent-magenta', FALLBACK.magenta);
            case 'green':   return cssVar('--accent-green',   FALLBACK.green);
            case 'orange':  return cssVar('--accent-orange',  FALLBACK.orange);
            case 'textDim': return cssVar('--text-dim',       FALLBACK.textDim);
            case 'textMid': return cssVar('--text-mid',       FALLBACK.textMid);
            case 'bgGrid':  return 'rgba(28,28,68,0.7)';   // grid is theme-independent for plot clarity
            case 'bgZero':  return 'rgba(45,45,90,1)';
            default:        return undefined;
        }
    }
});

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

/**
 * Returns a FRESH plain font object every call. Plotly mutates the layout
 * (it writes back e.g. `font.color`) so we must NOT share a single object
 * with a getter — that triggers "Cannot set property color of #<Object>".
 */
export function getFont() {
    return {
        color: PALETTE.textDim,
        size: 9,
        family: 'Space Mono, monospace'
    };
}

// Backward-compat: any module that still does `import { FONT }` keeps working
// (they pass it to Plotly which mutates, so each consumer gets its own copy
// via a Proxy that returns a new object on every property read).
export const FONT = new Proxy({}, {
    get(_, key) { return getFont()[key]; },
    set() { return true; }
});

const BG = 'rgba(0,0,0,0)';


export function baseLayout(overrides = {}) {
    const show = state.showGrids !== false;
    const gridColor = show ? PALETTE.bgGrid : 'rgba(0,0,0,0)';
    const zeroColor = show ? PALETTE.bgZero : 'rgba(0,0,0,0)';

    return {
        paper_bgcolor: BG,
        plot_bgcolor: BG,
        font: getFont(),
        margin: { t: 20, b: 24, l: 36, r: 12 },
        xaxis: {
            gridcolor: gridColor,
            zerolinecolor: zeroColor,
            tickfont: getFont(),
            linecolor: zeroColor,
            showgrid: show
        },
        yaxis: {
            gridcolor: gridColor,
            zerolinecolor: zeroColor,
            tickfont: getFont(),
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
