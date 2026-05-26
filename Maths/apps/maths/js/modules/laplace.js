// Laplace transform — table lookup with step-by-step derivation + pole-zero map.
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';

// Each entry: given a, ω → { steps:[{lbl,tex}], poles:[{re,im}], zeros:[{re,im}] }
function transform(kind, a, w) {
    switch (kind) {
        case 'step': return {
            steps: [
                { lbl: 'Signal', tex: `f(t) = u(t)` },
                { lbl: 'Définition', tex: `F(s) = \\int_0^\\infty 1\\cdot e^{-st}\\,dt` },
                { lbl: 'Intégration', tex: `= \\left[-\\tfrac{1}{s}e^{-st}\\right]_0^\\infty = \\tfrac{1}{s}` },
                { lbl: 'Résultat', tex: `F(s) = \\dfrac{1}{s}` }
            ], poles: [{ re: 0, im: 0 }], zeros: [] };
        case 'ramp': return {
            steps: [
                { lbl: 'Signal', tex: `f(t) = t\\,u(t)` },
                { lbl: 'Propriété', tex: `\\mathcal{L}\\{t\\} = -\\dfrac{d}{ds}\\mathcal{L}\\{1\\} = -\\dfrac{d}{ds}\\dfrac1s` },
                { lbl: 'Résultat', tex: `F(s) = \\dfrac{1}{s^2}` }
            ], poles: [{ re: 0, im: 0 }, { re: 0, im: 0 }], zeros: [] };
        case 'exp': return {
            steps: [
                { lbl: 'Signal', tex: `f(t) = e^{-${a}t}u(t)` },
                { lbl: 'Définition', tex: `F(s) = \\int_0^\\infty e^{-${a}t}e^{-st}\\,dt = \\int_0^\\infty e^{-(s+${a})t}\\,dt` },
                { lbl: 'Intégration', tex: `= \\dfrac{1}{s+${a}}` },
                { lbl: 'Résultat', tex: `F(s) = \\dfrac{1}{s+${a}}` }
            ], poles: [{ re: -a, im: 0 }], zeros: [] };
        case 'sin': return {
            steps: [
                { lbl: 'Signal', tex: `f(t) = \\sin(${w}t)\\,u(t)` },
                { lbl: 'Table', tex: `\\mathcal{L}\\{\\sin(\\omega t)\\} = \\dfrac{\\omega}{s^2+\\omega^2}` },
                { lbl: 'Résultat', tex: `F(s) = \\dfrac{${w}}{s^2+${w*w}}` }
            ], poles: [{ re: 0, im: w }, { re: 0, im: -w }], zeros: [] };
        case 'cos': return {
            steps: [
                { lbl: 'Signal', tex: `f(t) = \\cos(${w}t)\\,u(t)` },
                { lbl: 'Table', tex: `\\mathcal{L}\\{\\cos(\\omega t)\\} = \\dfrac{s}{s^2+\\omega^2}` },
                { lbl: 'Résultat', tex: `F(s) = \\dfrac{s}{s^2+${w*w}}` }
            ], poles: [{ re: 0, im: w }, { re: 0, im: -w }], zeros: [{ re: 0, im: 0 }] };
        case 'expsin': return {
            steps: [
                { lbl: 'Signal', tex: `f(t) = e^{-${a}t}\\sin(${w}t)\\,u(t)` },
                { lbl: 'Décalage', tex: `\\mathcal{L}\\{e^{-at}g(t)\\} = G(s+a)` },
                { lbl: 'Application', tex: `F(s) = \\dfrac{${w}}{(s+${a})^2+${w*w}}` }
            ], poles: [{ re: -a, im: w }, { re: -a, im: -w }], zeros: [] };
        default: return { steps: [], poles: [], zeros: [] };
    }
}

export function initLaplace() {
    const fn = document.getElementById('lap-fn');
    const aEl = document.getElementById('lap-a'), wEl = document.getElementById('lap-w');
    const vA = document.getElementById('val-lap-a'), vW = document.getElementById('val-lap-w');
    const stepsHost = document.getElementById('lap-steps');

    function render() {
        const a = +aEl.value, w = +wEl.value;
        vA.textContent = a; vW.textContent = w;
        const r = transform(fn.value, a, w);

        stepsHost.innerHTML = r.steps.map((s, i) =>
            `<div class="step"><div class="lbl">${i+1}. ${s.lbl}</div><div id="lap-step-${i}"></div></div>`).join('');
        if (window.katex) r.steps.forEach((s, i) =>
            katex.render(s.tex, document.getElementById('lap-step-' + i), { displayMode: true, throwOnError: false }));
        else stepsHost.textContent = r.steps.map(s => s.tex).join('  |  ');

        const layout = baseLayout({
            title: { text: 'Carte pôles-zéros de F(s)', font: { color: PALETTE.textMid } },
            xaxis: { title: 'Re(s)', gridcolor: PALETTE.bgGrid, zeroline: true, zerolinecolor: PALETTE.textDim, range: [-6, 2] },
            yaxis: { title: 'Im(s)', gridcolor: PALETTE.bgGrid, zeroline: true, zerolinecolor: PALETTE.textDim, scaleanchor: 'x' },
            showlegend: true, legend: { orientation: 'h', y: 1.15, font: { size: 9 } }, margin: { t: 36, b: 40, l: 46, r: 16 }
        });
        const traces = [
            { x: r.poles.map(p=>p.re), y: r.poles.map(p=>p.im), mode: 'markers', type: 'scatter', name: 'Pôles',
              marker: { size: 13, color: PALETTE.red, symbol: 'x', line: { width: 3 } } }
        ];
        if (r.zeros.length) traces.push({ x: r.zeros.map(z=>z.re), y: r.zeros.map(z=>z.im), mode: 'markers', type: 'scatter',
              name: 'Zéros', marker: { size: 12, color: PALETTE.green, symbol: 'circle-open', line: { width: 2 } } });
        Plotly.react('plot-lap', traces, layout, { displayModeBar: false, responsive: true });
    }

    fn.addEventListener('change', render);
    [aEl, wEl].forEach(e => e.addEventListener('input', render));
    render();
}
