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
    },
    {
        id: 'robotics',
        name: 'Robotique',
        icon: '🦾',
        color: 'var(--accent-cyan)',
        description: 'Cinématique, repères, rotations, transformations homogènes',
        matieres: ['Robotique industrielle', 'Maths'],
        apps: ['robotique'],
        position: { x: 0.50, y: 0.15 }
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
        icon: '<img src="shared/img/logo_ese.png" style="width: 28px; height: 28px; border-radius: 6px; vertical-align: middle; box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);">',
        status: 'stable',
        concept: 'circuits-analog',
        matieres: ['Électronique'],
        path: 'apps/circuits/index.html',
        description: 'Réponse RLC, analyse de Kirchhoff par mailles (Cramer) avec schéma SVG annoté, et équivalent de Thévenin avec droite de charge.'
    },
    'automatique': {
        name: 'Servo Lab',
        tagline: 'PID · Lieu des racines · Bode',
        icon: '<img src="shared/img/logo_aii.png" style="width: 28px; height: 28px; border-radius: 6px; vertical-align: middle; box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);">',
        status: 'stable',
        concept: 'systems-control',
        matieres: ['Automatique S4', 'Maths'],
        path: 'apps/automatique/index.html',
        description: 'PID interactif sur plant 2nd ordre, lieu des racines (solveur cubique), diagramme de Bode avec marges de gain et de phase.'
    },
    'numerique': {
        name: 'Digital Lab',
        tagline: 'Karnaugh · VHDL · Table de vérité',
        icon: '<img src="shared/img/logo_ese.png" style="width: 28px; height: 28px; border-radius: 6px; vertical-align: middle; box-shadow: 0 0 10px rgba(0, 240, 255, 0.3);">',
        status: 'stable',
        concept: 'digital-logic',
        matieres: ['Élec. numérique'],
        path: 'apps/numerique/index.html',
        description: 'Éditeur de table de vérité, minimisation Quine–McCluskey avec tableau de Karnaugh, et génération de code VHDL synthétisable.'
    },
    'maths': {
        name: 'Math Visualizer',
        tagline: 'Surface 3D · EDO · Laplace',
        icon: '∫',
        status: 'stable',
        concept: 'math-foundations',
        matieres: ['Maths S3-S6'],
        path: 'apps/maths/index.html',
        description: 'Traceur de surfaces 3D, résolveur d\'EDO du 2nd ordre par RK4, et transformée de Laplace pas-à-pas avec carte pôles-zéros.'
    },
    'robotique': {
        name: 'Robotique',
        tagline: 'Bras 2R/6R · Rotations · Repères',
        icon: '<img src="shared/img/logo_aii.png" style="width: 28px; height: 28px; border-radius: 6px; vertical-align: middle; box-shadow: 0 0 10px rgba(0, 255, 136, 0.3);">',
        status: 'stable',
        concept: 'robotics',
        matieres: ['Robotique industrielle'],
        path: 'apps/robotique/index.html',
        description: 'Cinématique 2R (MGD/MGI), rotations Rx/Ry/Rz et composition, transformations homogènes, repères & points d\'approche (style TP Stäubli), et bras 6 axes (DH) avec détection de singularités.'
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
