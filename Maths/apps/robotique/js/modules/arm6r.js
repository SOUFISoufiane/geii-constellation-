// 6-axis serial robot (Stäubli TX-style) — forward kinematics + singularity check.
//
// DH table (simplified TX-60-like geometry, lengths in arbitrary units):
//   i | θ        d     a     α
//   1 | q1       d1    0    -90°
//   2 | q2-90°   0     a2    0
//   3 | q3       0     0    -90°       (elbow)
//   4 | q4       d4    0    +90°       \
//   5 | q5       0     0    -90°        } spherical wrist (axes 4,5,6 meet)
//   6 | q6       d6    0     0         /
//
// Singularities shown:
//   • Wrist  : q5 ≈ 0 or ±180°  → axes 4 and 6 align, lose one DOF.
//   • Elbow  : q3 ≈ 0 or ±180°  → arm fully extended/folded, wrist on a boundary.
//   • Shoulder: wrist centre crosses axis-1 line (x≈0,y≈0).
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';
import { DEG, dhTransform, matmul4, I4, originOf, frameTriad, linkTrace, pointTrace } from './robokit.js';

const D1 = 1.0, A2 = 1.2, D4 = 1.0, D6 = 0.4;

// DH rows as a function of joint angles (radians).
function dhRows(q) {
    return [
        [q[0],            D1, 0,  -90*DEG],
        [q[1] - 90*DEG,   0,  A2,   0    ],
        [q[2],            0,  0,  -90*DEG],
        [q[3],            D4, 0,  +90*DEG],
        [q[4],            0,  0,  -90*DEG],
        [q[5],            D6, 0,   0     ]
    ];
}

// Forward kinematics → list of frame transforms [base, T1, T01..T06].
function fkFrames(q) {
    const rows = dhRows(q);
    const frames = [I4()];
    let T = I4();
    for (const [th,d,a,al] of rows) { T = matmul4(T, dhTransform(th,d,a,al)); frames.push(T); }
    return frames; // frames[0]=base ... frames[6]=tool
}

export function initArm6R() {
    const el = id => document.getElementById(id);
    const sliders = [0,1,2,3,4,5].map(i => el(`q${i+1}`));
    const vals = [0,1,2,3,4,5].map(i => el(`val-q${i+1}`));
    const readout = el('arm6-readout');

    function update() {
        const q = sliders.map(s => +s.value * DEG);
        vals.forEach((v,i) => v.textContent = sliders[i].value);

        const frames = fkFrames(q);
        const pts = frames.map(originOf);          // joint centres (base→tool)
        const tool = frames[6];
        const toolPos = originOf(tool);

        // ── Singularity tests ───────────────────────────────────────
        const q3 = +sliders[2].value, q5 = +sliders[4].value;
        const near = (a, target, tol=6) => Math.abs(((a - target) % 360 + 540) % 360 - 180) < tol;
        const wristSing = near(q5, 0) || near(q5, 180) || near(q5, -180);
        const elbowSing = near(q3, 0) || near(q3, 180) || near(q3, -180);
        const wristCentre = originOf(frames[5]);    // axes 4-6 intersection (approx)
        const shoulderSing = Math.hypot(wristCentre[0], wristCentre[1]) < 0.12;
        const anySing = wristSing || elbowSing || shoulderSing;

        // ── Traces ──────────────────────────────────────────────────
        const armColor = anySing ? PALETTE.red : PALETTE.cyan;
        const traces = [
            linkTrace(pts, armColor, 'Bras 6R', 9),
            // joint markers
            { type:'scatter3d', mode:'markers',
              x: pts.slice(0,6).map(p=>p[0]), y: pts.slice(0,6).map(p=>p[1]), z: pts.slice(0,6).map(p=>p[2]),
              marker:{ size:6, color: PALETTE.gold }, name:'Articulations', showlegend:true, hoverinfo:'skip' },
            // tool frame triad
            ...frameTriad(tool, 0.4, { label:'Repère outil' }),
            pointTrace(toolPos, armColor, 'Effecteur', 'square', 7)
        ];

        const reach = D1 + A2 + D4 + D6;
        const layout = baseLayout({
            title:{ text:'Bras 6 axes (DH)', font:{color:PALETTE.textMid} },
            showlegend:true, legend:{orientation:'h', y:1.05, font:{size:9}}, margin:{t:30,b:0,l:0,r:0},
            scene:{
                xaxis:{title:'x', range:[-reach,reach], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                yaxis:{title:'y', range:[-reach,reach], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                zaxis:{title:'z', range:[0,reach*1.4], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                aspectmode:'cube', camera:{ eye:{x:1.6,y:1.6,z:1.0} }
            }
        });
        renderPlot('plot-arm6', traces, layout, { displayModeBar:false });

        const f = v => v.toFixed(3);
        const singMsgs = [
            wristSing ? 'poignet (q5≈0/180° : axes 4 et 6 alignés)' : null,
            elbowSing ? 'coude (q3≈0/180° : bras tendu/replié)' : null,
            shoulderSing ? 'épaule (centre poignet sur l\'axe 1)' : null
        ].filter(Boolean);
        readout.innerHTML = `
            <div style="color:var(--accent-cyan)">Effecteur : (${f(toolPos[0])}, ${f(toolPos[1])}, ${f(toolPos[2])})</div>
            ${anySing
                ? `<div style="color:var(--accent-red)">⚠ Singularité : ${singMsgs.join(' ; ')}</div>
                   <div style="color:var(--text-dim)">En singularité, movel peut bloquer (perte d'un DDL).</div>`
                : `<div style="color:var(--accent-green)">Configuration régulière ✓ (6 DDL disponibles)</div>`}`;
    }

    sliders.forEach(s => s.addEventListener('input', update));
    update();
}
