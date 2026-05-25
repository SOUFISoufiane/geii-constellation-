// RLC Step Response MVP
import { PALETTE, baseLayout } from '../signal-observatory/js/plots/plotly-config.js';

const els = {
    sliderR: document.getElementById('slider-r'),
    sliderL: document.getElementById('slider-l'),
    sliderC: document.getElementById('slider-c'),
    valR: document.getElementById('val-r'),
    valL: document.getElementById('val-l'),
    valC: document.getElementById('val-c'),
    w0: document.getElementById('calc-w0'),
    zeta: document.getElementById('calc-zeta'),
    regime: document.getElementById('calc-regime')
};

function update() {
    const R = parseFloat(els.sliderR.value);
    const L = parseFloat(els.sliderL.value) * 1e-3; // H
    const C = parseFloat(els.sliderC.value) * 1e-6; // F
    const E = 10; // 10V step

    els.valR.textContent = R;
    els.valL.textContent = els.sliderL.value;
    els.valC.textContent = els.sliderC.value;

    const w0 = 1 / Math.sqrt(L * C);
    const zeta = (R / 2) * Math.sqrt(C / L);

    els.w0.textContent = w0.toFixed(1);
    els.zeta.textContent = zeta.toFixed(3);

    let regimeText = "";
    if (zeta > 1) regimeText = "Aperiodic (Overdamped)";
    else if (zeta === 1) regimeText = "Critical (Critically Damped)";
    else regimeText = "Pseudo-periodic (Underdamped)";
    els.regime.textContent = regimeText;

    // Time array from 0 to 0.1s
    const t = [];
    const vC = [];
    const tMax = Math.max(0.05, 5 / (w0 * Math.max(0.1, zeta)));
    const dt = tMax / 500;

    for (let time = 0; time <= tMax; time += dt) {
        t.push(time * 1000); // ms
        let v = 0;
        if (zeta > 1) {
            const s1 = -w0 * (zeta - Math.sqrt(zeta*zeta - 1));
            const s2 = -w0 * (zeta + Math.sqrt(zeta*zeta - 1));
            const A1 = E / (s1 - s2) * s2;
            const A2 = -E / (s1 - s2) * s1;
            v = E + A1 * Math.exp(s1 * time) + A2 * Math.exp(s2 * time);
        } else if (zeta === 1) {
            const A1 = -E;
            const A2 = -E * w0;
            v = E + (A1 + A2 * time) * Math.exp(-w0 * time);
        } else {
            const wd = w0 * Math.sqrt(1 - zeta*zeta);
            const A = -E;
            const B = -E * zeta * w0 / wd;
            v = E + Math.exp(-zeta * w0 * time) * (A * Math.cos(wd * time) + B * Math.sin(wd * time));
        }
        vC.push(v);
    }

    const trace = {
        x: t, y: vC,
        type: 'scatter', mode: 'lines',
        line: { color: PALETTE.red, width: 3 },
        name: 'Vc(t)'
    };

    const layout = baseLayout({
        title: { text: "Tension aux bornes du Condensateur Vc(t)", font: { color: PALETTE.textMid } },
        xaxis: { title: "Temps (ms)", gridcolor: PALETTE.bgGrid },
        yaxis: { title: "Tension (V)", gridcolor: PALETTE.bgGrid }
    });

    Plotly.react('plot', [trace], layout, { displayModeBar: false });
}

[els.sliderR, els.sliderL, els.sliderC].forEach(s => s.addEventListener('input', update));

// Initial render
update();
