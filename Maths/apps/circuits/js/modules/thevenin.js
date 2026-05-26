// Thévenin — source E with series R1 and shunt R2 seen from port A-B.
//   Vth = E · R2/(R1+R2)      (open-circuit voltage)
//   Rth = R1 ∥ R2             (source killed: R1 parallel R2)
//   Load line: I_load(R_load) = Vth / (Rth + R_load)
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';

export function initThevenin() {
    const els = {
        e: document.getElementById('t-e'), r1: document.getElementById('t-r1'), r2: document.getElementById('t-r2'),
        ve: document.getElementById('val-t-e'), vr1: document.getElementById('val-t-r1'), vr2: document.getElementById('val-t-r2'),
        readout: document.getElementById('t-readout'), svg: document.getElementById('t-svg')
    };

    function rawPalette() {
        const cs = getComputedStyle(document.body);
        const v = (n, f) => (cs.getPropertyValue(n).trim() || f);
        return { rim: v('--rim', '#2a2a55'), void: v('--void', '#05050f'),
                 gold: v('--accent-gold', '#ffd60a'), red: v('--accent-red', '#ff5c7a'),
                 green: v('--accent-green', '#00f5d4') };
    }

    function svg(Vth, Rth) {
        const A = rawPalette();
        return `
        <svg viewBox="0 0 360 160" width="100%" height="150" font-family="Space Mono, monospace" font-size="12">
          <text x="10" y="20" fill="${A.gold}">Équivalent de Thévenin</text>
          <!-- Vth source -->
          <circle cx="60" cy="90" r="18" fill="none" stroke="${A.gold}" stroke-width="2"/>
          <text x="60" y="95" text-anchor="middle" fill="${A.gold}">Vth</text>
          <line x1="60" y1="72" x2="60" y2="50"/>
          <line x1="60" y1="50" x2="150" y2="50" stroke="${A.rim}" stroke-width="1.5"/>
          <!-- Rth -->
          <rect x="150" y="42" width="60" height="16" fill="${A.void}" stroke="${A.red}" stroke-width="2"/>
          <text x="180" y="36" text-anchor="middle" fill="${A.red}">Rth</text>
          <line x1="210" y1="50" x2="300" y2="50" stroke="${A.rim}" stroke-width="1.5"/>
          <line x1="60" y1="108" x2="60" y2="130"/>
          <line x1="60" y1="130" x2="300" y2="130" stroke="${A.rim}" stroke-width="1.5"/>
          <!-- port terminals -->
          <circle cx="300" cy="50" r="4" fill="${A.green}"/><text x="308" y="54" fill="${A.green}">A</text>
          <circle cx="300" cy="130" r="4" fill="${A.green}"/><text x="308" y="134" fill="${A.green}">B</text>
          <text x="100" y="155" fill="${A.gold}">Vth=${Vth.toFixed(2)} V</text>
          <text x="210" y="155" fill="${A.red}">Rth=${Rth.toFixed(1)} Ω</text>
        </svg>`;
    }

    function update() {
        const E = +els.e.value, R1 = +els.r1.value, R2 = +els.r2.value;
        els.ve.textContent = E; els.vr1.textContent = R1; els.vr2.textContent = R2;

        const Vth = E * R2 / (R1 + R2);
        const Rth = (R1 * R2) / (R1 + R2);

        els.svg.innerHTML = svg(Vth, Rth);
        els.readout.innerHTML = `
            <div style="color:var(--accent-gold)">Vth = ${Vth.toFixed(3)} V</div>
            <div style="color:var(--accent-red)">Rth = ${Rth.toFixed(2)} Ω</div>
            <div style="color:var(--accent-green)">I_court-circuit = ${(Vth/Rth*1000).toFixed(2)} mA</div>`;

        // Load line: sweep R_load from 0 to ~5·Rth
        const rl = [], il = [], vl = [];
        const rMax = Math.max(10, Rth * 6);
        for (let i = 0; i <= 200; i++) {
            const R = rMax * i / 200;
            rl.push(R);
            const I = Vth / (Rth + R);
            il.push(I * 1000);          // mA
            vl.push(I * R);             // V across load
        }
        const layout = baseLayout({
            title: { text: 'Droite de charge — I et V_charge vs R_charge', font: { color: PALETTE.textMid } },
            xaxis: { title: 'R_charge (Ω)', gridcolor: PALETTE.bgGrid },
            yaxis: { title: 'I_charge (mA)', gridcolor: PALETTE.bgGrid },
            yaxis2: { title: 'V_charge (V)', overlaying: 'y', side: 'right', showgrid: false },
            showlegend: true, legend: { orientation: 'h', y: 1.15, font: { size: 9 } },
            margin: { t: 40, b: 40, l: 50, r: 50 }
        });
        Plotly.react('plot-thev', [
            { x: rl, y: il, type: 'scatter', mode: 'lines', name: 'I_charge (mA)', line: { color: PALETTE.red, width: 2 } },
            { x: rl, y: vl, type: 'scatter', mode: 'lines', name: 'V_charge (V)', yaxis: 'y2', line: { color: PALETTE.gold, width: 2, dash: 'dot' } }
        ], layout, { displayModeBar: false, responsive: true });
    }

    [els.e, els.r1, els.r2].forEach(s => s.addEventListener('input', update));
    update();
}
