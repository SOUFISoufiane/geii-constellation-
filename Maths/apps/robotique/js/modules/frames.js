// Frames & points — the conceptual core of the Stäubli TP (§IV-VII):
//   • World frame + a user-defined REF frame (position + orientation).
//   • A point taught in REF coordinates → its World coordinates (ᵂp = T·ᴿp).
//   • An approach point above it along REF-z (the TP "appro" / offset idea):
//       p_appro = p + offset along the REF z-axis.
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';
import { DEG, transform, I4, originOf, axisDir, frameTriad, pointTrace, linkTrace } from './robokit.js';

// Apply a 4×4 transform to a 3-point.
const applyT = (T, p) => [
    T[0][0]*p[0]+T[0][1]*p[1]+T[0][2]*p[2]+T[0][3],
    T[1][0]*p[0]+T[1][1]*p[1]+T[1][2]*p[2]+T[1][3],
    T[2][0]*p[0]+T[2][1]*p[1]+T[2][2]*p[2]+T[2][3]
];

export function initFrames() {
    const el = id => document.getElementById(id);
    const els = {
        rx: el('fr-rx'), ry: el('fr-ry'), rz: el('fr-rz'),
        vrx: el('val-fr-rx'), vry: el('val-fr-ry'), vrz: el('val-fr-rz'),
        ang: el('fr-ang'), vang: el('val-fr-ang'), axis: null,
        px: el('fr-px'), py: el('fr-py'), pz: el('fr-pz'),
        off: el('fr-off'), voff: el('val-fr-off'),
        matrix: el('fr-matrix'), readout: el('fr-readout')
    };
    let axis = 'z';

    function update() {
        const rx=+els.rx.value, ry=+els.ry.value, rz=+els.rz.value, ang=+els.ang.value*DEG;
        els.vrx.textContent=rx; els.vry.textContent=ry; els.vrz.textContent=rz;
        els.vang.textContent=els.ang.value;
        const off = +els.off.value; els.voff.textContent = off;

        // REF frame transform: rotation about chosen axis by ang, translated to (rx,ry,rz).
        const T = transform(axis, ang, rx, ry, rz);

        // Point taught in REF coords.
        const pRef = [+els.px.value||0, +els.py.value||0, +els.pz.value||0];
        const pWorld = applyT(T, pRef);
        // Approach point: offset along REF z-axis, expressed in world.
        const pApproRef = [pRef[0], pRef[1], pRef[2] + off];
        const pApproWorld = applyT(T, pApproRef);

        const traces = [
            // World frame (faint, at origin)
            ...frameTriad(I4(), 0.6, { width:3, label:'World' }),
            // REF frame (bold, at its origin)
            ...frameTriad(T, 0.6, { width:6, label:'REF1' }),
            // line World-origin → REF-origin (shows the translation p)
            linkTrace([[0,0,0], originOf(T)], PALETTE.textDim, null, 2),
            // approach → point segment
            linkTrace([pApproWorld, pWorld], PALETTE.gold, 'Approche', 4),
            pointTrace(pWorld, PALETTE.cyan, 'Point P', 'circle', 7),
            pointTrace(pApproWorld, PALETTE.magenta, 'P approche', 'diamond', 6)
        ];

        const allX=[0,pWorld[0],pApproWorld[0],originOf(T)[0]];
        const allY=[0,pWorld[1],pApproWorld[1],originOf(T)[1]];
        const allZ=[0,pWorld[2],pApproWorld[2],originOf(T)[2]];
        const span = Math.max(2, ...[...allX,...allY,...allZ].map(Math.abs)) * 1.25;
        const layout = baseLayout({
            title:{ text:'Repères et points', font:{color:PALETTE.textMid} },
            showlegend:true, legend:{orientation:'h', y:1.05, font:{size:9}}, margin:{t:30,b:0,l:0,r:0},
            scene:{
                xaxis:{title:'x', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                yaxis:{title:'y', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                zaxis:{title:'z', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                aspectmode:'cube', camera:{ eye:{x:1.5,y:1.5,z:1.2} }
            }
        });
        renderPlot('plot-fr', traces, layout, { displayModeBar:false });

        const f = v => (Math.abs(v)<1e-9?0:Math.round(v*1000)/1000);
        els.readout.innerHTML = `
            <div style="color:var(--accent-cyan)">P (World) = (${f(pWorld[0])}, ${f(pWorld[1])}, ${f(pWorld[2])})</div>
            <div style="color:var(--text-mid)">P (REF1) = (${f(pRef[0])}, ${f(pRef[1])}, ${f(pRef[2])})</div>
            <div style="color:var(--accent-magenta)">P approche (World) = (${f(pApproWorld[0])}, ${f(pApproWorld[1])}, ${f(pApproWorld[2])})</div>
            <div style="color:var(--text-dim)">ᵂp = T·ᴿp ; approche = +${off} le long de l'axe z de REF1</div>`;
    }

    document.querySelectorAll('#fr-axis button').forEach(b => b.addEventListener('click', () => {
        axis = b.dataset.axis;
        document.querySelectorAll('#fr-axis button').forEach(x => x.classList.toggle('active', x===b));
        update();
    }));
    [els.rx,els.ry,els.rz,els.ang,els.px,els.py,els.pz,els.off].forEach(s => {
        s.addEventListener('input', update); s.addEventListener('change', update);
    });
    update();
}
