// Robotique — tab router. Each module is initialised lazily the first time its
// tab is shown (Plotly needs a visible container to size right; renderPlot also
// re-fits on tab-show). Rotation/homogeneous tabs render LaTeX via KaTeX.
import { initArm2R } from './modules/arm2r.js';
import { initRotation } from './modules/rotation.js';
import { initHomogeneous } from './modules/homogeneous.js';

const INIT = { arm2r: initArm2R, rotation: initRotation, homogeneous: initHomogeneous };
const NEEDS_KATEX = new Set(['rotation', 'homogeneous']);
const started = new Set();

function activate(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.module').forEach(m => m.classList.toggle('active', m.id === 'mod-' + tab));

    if (!started.has(tab)) {
        started.add(tab);
        const run = () => { try { INIT[tab](); } catch (e) { console.error(`[robotique:${tab}]`, e); } };
        if (NEEDS_KATEX.has(tab) && !window.katex) {
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

// boot the default (2R arm) tab
activate('arm2r');
