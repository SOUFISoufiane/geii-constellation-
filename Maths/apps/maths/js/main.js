// Math Visualizer — tab router. Modules init lazily on first activation.
import { initSurface } from './modules/surface.js';
import { initOde } from './modules/ode.js';
import { initLaplace } from './modules/laplace.js';

const INIT = { surface: initSurface, ode: initOde, laplace: initLaplace };
const started = new Set();

function activate(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
    document.querySelectorAll('.module').forEach(m => m.classList.toggle('active', m.id === 'mod-' + tab));
    if (!started.has(tab)) {
        started.add(tab);
        const run = () => { try { INIT[tab](); } catch (e) { console.error(`[maths:${tab}]`, e); } };
        // Laplace uses katex; wait for it.
        if (tab === 'laplace' && !window.katex) {
            const w = setInterval(() => { if (window.katex) { clearInterval(w); run(); } }, 80);
            setTimeout(() => { clearInterval(w); run(); }, 2000);
        } else { run(); }
    } else {
        window.dispatchEvent(new Event('resize'));
    }
}

document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => activate(t.dataset.tab)));
activate('surface');
