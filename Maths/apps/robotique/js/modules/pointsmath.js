import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';

export function initPointsMath() {
    const el = id => document.getElementById(id);
    
    let points = [
        { id: 1, x: 0, y: 0, z: 0 },
        { id: 2, x: 1, y: 0, z: 0 },
        { id: 3, x: 1, y: 1, z: 0 }
    ];
    let nextId = 4;
    
    const listContainer = el('pm-points-list');
    const btnAdd = el('pm-btn-add');
    const selA = el('pm-angle-a');
    const selB = el('pm-angle-b');
    const selC = el('pm-angle-c');
    const readout = el('pm-readout');

    function updateDOM() {
        // Update points list
        listContainer.innerHTML = '';
        points.forEach((pt, index) => {
            const row = document.createElement('div');
            row.className = 'pose-grid';
            row.style.alignItems = 'center';
            row.style.gridTemplateColumns = '30px repeat(3, 1fr) 30px';
            
            const label = document.createElement('div');
            label.textContent = `P${index + 1}`;
            label.style.color = 'var(--accent-cyan)';
            label.style.fontFamily = "'Space Mono', monospace";
            label.style.fontSize = '0.8rem';
            
            const createInput = (axis) => {
                const fld = document.createElement('div');
                fld.className = 'fld';
                const lbl = document.createElement('label'); lbl.textContent = axis;
                const inp = document.createElement('input');
                inp.className = 'numinput';
                inp.type = 'number';
                inp.step = '0.5';
                inp.value = pt[axis];
                inp.addEventListener('input', (e) => {
                    pt[axis] = parseFloat(e.target.value) || 0;
                    render();
                });
                fld.appendChild(lbl); fld.appendChild(inp);
                return fld;
            };

            const delBtn = document.createElement('button');
            delBtn.textContent = '×';
            delBtn.style.cssText = 'background:rgba(255,50,50,0.2); border:1px solid var(--accent-red); color:var(--accent-red); border-radius:4px; cursor:pointer; height:24px; margin-top:14px;';
            delBtn.onclick = () => {
                points = points.filter(p => p.id !== pt.id);
                updateDOM();
            };

            row.appendChild(label);
            row.appendChild(createInput('x'));
            row.appendChild(createInput('y'));
            row.appendChild(createInput('z'));
            row.appendChild(delBtn);
            listContainer.appendChild(row);
        });

        // Update selects
        const updateSelect = (sel) => {
            const currentVal = sel.value;
            sel.innerHTML = '<option value="">--</option>';
            points.forEach((pt, idx) => {
                const opt = document.createElement('option');
                opt.value = pt.id;
                opt.textContent = `P${idx + 1}`;
                sel.appendChild(opt);
            });
            if (points.find(p => p.id == currentVal)) {
                sel.value = currentVal;
            }
        };
        updateSelect(selA);
        updateSelect(selB);
        updateSelect(selC);
        
        render();
    }

    // Vector math helpers
    const sub = (p1, p2) => ({ x: p1.x - p2.x, y: p1.y - p2.y, z: p1.z - p2.z });
    const add = (p1, p2) => ({ x: p1.x + p2.x, y: p1.y + p2.y, z: p1.z + p2.z });
    const mult = (v, s) => ({ x: v.x * s, y: v.y * s, z: v.z * s });
    const dot = (v1, v2) => v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
    const mag = (v) => Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    const norm = (v) => { const m = mag(v); return m === 0 ? {x:0, y:0, z:0} : mult(v, 1/m); };

    // Create points along an arc between vector v1 and v2 starting at vertex B
    function getArcPoints(B, A, C, radius = 0.5, numPoints = 20) {
        const v1 = sub(A, B);
        const v2 = sub(C, B);
        const d1 = norm(v1);
        const d2 = norm(v2);
        
        // If points are degenerate, return empty
        if (mag(d1) === 0 || mag(d2) === 0) return [];

        const dotProduct = Math.max(-1, Math.min(1, dot(d1, d2)));
        const angle = Math.acos(dotProduct);
        
        // Find an orthogonal vector to d1 in the plane of d1,d2 (Gram-Schmidt)
        let ortho = sub(d2, mult(d1, dotProduct));
        if (mag(ortho) < 1e-6) {
            return []; // colinear
        }
        ortho = norm(ortho);

        const arcPts = [];
        for (let i = 0; i <= numPoints; i++) {
            const theta = (i / numPoints) * angle;
            const cosT = Math.cos(theta);
            const sinT = Math.sin(theta);
            const rDir = add(mult(d1, cosT), mult(ortho, sinT));
            arcPts.push(add(B, mult(rDir, radius)));
        }
        return arcPts;
    }

    function render() {
        const traces = [];
        let angleStr = "Sélectionnez 3 points (A, B=sommet, C) pour calculer l'angle.";

        // Draw trajectory
        if (points.length > 0) {
            const x = points.map(p => p.x);
            const y = points.map(p => p.y);
            const z = points.map(p => p.z);
            const text = points.map((p, i) => `P${i + 1}`);

            traces.push({
                type: 'scatter3d',
                mode: 'lines+markers+text',
                x: x, y: y, z: z,
                text: text,
                textposition: 'top right',
                marker: { size: 6, color: PALETTE.cyan },
                line: { color: PALETTE.cyan, width: 4 },
                name: 'Trajectoire',
                showlegend: false
            });
        }

        // Draw Angle if valid
        const idA = parseInt(selA.value);
        const idB = parseInt(selB.value);
        const idC = parseInt(selC.value);

        if (idA && idB && idC && idA !== idB && idB !== idC && idA !== idC) {
            const ptA = points.find(p => p.id === idA);
            const ptB = points.find(p => p.id === idB);
            const ptC = points.find(p => p.id === idC);

            if (ptA && ptB && ptC) {
                const v1 = sub(ptA, ptB);
                const v2 = sub(ptC, ptB);
                const m1 = mag(v1);
                const m2 = mag(v2);

                if (m1 > 0 && m2 > 0) {
                    const cosTheta = dot(v1, v2) / (m1 * m2);
                    const clampedCos = Math.max(-1, Math.min(1, cosTheta));
                    const angleRad = Math.acos(clampedCos);
                    const angleDeg = angleRad * (180 / Math.PI);

                    // Add trace for A-B and B-C explicitly just in case they are not adjacent in trajectory
                    traces.push({
                        type: 'scatter3d', mode: 'lines',
                        x: [ptA.x, ptB.x, ptC.x], y: [ptA.y, ptB.y, ptC.y], z: [ptA.z, ptB.z, ptC.z],
                        line: { color: PALETTE.gold, width: 2, dash: 'dot' },
                        name: 'Angle Segments', showlegend: false, hoverinfo: 'skip'
                    });

                    // Draw the arc
                    const radius = Math.min(m1, m2, 1.0) * 0.3;
                    const arcPoints = getArcPoints(ptB, ptA, ptC, radius);
                    if (arcPoints.length > 0) {
                        traces.push({
                            type: 'scatter3d', mode: 'lines',
                            x: arcPoints.map(p => p.x), y: arcPoints.map(p => p.y), z: arcPoints.map(p => p.z),
                            line: { color: PALETTE.gold, width: 4 },
                            name: 'Arc', showlegend: false, hoverinfo: 'skip'
                        });
                    }

                    angleStr = `<span style="color:var(--accent-gold)">Angle $\\angle ABC$ = ${angleDeg.toFixed(1)}° (${angleRad.toFixed(2)} rad)</span>`;
                }
            }
        }

        readout.innerHTML = `<div>${angleStr}</div>`;

        // Draw Origin to have some reference
        traces.push({
            type: 'scatter3d', mode: 'markers',
            x: [0], y: [0], z: [0],
            marker: { size: 4, color: PALETTE.textDim, symbol: 'cross' },
            name: 'World Origin', showlegend: false, hoverinfo: 'skip'
        });

        const layout = baseLayout({
            title: { text: `Trajectoires & Math`, font: { color: PALETTE.textMid } },
            showlegend: false, margin: { t: 30, b: 0, l: 0, r: 0 },
            scene: {
                xaxis: { title: 'x', color: PALETTE.textMid, gridcolor: PALETTE.bgGrid },
                yaxis: { title: 'y', color: PALETTE.textMid, gridcolor: PALETTE.bgGrid },
                zaxis: { title: 'z', color: PALETTE.textMid, gridcolor: PALETTE.bgGrid },
                aspectmode: 'data', camera: { eye: { x: 1.6, y: 1.6, z: 1.0 } }
            }
        });
        
        renderPlot('plot-pointsmath', traces, layout, { displayModeBar: false });
        
        // Re-run MathJax/KaTeX if there are math formulas in readout
        if (window.renderMathInElement) {
            window.renderMathInElement(readout, {
                delimiters: [{left: "$", right: "$", display: false}]
            });
        }
    }

    btnAdd.onclick = () => {
        const lastPt = points[points.length - 1] || { x: 0, y: 0, z: 0 };
        points.push({ id: nextId++, x: lastPt.x + 1, y: lastPt.y, z: lastPt.z });
        updateDOM();
    };

    selA.onchange = render;
    selB.onchange = render;
    selC.onchange = render;

    // Initial render
    updateDOM();
}
