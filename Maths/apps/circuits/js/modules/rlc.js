// RLC series — step response of Vc(t) to a 10 V step.
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';

export function initRlc() {
    const els = {
        r: document.getElementById('slider-r'), l: document.getElementById('slider-l'), c: document.getElementById('slider-c'),
        vr: document.getElementById('val-r'), vl: document.getElementById('val-l'), vc: document.getElementById('val-c'),
        w0: document.getElementById('calc-w0'), zeta: document.getElementById('calc-zeta'), regime: document.getElementById('calc-regime')
    };

    function update() {
        const R = parseFloat(els.r.value);
        const L = parseFloat(els.l.value) * 1e-3;   // H
        const C = parseFloat(els.c.value) * 1e-6;   // F
        const E = 10;

        els.vr.textContent = R; els.vl.textContent = els.l.value; els.vc.textContent = els.c.value;

        const w0 = 1 / Math.sqrt(L * C);
        const zeta = (R / 2) * Math.sqrt(C / L);
        els.w0.textContent = w0.toFixed(1);
        els.zeta.textContent = zeta.toFixed(3);
        els.regime.textContent = zeta > 1 ? 'Apériodique (suramorti)'
            : Math.abs(zeta - 1) < 1e-9 ? 'Critique' : 'Pseudo-périodique (sous-amorti)';

        const t = [], vC = [];
        const tMax = Math.max(0.05, 5 / (w0 * Math.max(0.1, zeta)));
        const dt = tMax / 500;
        for (let time = 0; time <= tMax; time += dt) {
            t.push(time * 1000);
            let v;
            if (zeta > 1) {
                const s1 = -w0 * (zeta - Math.sqrt(zeta*zeta - 1));
                const s2 = -w0 * (zeta + Math.sqrt(zeta*zeta - 1));
                const A1 = E / (s1 - s2) * s2, A2 = -E / (s1 - s2) * s1;
                v = E + A1 * Math.exp(s1 * time) + A2 * Math.exp(s2 * time);
            } else if (Math.abs(zeta - 1) < 1e-9) {
                v = E + (-E - E * w0 * time) * Math.exp(-w0 * time);
            } else {
                const wd = w0 * Math.sqrt(1 - zeta*zeta);
                v = E + Math.exp(-zeta * w0 * time) * (-E * Math.cos(wd * time) - E * zeta * w0 / wd * Math.sin(wd * time));
            }
            vC.push(v);
        }

        const trace = { x: t, y: vC, type: 'scatter', mode: 'lines', line: { color: PALETTE.red, width: 3 }, name: 'Vc(t)' };
        const layout = baseLayout({
            title: { text: 'Tension aux bornes du condensateur Vc(t)', font: { color: PALETTE.textMid } },
            xaxis: { title: 'Temps (ms)', gridcolor: PALETTE.bgGrid },
            yaxis: { title: 'Tension (V)', gridcolor: PALETTE.bgGrid }
        });
        renderPlot('plot-rlc', [trace], layout, { displayModeBar: false });
    }

    [els.r, els.l, els.c].forEach(s => s.addEventListener('input', update));
    update();
}
