// 6-axis serial robot (Stäubli TX-style) — two control modes, like the pendant:
//   • JOINT (movej)     : jog each axis q1..q6 directly.
//   • CARTESIAN (movel) : command the tool pose (X/Y/Z + RX/RY/RZ); inverse
//                         kinematics solves the 6 joints so the arm follows.
//
// State is ALWAYS the 6 joint angles `q` (degrees). Joint mode writes q from
// sliders; cartesian mode reads the pose fields, runs ik6 seeded from the
// current q, writes the solution back to q and re-syncs the joint sliders so
// switching modes is seamless. Geometry (fk6/ik6) lives in robokit — one source
// of truth shared with the FK display, so IK can't disagree with what's drawn.
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';
import { DEG, ROBOT6, fk6, ik6, poseToMatrix, matrixToPose,
         originOf, frameTriad, linkTrace, pointTrace } from './robokit.js';

// FK/IK and DH now live in robokit.js (shared with the IK solver) so the drawn
// arm and the inverse-kinematics solution can never disagree.

export function initArm6R() {
    const el = id => document.getElementById(id);
    const jSliders = [0,1,2,3,4,5].map(i => el(`q${i+1}`));
    const jVals    = [0,1,2,3,4,5].map(i => el(`val-q${i+1}`));
    const cFields  = ['x','y','z','rx','ry','rz'].map(k => el(`c6-${k}`));
    const cVals    = ['x','y','z','rx','ry','rz'].map(k => el(`val-c6-${k}`));
    const readout  = el('arm6-readout');
    const reach = ROBOT6.d1 + ROBOT6.a2 + ROBOT6.d4 + ROBOT6.d6;

    let mode = 'joint';
    let q = jSliders.map(s => +s.value);          // joint state in DEGREES
    let lastErr = null;                            // last IK position error (for cartesian feedback)

    // ── draw the arm for a joint vector (degrees) ────────────────────
    function render() {
        const qr = q.map(v => v*DEG);
        const frames = fk6(qr);
        const pts = frames.map(originOf);
        const tool = frames[6];
        const toolPos = originOf(tool);
        const toolPose = matrixToPose(tool);       // (x,y,z,rx,ry,rz)

        // singularities (same tests as before, on the live q)
        const near = (a,t,tol=6) => Math.abs(((a-t)%360+540)%360-180) < tol;
        const wristSing = near(q[4],0)||near(q[4],180)||near(q[4],-180);
        const elbowSing = near(q[2],0)||near(q[2],180)||near(q[2],-180);
        const wc = originOf(frames[5]);
        const shoulderSing = Math.hypot(wc[0],wc[1]) < 0.12;
        const anySing = wristSing||elbowSing||shoulderSing;

        const armColor = anySing ? PALETTE.red : PALETTE.cyan;
        const traces = [
            linkTrace(pts, armColor, 'Bras 6R', 9),
            { type:'scatter3d', mode:'markers',
              x:pts.slice(0,6).map(p=>p[0]), y:pts.slice(0,6).map(p=>p[1]), z:pts.slice(0,6).map(p=>p[2]),
              marker:{ size:6, color:PALETTE.gold }, name:'Articulations', showlegend:true, hoverinfo:'skip' },
            ...frameTriad(tool, 0.4, { label:'Repère outil' }),
            pointTrace(toolPos, armColor, 'Effecteur', 'square', 7)
        ];
        const layout = baseLayout({
            title:{ text:`Bras 6 axes — ${mode==='joint'?'mode articulaire (movej)':'mode cartésien (movel)'}`, font:{color:PALETTE.textMid} },
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
            wristSing?'poignet (q5≈0/180°)':null,
            elbowSing?'coude (q3≈0/180°)':null,
            shoulderSing?'épaule (centre poignet sur axe 1)':null
        ].filter(Boolean);
        const ikWarn = (mode==='cartesian' && lastErr!=null && lastErr>5e-3)
            ? `<div style="color:var(--accent-red)">⚠ Pose hors d'atteinte — bras au plus près (erreur ${f(lastErr)}).</div>` : '';
        readout.innerHTML = `
            <div style="color:var(--accent-cyan)">Effecteur : (${f(toolPos[0])}, ${f(toolPos[1])}, ${f(toolPos[2])})</div>
            <div style="color:var(--text-mid)">Pose : rx=${toolPose.rx.toFixed(1)}° ry=${toolPose.ry.toFixed(1)}° rz=${toolPose.rz.toFixed(1)}°</div>
            ${ikWarn}
            ${anySing
                ? `<div style="color:var(--accent-red)">⚠ Singularité : ${singMsgs.join(' ; ')}</div>
                   <div style="color:var(--text-dim)">En singularité, movel peut bloquer (perte d'un DDL).</div>`
                : `<div style="color:var(--accent-green)">Configuration régulière ✓ (6 DDL)</div>`}`;
    }

    // keep the joint sliders showing the current q (after an IK solve)
    function syncJointSliders() {
        jSliders.forEach((s,i) => { s.value = Math.round(q[i]); jVals[i].textContent = s.value; });
    }
    // keep the cartesian fields showing the current tool pose (on entering cartesian mode)
    function syncCartesianFields() {
        const p = matrixToPose(fk6(q.map(v=>v*DEG))[6]);
        const vals = [p.x, p.y, p.z, p.rx, p.ry, p.rz];
        cFields.forEach((f,i) => { f.value = (Math.round(vals[i]*100)/100); cVals[i].textContent = f.value; });
    }

    // ── JOINT mode: sliders → q ──────────────────────────────────────
    function onJoint() {
        q = jSliders.map((s,i) => { jVals[i].textContent = s.value; return +s.value; });
        lastErr = null;
        render();
    }

    // ── CARTESIAN mode: pose fields → ik6 → q ────────────────────────
    function onCartesian() {
        const p = {};
        ['x','y','z','rx','ry','rz'].forEach((k,i) => { p[k] = +cFields[i].value||0; cVals[i].textContent = cFields[i].value; });
        const Ttarget = poseToMatrix(p);
        const sol = ik6(Ttarget, q.map(v=>v*DEG));   // seed from current joints
        lastErr = sol.posErr;
        q = sol.q.map(r => r/DEG);                    // store back in degrees
        syncJointSliders();                            // so JOINT mode stays in sync
        render();
    }

    // mode toggle
    document.querySelectorAll('#arm6-mode button').forEach(b => b.addEventListener('click', () => {
        mode = b.dataset.mode;
        document.querySelectorAll('#arm6-mode button').forEach(x => x.classList.toggle('active', x===b));
        el('arm6-joint').style.display = mode==='joint' ? '' : 'none';
        el('arm6-cart').style.display  = mode==='cartesian' ? '' : 'none';
        if (mode==='cartesian') syncCartesianFields();  // seed cartesian fields from current pose
        else syncJointSliders();
        render();
    }));

    jSliders.forEach(s => s.addEventListener('input', () => { if (mode==='joint') onJoint(); }));
    cFields.forEach(f => { const h=()=>{ if(mode==='cartesian') onCartesian(); }; f.addEventListener('input',h); f.addEventListener('change',h); });

    render();
}
