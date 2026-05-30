// ═══════════════════════════════════════════════════════════════════
//  DEVINE LA TF — Interactive Fourier-transform guessing game
//
//  Tier 1, Phase 3 (F) of [[concepts/tier1-implementation-plan]].
//  Two directions:
//   - 'time→freq': show s(t), pick the correct |S(f)| from 4 options
//   - 'freq→time': show |S(f)|, pick the correct s(t) from 4 options
//
//  Decoys = 3 other random signals from the eligible pool. Scoring
//  persists to localStorage so the score survives reloads/sharing.
//
//  Why this teaches: active recall on the FT pairs (porte ↔ sinc,
//  gauss ↔ gauss, dirac ↔ const, etc). Way more sticky than reading.
// ═══════════════════════════════════════════════════════════════════

import { tRange, fRange } from '../math/axes.js';
import { findSignal } from '../math/signals.js';
import { baseLayoutLegend, axisTitle, PALETTE, PLOTLY_CONFIG } from './plotly-config.js';

const SCORE_KEY = 'geii-toolbox-signal-observatory-game-score';

// Eligible signals — same finite-support pool used by algebra/convolution,
// plus a couple of well-known FT pairs students should know.
const GAME_POOL_IDS = [
    'porte', 'triangle', 'gaussienne', 'sinc_fn',
    'exp_causale', 'exp_bilatere',
    'dirac', 'heaviside',
    'cosinus', 'sinus',
    'rampe'
];

export const gameState = {
    direction: 'time_to_freq',  // or 'freq_to_time'
    phase:     'idle',          // 'idle' | 'question' | 'answered'
    correctId: null,
    options:   [],              // array of signal ids (length 4, shuffled)
    selectedIdx: -1,
    lastResult: null,           // 'correct' | 'wrong' | null
    score:     loadScore()
};

function loadScore() {
    try {
        const raw = localStorage.getItem(SCORE_KEY);
        if (!raw) return { correct: 0, total: 0, streak: 0, bestStreak: 0 };
        return JSON.parse(raw);
    } catch {
        return { correct: 0, total: 0, streak: 0, bestStreak: 0 };
    }
}

function saveScore() {
    try { localStorage.setItem(SCORE_KEY, JSON.stringify(gameState.score)); } catch {}
}

/** Pick a random correct signal + 3 distinct decoys. */
export function newQuestion() {
    const pool = GAME_POOL_IDS.filter(id => findSignal(id));
    if (pool.length < 4) return;

    // Pick correct
    const correctId = pool[Math.floor(Math.random() * pool.length)];
    // Pick 3 decoys
    const decoys = [];
    const remaining = pool.filter(id => id !== correctId);
    while (decoys.length < 3 && remaining.length > 0) {
        const idx = Math.floor(Math.random() * remaining.length);
        decoys.push(remaining.splice(idx, 1)[0]);
    }
    // Shuffle 4-tuple
    const opts = [correctId, ...decoys];
    for (let i = opts.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [opts[i], opts[j]] = [opts[j], opts[i]];
    }

    gameState.correctId = correctId;
    gameState.options = opts;
    gameState.selectedIdx = -1;
    gameState.lastResult = null;
    gameState.phase = 'question';
}

/** Register the user's pick. Returns 'correct' | 'wrong'. */
export function submitAnswer(idx) {
    if (gameState.phase !== 'question') return null;
    gameState.selectedIdx = idx;
    const picked = gameState.options[idx];
    const correct = picked === gameState.correctId;
    gameState.lastResult = correct ? 'correct' : 'wrong';
    gameState.phase = 'answered';

    gameState.score.total++;
    if (correct) {
        gameState.score.correct++;
        gameState.score.streak++;
        if (gameState.score.streak > gameState.score.bestStreak) {
            gameState.score.bestStreak = gameState.score.streak;
        }
    } else {
        gameState.score.streak = 0;
    }
    saveScore();
    return gameState.lastResult;
}

