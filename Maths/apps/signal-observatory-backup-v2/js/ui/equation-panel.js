// ═══════════════════════════════════════════════════════════════════
//  EQUATION PANEL — floating draggable HUD for the custom signal
//
//  Three modes via top tabs:
//    [ f(t) ]     time-domain input
//    [ Ŝ(f) ]     frequency-domain input (with sub-selector for complex Ŝ
//                 vs Fourier series coefficients aₙ, bₙ)
//
//  Convention selector at the top: Hz / ω·1/2π / symmetric.
//
//  Sections:
//    • Equation input(s) + math keyboard
//    • Live KaTeX preview
//    • ▾ FORME DÉVELOPPÉE   (collapsible, shows Euler-expanded form)
//    • ▾ ROUND-TRIP         (collapsible, shows FFT/IFFT comparison)
// ═══════════════════════════════════════════════════════════════════

import {
    setEquation, setSeriesEquation, setMode, customSignalState, getActiveEquation
} from '../math/signals-custom.js';
import { state, notify } from '../state.js';
import { renderExtraControls } from './controls.js';
import { listConventions, getActiveConvention, setActiveConvention } from '../math/fourier-conventions.js';
import { astToKatex } from '../math/equation-to-katex.js';

const STORAGE_EQ_TIME  = 'geii-toolbox-signal-observatory-equation-time';
const STORAGE_EQ_FREQ  = 'geii-toolbox-signal-observatory-equation-freq';
const STORAGE_EQ_AN    = 'geii-toolbox-signal-observatory-equation-an';
const STORAGE_EQ_BN    = 'geii-toolbox-signal-observatory-equation-bn';
const STORAGE_MODE     = 'geii-toolbox-signal-observatory-eqmode';
const STORAGE_CONV     = 'geii-toolbox-signal-observatory-eqconv';
const STORAGE_POS      = 'geii-toolbox-signal-observatory-eqpanel-pos';

// ─── Per-mode presets ─────────────────────────────────────────────
const PRESETS = {
    time: [
        { label: 'Pure sine',    expr: 'sin(2*pi*3*t)' },
        { label: '2-tone',       expr: 'sin(2*pi*f*t) + 0.3*sin(2*pi*g*t)' },
        { label: 'Damped sine',  expr: 'exp(-a*t)*sin(2*pi*f*t)*step(t)' },
        { label: 'Square pulse', expr: 'rect(t/tau)' },
        { label: 'Chirp',        expr: 'sin(2*pi*(a + b*t)*t)' },
        { label: 'Gauss',        expr: 'exp(-a*t*t)' },
        { label: 'Complex exp',  expr: 're(exp(j*2*pi*f*t))' }
    ],
    freqComplex: [
        { label: 'RC lowpass',     expr: '1/(1 + j*w*tau)' },
        { label: 'Differentiator', expr: 'j*w' },
        { label: 'Integrator',     expr: '1/(j*w)' },
        { label: 'Ideal lowpass',  expr: 'rect(f/(2*B))' },
        { label: 'Sinc spectrum',  expr: 'sinc(f*tau)' },
        { label: 'RLC bandpass',   expr: 'j*w/(1 + j*w*R*C - w*w*L*C)' }
    ],
    fourierSeriesAn: [
        { label: 'Square (0)',     expr: '0' },
        { label: 'Triangle (8/π²n²)', expr: '8/(pi*pi*n*n)' }
    ],
    fourierSeriesBn: [
        { label: 'Square (4/πn odd)', expr: '4/(pi*n)*(1 - cos(pi*n))/2' },
        { label: 'Sawtooth (2/πn)',   expr: '2/(pi*n)*(-1)^(n+1)' },
        { label: 'Zero',              expr: '0' }
    ]
};

