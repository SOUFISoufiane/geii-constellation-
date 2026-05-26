// Servo Lab — tab router. Modules init lazily on first activation so Plotly
// sizes against a visible container.
import { initPid } from './modules/pid.js';
import { initRootLocus } from './modules/rootlocus.js';
import { initBode } from './modules/bode.js';

const INIT = { pid: initPid, rootlocus: initRootLocus, bode: initBode };
const started = new Set();

function activate(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.module').forEach(m => m.classList.toggle('active', m.id === 'mod-' + tab));
    if (!started.has(tab)) {
        started.add(tab);
        try { INIT[tab](); } catch (e) { console.error(`[automatique:${tab}]`, e); }
    } else {
        window.dispatchEvent(new Event('resize'));
    }
}

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => activate(t.dataset.tab)));
activate('pid');
