// PID control of a 2nd-order plant, simulated by Euler integration.
//   Plant:  y'' + 2ζω₀ y' + ω₀² y = K ω₀² u
//   u = Kp·e + Ki·∫e + Kd·ė ,  e = consigne − y
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';

export function initPid() {
    const ids = ['k','w0','zeta','kp','ki','kd'];
    const els = {};
    ids.forEach(k => { els[k] = document.getElementById('slider-' + k); els['v'+k] = document.getElementById('val-' + k); });
    const readout = document.getElementById('pid-readout');

    function update() {
        const K=+els.k.value, w0=+els.w0.value, zeta=+els.zeta.value, kp=+els.kp.value, ki=+els.ki.value, kd=+els.kd.value;
        ids.forEach(k => els['v'+k].textContent = els[k].value);

        const setpoint = 1.0, dt = 0.01, tMax = 15;
        const tArr=[], yArr=[], spArr=[];
        let y=0, yDot=0, integralE=0, prevE=setpoint;
        for (let t=0; t<=tMax; t+=dt) {
            tArr.push(t); yArr.push(y); spArr.push(setpoint);
            const e = setpoint - y;
            integralE += e * dt;
            const eDot = (e - prevE) / dt; prevE = e;
            const u = kp*e + ki*integralE + kd*eDot;
            const yDDot = K*w0*w0*u - 2*zeta*w0*yDot - w0*w0*y;
            yDot += yDDot * dt; y += yDot * dt;
        }

        // Performance metrics
        const yFinal = yArr[yArr.length-1];
        const peak = Math.max(...yArr);
        const overshoot = yFinal > 0 ? Math.max(0, (peak - setpoint) / setpoint * 100) : 0;
        // settling time: last time |y-sp| leaves the ±5% band
        let settle = tMax;
        for (let i = yArr.length-1; i >= 0; i--) { if (Math.abs(yArr[i]-setpoint) > 0.05) { settle = tArr[i]; break; } }
        const ess = Math.abs(setpoint - yFinal);

        readout.innerHTML = `
            <div style="color:var(--accent-gold)">Dépassement = ${overshoot.toFixed(1)} %</div>
            <div style="color:var(--accent-cyan)">Temps de réponse (±5%) ≈ ${settle.toFixed(2)} s</div>
            <div style="color:var(--accent-green)">Erreur statique ≈ ${ess.toFixed(3)}</div>`;

        const layout = baseLayout({
            title: { text: 'Réponse indicielle en boucle fermée', font: { color: PALETTE.textMid } },
            xaxis: { title: 'Temps (s)', gridcolor: PALETTE.bgGrid },
            yaxis: { title: 'Sortie y(t)', gridcolor: PALETTE.bgGrid },
            showlegend: true, legend: { orientation:'h', y:1.12, font:{size:9} }, margin:{t:36,b:40,l:46,r:16}
        });
        Plotly.react('plot-pid', [
            { x: tArr, y: spArr, name: 'Consigne', type:'scatter', line:{ color:'rgba(255,255,255,0.3)', dash:'dash' } },
            { x: tArr, y: yArr, name: 'y(t)', type:'scatter', line:{ color: PALETTE.gold, width:3 } }
        ], layout, { displayModeBar:false, responsive:true });
    }

    ids.forEach(k => els[k].addEventListener('input', update));
    update();
}
