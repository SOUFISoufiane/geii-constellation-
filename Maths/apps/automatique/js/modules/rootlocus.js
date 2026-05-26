// Root locus for unity-feedback G(s)=K/((s+a)(s+b)(s+c)).
// Closed-loop char. poly: (s+a)(s+b)(s+c) + K = 0
//   = s³ + (a+b+c)s² + (ab+ac+bc)s + (abc + K)
// Roots found via Durand–Kerner (complex). Swept over K to draw the locus.
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';

// --- minimal complex helpers ---
const cx = (re, im=0) => ({ re, im });
const add = (p,q) => cx(p.re+q.re, p.im+q.im);
const sub = (p,q) => cx(p.re-q.re, p.im-q.im);
const mul = (p,q) => cx(p.re*q.re - p.im*q.im, p.re*q.im + p.im*q.re);
const div = (p,q) => { const d=q.re*q.re+q.im*q.im; return cx((p.re*q.re+p.im*q.im)/d, (p.im*q.re-p.re*q.im)/d); };

// Evaluate monic poly with given coeffs [1, c2, c1, c0] at complex x (Horner).
function evalPoly(coeffs, x) {
    let acc = cx(coeffs[0], 0);
    for (let i=1; i<coeffs.length; i++) acc = add(mul(acc, x), cx(coeffs[i], 0));
    return acc;
}

// Durand–Kerner for a degree-3 monic polynomial. coeffs=[1,c2,c1,c0].
function rootsCubic(coeffs) {
    let r = [cx(0.4,0.9), cx(-0.8,0), cx(0.4,-0.9)]; // distinct seeds
    for (let iter=0; iter<60; iter++) {
        let maxDelta = 0;
        const next = r.map((ri, i) => {
            let denom = cx(1,0);
            for (let j=0; j<r.length; j++) if (j!==i) denom = mul(denom, sub(ri, r[j]));
            const delta = div(evalPoly(coeffs, ri), denom);
            maxDelta = Math.max(maxDelta, Math.hypot(delta.re, delta.im));
            return sub(ri, delta);
        });
        r = next;
        if (maxDelta < 1e-9) break;
    }
    return r;
}

export function initRootLocus() {
    const ids = ['a','b','c','k'];
    const els = {};
    ids.forEach(k => { els[k]=document.getElementById('rl-'+k); els['v'+k]=document.getElementById('val-rl-'+k); });
    const readout = document.getElementById('rl-readout');

    function update() {
        const a=+els.a.value, b=+els.b.value, c=+els.c.value, Ksel=+els.k.value;
        ids.forEach(k => els['v'+k].textContent = els[k].value);

        const c2 = a+b+c, c1 = a*b + a*c + b*c, c0base = a*b*c;

        // Sweep K → collect root trajectories
        const reAll=[], imAll=[];
        const Kmax = 400;
        for (let i=0; i<=300; i++) {
            const K = Kmax * (i/300)**2; // denser near small K
            const roots = rootsCubic([1, c2, c1, c0base + K]);
            roots.forEach(rt => { reAll.push(rt.re); imAll.push(rt.im); });
        }

        // Open-loop poles (K=0) and chosen-K closed-loop poles
        const olRe=[-a,-b,-c], olIm=[0,0,0];
        const selRoots = rootsCubic([1, c2, c1, c0base + Ksel]);
        const selRe = selRoots.map(r=>r.re), selIm = selRoots.map(r=>r.im);
        const stable = selRoots.every(r => r.re < 0);
        const maxRe = Math.max(...selRe);

        readout.innerHTML = `
            <div style="color:${stable?'var(--accent-green)':'var(--accent-red)'}">${stable?'STABLE ✓':'INSTABLE ✗'} (K=${Ksel})</div>
            <div style="color:var(--text-mid)">Pôle le plus à droite : Re = ${maxRe.toFixed(3)}</div>
            <div style="color:var(--text-dim)">Pôles BF : ${selRoots.map(r=>`${r.re.toFixed(2)}${r.im>=0?'+':''}${r.im.toFixed(2)}j`).join(' , ')}</div>`;

        const layout = baseLayout({
            title: { text: 'Lieu des racines (plan s)', font: { color: PALETTE.textMid } },
            xaxis: { title: 'Re', gridcolor: PALETTE.bgGrid, zeroline:true, zerolinecolor: PALETTE.textDim },
            yaxis: { title: 'Im', gridcolor: PALETTE.bgGrid, zeroline:true, zerolinecolor: PALETTE.textDim, scaleanchor:'x' },
            showlegend: true, legend:{orientation:'h', y:1.12, font:{size:9}}, margin:{t:36,b:40,l:46,r:16}
        });
        renderPlot('plot-rl', [
            { x: reAll, y: imAll, mode:'markers', type:'scatter', name:'Locus', marker:{ size:3, color: PALETTE.cyan, opacity:0.5 } },
            { x: olRe, y: olIm, mode:'markers', type:'scatter', name:'Pôles BO (K=0)', marker:{ size:12, color: PALETTE.gold, symbol:'x', line:{width:2} } },
            { x: selRe, y: selIm, mode:'markers', type:'scatter', name:`Pôles BF (K=${Ksel})`, marker:{ size:11, color: stable?PALETTE.green:PALETTE.red, symbol:'circle' } }
        ], layout, { displayModeBar:false });
    }

    ids.forEach(k => els[k].addEventListener('input', update));
    update();
}
