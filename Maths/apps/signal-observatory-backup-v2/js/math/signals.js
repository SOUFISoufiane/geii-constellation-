// ═══════════════════════════════════════════════════════════════════
//  SIGNALS — Unified catalogue
//  Merges GEII + Extras and provides lookup utilities
// ═══════════════════════════════════════════════════════════════════

import { SIGNALS_GEII }      from './signals-geii.js';
import { SIGNALS_ELECTRICAL } from './signals-electrical.js';
import { SIGNALS_AI }         from './signals-ai.js';
import { SIGNALS_AUTOMATION } from './signals-automation.js';
import { SIGNALS_LIVE }       from './signals-live.js';
import { SIGNALS_CUSTOM }     from './signals-custom.js';

// All signals, tagged with their root tree.
// The CUSTOM root is a single user-defined equation driven by the
// floating equation panel (see ui/equation-panel.js).
//
// CRITICAL: `{ ...s }` spread breaks getters — they become snapshot values
// at module-load time. The custom signal needs LIVE getters for
// extraControls + formulaTime, so we tag `root` via mutation
// (`Object.defineProperty` on a fresh object that preserves getters).
function tag(signal, root) {
    const out = Object.create(Object.getPrototypeOf(signal));
    // Copy descriptors verbatim — getters stay as getters.
    const descs = Object.getOwnPropertyDescriptors(signal);
    Object.defineProperties(out, descs);
    out.root = root;
    return out;
}

export const ALL_SIGNALS = [
    ...SIGNALS_GEII.map(s => tag(s, 'GEII')),
    ...SIGNALS_ELECTRICAL.map(s => tag(s, 'EXTRAS')),
    ...SIGNALS_AI.map(s => tag(s, 'EXTRAS')),
    ...SIGNALS_AUTOMATION.map(s => tag(s, 'EXTRAS')),
    ...SIGNALS_LIVE.map(s => tag(s, 'EXTRAS')),
    ...SIGNALS_CUSTOM.map(s => tag(s, 'CUSTOM'))
];

export function findSignal(id) {
    return ALL_SIGNALS.find(s => s.id === id);
}

// Tree structure for sidebar
export const TREE = {
    GEII: {
        label: 'GEII BUT2 — PROGRAMME OFFICIEL',
        categories: ['DISTRIBUTIONS', 'CONTINUS', 'EXPONENTIELLES', 'FORMES', 'OSCILLATIONS', 'THÉORÈMES'],
        signals: SIGNALS_GEII
    },
    EXTRAS: {
        label: 'EXTRAS — INTERDISCIPLINAIRE',
        categories: ['ELECTRICAL', 'AI / ML', 'AUTOMATION', 'LIVE'],
        signals: [...SIGNALS_ELECTRICAL, ...SIGNALS_AI, ...SIGNALS_AUTOMATION, ...SIGNALS_LIVE]
    },
    CUSTOM: {
        label: 'ÉQUATION PERSONNALISÉE',
        categories: ['CUSTOM'],
        signals: SIGNALS_CUSTOM
    }
};
