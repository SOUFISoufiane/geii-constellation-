// 2R planar manipulator — forward (MGD) and inverse (MGI) kinematics.
//
// Forward (TD1, Ex. 7 — exact form from the sheet, with L1=2, L2=1):
//   x = L1·cos θ1 + L2·cos(θ1+θ2)
//   y = L1·sin θ1 + L2·sin(θ1+θ2)
//
// Inverse (law of cosines):
//   c2 = (x² + y² − L1² − L2²) / (2 L1 L2)
//   θ2 = ± acos(c2)                         (elbow-down / elbow-up)
//   θ1 = atan2(y,x) − atan2(L2·sin θ2, L1 + L2·cos θ2)
import { PALETTE, baseLayout } from '../../../signal-observatory/js/plots/plotly-config.js';
import { renderPlot } from '../../../../shared/js/plot-fit.js';

const DEG = Math.PI / 180;

export function initArm2R() {
    const el = id => document.getElementById(id);
    const els = {
        l1: el('arm-l1'), l2: el('arm-l2'), vl1: el('val-l1'), vl2: el('val-l2'),
        t1: el('arm-t1'), t2: el('arm-t2'), vt1: el('val-t1'), vt2: el('val-t2'),
        tx: el('arm-tx'), ty: el('arm-ty'), vtx: el('val-tx'), vty: el('val-ty'),
        fk: el('fk-controls'), ik: el('ik-controls'),
        readout: el('arm-readout')
    };
    let mode = 'fk';

    // Forward kinematics → joint, elbow, end-effector positions.
    function fkChain(L1, L2, t1, t2) {
        const elbow = { x: L1 * Math.cos(t1), y: L1 * Math.sin(t1) };
        const end = {
            x: L1 * Math.cos(t1) + L2 * Math.cos(t1 + t2),
            y: L1 * Math.sin(t1) + L2 * Math.sin(t1 + t2)
        };
        return { base: { x: 0, y: 0 }, elbow, end };
    }

    // Draw one arm (base→elbow→end) plus its joint markers, in a given colour.
    function armTraces(L1, L2, t1, t2, color, name, dash) {
        const c = fkChain(L1, L2, t1, t2);
        return [
            { x: [c.base.x, c.elbow.x, c.end.x], y: [c.base.y, c.elbow.y, c.end.y],
              mode: 'lines', type: 'scatter', name, line: { color, width: 6, dash: dash || 'solid' }, hoverinfo: 'skip' },
            { x: [c.base.x, c.elbow.x], y: [c.base.y, c.elbow.y],
              mode: 'markers', type: 'scatter', showlegend: false,
              marker: { size: 11, color: PALETTE.gold, symbol: 'circle', line: { color: '#000', width: 1 } }, hoverinfo: 'skip' },
            { x: [c.end.x], y: [c.end.y], mode: 'markers', type: 'scatter', showlegend: false,
              marker: { size: 13, color, symbol: 'square', line: { color: '#000', width: 1 } },
              hovertemplate: `(%{x:.3f}, %{y:.3f})<extra></extra>` }
        ];
    }

    // Reachable annulus: inner radius |L1−L2|, outer L1+L2.
    function workspaceTraces(L1, L2) {
        const rOut = L1 + L2, rIn = Math.abs(L1 - L2);
        const ring = (r, color) => {
            const x = [], y = [];
            for (let a = 0; a <= 360; a += 4) { x.push(r * Math.cos(a * DEG)); y.push(r * Math.sin(a * DEG)); }
            return { x, y, mode: 'lines', type: 'scatter', name: 'Espace de travail',
                     line: { color, width: 1, dash: 'dot' }, showlegend: false, hoverinfo: 'skip' };
        };
        return [ring(rOut, PALETTE.textDim), ring(rIn, PALETTE.textDim)];
    }

    function draw(traces, L1, L2) {
        const R = (L1 + L2) * 1.15;
        const layout = baseLayout({
            title: { text: 'Bras planaire 2R', font: { color: PALETTE.textMid } },
            xaxis: { title: 'x', range: [-R, R], gridcolor: PALETTE.bgGrid, zeroline: true, zerolinecolor: PALETTE.textDim },
            yaxis: { title: 'y', range: [-R, R], gridcolor: PALETTE.bgGrid, zeroline: true, zerolinecolor: PALETTE.textDim, scaleanchor: 'x' },
            showlegend: true, legend: { orientation: 'h', y: 1.12, font: { size: 9 } }, margin: { t: 36, b: 40, l: 46, r: 16 }
        });
        renderPlot('plot-arm', [...workspaceTraces(L1, L2), ...traces], layout, { displayModeBar: false });
    }

    function updateFK() {
        const L1 = +els.l1.value, L2 = +els.l2.value, t1 = +els.t1.value * DEG, t2 = +els.t2.value * DEG;
        els.vl1.textContent = els.l1.value; els.vl2.textContent = els.l2.value;
        els.vt1.textContent = els.t1.value; els.vt2.textContent = els.t2.value;
        const c = fkChain(L1, L2, t1, t2);
        draw(armTraces(L1, L2, t1, t2, PALETTE.cyan, 'Bras'), L1, L2);
        els.readout.innerHTML = `
            <div style="color:var(--accent-cyan)">Effecteur : x = ${c.end.x.toFixed(3)}, y = ${c.end.y.toFixed(3)}</div>
            <div style="color:var(--text-mid)">Coude : (${c.elbow.x.toFixed(3)}, ${c.elbow.y.toFixed(3)})</div>
            <div style="color:var(--text-dim)">Distance base→effecteur : ${Math.hypot(c.end.x, c.end.y).toFixed(3)}</div>`;
    }

    function updateIK() {
        const L1 = +els.l1.value, L2 = +els.l2.value, x = +els.tx.value, y = +els.ty.value;
        els.vl1.textContent = els.l1.value; els.vl2.textContent = els.l2.value;
        els.vtx.textContent = els.tx.value; els.vty.textContent = els.ty.value;

        const r2 = x * x + y * y, r = Math.sqrt(r2);
        const rMin = Math.abs(L1 - L2), rMax = L1 + L2;
        let c2 = (r2 - L1 * L1 - L2 * L2) / (2 * L1 * L2);

        // Target ring shows where the cible sits relative to the workspace.
        const targetTrace = {
            x: [x], y: [y], mode: 'markers', type: 'scatter', name: 'Cible',
            marker: { size: 14, color: PALETTE.magenta, symbol: 'x', line: { width: 3 } }
        };

        if (r > rMax + 1e-9 || r < rMin - 1e-9) {
            draw([targetTrace], L1, L2);
            els.readout.innerHTML = `
                <div style="color:var(--accent-red)">Cible hors d'atteinte ✗</div>
                <div style="color:var(--text-dim)">r = ${r.toFixed(3)} ∉ [${rMin.toFixed(2)}, ${rMax.toFixed(2)}]</div>`;
            return;
        }
        c2 = Math.max(-1, Math.min(1, c2));            // clamp rounding
        const t2a = Math.acos(c2), t2b = -t2a;          // elbow-down / elbow-up
        const sol = (t2) => {
            const t1 = Math.atan2(y, x) - Math.atan2(L2 * Math.sin(t2), L1 + L2 * Math.cos(t2));
            return { t1, t2 };
        };
        const s1 = sol(t2a), s2 = sol(t2b);

        const traces = [
            ...armTraces(L1, L2, s1.t1, s1.t2, PALETTE.cyan, 'Coude bas'),
            ...armTraces(L1, L2, s2.t1, s2.t2, PALETTE.green, 'Coude haut', 'dash'),
            targetTrace
        ];
        draw(traces, L1, L2);
        const deg = v => (v / DEG).toFixed(1);
        const collapsed = Math.abs(t2a) < 1e-6 || Math.abs(Math.abs(t2a) - Math.PI) < 1e-6;
        els.readout.innerHTML = `
            <div style="color:var(--accent-green)">Cible atteignable ✓</div>
            <div style="color:var(--accent-cyan)">Coude bas : θ₁=${deg(s1.t1)}° , θ₂=${deg(s1.t2)}°</div>
            <div style="color:var(--accent-green)">Coude haut : θ₁=${deg(s2.t1)}° , θ₂=${deg(s2.t2)}°</div>
            ${collapsed ? `<div style="color:var(--text-dim)">Solution unique (bras tendu ou replié)</div>` : ''}`;
    }

    function update() { mode === 'fk' ? updateFK() : updateIK(); }

    // Mode toggle
    document.querySelectorAll('#arm-mode button').forEach(b => b.addEventListener('click', () => {
        mode = b.dataset.mode;
        document.querySelectorAll('#arm-mode button').forEach(x => x.classList.toggle('active', x === b));
        els.fk.style.display = mode === 'fk' ? '' : 'none';
        els.ik.style.display = mode === 'ik' ? '' : 'none';
        update();
    }));

    [els.l1, els.l2, els.t1, els.t2, els.tx, els.ty].forEach(s => s.addEventListener('input', update));
    update();
}
