// ═══════════════════════════════════════════════════════════════════
//  GEII TOOLBOX — MANIFEST
//
//  Single source of truth for the home page galaxy.
//  • CONCEPTS = transverse pedagogical themes (constellations)
//  • APPS     = individual tools (stars in a constellation)
//
//  Adding a new app:
//   1. Create apps/<id>/index.html (use signal-observatory or a stub as ref)
//   2. Add an entry under APPS keyed by '<id>'
//   3. Push '<id>' into the matching concept's `apps` array
//   4. (Optional) If the concept is new, add it to CONCEPTS first
//
//  Adding a new concept:
//   1. Push to CONCEPTS with id, name, icon, color, description, matieres, apps, position
//   2. `position` is (x, y) in [0, 1] — relative coords on the galaxy canvas
// ═══════════════════════════════════════════════════════════════════

export const CONCEPTS = [
    {
        id: 'signals-transforms',
        name: 'Signaux & Transformées',
        icon: '∿',
        color: 'var(--accent-blue)',
        description: 'Fourier, Laplace, Z, convolution, STFT, filtrage',
        matieres: ['Maths', 'Signal', 'Électronique'],
        apps: ['signal-observatory'],
        position: { x: 0.22, y: 0.30 }
    },
    {
        id: 'systems-control',
        name: 'Systèmes & Asservissement',
        icon: '⟲',
        color: 'var(--accent-gold)',
        description: 'PID, stabilité, root locus, réponse temporelle',
        matieres: ['Automatique', 'Maths', 'Électronique'],
        apps: ['automatique'],
        position: { x: 0.72, y: 0.25 }
    },
    {
        id: 'circuits-analog',
        name: 'Circuits Analogiques',
        icon: '⚡',
        color: 'var(--accent-red)',
        description: 'Kirchhoff, RLC, ampli op, Thévenin, transistors',
        matieres: ['Électronique', 'Énergie', 'Physique'],
        apps: ['circuits'],
        position: { x: 0.32, y: 0.68 }
    },
    {
        id: 'digital-logic',
        name: 'Logique Numérique',
        icon: '01',
        color: 'var(--accent-green)',
        description: 'Tables de vérité, Karnaugh, FSM, VHDL',
        matieres: ['Électronique numérique', 'Informatique'],
        apps: ['numerique'],
        position: { x: 0.78, y: 0.72 }
    },
    {
        id: 'math-foundations',
        name: 'Mathématiques',
        icon: '∫',
        color: 'var(--accent-purple)',
        description: 'EDO, calcul matriciel, séries, complexes',
        matieres: ['Maths'],
        apps: ['maths'],
        position: { x: 0.50, y: 0.48 }
    }
];

export const APPS = {
    'signal-observatory': {
        name: 'Signal Observatory',
        tagline: 'TF · Filtres · STFT · Convolution',
        icon: '🌌',
        status: 'stable',
        concept: 'signals-transforms',
        matieres: ['Maths S4', 'Signal'],
        path: 'apps/signal-observatory/index.html',
        description: '32 signaux, 9 modes de fusion, 8 filtres, players animés. La pierre angulaire de la toolbox.',
        version: 'v5.2'
    },
    'circuits': {
        name: 'Circuits Interactifs',
        tagline: 'Kirchhoff · Thévenin · RLC',
        icon: '⚡',
        status: 'stub',
        concept: 'circuits-analog',
        matieres: ['Électronique'],
        path: 'apps/circuits/index.html',
        description: 'Schémas SVG interactifs avec calcul de tensions/courants en temps réel.'
    },
    'automatique': {
        name: 'Servo Lab',
        tagline: 'PID · Root locus · Réponses',
        icon: '⟲',
        status: 'stub',
        concept: 'systems-control',
        matieres: ['Automatique S4', 'Maths'],
        path: 'apps/automatique/index.html',
        description: 'PID interactif sur plant 2nd ordre, placement de pôles, marges de stabilité.'
    },
    'numerique': {
        name: 'Digital Lab',
        tagline: 'Karnaugh · FSM · VHDL',
        icon: '01',
        status: 'stub',
        concept: 'digital-logic',
        matieres: ['Élec. numérique'],
        path: 'apps/numerique/index.html',
        description: 'Simplification booléenne visuelle, simulateur de circuits logiques.'
    },
    'maths': {
        name: 'Math Visualizer',
        tagline: 'EDO · Laplace · Algèbre',
        icon: '∫',
        status: 'stub',
        concept: 'math-foundations',
        matieres: ['Maths S3-S6'],
        path: 'apps/maths/index.html',
        description: 'Résolveur visuel EDO, Laplace pas-à-pas, espaces vectoriels animés.'
    }
};

/** Helper: list of all unique matières across the toolbox. */
export function allMatieres() {
    const s = new Set();
    Object.values(APPS).forEach(a => a.matieres.forEach(m => s.add(m)));
    return [...s].sort();
}

/** Helper: get the apps belonging to a concept, hydrated with their metadata. */
export function appsForConcept(conceptId) {
    const c = CONCEPTS.find(c => c.id === conceptId);
    return c ? c.apps.map(id => ({ id, ...APPS[id] })).filter(a => a.name) : [];
}

/** Toolbox metadata. */
export const TOOLBOX = {
    name: 'GEII Visual Toolbox',
    tagline: 'Constellation pédagogique pour BUT GEII',
    version: '0.1.0',
    homePath: 'index.html'
};
