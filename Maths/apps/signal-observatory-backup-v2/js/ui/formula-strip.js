// ═══════════════════════════════════════════════════════════════════
//  FORMULA STRIP — Bottom KaTeX bar + EXPANSIVE sidebar formula panel
//  Now populates: s(t), S(f), |S(f)|, φ(f), H(f), Y(f), Parseval,
//  constants, active theorem. Panel is resizable via top-edge drag.
// ═══════════════════════════════════════════════════════════════════

import { showDerivation, hideDerivation } from './tooltips.js';
import { FILTER_TYPES } from '../math/filters.js';
import { aliasState } from './aliasing.js';
import { findDerivation } from '../derivations/derivations.js';

// Tier 1 Phase 4 (E): user's expand/collapse preference for the demarche panel.
// Persisted to localStorage so the panel stays open across reloads if they want.
const DEMARCHE_STORAGE = 'geii-toolbox-signal-observatory-demarche-open';
let demarcheOpen = (() => {
    try { return localStorage.getItem(DEMARCHE_STORAGE) === '1'; } catch { return false; }
})();
let demarcheWired = false;

const FORMULA_STORAGE = 'signal-obs-formula-panel-height';
const MIN_HEIGHT = 80;
const MAX_HEIGHT_FRAC = 0.7; // 70% of viewport

export function renderFormulas(signal, state) {
    const ftype = state.filterType || 'butterworth';
    const fmeta = FILTER_TYPES[ftype] || FILTER_TYPES.butterworth;
    const n = state.filterOrder || 1;

    // ─── SIDEBAR PANEL — full expanded set ───
    setHTML('formula-time',  `$${signal.formulaTime}$`);
    setHTML('formula-freq',  `$${signal.formulaFreq}$`);
    setHTML('formula-mag',   `$\\left|S(f)\\right|$ — module du spectre`);
    setHTML('formula-phase', `$\\varphi(f) = \\arg S(f)$`);
    setHTML('formula-filter',
        `<span class="filter-tag">[${fmeta.label}]</span> $H(f)=${fmeta.formula || '\\dfrac{1}{\\sqrt{1+(f/f_c)^{2n}}}'}$`
    );
    setHTML('formula-output', `$Y(f) = S(f) \\cdot H(f)$`);
    setHTML('formula-parseval',
        `$\\int_{-\\infty}^{+\\infty} |s(t)|^2 dt = \\int_{-\\infty}^{+\\infty} |S(f)|^2 df$`
    );

    // Numeric constants block
    const tau = 1 / (2 * Math.PI * state.cutoffFreq);
    const fNyq = (aliasState.fSampling || 8) / 2;
    const T_rot = 1 / Math.max(0.01, Math.abs(state.windingFreq || 1));
    setHTML('formula-constants', `
        <div style="margin:2px 0">τ filtre &nbsp;=&nbsp; <b>${tau.toFixed(3)} s</b></div>
        <div style="margin:2px 0">ω<sub>c</sub> &nbsp;=&nbsp; <b>${(2*Math.PI*state.cutoffFreq).toFixed(2)} rad/s</b></div>
        <div style="margin:2px 0">f<sub>c</sub> &nbsp;=&nbsp; <b>${state.cutoffFreq.toFixed(3)} Hz</b></div>
        <div style="margin:2px 0">ordre n &nbsp;=&nbsp; <b>${n}</b></div>
        <div style="margin:2px 0">f<sub>Nyquist</sub> &nbsp;=&nbsp; <b>${fNyq.toFixed(2)} Hz</b></div>
        <div style="margin:2px 0">f<sub>s</sub> &nbsp;=&nbsp; <b>${(aliasState.fSampling || 8).toFixed(2)} Hz</b></div>
        <div style="margin:2px 0">T<sub>rot</sub> &nbsp;=&nbsp; <b>${T_rot.toFixed(3)} s</b></div>
    `);

    // Theorem highlight — depends on active mode
    setHTML('formula-theorem', getTheoremText(state.activeCombo));

    // Démarche (step-by-step proof) — Tier 1 Phase 4 (E)
    window.__lastRenderedSignal = signal;  // so the toggle handler can re-render without a state pass
    renderDemarche(signal);
    wireDemarcheToggle();

    // ─── BOTTOM STRIP ───
    setHTML('strip-time', `$${signal.formulaTime}$`);
    setHTML('strip-freq', `$${signal.formulaFreq}$`);
    const filterTeX = fmeta.formula || '\\dfrac{1}{\\sqrt{1+(f/f_c)^{2n}}}';
    setHTML('strip-filter',
        `<span style="color:var(--text-dim);font-family:'Space Mono',monospace;font-size:0.55rem;margin-right:4px">[${fmeta.label}]</span> $H(f)=${filterTeX}$`
    );

    // Render KaTeX
    if (window.renderMathInElement) {
        ['formula-panel', 'formula-strip'].forEach(id => {
            const el = document.getElementById(id);
            if (el) window.renderMathInElement(el, {
                delimiters: [
                    { left: '$$', right: '$$', display: true },
                    { left: '$',  right: '$',  display: false }
                ],
                throwOnError: false
            });
        });
    }

    // Hook strip elements for derivation hover
    hookStripDerivation('strip-time-wrap', signal.id);
    hookStripDerivation('strip-freq-wrap', signal.id);
}

