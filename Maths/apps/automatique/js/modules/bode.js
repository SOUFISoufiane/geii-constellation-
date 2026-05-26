// Bode plot + stability margins for open loop
//   G(jω) = K / ( jω · (1 + jω/ω₁) · (1 + jω/ω₂) )
// Phase margin  = 180° + phase at gain-crossover (|G|=1)
// Gain margin   = −20·log10|G| at phase-crossover (phase=−180°)
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';

export function initBode() {
    const ids = ['k','w1','w2'];
    const els = {};
    ids.forEach(k => { els[k]=document.getElementById('b-'+k); els['v'+k]=document.getElementById('val-b-'+k); });
    const readout = document.getElementById('b-readout');

    function response(w, K, w1, w2) {
        // magnitude (dB) and phase (deg)
        const mag = K / (w * Math.sqrt(1+(w/w1)**2) * Math.sqrt(1+(w/w2)**2));
        const phase = -90 - Math.atan(w/w1)*180/Math.PI - Math.atan(w/w2)*180/Math.PI;
        return { magDb: 20*Math.log10(mag), phaseDeg: phase, magLin: mag };
    }

    function update() {
        const K=+els.k.value, w1=+els.w1.value, w2=+els.w2.value;
        ids.forEach(k => els['v'+k].textContent = els[k].value);

        const W=[], magDb=[], phase=[];
        const decades = 4; const start = -2; // 1e-2 .. 1e2
        let gcW=null, gcPhase=null, pcW=null, pcMag=null;
        let prev=null;
        for (let i=0; i<=600; i++) {
            const w = Math.pow(10, start + decades*i/600);
            const r = response(w, K, w1, w2);
            W.push(w); magDb.push(r.magDb); phase.push(r.phaseDeg);
            if (prev) {
                // gain crossover: magDb crosses 0
                if ((prev.magDb>=0) !== (r.magDb>=0) && gcW===null) { gcW=w; gcPhase=r.phaseDeg; }
                // phase crossover: phase crosses -180
                if ((prev.phaseDeg>=-180) !== (r.phaseDeg>=-180) && pcW===null) { pcW=w; pcMag=r.magDb; }
            }
            prev = r;
        }
        const pm = gcPhase!==null ? (180 + gcPhase) : null;
        const gm = pcMag!==null ? (-pcMag) : null;
        const stable = (pm!==null && pm>0) && (gm===null || gm>0);

        readout.innerHTML = `
            <div style="color:${stable?'var(--accent-green)':'var(--accent-red)'}">${stable?'STABLE ✓':'INSTABLE / limite ✗'}</div>
            <div style="color:var(--accent-gold)">Marge de phase ≈ ${pm!==null?pm.toFixed(1)+'°':'—'}</div>
            <div style="color:var(--accent-cyan)">Marge de gain ≈ ${gm!==null?gm.toFixed(1)+' dB':'∞'}</div>
            <div style="color:var(--text-dim)">ω_co(gain) ≈ ${gcW?gcW.toFixed(2):'—'} rad/s</div>`;

        const shapes = [{ type:'line', xref:'x', yref:'y', x0:W[0], x1:W[W.length-1], y0:0, y1:0,
                          line:{color:PALETTE.textDim, width:1, dash:'dot'} }];
        const layout = baseLayout({
            title:{ text:'Diagramme de Bode (boucle ouverte)', font:{color:PALETTE.textMid} },
            grid:{ rows:2, columns:1, pattern:'independent', roworder:'top to bottom' },
            xaxis:{ type:'log', title:'ω (rad/s)', gridcolor:PALETTE.bgGrid },
            yaxis:{ title:'Gain (dB)', gridcolor:PALETTE.bgGrid },
            xaxis2:{ type:'log', title:'ω (rad/s)', gridcolor:PALETTE.bgGrid },
            yaxis2:{ title:'Phase (°)', gridcolor:PALETTE.bgGrid },
            shapes, showlegend:false, margin:{t:36,b:40,l:50,r:16}
        });
        const traces = [
            { x:W, y:magDb, xaxis:'x', yaxis:'y', type:'scatter', mode:'lines', line:{color:PALETTE.gold,width:2}, name:'|G| dB' },
            { x:W, y:phase, xaxis:'x2', yaxis:'y2', type:'scatter', mode:'lines', line:{color:PALETTE.cyan,width:2}, name:'∠G' }
        ];
        if (gcW) traces.push({ x:[gcW], y:[0], xaxis:'x', yaxis:'y', mode:'markers', marker:{size:10,color:PALETTE.red,symbol:'circle'}, name:'ω_co' });
        Plotly.react('plot-bode', traces, layout, { displayModeBar:false, responsive:true });
    }

    ids.forEach(k => els[k].addEventListener('input', update));
    update();
}