// ─── Math keyboard ────────────────────────────────────────────────
const KEYBOARD = [
    [
        { label: 'sin',  insert: 'sin('  },
        { label: 'cos',  insert: 'cos('  },
        { label: 'tan',  insert: 'tan('  },
        { label: 'exp',  insert: 'exp('  },
        { label: 'log',  insert: 'log('  },
        { label: 'sqrt', insert: 'sqrt(' },
        { label: 'abs',  insert: 'abs('  },
        { label: 'sinc', insert: 'sinc(' }
    ],
    [
        { label: 'rect', insert: 'rect(' },
        { label: 'tri',  insert: 'tri('  },
        { label: 'step', insert: 'step(' },
        { label: 'sign', insert: 'sign(' },
        { label: 'sinh', insert: 'sinh(' },
        { label: 'cosh', insert: 'cosh(' },
        { label: 'tanh', insert: 'tanh(' },
        { label: '^',    insert: '^'     }
    ],
    [
        { label: '+',    insert: '+', cls: 'op' },
        { label: '−',    insert: '-', cls: 'op' },
        { label: '×',    insert: '*', cls: 'op' },
        { label: '÷',    insert: '/', cls: 'op' },
        { label: '(',    insert: '(', cls: 'op' },
        { label: ')',    insert: ')', cls: 'op' },
        { label: 'π',    insert: 'pi', cls: 'cst' },
        { label: 'e',    insert: 'e',  cls: 'cst' }
    ],
    [
        // Complex + sweep keys
        { label: 'j',    insert: 'j',    cls: 'cst' },
        { label: 're(',  insert: 're(',  cls: 'fn' },
        { label: 'im(',  insert: 'im(',  cls: 'fn' },
        { label: 'arg(', insert: 'arg(', cls: 'fn' },
        { label: 'mag(', insert: 'mag(', cls: 'fn' },
        { label: 'conj(',insert: 'conj(',cls: 'fn' },
        { label: 'ω',    insert: 'omega',cls: 'var' },
        { label: 'n',    insert: 'n',    cls: 'var' }
    ],
    [
        { label: 't',    insert: 't',    cls: 'var' },
        { label: 'f',    insert: 'f',    cls: 'var' },
        { label: 'a',    insert: 'a',    cls: 'var' },
        { label: 'b',    insert: 'b',    cls: 'var' },
        { label: 'τ',    insert: 'tau',  cls: 'var' },
        { label: 'T',    insert: 'T',    cls: 'var' },
        { label: 'N',    insert: 'N',    cls: 'var' },
        { label: 'φ',    insert: 'phi',  cls: 'var' }
    ]
];

// ─── State ────────────────────────────────────────────────────────
let panel    = null;
let inputEl  = null;            // currently-focused input (time, freq, an, or bn)
let previewEl, errorEl;
let inputTime, inputFreq, inputAn, inputBn;
let sectionTime, sectionFreq, sectionSeries;
let roundTripEl;
let activeMode = 'time';        // 'time' | 'freqComplex' | 'fourierSeries'

