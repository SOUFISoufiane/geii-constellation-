// 2nd-order linear ODE  a·y'' + b·y' + c·y = f(t)  solved with classic RK4.
// State form: x1=y, x2=y'.  x1'=x2 ; x2' = (f(t) − b·x2 − c·x1)/a.
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';

export function initOde() {
    const ids = ['a','b','c','y0','v0'];
    const els = {};
    ids.forEach(k => { els[k] = document.getElementById('ode-' + k); els['v'+k] = document.getElementById('val-ode-' + k); });
    const force = document.getElementById('ode-force');
    const info = document.getElementById('ode-info');

    function update() {
        const a=+els.a.value, b=+els.b.value, c=+els.c.value, y0=+els.y0.value, v0=+els.v0.value;
        ids.forEach(k => els['v'+k].textContent = els[k].value);

        let fFn;
        try { fFn = new Function('t', `return ${force.value};`); } catch { fFn = () => 0; }

        const deriv = (t, x1, x2) => [x2, (fFn(t) - b*x2 - c*x1) / a];

        const dt = 0.01, tMax = 20;
        const T=[], Y=[];
        let x1 = y0, x2 = v0;
        for (let t = 0; t <= tMax; t += dt) {
            T.push(t); Y.push(x1);
            const k1 = deriv(t, x1, x2);
            const k2 = deriv(t + dt/2, x1 + dt/2*k1[0], x2 + dt/2*k1[1]);
            const k3 = deriv(t + dt/2, x1 + dt/2*k2[0], x2 + dt/2*k2[1]);
            const k4 = deriv(t + dt,   x1 + dt*k3[0],   x2 + dt*k3[1]);
            x1 += dt/6 * (k1[0] + 2*k2[0] + 2*k3[0] + k4[0]);
            x2 += dt/6 * (k1[1] + 2*k2[1] + 2*k3[1] + k4[1]);
        }

        // Characteristic analysis: a·r² + b·r + c = 0
        const disc = b*b - 4*a*c;
        let regime;
        if (c === 0) regime = 'Intégrateur (c=0)';
        else if (disc > 1e-9) regime = 'Apériodique (2 racines réelles)';
        else if (disc < -1e-9) regime = 'Oscillant amorti (racines complexes)';
        else regime = 'Amortissement critique';
        info.innerHTML = `Δ = b²−4ac = ${disc.toFixed(2)}<br><span style="color:var(--accent-gold)">${regime}</span>`;

        const layout = baseLayout({
            title: { text: 'Solution y(t)', font: { color: PALETTE.textMid } },
            xaxis: { title: 'Temps t', gridcolor: PALETTE.bgGrid },
            yaxis: { title: 'y(t)', gridcolor: PALETTE.bgGrid }
        });
        renderPlot('plot-ode', [{ x: T, y: Y, type: 'scatter', mode: 'lines', line: { color: PALETTE.purple, width: 2.5 }, name: 'y(t)' }],
            layout, { displayModeBar: false });
    }

    ids.forEach(k => els[k].addEventListener('input', update));
    force.addEventListener('change', update);
    update();
}
