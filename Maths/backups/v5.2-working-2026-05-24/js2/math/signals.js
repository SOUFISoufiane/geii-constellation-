// ═══════════════════════════════════════════════════════════════════
//  SIGNALS — Unified catalogue
//  Merges GEII + Extras and provides lookup utilities
// ═══════════════════════════════════════════════════════════════════

import { SIGNALS_GEII }      from './signals-geii.js';
import { SIGNALS_ELECTRICAL } from './signals-electrical.js';
import { SIGNALS_AI }         from './signals-ai.js';
import { SIGNALS_AUTOMATION } from './signals-automation.js';
import { SIGNALS_LIVE }       from './signals-live.js';

// All signals, tagged with their root tree
export const ALL_SIGNALS = [
    ...SIGNALS_GEII.map(s => ({ ...s, root: 'GEII' })),
    ...SIGNALS_ELECTRICAL.map(s => ({ ...s, root: 'EXTRAS' })),
    ...SIGNALS_AI.map(s => ({ ...s, root: 'EXTRAS' })),
    ...SIGNALS_AUTOMATION.map(s => ({ ...s, root: 'EXTRAS' })),
    ...SIGNALS_LIVE.map(s => ({ ...s, root: 'EXTRAS' }))
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
    }
};
