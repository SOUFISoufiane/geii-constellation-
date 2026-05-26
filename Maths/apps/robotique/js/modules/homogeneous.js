// Homogeneous transforms — T = [ R | p ; 0 0 0 1 ]. (TD2, Ex. 5-8.)
// Apply T to a point q (in frame B) → its coords in frame A:  ᴬq = T · [qx qy qz 1]ᵀ
// Inverse of a homogeneous transform:  T⁻¹ = [ Rᵀ | −Rᵀp ; 0 0 0 1 ]
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';

const DEG = Math.PI / 180;

function Rx(t){const c=Math.cos(t),s=Math.sin(t);return [[1,0,0],[0,c,-s],[0,s,c]];}
function Ry(t){const c=Math.cos(t),s=Math.sin(t);return [[c,0,s],[0,1,0],[-s,0,c]];}
function Rz(t){const c=Math.cos(t),s=Math.sin(t);return [[c,-s,0],[s,c,0],[0,0,1]];}
function elem(axis,t){return axis==='x'?Rx(t):axis==='y'?Ry(t):Rz(t);}

const col = (M,j) => [M[0][j], M[1][j], M[2][j]];
// Apply rotation R to a 3-vector.
const rot = (R,v) => [R[0][0]*v[0]+R[0][1]*v[1]+R[0][2]*v[2],
                      R[1][0]*v[0]+R[1][1]*v[1]+R[1][2]*v[2],
                      R[2][0]*v[0]+R[2][1]*v[1]+R[2][2]*v[2]];
const transpose = M => [[M[0][0],M[1][0],M[2][0]],[M[0][1],M[1][1],M[2][1]],[M[0][2],M[1][2],M[2][2]]];

function num(v){ const n = Math.abs(v)<1e-9?0:v; return Math.round(n*1000)/1000; }

function katexT(R,p){
    const rows = [0,1,2].map(i => `${num(R[i][0])} & ${num(R[i][1])} & ${num(R[i][2])} & ${num(p[i])}`);
    rows.push('0 & 0 & 0 & 1');
    return `T = \\begin{bmatrix} ${rows.join(' \\\\ ')} \\end{bmatrix}`;
}

export function initHomogeneous() {
    const el = id => document.getElementById(id);
    const els = {
        ang: el('hom-ang'), vAng: el('val-hom-ang'),
        px: el('hom-px'), py: el('hom-py'), pz: el('hom-pz'),
        vpx: el('val-px'), vpy: el('val-py'), vpz: el('val-pz'),
        qx: el('hom-qx'), qy: el('hom-qy'), qz: el('hom-qz'),
        matrix: el('hom-matrix'), readout: el('hom-readout')
    };
    let axis = 'z';

    function axisTrace(origin, vec, color, name, width){
        return { type:'scatter3d', mode:'lines',
                 x:[origin[0], origin[0]+vec[0]], y:[origin[1], origin[1]+vec[1]], z:[origin[2], origin[2]+vec[2]],
                 line:{color,width}, name, showlegend: !!name, hoverinfo:'skip' };
    }
    function ptTrace(p, color, name, symbol){
        return { type:'scatter3d', mode:'markers', x:[p[0]], y:[p[1]], z:[p[2]],
                 marker:{size:6, color, symbol: symbol||'circle'}, name, showlegend:true,
                 hovertemplate:`(%{x:.2f}, %{y:.2f}, %{z:.2f})<extra></extra>` };
    }

    function update(){
        const t = +els.ang.value * DEG;
        els.vAng.textContent = els.ang.value;
        els.vpx.textContent = els.px.value; els.vpy.textContent = els.py.value; els.vpz.textContent = els.pz.value;
        const R = elem(axis, t);
        const p = [+els.px.value, +els.py.value, +els.pz.value];
        const q = [+els.qx.value || 0, +els.qy.value || 0, +els.qz.value || 0];

        // ᴬq = R·q + p
        const Aq = rot(R, q).map((v,i) => v + p[i]);
        // T⁻¹ : Rᵀ and −Rᵀp
        const RT = transpose(R);
        const pInv = rot(RT, p).map(v => -v);

        // World frame at origin (faint), transformed frame B at p (bold), point in both frames.
        const sc = 1.0;
        const world = [
            axisTrace([0,0,0],[sc,0,0], PALETTE.textDim, null, 2),
            axisTrace([0,0,0],[0,sc,0], PALETTE.textDim, null, 2),
            axisTrace([0,0,0],[0,0,sc], PALETTE.textDim, 'Repère A (monde)', 2)
        ];
        const frameB = [
            axisTrace(p, col(R,0).map(v=>v*sc), PALETTE.red,   'x_B', 6),
            axisTrace(p, col(R,1).map(v=>v*sc), PALETTE.green, 'y_B', 6),
            axisTrace(p, col(R,2).map(v=>v*sc), PALETTE.blue,  'z_B', 6)
        ];
        const points = [
            ptTrace(Aq, PALETTE.cyan, 'q vu dans A', 'circle'),
            ptTrace(p,  PALETTE.gold, 'origine de B', 'diamond')
        ];

        const allX=[0,p[0],Aq[0]], allY=[0,p[1],Aq[1]], allZ=[0,p[2],Aq[2]];
        const span = Math.max(2, ...[...allX,...allY,...allZ].map(Math.abs)) * 1.2;
        const layout = baseLayout({
            title:{ text:'Transformation homogène T', font:{color:PALETTE.textMid} },
            showlegend:true, legend:{orientation:'h', y:1.05, font:{size:9}}, margin:{t:30,b:0,l:0,r:0},
            scene:{
                xaxis:{title:'x', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                yaxis:{title:'y', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                zaxis:{title:'z', range:[-span,span], color:PALETTE.textMid, gridcolor:PALETTE.bgGrid},
                aspectmode:'cube', camera:{ eye:{x:1.5,y:1.5,z:1.2} }
            }
        });
        renderPlot('plot-hom', [...world, ...frameB, ...points], layout, { displayModeBar:false });

        try { window.katex.render(katexT(R,p), els.matrix, { throwOnError:false, displayMode:true }); }
        catch(e){ els.matrix.textContent = 'T'; }
        els.readout.innerHTML = `
            <div style="color:var(--accent-cyan)">ᴬq = R·q + p = (${num(Aq[0])}, ${num(Aq[1])}, ${num(Aq[2])})</div>
            <div style="color:var(--text-mid)">T⁻¹ : translation = (${num(pInv[0])}, ${num(pInv[1])}, ${num(pInv[2])}), rotation = Rᵀ</div>
            <div style="color:var(--text-dim)">q (repère B) = (${num(q[0])}, ${num(q[1])}, ${num(q[2])})</div>`;
    }

    document.querySelectorAll('#hom-axis button').forEach(b => b.addEventListener('click', () => {
        axis = b.dataset.axis;
        document.querySelectorAll('#hom-axis button').forEach(x => x.classList.toggle('active', x===b));
        update();
    }));
    [els.ang, els.px, els.py, els.pz, els.qx, els.qy, els.qz].forEach(s => {
        s.addEventListener('input', update); s.addEventListener('change', update);
    });
    update();
}
