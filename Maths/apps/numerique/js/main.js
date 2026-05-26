// Digital Lab — truth table is the shared input; Karnaugh and VHDL tabs derive
// from the same `outputs` array.
import { renderKmap } from './modules/karnaugh.js';
import { generateVhdl } from './modules/vhdl.js';

const selectVar = document.getElementById('var-count');
const thead = document.getElementById('tt-head');
const tbody = document.getElementById('tt-body');
const eqOut = document.getElementById('equation-out');

const state = { nVars: 3, outputs: [] };

function varNames() { return ['A', 'B', 'C', 'D'].slice(0, state.nVars); }

function ensureOutputs() {
    const rows = 1 << state.nVars;
    if (state.outputs.length !== rows) state.outputs = new Array(rows).fill(0);
}

// ─── Truth table ───────────────────────────────────────────────────
function renderTruthTable() {
    state.nVars = parseInt(selectVar.value);
    ensureOutputs();
    const vars = varNames();
    const rows = 1 << state.nVars;

    thead.innerHTML = `<tr>${vars.map(v => `<th>${v}</th>`).join('')}<th style="color:var(--accent-green)">S</th></tr>`;
    let html = '';
    for (let i = 0; i < rows; i++) {
        let cells = '';
        for (let j = state.nVars - 1; j >= 0; j--) cells += `<td>${(i >> j) & 1}</td>`;
        const s = state.outputs[i];
        cells += `<td><button class="out-btn ${s ? 'on' : ''}" data-row="${i}">${s}</button></td>`;
        html += `<tr>${cells}</tr>`;
    }
    tbody.innerHTML = html;
    tbody.querySelectorAll('.out-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const r = +e.target.getAttribute('data-row');
            state.outputs[r] = state.outputs[r] ? 0 : 1;
            renderTruthTable();
            refreshDerived();
        });
    });
    renderCanonical();
}

function renderCanonical() {
    const vars = varNames();
    const minterms = [];
    state.outputs.forEach((v, i) => { if (v === 1) minterms.push(i); });
    let latex = 'S = 0';
    if (minterms.length === state.outputs.length) latex = 'S = 1';
    else if (minterms.length > 0) {
        latex = 'S = ' + minterms.map(i => {
            let term = '';
            for (let j = state.nVars - 1; j >= 0; j--) {
                const bit = (i >> j) & 1;
                const v = vars[state.nVars - 1 - j];
                term += bit ? v : `\\overline{${v}}`;
            }
            return term;
        }).join(' + ');
    }
    if (window.katex) katex.render(latex, eqOut, { displayMode: true, throwOnError: false });
    else eqOut.textContent = latex;
}

// ─── Derived views (re-rendered when active) ───────────────────────
function refreshDerived() {
    if (document.getElementById('mod-karnaugh').classList.contains('active')) {
        renderKmap(document.getElementById('kmap-host'), document.getElementById('kmap-eq'),
                   state.outputs, state.nVars, varNames());
    }
    if (document.getElementById('mod-vhdl').classList.contains('active')) {
        document.getElementById('vhdl-out').textContent =
            generateVhdl(state.outputs, state.nVars, varNames());
    }
}

// ─── Tabs ──────────────────────────────────────────────────────────
function activate(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.module').forEach(m => m.classList.toggle('active', m.id === 'mod-' + tab));
    refreshDerived();
}
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => activate(t.dataset.tab)));

document.getElementById('vhdl-copy').addEventListener('click', () => {
    navigator.clipboard?.writeText(document.getElementById('vhdl-out').textContent);
});

selectVar.addEventListener('change', () => { state.outputs = []; renderTruthTable(); refreshDerived(); });

// Boot (wait for katex so canonical eq renders).
function boot() { renderTruthTable(); }
if (window.katex) boot();
else { const w = setInterval(() => { if (window.katex) { clearInterval(w); boot(); } }, 80); setTimeout(() => { clearInterval(w); boot(); }, 2000); }
