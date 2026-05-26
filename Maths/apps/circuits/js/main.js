// Circuits Interactifs — tab router. Each module is initialised lazily the
// first time its tab is shown (Plotly needs a visible container to size right).
import { initRlc } from './modules/rlc.js';
import { initKirchhoff } from './modules/kirchhoff.js';
import { initThevenin } from './modules/thevenin.js';

const INIT = { rlc: initRlc, kirchhoff: initKirchhoff, thevenin: initThevenin };
const started = new Set();

function activate(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.module').forEach(m => m.classList.toggle('active', m.id === 'mod-' + tab));

    if (!started.has(tab)) {
        started.add(tab);
        // wait for katex (Kirchhoff uses it) then init
        const run = () => { try { INIT[tab](); } catch (e) { console.error(`[circuits:${tab}]`, e); } };
        if (tab === 'kirchhoff' && !window.katex) {
            const w = setInterval(() => { if (window.katex) { clearInterval(w); run(); } }, 80);
            setTimeout(() => { clearInterval(w); run(); }, 2000); // fallback
        } else { run(); }
    } else {
        // module already built — nudge Plotly to resize to the now-visible container
        window.dispatchEvent(new Event('resize'));
    }
}

document.querySelectorAll('.tab').forEach(t =>
    t.addEventListener('click', () => activate(t.dataset.tab)));

// boot the default (RLC) tab
activate('rlc');
