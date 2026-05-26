// Rotation matrices — elementary Rx(θ), Ry(θ), Rz(θ) and their composition.
// (TD2, §1.3 — exact forms from the sheet.)
//   Rx = [[1,0,0],[0,c,-s],[0,s,c]]
//   Ry = [[c,0,s],[0,1,0],[-s,0,c]]
//   Rz = [[c,-s,0],[s,c,0],[0,0,1]]
// A frame {e1,e2,e3} (the world identity columns) is rotated by R; we draw the
// original axes faint and the rotated axes bold so the action of R is visible.
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';

const DEG = Math.PI / 180;

function Rx(t){const c=Math.cos(t),s=Math.sin(t);return [[1,0,0],[0,c,-s],[0,s,c]];}
function Ry(t){const c=Math.cos(t),s=Math.sin(t);return [[c,0,s],[0,1,0],[-s,0,c]];}
function Rz(t){const c=Math.cos(t),s=Math.sin(t);return [[c,-s,0],[s,c,0],[0,0,1]];}
function elem(axis,t){return axis==='x'?Rx(t):axis==='y'?Ry(t):Rz(t);}

function matmul(A,B){
    const C=[[0,0,0],[0,0,0],[0,0,0]];
    for(let i=0;i<3;i++)for(let j=0;j<3;j++)for(let k=0;k<3;k++)C[i][j]+=A[i][k]*B[k][j];
    return C;
}
function det3(M){
    return M[0][0]*(M[1][1]*M[2][2]-M[1][2]*M[2][1])
         - M[0][1]*(M[1][0]*M[2][2]-M[1][2]*M[2][0])
         + M[0][2]*(M[1][0]*M[2][1]-M[1][1]*M[2][0]);
}
// column j of M = where basis vector e_j lands
const col = (M,j) => [M[0][j], M[1][j], M[2][j]];

function katexMatrix(M){
    const body = M.map(r => r.map(v => {
        const n = Math.abs(v) < 1e-9 ? 0 : v;
        return (Math.round(n*1000)/1000).toString();
    }).join(' & ')).join(' \\\\ ');
    return `R = \\begin{bmatrix} ${body} \\end{bmatrix}`;
}

export function initRotation() {
    const el = id => document.getElementById(id);
    const els = {
        aAng: el('rotA-ang'), bAng: el('rotB-ang'),
        vA: el('val-rotA'), vB: el('val-rotB'),
        matrix: el('rot-matrix'), readout: el('rot-readout')
    };
    let axisA = 'x', axisB = 'none';

    function axisTrace(vec, color, name, width){
        return { type:'scatter3d', mode:'lines', x:[0,vec[0]], y:[0,vec[1]], z:[0,vec[2]],
                 line:{color,width}, name, showlegend: !!name, hoverinfo:'skip' };
    }

    function update(){
        const tA = +els.aAng.value * DEG, tB = +els.bAng.value * DEG;
        els.vA.textContent = els.aAng.value; els.vB.textContent = els.bAng.value;

        const RA = elem(axisA, tA);
        const R = axisB === 'none' ? RA : matmul(RA, elem(axisB, tB));

        // Original (faint) and rotated (bold) frame axes.
        const orig = [
            axisTrace([1.2,0,0], PALETTE.textDim, null, 2),
            axisTrace([0,1.2,0], PALETTE.textDim, null, 2),
            axisTrace([0,0,1.2], PALETTE.textDim, 'Repère initial', 2)
        ];
        const rotated = [
            axisTrace(col(R,0).map(v=>v*1.2), PALETTE.red,  'x\' (rouge)', 7),
            axisTrace(col(R,1).map(v=>v*1.2), PALETTE.green,'y\' (vert)', 7),
            axisTrace(col(R,2).map(v=>v*1.2), PALETTE.blue, 'z\' (bleu)', 7)
        ];

        const layout = baseLayout({
            title:{ text:'Rotation d\'un repère', font:{color:PALETTE.textMid} },
            showlegend:true, legend:{orientation:'h', y:1.05, font:{size:9}}, margin:{t:30,b:0,l:0,r:0},
            scene:{
                xaxis:{title:'x', range:[-1.3,1.3], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                yaxis:{title:'y', range:[-1.3,1.3], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                zaxis:{title:'z', range:[-1.3,1.3], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                aspectmode:'cube',
                camera:{ eye:{x:1.4,y:1.4,z:1.1} }
            }
        });
        renderPlot('plot-rot', [...orig, ...rotated], layout, { displayModeBar:false });

        // KaTeX matrix + invariants.
        try { window.katex.render(katexMatrix(R), els.matrix, { throwOnError:false, displayMode:true }); }
        catch(e){ els.matrix.textContent = JSON.stringify(R); }
        const d = det3(R);
        els.readout.innerHTML = `
            <div style="color:var(--accent-cyan)">det(R) = ${d.toFixed(4)} ${Math.abs(d-1)<1e-6?'✓ (rotation propre)':''}</div>
            <div style="color:var(--text-mid)">Rᵀ = R⁻¹ (matrice orthogonale)</div>
            <div style="color:var(--text-dim)">${axisB==='none' ? `R = R${axisA}(${els.aAng.value}°)` : `R = R${axisA}(${els.aAng.value}°)·R${axisB}(${els.bAng.value}°)`}</div>`;
    }

    document.querySelectorAll('#rotA-axis button').forEach(b => b.addEventListener('click', () => {
        axisA = b.dataset.axis;
        document.querySelectorAll('#rotA-axis button').forEach(x => x.classList.toggle('active', x===b));
        update();
    }));
    document.querySelectorAll('#rotB-axis button').forEach(b => b.addEventListener('click', () => {
        axisB = b.dataset.axis;
        document.querySelectorAll('#rotB-axis button').forEach(x => x.classList.toggle('active', x===b));
        update();
    }));
    [els.aAng, els.bAng].forEach(s => s.addEventListener('input', update));
    update();
}
