// Servo Lab MVP - Numerical integration of a PID loop
import { PALETTE, baseLayout } from '../signal-observatory/js/plots/plotly-config.js';

const els = {
    sliderK: document.getElementById('slider-k'),
    sliderW0: document.getElementById('slider-w0'),
    sliderZeta: document.getElementById('slider-zeta'),
    sliderKp: document.getElementById('slider-kp'),
    sliderKi: document.getElementById('slider-ki'),
    sliderKd: document.getElementById('slider-kd'),
    valK: document.getElementById('val-k'),
    valW0: document.getElementById('val-w0'),
    valZeta: document.getElementById('val-zeta'),
    valKp: document.getElementById('val-kp'),
    valKi: document.getElementById('val-ki'),
    valKd: document.getElementById('val-kd')
};

function update() {
    const K = parseFloat(els.sliderK.value);
    const w0 = parseFloat(els.sliderW0.value);
    const zeta = parseFloat(els.sliderZeta.value);
    
    const kp = parseFloat(els.sliderKp.value);
    const ki = parseFloat(els.sliderKi.value);
    const kd = parseFloat(els.sliderKd.value);

    els.valK.textContent = K; els.valW0.textContent = w0; els.valZeta.textContent = zeta;
    els.valKp.textContent = kp; els.valKi.textContent = ki; els.valKd.textContent = kd;

    // Simulation using Euler integration for a 2nd order plant + PID
    // Plant: y'' + 2*zeta*w0*y' + w0^2*y = K*w0^2 * u
    // u = kp*e + ki*integral(e) + kd*e'
    // e = setpoint - y
    
    const setpoint = 1.0;
    const dt = 0.01;
    const tMax = 15;
    
    const tArr = [];
    const yArr = [];
    const setpointArr = [];
    
    let y = 0, yDot = 0;
    let integralE = 0;
    let prevE = 1.0;
    
    for(let t = 0; t <= tMax; t += dt) {
        tArr.push(t);
        yArr.push(y);
        setpointArr.push(setpoint);
        
        const e = setpoint - y;
        integralE += e * dt;
        const eDot = (e - prevE) / dt;
        prevE = e;
        
        // PID output
        const u = kp * e + ki * integralE + kd * eDot;
        
        // Plant physics
        const yDDot = K * w0 * w0 * u - 2 * zeta * w0 * yDot - w0 * w0 * y;
        
        yDot += yDDot * dt;
        y += yDot * dt;
    }

    const layout = baseLayout({
        title: { text: "Réponse Indicielle en Boucle Fermée", font: { color: PALETTE.textMid } },
        xaxis: { title: "Temps (s)", gridcolor: PALETTE.bgGrid },
        yaxis: { title: "Sortie y(t)", gridcolor: PALETTE.bgGrid }
    });

    const traces = [
        { x: tArr, y: setpointArr, name: 'Consigne', type: 'scatter', line: { color: 'rgba(255,255,255,0.3)', dash: 'dash' } },
        { x: tArr, y: yArr, name: 'y(t)', type: 'scatter', line: { color: PALETTE.gold, width: 3 } }
    ];

    Plotly.react('plot', traces, layout, { displayModeBar: false });
}

Object.values(els).forEach(el => {
    if(el.tagName === 'INPUT') el.addEventListener('input', update);
});

// Initial render
update();