function setHTML(id, html) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
}

function getTheoremText(mode) {
    switch (mode) {
        case 'parseval':     return 'Théorème de Parseval — Conservation de l\'énergie entre temps et fréquence';
        case 'stability':    return 'Critère de Nyquist — Stabilité en boucle fermée si point critique (-1,0) non encerclé';
        case 'winding':      return 'Machine à enrouler — Centre de gravité = composante spectrale';
        case 'stft':         return 'Transformée de Fourier à court terme — Représentation temps-fréquence';
        case 'filter':       return 'Réponse fréquentielle — H(f) = TF{h(t)}';
        case 'convolution':  return 'Théorème de convolution — 𝓕{s*h} = S(f)·H(f)';
        case 'bode_pure':    return 'Bode — Gain (dB) et phase (deg) vs log(f)';
        case 'nyquist_pure': return 'Nyquist — Lieu de transfert dans le plan complexe';
        case 'waterfall':    return 'Waterfall — Évolution spectrale temporelle 3D';
        default:             return 'Mode actif';
    }
}

function hookStripDerivation(wrapId, signalId) {
    const el = document.getElementById(wrapId);
    if (!el) return;
    if (el._hookId === signalId) return;
    const fresh = el.cloneNode(true);
    el.parentNode.replaceChild(fresh, el);
    fresh._hookId = signalId;
    fresh.addEventListener('mouseenter', () => showDerivation(signalId, fresh));
    fresh.addEventListener('mouseleave', () => hideDerivation());
}

export function renderTauLine(state) {
    const tau = 1 / (2 * Math.PI * state.cutoffFreq);
    const tauEl = document.getElementById('tau-line');
    if (tauEl) {
        tauEl.innerHTML = `
            τ = <span class="val" style="color:var(--accent-blue)">${tau.toFixed(3)} s</span>
            <span style="color:var(--rim-bright);margin:0 8px">|</span>
            ordre n = <span class="val" style="color:var(--accent-gold)">${state.filterOrder}</span>
        `;
    }
}

// ═══════════════════════════════════════════════════════════════════
//  RESIZABLE PANEL — drag the top handle to change height
//  Math scales proportionally via CSS custom property --formula-size
// ═══════════════════════════════════════════════════════════════════

let resizeAttached = false;

export function initFormulaResize() {
    if (resizeAttached) return;
    const panel = document.getElementById('formula-panel');
    const handle = document.getElementById('formula-resize-handle');
    if (!panel || !handle) return;
    resizeAttached = true;

    // Restore persisted height
    try {
        const stored = parseFloat(localStorage.getItem(FORMULA_STORAGE));
        if (stored && stored >= MIN_HEIGHT) {
            applyHeight(stored);
        }
    } catch (e) {}

    let dragging = false;
    let startY = 0;
    let startH = 0;

    handle.addEventListener('mousedown', (e) => {
        e.preventDefault();
        dragging = true;
        startY = e.clientY;
        startH = panel.getBoundingClientRect().height;
        handle.classList.add('dragging');
        document.body.style.cursor = 'row-resize';
        document.body.style.userSelect = 'none';
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const dy = e.clientY - startY;
        // Drag UP increases height (handle is on top)
        let newH = startH - dy;
        const maxH = window.innerHeight * MAX_HEIGHT_FRAC;
        newH = Math.max(MIN_HEIGHT, Math.min(maxH, newH));
        applyHeight(newH);
    });

    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        handle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        try {
            const h = panel.getBoundingClientRect().height;
            localStorage.setItem(FORMULA_STORAGE, String(h));
        } catch (e) {}
    });
}