export function setDirection(dir) {
    if (dir !== 'time_to_freq' && dir !== 'freq_to_time') return;
    gameState.direction = dir;
    newQuestion();
}

export function resetScore() {
    gameState.score = { correct: 0, total: 0, streak: 0, bestStreak: 0 };
    saveScore();
}

// ─── Render ────────────────────────────────────────────────────────

/** Sample a signal in the relevant domain for the prompt/option panels. */
function sampleSignal(sig, domain) {
    if (!sig) return [];
    if (domain === 'time') {
        return tRange.map(t => sig.calcTime(t, {}));
    }
    return fRange.map(f => sig.calcFreq(f, {}).mag);
}

export function renderGame(/* signal, state, computed */) {
    if (gameState.phase === 'idle') newQuestion();

    const correctSig = findSignal(gameState.correctId);
    if (!correctSig) return;

    const promptIsTime = gameState.direction === 'time_to_freq';
    const promptDomain = promptIsTime ? 'time' : 'freq';
    const optionDomain = promptIsTime ? 'freq' : 'time';

    const promptY = sampleSignal(correctSig, promptDomain);
    const promptX = promptIsTime ? tRange : fRange;

    // Sample all 4 options
    const optionTraces = gameState.options.map(id => {
        const sig = findSignal(id);
        return { id, name: sig?.name || id, y: sampleSignal(sig, optionDomain) };
    });

    // Layout: 1 large prompt panel on the left, 2×2 grid of options on the right.
    // The whole game uses Plotly subplots — keeps it inside the existing
    // `plot-fusion` container, no DOM surgery needed.
    const optX = promptIsTime ? fRange : tRange;
    const optXTitle = promptIsTime ? 'f (Hz)' : 't (s)';
    const optYTitle = promptIsTime ? '|S(f)|' : 's(t)';
    const promptXTitle = promptIsTime ? 't (s)' : 'f (Hz)';
    const promptYTitle = promptIsTime ? 's(t)' : '|S(f)|';

    // Per-option border color reflects state
    const colorFor = (idx) => {
        if (gameState.phase !== 'answered') return PALETTE.cyan;
        const picked = idx === gameState.selectedIdx;
        const isCorrect = gameState.options[idx] === gameState.correctId;
        if (isCorrect) return '#4ade80';                     // green for correct option
        if (picked && !isCorrect) return '#f87171';          // red for wrong pick
        return PALETTE.cyan;                                 // dim others
    };
    const showLabel = (idx) => {
        if (gameState.phase !== 'answered') return `Option ${idx + 1}`;
        return `Option ${idx + 1}${gameState.options[idx] === gameState.correctId ? ' ✓' : (idx === gameState.selectedIdx ? ' ✗' : '')}`;
    };

    const layout = baseLayoutLegend({
        margin: { t: 38, b: 38, l: 48, r: 14 },
        grid: { rows: 2, columns: 3, pattern: 'independent', roworder: 'top to bottom' },
        // Big prompt panel: column 0, spanning both rows (Plotly grid doesn't span — we make it wider)
        xaxis:  { title: axisTitle(promptXTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0,    0.45], anchor: 'y'  },
        yaxis:  { title: axisTitle(promptYTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.15, 0.95] },
        // 4 option panels (2 rows × 2 cols on the right half)
        xaxis2: { title: axisTitle(optXTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.52, 0.74], anchor: 'y2' },
        yaxis2: { title: axisTitle(optYTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.55, 0.95], anchor: 'x2' },
        xaxis3: { title: axisTitle(optXTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.78, 1],    anchor: 'y3' },
        yaxis3: { title: axisTitle(optYTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.55, 0.95], anchor: 'x3' },
        xaxis4: { title: axisTitle(optXTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.52, 0.74], anchor: 'y4' },
        yaxis4: { title: axisTitle(optYTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.15, 0.45], anchor: 'x4' },
        xaxis5: { title: axisTitle(optXTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.78, 1],    anchor: 'y5' },
        yaxis5: { title: axisTitle(optYTitle), gridcolor: PALETTE.bgGrid, zerolinecolor: PALETTE.bgZero, domain: [0.15, 0.45], anchor: 'x5' },
        annotations: [
            { x: 0.225, y: 1.02, xref: 'paper', yref: 'paper', xanchor: 'center', showarrow: false,
              text: `<b>🎮 DEVINE LA TF</b>  —  ${promptIsTime ? 'Trouve le spectre |S(f)|' : 'Trouve le signal s(t)'}  —  Score : <b>${gameState.score.correct}/${gameState.score.total}</b>  (série : ${gameState.score.streak}, record : ${gameState.score.bestStreak})`,
              font: { color: PALETTE.cyan, size: 11, family: 'Space Mono,monospace' } },
            ...['x2', 'x3', 'x4', 'x5'].map((ax, i) => ({
                xref: ax + ' domain', yref: ['y2','y3','y4','y5'][i] + ' domain',
                x: 0.5, y: 1.08, xanchor: 'center', showarrow: false,
                text: showLabel(i),
                font: { color: colorFor(i), size: 10, family: 'Space Mono,monospace' }
            })),
            ...(gameState.phase === 'answered' ? [{
                x: 0.225, y: 0.06, xref: 'paper', yref: 'paper', xanchor: 'center', showarrow: false,
                text: gameState.lastResult === 'correct'
                    ? `✓ Bravo — c'était bien <b>${correctSig.name}</b>. Clique une option pour rejouer.`
                    : `✗ Raté — la bonne réponse était <b>${correctSig.name}</b>. Clique une option pour rejouer.`,
                font: { color: gameState.lastResult === 'correct' ? '#4ade80' : '#f87171', size: 10, family: 'Space Mono,monospace' }
            }] : [{
                x: 0.225, y: 0.06, xref: 'paper', yref: 'paper', xanchor: 'center', showarrow: false,
                text: `Clique l'option qui correspond.`,
                font: { color: PALETTE.gold, size: 10, family: 'Space Mono,monospace' }
            }])
        ]
    });

    const data = [
        // Prompt
        { x: promptX, y: promptY, name: 'mystère', type: 'scatter', mode: 'lines',
          line: { color: PALETTE.gold, width: 2.2 }, fill: 'tozeroy', fillcolor: 'rgba(255,214,10,0.10)',
          xaxis: 'x', yaxis: 'y', showlegend: false },
        // 4 options
        ...optionTraces.map((tr, i) => ({
            x: optX, y: tr.y, name: `Option ${i+1}`, type: 'scatter', mode: 'lines',
            line: { color: colorFor(i), width: 1.6 }, fill: 'tozeroy',
            fillcolor: gameState.phase === 'answered' && gameState.options[i] === gameState.correctId
                ? 'rgba(74,222,128,0.10)'
                : (gameState.phase === 'answered' && i === gameState.selectedIdx ? 'rgba(248,113,113,0.10)' : 'rgba(0,245,212,0.05)'),
            xaxis: ['x2','x3','x4','x5'][i], yaxis: ['y2','y3','y4','y5'][i], showlegend: false
        }))
    ];

    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);

    // Wire click handler on the plot (once)
    installClickHandler();
}

// Plotly click handler — picks the closest option subplot, dispatches answer
let _clickWired = false;
function installClickHandler() {
    if (_clickWired) return;
    const plot = document.getElementById('plot-fusion');
    if (!plot || !plot.on) return;
    _clickWired = true;
    plot.on('plotly_click', (ev) => {
        const pt = ev.points?.[0];
        if (!pt) return;
        // Identify which option subplot was clicked by its xaxis/yaxis attribute
        const ax = pt.fullData?.xaxis;
        const idx = { 'x2': 0, 'x3': 1, 'x4': 2, 'x5': 3 }[ax];
        if (idx === undefined) return;

        if (gameState.phase === 'question') {
            submitAnswer(idx);
            renderGame();
        } else if (gameState.phase === 'answered') {
            // Click after answer → start next question
            newQuestion();
            renderGame();
        }
    });
}