// ─── Build ────────────────────────────────────────────────────────
function ensurePanel() {
    if (panel) return panel;

    // Restore last mode + convention
    activeMode = localStorage.getItem(STORAGE_MODE) || 'time';
    const savedConv = localStorage.getItem(STORAGE_CONV) || 'hz';
    setActiveConvention(savedConv);

    panel = document.createElement('div');
    panel.id = 'eq-panel';
    panel.innerHTML = `
        <div class="eq-header" id="eq-drag">
            <span class="eq-title">▸ ÉQUATEUR</span>
            <span class="eq-sub">tape ou clique pour composer</span>
            <button class="eq-close" id="eq-close" title="Fermer">×</button>
        </div>

        <div class="eq-body">
            <div class="eq-tabs" role="tablist">
                <button class="eq-tab" data-mode="time"          title="Définir s(t)">f(t)</button>
                <button class="eq-tab" data-mode="freqComplex"   title="Définir Ŝ(f) complexe">Ŝ(f)</button>
                <button class="eq-tab" data-mode="fourierSeries" title="Coefficients aₙ, bₙ">aₙ,bₙ</button>
            </div>

            <div class="eq-conv-row">
                <label>Convention :</label>
                <select id="eq-conv">
                    ${listConventions().map(c =>
                        `<option value="${c.id}">${c.label}</option>`
                    ).join('')}
                </select>
                <span class="eq-conv-formula" id="eq-conv-formula"></span>
            </div>

            <div class="eq-mode-section" data-mode="time">
                <label class="eq-input-label">s(t) =</label>
                <input id="eq-input-time" type="text" class="eq-input" spellcheck="false" autocomplete="off" placeholder="ex: sin(2*pi*f*t)">
            </div>
            <div class="eq-mode-section" data-mode="freqComplex">
                <label class="eq-input-label">Ŝ(f) =</label>
                <input id="eq-input-freq" type="text" class="eq-input" spellcheck="false" autocomplete="off" placeholder="ex: 1/(1+j*w*tau)">
            </div>
            <div class="eq-mode-section" data-mode="fourierSeries">
                <label class="eq-input-label">aₙ =</label>
                <input id="eq-input-an" type="text" class="eq-input" spellcheck="false" autocomplete="off" placeholder="ex: 0">
                <label class="eq-input-label">bₙ =</label>
                <input id="eq-input-bn" type="text" class="eq-input" spellcheck="false" autocomplete="off" placeholder="ex: 4/(pi*n)">
                <div class="eq-hint">période T et nombre de termes N → ajuste-les dans le params board.</div>
            </div>

            <div id="eq-error" class="eq-error"></div>

            <div class="eq-preview-label">aperçu</div>
            <div id="eq-preview" class="eq-preview"></div>

            <details class="eq-collapse">
                <summary>▸ Round-trip (transformée &amp; inverse)</summary>
                <div class="eq-roundtrip" id="eq-roundtrip"></div>
            </details>

            <details class="eq-collapse eq-glossary-collapse">
                <summary>▸ Glossaire des symboles</summary>
                <div class="eq-glossary" id="eq-glossary">

                    <div class="gl-section-title">Lettres grecques &amp; constantes</div>
                    <table class="gl-table">
                        <thead><tr><th>Symbole</th><th>Signification</th><th>Taper</th><th>Alias</th></tr></thead>
                        <tbody>
                            <tr><td class="gl-sym">τ</td><td>Constante de temps — RC : τ = R·C, RL : τ = L/R. exp(−t/τ) perd 63 % chaque τ</td><td class="gl-code">tau</td><td>—</td></tr>
                            <tr><td class="gl-sym">ω</td><td>Pulsation (rad/s) — ω = 2πf</td><td class="gl-code">omega</td><td class="gl-code">w</td></tr>
                            <tr><td class="gl-sym">π</td><td>Pi ≈ 3.14159…</td><td class="gl-code">pi</td><td class="gl-code">π</td></tr>
                            <tr><td class="gl-sym">φ</td><td>Phase / déphasage (rad)</td><td class="gl-code">phi</td><td>—</td></tr>
                            <tr><td class="gl-sym">α</td><td>Coefficient d'atténuation, facteur de décroissance</td><td class="gl-code">alpha</td><td>—</td></tr>
                            <tr><td class="gl-sym">β</td><td>Paramètre de boucle / fréquence angulaire normalisée</td><td class="gl-code">beta</td><td>—</td></tr>
                            <tr><td class="gl-sym">γ</td><td>Rapport / coefficient</td><td class="gl-code">gamma</td><td>—</td></tr>
                            <tr><td class="gl-sym">δ</td><td>Dirac δ(t), variation infinitésimale</td><td class="gl-code">delta</td><td>—</td></tr>
                            <tr><td class="gl-sym">σ</td><td>Écart-type, partie réelle de s = σ + jω</td><td class="gl-code">sigma</td><td>—</td></tr>
                            <tr><td class="gl-sym">θ</td><td>Angle / argument</td><td class="gl-code">theta</td><td>—</td></tr>
                            <tr><td class="gl-sym">λ</td><td>Longueur d'onde, valeur propre</td><td class="gl-code">lambda</td><td>—</td></tr>
                            <tr><td class="gl-sym">μ</td><td>Micro (10⁻⁶), moyenne</td><td class="gl-code">mu</td><td>—</td></tr>
                            <tr><td class="gl-sym">ρ</td><td>Résistivité, coefficient de réflexion</td><td class="gl-code">rho</td><td>—</td></tr>
                            <tr><td class="gl-sym">η</td><td>Rendement</td><td class="gl-code">eta</td><td>—</td></tr>
                            <tr><td class="gl-sym">ε</td><td>Erreur, permittivité</td><td class="gl-code">epsilon</td><td>—</td></tr>
                            <tr><td class="gl-sym">e</td><td>Constante d'Euler ≈ 2.718…</td><td class="gl-code">e</td><td>—</td></tr>
                            <tr><td class="gl-sym">j</td><td>Unité imaginaire (j = √−1, convention ingénieur)</td><td class="gl-code">j</td><td>—</td></tr>
                        </tbody>
                    </table>

                    <div class="gl-section-title">Variables réservées</div>
                    <table class="gl-table">
                        <thead><tr><th>Var</th><th>Rôle</th><th>Notes</th></tr></thead>
                        <tbody>
                            <tr><td class="gl-code">t</td><td>Axe temporel (s)</td><td>Variable de balayage en mode f(t)</td></tr>
                            <tr><td class="gl-code">f</td><td>Fréquence (Hz)</td><td>Variable de balayage en mode Ŝ(f)</td></tr>
                            <tr><td class="gl-code">x</td><td>Axe horizontal</td><td>Alias mathématique universel (pour t ou f)</td></tr>
                            <tr><td class="gl-code">n</td><td>Indice harmonique</td><td>Entier, utilisé en mode aₙ, bₙ</td></tr>
                            <tr><td class="gl-code">w</td><td>ω = 2πf</td><td>Lié automatiquement à f quand f est défini</td></tr>
                            <tr><td class="gl-code">omega</td><td>ω = 2πf</td><td>Identique à w, notation longue</td></tr>
                        </tbody>
                    </table>

                    <div class="gl-section-title">Fonctions</div>
                    <table class="gl-table">
                        <thead><tr><th>Taper</th><th>Signification</th></tr></thead>
                        <tbody>
                            <tr><td class="gl-code">sin( ) cos( ) tan( )</td><td>Trigonométrie</td></tr>
                            <tr><td class="gl-code">sec( ) csc( ) cot( )</td><td>Sécante, cosécante, cotangente</td></tr>
                            <tr><td class="gl-code">asin( ) acos( ) atan( )</td><td>Trigo inverses</td></tr>
                            <tr><td class="gl-code">sinh( ) cosh( ) tanh( )</td><td>Hyperboliques</td></tr>
                            <tr><td class="gl-code">exp( )</td><td>Exponentielle → rendu e^{…}</td></tr>
                            <tr><td class="gl-code">log( ) ln( )</td><td>Logarithme naturel</td></tr>
                            <tr><td class="gl-code">log10( ) log2( )</td><td>Log base 10 et base 2</td></tr>
                            <tr><td class="gl-code">sqrt( ) cbrt( )</td><td>Racine carrée et cubique</td></tr>
                            <tr><td class="gl-code">abs( )</td><td>Valeur absolue / module</td></tr>
                            <tr><td class="gl-code">sinc( )</td><td>sinc(x) = sin(πx) / (πx)</td></tr>
                            <tr><td class="gl-code">rect( )</td><td>Fonction porte : 1 si |x| ≤ 0.5</td></tr>
                            <tr><td class="gl-code">tri( )</td><td>Fonction triangle : max(0, 1−|x|)</td></tr>
                            <tr><td class="gl-code">step( ) heaviside( )</td><td>Échelon unitaire u(t)</td></tr>
                            <tr><td class="gl-code">sign( )</td><td>Signe : −1, 0 ou +1</td></tr>
                            <tr><td class="gl-code">floor( ) ceil( ) round( )</td><td>Arrondi inférieur, supérieur, au plus proche</td></tr>
                            <tr><td class="gl-code">min(a,b) max(a,b)</td><td>Minimum et maximum</td></tr>
                            <tr><td class="gl-code">mod(a,b)</td><td>Modulo (reste de la division)</td></tr>
                        </tbody>
                    </table>

                    <div class="gl-section-title">Fonctions complexes (actives si j apparaît)</div>
                    <table class="gl-table">
                        <thead><tr><th>Taper</th><th>Signification</th></tr></thead>
                        <tbody>
                            <tr><td class="gl-code">re( )</td><td>Partie réelle</td></tr>
                            <tr><td class="gl-code">im( )</td><td>Partie imaginaire</td></tr>
                            <tr><td class="gl-code">mag( ) abs( )</td><td>Module |z|</td></tr>
                            <tr><td class="gl-code">arg( )</td><td>Argument (phase en rad)</td></tr>
                            <tr><td class="gl-code">conj( )</td><td>Conjugué z*</td></tr>
                        </tbody>
                    </table>

                    <div class="gl-section-title">Opérateurs</div>
                    <table class="gl-table">
                        <thead><tr><th>Taper</th><th>Rendu</th><th>Aussi accepté</th></tr></thead>
                        <tbody>
                            <tr><td class="gl-code">+</td><td>Addition</td><td>—</td></tr>
                            <tr><td class="gl-code">-</td><td>Soustraction</td><td class="gl-code">− – —</td></tr>
                            <tr><td class="gl-code">*</td><td>Multiplication</td><td class="gl-code">× · ⋅ ou implicite (2pi = 2*pi)</td></tr>
                            <tr><td class="gl-code">/</td><td>Division → frac</td><td class="gl-code">÷</td></tr>
                            <tr><td class="gl-code">^</td><td>Puissance</td><td class="gl-code">² ³ ⁴…</td></tr>
                        </tbody>
                    </table>

                    <div class="gl-section-title">Astuces d'écriture</div>
                    <div class="gl-tips">
                        <div>• <code>2pi</code> → 2·π (multiplication implicite)</div>
                        <div>• <code>2(x+1)</code> → 2·(x+1)</div>
                        <div>• Parenthèses oubliées → auto-fermées</div>
                        <div>• <code>½ ⅓ ¼ ¾</code> → fractions reconnues</div>
                        <div>• Toutes les lettres simples (a, b, c…) deviennent des paramètres avec sliders</div>
                    </div>
                </div>
            </details>

            <div class="eq-keyboard">
                ${KEYBOARD.map(row => `
                    <div class="eq-row">
                        ${row.map(k => `
                            <button class="eq-key${k.cls ? ' k-' + k.cls : ''}"
                                    data-insert="${escapeAttr(k.insert)}">
                                ${escapeHtml(k.label)}
                            </button>
                        `).join('')}
                    </div>
                `).join('')}
                <div class="eq-row eq-row-utility">
                    <button class="eq-key k-util" id="eq-back" title="Effacer le dernier caractère">⌫</button>
                    <button class="eq-key k-util" id="eq-clear" title="Tout effacer">Clear</button>
                    <select class="eq-presets" id="eq-presets" title="Préréglages"></select>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    inputTime = panel.querySelector('#eq-input-time');
    inputFreq = panel.querySelector('#eq-input-freq');
    inputAn   = panel.querySelector('#eq-input-an');
    inputBn   = panel.querySelector('#eq-input-bn');
    previewEl = panel.querySelector('#eq-preview');
    errorEl   = panel.querySelector('#eq-error');
    roundTripEl = panel.querySelector('#eq-roundtrip');
    sectionTime   = panel.querySelector('.eq-mode-section[data-mode="time"]');
    sectionFreq   = panel.querySelector('.eq-mode-section[data-mode="freqComplex"]');
    sectionSeries = panel.querySelector('.eq-mode-section[data-mode="fourierSeries"]');

    // Restore equations
    inputTime.value = localStorage.getItem(STORAGE_EQ_TIME) || customSignalState.equationTime;
    inputFreq.value = localStorage.getItem(STORAGE_EQ_FREQ) || customSignalState.equationFreq;
    inputAn.value   = localStorage.getItem(STORAGE_EQ_AN)   || customSignalState.equationAn;
    inputBn.value   = localStorage.getItem(STORAGE_EQ_BN)   || customSignalState.equationBn;

    // Restore panel position
    try {
        const pos = JSON.parse(localStorage.getItem(STORAGE_POS) || 'null');
        if (pos && Number.isFinite(pos.x) && Number.isFinite(pos.y)) {
            panel.style.left = pos.x + 'px';
            panel.style.top  = pos.y + 'px';
            panel.style.right = 'auto';
        }
    } catch {}

    // Wire
    panel.querySelector('#eq-close').addEventListener('click', hide);
    makeDraggable(panel, panel.querySelector('#eq-drag'));

    panel.querySelectorAll('.eq-tab').forEach(t => {
        t.addEventListener('click', () => switchMode(t.dataset.mode));
    });

    const convSel = panel.querySelector('#eq-conv');
    convSel.value = getActiveConvention().id;
    convSel.addEventListener('change', () => {
        setActiveConvention(convSel.value);
        localStorage.setItem(STORAGE_CONV, convSel.value);
        updateConventionDisplay();
        // Force cache rebuild
        customSignalState.cacheKey = '';
        applyEquation();
    });

    panel.querySelectorAll('.eq-key[data-insert]').forEach(btn => {
        btn.addEventListener('click', () => insertAtCursor(btn.dataset.insert));
    });
    panel.querySelector('#eq-back').addEventListener('click', () => {
        if (!inputEl) return;
        const s = inputEl.value;
        const c = inputEl.selectionStart ?? s.length;
        if (c === 0) return;
        inputEl.value = s.slice(0, c - 1) + s.slice(c);
        inputEl.selectionStart = inputEl.selectionEnd = c - 1;
        applyEquation();
    });
    panel.querySelector('#eq-clear').addEventListener('click', () => {
        if (inputEl) { inputEl.value = ''; inputEl.focus(); applyEquation(); }
    });
    panel.querySelector('#eq-presets').addEventListener('change', e => {
        if (!e.target.value || !inputEl) return;
        inputEl.value = e.target.value;
        e.target.value = '';
        inputEl.focus();
        applyEquation();
    });

    // Focus tracking
    [inputTime, inputFreq, inputAn, inputBn].forEach(inp => {
        inp.addEventListener('focus', () => { inputEl = inp; });
        inp.addEventListener('input', applyEquation);
    });

    switchMode(activeMode);
    updateConventionDisplay();
    return panel;
}

function switchMode(newMode) {
    activeMode = newMode;
    localStorage.setItem(STORAGE_MODE, newMode);
    setMode(newMode);

    // Update tab highlight
    panel.querySelectorAll('.eq-tab').forEach(t => {
        t.classList.toggle('active', t.dataset.mode === newMode);
    });

    // Show only the relevant input section
    sectionTime.style.display   = newMode === 'time'          ? '' : 'none';
    sectionFreq.style.display   = newMode === 'freqComplex'   ? '' : 'none';
    sectionSeries.style.display = newMode === 'fourierSeries' ? '' : 'none';

    // Update preset list
    const presetSel = panel.querySelector('#eq-presets');
    let presets = [];
    if (newMode === 'time')          presets = PRESETS.time;
    if (newMode === 'freqComplex')   presets = PRESETS.freqComplex;
    if (newMode === 'fourierSeries') presets = [
        ...PRESETS.fourierSeriesAn.map(p => ({ ...p, label: 'aₙ: ' + p.label })),
        ...PRESETS.fourierSeriesBn.map(p => ({ ...p, label: 'bₙ: ' + p.label }))
    ];
    presetSel.innerHTML = `<option value="">Préréglages…</option>` +
        presets.map(p => `<option value="${escapeAttr(p.expr)}">${escapeHtml(p.label)}</option>`).join('');

    // Set focus to the right input
    if (newMode === 'time')          inputEl = inputTime;
    if (newMode === 'freqComplex')   inputEl = inputFreq;
    if (newMode === 'fourierSeries') inputEl = inputAn;
    setTimeout(() => inputEl?.focus(), 0);

    applyEquation();
}

function applyEquation() {
    let result;
    if (activeMode === 'fourierSeries') {
        localStorage.setItem(STORAGE_EQ_AN, inputAn.value);
        localStorage.setItem(STORAGE_EQ_BN, inputBn.value);
        const r = setSeriesEquation(inputAn.value, inputBn.value);
        // Combined preview: synthesize one summary KaTeX
        const anC = r.an, bnC = r.bn;
        const hasErr = anC?.error || bnC?.error;
        result = {
            error: hasErr,
            warnings: [...(anC?.warnings||[]), ...(bnC?.warnings||[])],
            latex: `a_n = ${anC?.ast ? astToKatexInline(anC.ast) : '?'} \\;,\\; b_n = ${bnC?.ast ? astToKatexInline(bnC.ast) : '?'}`,
            mode: activeMode
        };
    } else {
        const src = (activeMode === 'time' ? inputTime : inputFreq).value;
        const storage = activeMode === 'time' ? STORAGE_EQ_TIME : STORAGE_EQ_FREQ;
        localStorage.setItem(storage, src);
        result = setEquation(src);
    }
    renderFeedback(result);
    syncStateAndRender();
}

function renderFeedback(result) {
    // Error / warning chip
    const warnings = result.warnings || [];
    if (result.error) {
        errorEl.className = 'eq-error level-error';
        errorEl.innerHTML = '⚠ ' + escapeHtml(result.error);
        errorEl.style.display = 'block';
    } else if (warnings.length) {
        errorEl.className = 'eq-error level-warn';
        errorEl.innerHTML = '<span class="eq-warn-tag">corrigé</span> ' + warnings.map(escapeHtml).join(' · ');
        errorEl.style.display = 'block';
    } else {
        errorEl.style.display = 'none';
    }

    // KaTeX preview
    if (result.latex && window.katex) {
        try {
            window.katex.render(result.latex, previewEl, { throwOnError: false, displayMode: true });
        } catch (e) {
            previewEl.textContent = result.latex;
        }
    } else {
        previewEl.innerHTML = '<span class="eq-placeholder">(aperçu)</span>';
    }

    renderRoundTrip();
}

function renderRoundTrip() {
    const rt = customSignalState.roundTrip;
    if (!rt) {
        roundTripEl.innerHTML = '<span class="eq-placeholder">round-trip indisponible pour ce mode</span>';
        return;
    }
    const relPct = (rt.relative * 100).toFixed(1);
    const aliasPct = (rt.aliasFrac * 100).toFixed(0);
    const leakPct  = (rt.leakageFrac * 100).toFixed(0);
    const discPct  = (rt.discretizationFrac * 100).toFixed(0);

    roundTripEl.innerHTML = `
        <div class="rt-row"><span class="rt-label">Erreur RMS</span><span class="rt-val">${rt.rms.toFixed(4)}</span></div>
        <div class="rt-row"><span class="rt-label">relatif</span><span class="rt-val">${relPct}%</span></div>
        <hr>
        <div class="rt-bar"><span class="rt-bar-lbl">Aliasing |f|≥${Math.max(...[...customSignalState.freqCache?.keys()||[20]]).toFixed(0)}</span>
            <div class="rt-bar-track"><div class="rt-bar-fill" style="width:${aliasPct}%; background:var(--accent-red)"></div></div>
            <span class="rt-bar-val">${aliasPct}%</span>
        </div>
        <div class="rt-bar"><span class="rt-bar-lbl">Fuite spectrale (fenêtre finie)</span>
            <div class="rt-bar-track"><div class="rt-bar-fill" style="width:${leakPct}%; background:var(--accent-gold)"></div></div>
            <span class="rt-bar-val">${leakPct}%</span>
        </div>
        <div class="rt-bar"><span class="rt-bar-lbl">Discrétisation (δ→bin)</span>
            <div class="rt-bar-track"><div class="rt-bar-fill" style="width:${discPct}%; background:var(--accent-cyan)"></div></div>
            <span class="rt-bar-val">${discPct}%</span>
        </div>
    `;
}

function updateConventionDisplay() {
    const c = getActiveConvention();
    const el = panel.querySelector('#eq-conv-formula');
    if (el && window.katex) {
        try {
            window.katex.render(c.formulaForward, el, { throwOnError: false, displayMode: false });
        } catch {
            el.textContent = c.label;
        }
    }
}

function syncStateAndRender() {
    if (state.funcId !== 'custom') return;
    state.params = state.params || {};
    for (const ctrl of customSignalState.extraControls) {
        if (state.params[ctrl.id] === undefined) state.params[ctrl.id] = ctrl.value;
    }
    renderExtraControls(state, () => notify());
    customSignalState.cacheKey = ''; // force cache rebuild on next render
    notify();
}

function insertAtCursor(text) {
    if (!inputEl) return;
    const s = inputEl.value;
    const start = inputEl.selectionStart ?? s.length;
    const end   = inputEl.selectionEnd   ?? s.length;
    inputEl.value = s.slice(0, start) + text + s.slice(end);
    const caret = start + text.length;
    inputEl.selectionStart = inputEl.selectionEnd = caret;
    inputEl.focus();
    applyEquation();
}

function astToKatexInline(ast) {
    return ast ? astToKatex(ast) : '?';
}

// ─── Drag ─────────────────────────────────────────────────────────
function makeDraggable(el, handle) {
    let dragging = false, dx = 0, dy = 0;
    handle.style.cursor = 'grab';
    handle.addEventListener('mousedown', e => {
        if (e.target.closest('button, input, select')) return;
        dragging = true;
        const r = el.getBoundingClientRect();
        dx = e.clientX - r.left; dy = e.clientY - r.top;
        handle.style.cursor = 'grabbing'; e.preventDefault();
    });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const x = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, e.clientX - dx));
        const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - dy));
        el.style.left = x + 'px'; el.style.top = y + 'px'; el.style.right = 'auto';
    });
    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        handle.style.cursor = 'grab';
        try {
            const r = el.getBoundingClientRect();
            localStorage.setItem(STORAGE_POS, JSON.stringify({ x: r.left, y: r.top }));
        } catch {}
    });
}

// ─── Public API ────────────────────────────────────────────────────
export function showEquationPanel() {
    ensurePanel();
    panel.classList.add('visible');
    setTimeout(() => inputEl?.focus(), 0);
}
export function hideEquationPanel() {
    if (!panel) return;
    panel.classList.remove('visible');
}
export function refreshEquationPreview() {
    if (!inputEl) return;
    applyEquation();
}
function hide() { hideEquationPanel(); }

// ─── Helpers ──────────────────────────────────────────────────────
function escapeHtml(s) {
    return String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
}
