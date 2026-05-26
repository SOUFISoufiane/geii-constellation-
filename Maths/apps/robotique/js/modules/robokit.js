// robokit — shared 3D kinematics + frame-drawing helpers for the Robotique app.
// Pure functions (no DOM) so the frames and 6-axis modules can both use them.
import { PALETTE } from '../../../signal-observatory/js/plots/plotly-config.js';

export const DEG = Math.PI / 180;

// ── 4×4 homogeneous matrix algebra ───────────────────────────────────
export const I4 = () => [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]];

export function matmul4(A, B) {
    const C = [[0,0,0,0],[0,0,0,0],[0,0,0,0],[0,0,0,0]];
    for (let i=0;i<4;i++) for (let j=0;j<4;j++) for (let k=0;k<4;k++) C[i][j] += A[i][k]*B[k][j];
    return C;
}

// Build a homogeneous transform from an axis rotation + translation.
export function transform(axis, ang, tx=0, ty=0, tz=0) {
    const c = Math.cos(ang), s = Math.sin(ang);
    let R;
    if (axis === 'x')      R = [[1,0,0],[0,c,-s],[0,s,c]];
    else if (axis === 'y') R = [[c,0,s],[0,1,0],[-s,0,c]];
    else                   R = [[c,-s,0],[s,c,0],[0,0,1]];
    return [
        [R[0][0],R[0][1],R[0][2],tx],
        [R[1][0],R[1][1],R[1][2],ty],
        [R[2][0],R[2][1],R[2][2],tz],
        [0,0,0,1]
    ];
}

// Standard Denavit–Hartenberg link transform.
//   A = Rz(θ)·Tz(d)·Tx(a)·Rx(α)
export function dhTransform(theta, d, a, alpha) {
    const ct=Math.cos(theta), st=Math.sin(theta), ca=Math.cos(alpha), sa=Math.sin(alpha);
    return [
        [ct, -st*ca,  st*sa, a*ct],
        [st,  ct*ca, -ct*sa, a*st],
        [0,      sa,     ca,    d ],
        [0,       0,      0,    1 ]
    ];
}

// Position (translation column) of a 4×4 transform.
export const originOf = T => [T[0][3], T[1][3], T[2][3]];
// Column j of the rotation part = direction of that frame axis in world coords.
export const axisDir = (T, j) => [T[0][j], T[1][j], T[2][j]];

// ── 3D frame drawing (Plotly scatter3d traces) ───────────────────────
const AXIS_COLORS = [PALETTE.red, PALETTE.green, PALETTE.blue]; // x, y, z

/**
 * Three coloured line segments forming a coordinate triad at transform T.
 * @param {number[][]} T   4×4 transform
 * @param {number} len     axis length
 * @param {object} opts    { width, label, showlegend }
 */
export function frameTriad(T, len = 0.5, opts = {}) {
    const o = originOf(T);
    const w = opts.width || 5;
    const names = opts.labels || [null, null, opts.label || null];
    return [0,1,2].map(j => {
        const d = axisDir(T, j);
        return {
            type:'scatter3d', mode:'lines',
            x:[o[0], o[0]+d[0]*len], y:[o[1], o[1]+d[1]*len], z:[o[2], o[2]+d[2]*len],
            line:{ color: AXIS_COLORS[j], width: w },
            name: names[j], showlegend: !!names[j], hoverinfo:'skip'
        };
    });
}

/** A point marker trace. */
export function pointTrace(p, color, name, symbol='circle', size=6) {
    return {
        type:'scatter3d', mode:'markers', x:[p[0]], y:[p[1]], z:[p[2]],
        marker:{ size, color, symbol }, name, showlegend: !!name,
        hovertemplate:`${name||''} (%{x:.0f}, %{y:.0f}, %{z:.0f})<extra></extra>`
    };
}

/** A polyline trace through a list of [x,y,z] points (e.g. a robot's links). */
export function linkTrace(points, color, name, width=8) {
    return {
        type:'scatter3d', mode:'lines',
        x: points.map(p=>p[0]), y: points.map(p=>p[1]), z: points.map(p=>p[2]),
        line:{ color, width }, name, showlegend: !!name, hoverinfo:'skip'
    };
}