function applyHeight(px) {
    const panel = document.getElementById('formula-panel');
    if (!panel) return;
    panel.style.setProperty('--formula-panel-h', `${px}px`);
    // Scale font size proportionally: 0.7rem at 80px, 1.4rem at 500px
    const fontSize = 0.6 + (px - 80) * (1.4 - 0.6) / (500 - 80);
    const clamped = Math.max(0.6, Math.min(1.6, fontSize));
    panel.style.setProperty('--formula-size', `${clamped}rem`);
}

// ═══════════════════════════════════════════════════════════════════
//  DÉMARCHE — Step-by-step derivation panel (Tier 1 Phase 4 / E)
// ═══════════════════════════════════════════════════════════════════

function renderDemarche(signal) {
    const container = document.getElementById('formula-demarche');
    if (!container) return;
    container.style.display = demarcheOpen ? 'block' : 'none';
    const arrow = document.getElementById('demarche-arrow');
    if (arrow) arrow.textContent = demarcheOpen ? '▾' : '▸';

    // No need to do KaTeX work if collapsed
    if (!demarcheOpen) return;

    const deriv = findDerivation(signal?.id);
    if (!deriv) {
        container.innerHTML = `
            <div style="color:var(--text-dim); font-style:italic; font-size:0.7rem; padding:6px 0;">
                Pas de démarche disponible pour ce signal.<br>
                <span style="opacity:0.6">(Tag <code>${signal?.id || '?'}</code> non répertorié dans <code>derivations.js</code>.)</span>
            </div>`;
        return;
    }

    // Build step list with KaTeX inline math
    const stepsHtml = (deriv.steps || []).map((step, i) => `
        <div class="demarche-step" style="margin: 6px 0; padding: 6px 8px; background: rgba(0,245,212,0.04); border-left: 2px solid var(--accent-cyan); border-radius: 2px;">
            <div style="display:flex; gap:6px; align-items:baseline;">
                <span style="color: var(--accent-cyan); font-family:'Space Mono',monospace; font-size: 0.65rem; font-weight: 700;">[${i + 1}]</span>
                <span style="flex:1;">$${step.latex}$</span>
            </div>
            ${step.note ? `<div style="margin-left:22px; margin-top:3px; color: var(--text-dim); font-size: 0.62rem; font-style: italic;">${escapeHtml(step.note)}</div>` : ''}
        </div>
    `).join('');

    const intuitionHtml = deriv.intuition ? `
        <div style="margin-top: 10px; padding: 8px; background: rgba(255,214,10,0.06); border-left: 2px solid var(--accent-gold); border-radius: 2px;">
            <div style="color: var(--accent-gold); font-family:'Space Mono',monospace; font-size: 0.62rem; font-weight: 700; margin-bottom: 4px;">▸ INTUITION</div>
            <div style="font-size: 0.7rem; line-height: 1.5;">${escapeHtml(deriv.intuition)}</div>
        </div>` : '';

    const geiiHtml = deriv.geiiContext ? `
        <div style="margin-top: 8px; padding: 8px; background: rgba(155,93,229,0.06); border-left: 2px solid var(--accent-purple, #9b5de5); border-radius: 2px;">
            <div style="color: var(--accent-purple, #9b5de5); font-family:'Space Mono',monospace; font-size: 0.62rem; font-weight: 700; margin-bottom: 4px;">▸ CONTEXTE GEII</div>
            <div style="font-size: 0.7rem; line-height: 1.5;">${escapeHtml(deriv.geiiContext)}</div>
        </div>` : '';

    container.innerHTML = `
        <div style="color: var(--accent-cyan); font-family:'Space Mono',monospace; font-size: 0.7rem; font-weight: 700; margin-bottom: 6px;">
            ${escapeHtml(deriv.title || signal.name)}
        </div>
        ${stepsHtml}
        ${intuitionHtml}
        ${geiiHtml}
    `;

    // Render KaTeX in the steps
    if (window.renderMathInElement) {
        window.renderMathInElement(container, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$',  right: '$',  display: false }
            ],
            throwOnError: false
        });
    }
}

function wireDemarcheToggle() {
    if (demarcheWired) return;
    const toggle = document.getElementById('demarche-toggle');
    if (!toggle) return;
    demarcheWired = true;
    toggle.addEventListener('click', () => {
        demarcheOpen = !demarcheOpen;
        try { localStorage.setItem(DEMARCHE_STORAGE, demarcheOpen ? '1' : '0'); } catch {}
        // Force a re-render so the body is freshly populated when expanding
        const lastSignal = window.__lastRenderedSignal;
        renderDemarche(lastSignal);
    });
}

function escapeHtml(s) {
    if (s == null) return '';
    return String(s)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
