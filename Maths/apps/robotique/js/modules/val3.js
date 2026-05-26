// VAL3 / trsf sandbox — the at-home geometry layer beneath VAL3.
//
// A robot point is a pose (x,y,z,rx,ry,rz) which the controller stores as a 4×4
// homogeneous transform. This tab lets you:
//   • see the pose ⇄ matrix bridge both ways (Stäubli/course convention),
//   • run the three pure-geometry VAL3 ops — appro / compose / setFrame —
//   • read the result as a pose to copy straight into the real simulator.
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';
import { poseToMatrix, matrixToPose, valCompose, valAppro, valSetFrame,
         originOf, frameTriad, pointTrace, linkTrace } from './robokit.js';

export function initVal3() {
    const el = id => document.getElementById(id);
    const num = id => +el(id).value || 0;
    const readout = el('v3-readout');
    const matrix = el('v3-matrix');
    const code = el('v3-code');
    let op = 'compose';

    // read the six pose fields of a named group ('base' or 'trsf')
    const pose = g => ({
        x:num(`v3-${g}-x`), y:num(`v3-${g}-y`), z:num(`v3-${g}-z`),
        rx:num(`v3-${g}-rx`), ry:num(`v3-${g}-ry`), rz:num(`v3-${g}-rz`)
    });
    // setFrame uses three xyz points instead
    const pt = g => [num(`v3-${g}-x`), num(`v3-${g}-y`), num(`v3-${g}-z`)];

    function katex4(T){
        const f = v => { const n=Math.abs(v)<1e-9?0:v; return (Math.round(n*1000)/1000).toString(); };
        const rows = [0,1,2,3].map(i => T[i].map(f).join(' & '));
        return `T = \\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
    }
    const fmtPose = p => `(${[p.x,p.y,p.z,p.rx,p.ry,p.rz].map(v=>Math.round(v*100)/100).join(', ')})`;

    function update() {
        // show/hide the right control groups for the active op
        el('v3-trsf-group').style.display = (op==='setframe') ? 'none' : '';
        el('v3-setframe-group').style.display = (op==='setframe') ? '' : 'none';
        document.querySelectorAll('#v3-base-title')[0].textContent =
            op==='compose' ? 'Repère / point de base' : op==='appro' ? 'Point appris' : 'Origine du repère';

        let result, baseT, traces = [], codeStr = '';
        const base = pose('base');
        baseT = poseToMatrix(base);

        if (op === 'compose' || op === 'appro') {
            const trsf = pose('trsf');
            result = (op==='compose') ? valCompose(base, trsf) : valAppro(base, trsf);
            const resT = poseToMatrix(result);
            const tArr = `{${[trsf.x,trsf.y,trsf.z,trsf.rx,trsf.ry,trsf.rz].join(',')}}`;
            codeStr = (op==='compose')
                ? `pResult = compose(pBase, fRef, ${tArr})`
                : `pResult = appro(pBase, ${tArr})`;
            traces = [
                ...frameTriad(baseT, 60, { width:4, label:'Base' }),
                ...frameTriad(resT, 60, { width:6, label:'Résultat' }),
                linkTrace([originOf(baseT), originOf(resT)], PALETTE.gold, 'Décalage', 3),
                pointTrace(originOf(resT), PALETTE.cyan, 'pResult', 'square', 7)
            ];
            matrix.parentElement.style.display = '';
            try { window.katex.render(katex4(resT), matrix, { throwOnError:false, displayMode:true }); }
            catch(e){ matrix.textContent='T'; }
        } else { // setframe
            const O = pt('base'), PA = pt('sfx'), PB = pt('sfy');
            result = valSetFrame(O, PA, PB);
            const resT = poseToMatrix(result);
            codeStr = `setFrame(pO, pAxeX, pAxeY, REF)`;
            traces = [
                ...frameTriad(resT, 80, { width:6, label:'REF construit' }),
                pointTrace(O,  PALETTE.gold,    'O (origine)', 'circle', 6),
                pointTrace(PA, PALETTE.red,     'PA (axe X)',  'diamond', 6),
                pointTrace(PB, PALETTE.green,   'PB (plan XY)','diamond', 6),
                linkTrace([O,PA], PALETTE.red, null, 2),
                linkTrace([O,PB], PALETTE.green, null, 2)
            ];
            try { window.katex.render(katex4(resT), matrix, { throwOnError:false, displayMode:true }); }
            catch(e){ matrix.textContent='T'; }
        }

        // auto-scale the 3D box around everything drawn
        const allPts = traces.flatMap(t => (t.x||[]).map((_,i)=>[t.x[i],t.y[i],t.z[i]]));
        const span = Math.max(100, ...allPts.flat().map(Math.abs)) * 1.2;
        const layout = baseLayout({
            title:{ text:`VAL3 : ${op}`, font:{color:PALETTE.textMid} },
            showlegend:true, legend:{orientation:'h', y:1.05, font:{size:9}}, margin:{t:30,b:0,l:0,r:0},
            scene:{
                xaxis:{title:'x (mm)', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                yaxis:{title:'y (mm)', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                zaxis:{title:'z (mm)', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                aspectmode:'cube', camera:{ eye:{x:1.5,y:1.5,z:1.2} }
            }
        });
        renderPlot('plot-v3', traces, layout, { displayModeBar:false });

        code.textContent = codeStr;
        readout.innerHTML = `
            <div style="color:var(--accent-cyan)">pResult = ${fmtPose(result)}</div>
            <div style="color:var(--text-mid)">(x,y,z en mm ; rx,ry,rz en ° — angles d'Euler Stäubli)</div>
            <div style="color:var(--text-dim)">À recopier tel quel dans le simulateur.</div>`;
    }

    document.querySelectorAll('#v3-op button').forEach(b => b.addEventListener('click', () => {
        op = b.dataset.op;
        document.querySelectorAll('#v3-op button').forEach(x => x.classList.toggle('active', x===b));
        update();
    }));
    document.querySelectorAll('#mod-val3 input').forEach(i => {
        i.addEventListener('input', update); i.addEventListener('change', update);
    });
    update();
}
