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

// ── Pose ⇄ matrix (Stäubli VAL3 / course convention) ─────────────────
// A pose is {x, y, z, rx, ry, rz} (mm, degrees). The orientation is built by
// successive rotations about the FIXED world axes x₀, then y₀, then z₀ — i.e.
//   R = Rz(rz) · Ry(ry) · Rx(rx)
// (TD2 p.12: "rotation autour de x₀, puis y₀, puis z₀"; matches Stäubli trsf.)
export function poseToMatrix({ x, y, z, rx, ry, rz }) {
    const cx=Math.cos(rx*DEG), sx=Math.sin(rx*DEG);
    const cy=Math.cos(ry*DEG), sy=Math.sin(ry*DEG);
    const cz=Math.cos(rz*DEG), sz=Math.sin(rz*DEG);
    // R = Rz·Ry·Rx (expanded)
    const R = [
        [ cz*cy,  cz*sy*sx - sz*cx,  cz*sy*cx + sz*sx ],
        [ sz*cy,  sz*sy*sx + cz*cx,  sz*sy*cx - cz*sx ],
        [ -sy,    cy*sx,             cy*cx            ]
    ];
    return [
        [R[0][0],R[0][1],R[0][2], x],
        [R[1][0],R[1][1],R[1][2], y],
        [R[2][0],R[2][1],R[2][2], z],
        [0,0,0,1]
    ];
}

// Inverse: recover {x,y,z,rx,ry,rz} (degrees) from a 4×4 transform, same
// convention. Handles the gimbal-lock case (ry = ±90°) gracefully.
export function matrixToPose(T) {
    const x=T[0][3], y=T[1][3], z=T[2][3];
    const r31 = -T[2][0];
    const ry = Math.asin(Math.max(-1, Math.min(1, r31)));
    let rx, rz;
    if (Math.abs(r31) < 0.999999) {
        rx = Math.atan2(T[2][1], T[2][2]);
        rz = Math.atan2(T[1][0], T[0][0]);
    } else { // gimbal lock: ry = ±90°, fix rz=0 and fold into rx
        rz = 0;
        rx = Math.atan2(-T[0][1], T[1][1]) * Math.sign(r31 || 1);
    }
    const d = a => a / DEG;
    return { x, y, z, rx: d(rx), ry: d(ry), rz: d(rz) };
}

// ── VAL3 geometry primitives (pure, hardware-free) ───────────────────
// trsf is a pose-like offset {x,y,z,rx,ry,rz}.
//
// compose(point, frame, trsf): place a point relative to `frame`, offset by
// trsf. In matrix terms: T_result = T_frame · T_trsf, then the point is the
// origin/pose of that result. (VAL3: compose(p, frame, trsf))
export function valCompose(framePose, trsfPose) {
    return matrixToPose(matmul4(poseToMatrix(framePose), poseToMatrix(trsfPose)));
}

// appro(point, trsf): offset expressed in the point's OWN frame (post-multiply).
// T_result = T_point · T_trsf. (VAL3: appro(p, trsf))
export function valAppro(pointPose, trsfPose) {
    return matrixToPose(matmul4(poseToMatrix(pointPose), poseToMatrix(trsfPose)));
}

// setFrame(origin, ptOnX, ptOnY): build a frame from three taught points —
// origin, a point defining +X, a point defining the XY plane (+Y side).
// Returns the frame as a pose. (VAL3: setFrame(O, PA, PB, REF))
export function valSetFrame(origin, ptX, ptY) {
    const sub = (a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
    const norm = v=>{const n=Math.hypot(...v)||1;return v.map(c=>c/n);};
    const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]];
    const ex = norm(sub(ptX, origin));
    let ey = sub(ptY, origin);
    // Gram–Schmidt: remove the ex component so ey ⟂ ex.
    const dot = ex[0]*ey[0]+ex[1]*ey[1]+ex[2]*ey[2];
    ey = norm([ey[0]-dot*ex[0], ey[1]-dot*ex[1], ey[2]-dot*ex[2]]);
    const ez = cross(ex, ey);
    const T = [
        [ex[0], ey[0], ez[0], origin[0]],
        [ex[1], ey[1], ez[1], origin[1]],
        [ex[2], ey[2], ez[2], origin[2]],
        [0,0,0,1]
    ];
    return matrixToPose(T);
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
