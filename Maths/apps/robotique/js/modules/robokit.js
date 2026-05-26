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

// ── 6R robot (spherical-wrist) FK + closed-form IK ───────────────────
// Single source of truth for the 6-axis arm geometry. DH (Stäubli TX-like):
//   i | θ          d     a     α
//   1 | q1         d1    0    -90°
//   2 | q2-90°     0     a2    0
//   3 | q3         0     0    -90°
//   4 | q4         d4    0    +90°
//   5 | q5         0     0    -90°
//   6 | q6         d6    0     0
export const ROBOT6 = { d1: 1.0, a2: 1.2, d4: 1.0, d6: 0.4 };

export function dhRows6(q) {
    const { d1, a2, d4, d6 } = ROBOT6;
    return [
        [q[0],            d1, 0,  -90*DEG],
        [q[1] - 90*DEG,   0,  a2,   0    ],
        [q[2],            0,  0,  -90*DEG],
        [q[3],            d4, 0,  +90*DEG],
        [q[4],            0,  0,  -90*DEG],
        [q[5],            d6, 0,   0     ]
    ];
}

// Forward kinematics → list of cumulative frames [base, T01, T02, … T06].
export function fk6(q) {
    const frames = [I4()];
    let T = I4();
    for (const [th,d,a,al] of dhRows6(q)) { T = matmul4(T, dhTransform(th,d,a,al)); frames.push(T); }
    return frames;
}

// Numerical IK by damped least squares (Levenberg–Marquardt on a 6-D pose
// error), seeded from the arm's current joints. Robust and DH-offset-agnostic:
// it differentiates the real fk6 rather than hand-deriving a closed form, so it
// can never silently disagree with the FK the visualisation draws.
//
//   T06   target tool transform (4×4)
//   qSeed current joints (rad) — IK stays near them for continuity
// Returns { q:[…6], ok, posErr } ; ok=false if it can't converge (out of reach).
export function ik6(T06, qSeed = [0,0,0,0,0,0]) {
    const targetPos = [T06[0][3], T06[1][3], T06[2][3]];
    const targetR = [[T06[0][0],T06[0][1],T06[0][2]],
                     [T06[1][0],T06[1][1],T06[1][2]],
                     [T06[2][0],T06[2][1],T06[2][2]]];

    // 6-vector pose error: position diff + orientation diff (axis·angle of Rerr).
    function poseError(q) {
        const T = fk6(q)[6];
        const ep = [targetPos[0]-T[0][3], targetPos[1]-T[1][3], targetPos[2]-T[2][3]];
        // Rerr = targetR · Rcurrentᵀ ; small-angle vector = 0.5*(off-diagonals)
        const Rc = [[T[0][0],T[0][1],T[0][2]],[T[1][0],T[1][1],T[1][2]],[T[2][0],T[2][1],T[2][2]]];
        const Re = [[0,0,0],[0,0,0],[0,0,0]];
        for (let i=0;i<3;i++) for (let j=0;j<3;j++) for (let k=0;k<3;k++) Re[i][j]+=targetR[i][k]*Rc[j][k];
        const eo = [ (Re[2][1]-Re[1][2])/2, (Re[0][2]-Re[2][0])/2, (Re[1][0]-Re[0][1])/2 ];
        return [...ep, ...eo];
    }

    let q = qSeed.slice();
    const lambda = 0.05;            // damping
    for (let iter=0; iter<80; iter++) {
        const e = poseError(q);
        const errNorm = Math.hypot(...e);
        if (errNorm < 1e-5) return { q: q.map(wrapPi), ok:true, posErr: Math.hypot(e[0],e[1],e[2]) };

        // Numerical Jacobian J (6×6): ∂pose/∂q.
        const h = 1e-6;
        const J = [[],[],[],[],[],[]];
        for (let j=0;j<6;j++) {
            const qp = q.slice(); qp[j]+=h;
            const ep = poseError(qp);
            for (let i=0;i<6;i++) J[i][j] = (e[i]-ep[i]) / h;  // note sign: d(err)/dq
        }
        // Damped least squares: Δq = (JᵀJ + λ²I)⁻¹ Jᵀ e
        const JT = transpose6(J);
        const JTJ = matmulN(JT, J);
        for (let i=0;i<6;i++) JTJ[i][i] += lambda*lambda;
        const JTe = matvecN(JT, e);
        const dq = solve6(JTJ, JTe);
        if (!dq) break;
        // step-limit for stability
        const step = Math.min(1, 0.4 / (Math.hypot(...dq)+1e-9));
        for (let i=0;i<6;i++) q[i] += dq[i]*step;
    }
    const e = poseError(q);
    const posErr = Math.hypot(e[0],e[1],e[2]);
    return { q: q.map(wrapPi), ok: posErr < 5e-3, posErr };
}

// small linear-algebra helpers for the 6×6 solve
const wrapPi = a => Math.atan2(Math.sin(a), Math.cos(a));
function transpose6(M){const T=[];for(let i=0;i<M.length;i++){T.push([]);for(let j=0;j<M[0].length;j++)T[i].push(M[j][i]);}return T;}
function matmulN(A,B){const n=A.length,m=B[0].length,p=B.length;const C=[];for(let i=0;i<n;i++){C.push([]);for(let j=0;j<m;j++){let s=0;for(let k=0;k<p;k++)s+=A[i][k]*B[k][j];C[i].push(s);}}return C;}
function matvecN(A,v){return A.map(row=>row.reduce((s,a,k)=>s+a*v[k],0));}
// Gaussian elimination for a 6×6 (or n×n) system Ax=b.
function solve6(A,b){
    const n=b.length; const M=A.map((r,i)=>[...r,b[i]]);
    for(let c=0;c<n;c++){
        let piv=c; for(let r=c+1;r<n;r++) if(Math.abs(M[r][c])>Math.abs(M[piv][c])) piv=r;
        if(Math.abs(M[piv][c])<1e-12) return null;
        [M[c],M[piv]]=[M[piv],M[c]];
        for(let r=0;r<n;r++){ if(r===c) continue; const f=M[r][c]/M[c][c]; for(let k=c;k<=n;k++) M[r][k]-=f*M[c][k]; }
    }
    return M.map((row,i)=>row[n]/row[i]);
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
