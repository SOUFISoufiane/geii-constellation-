// ═══════════════════════════════════════════════════════════════════
//  COMPLEX KERNEL — minimal {re, im} arithmetic
//
//  All functions return plain {re, im} objects. Real numbers are
//  promoted via `c(x) = {re: x, im: 0}` so the evaluator can treat
//  every value as complex without branching.
//
//  Trig/exp/log/sqrt extended via the Euler identity:
//    exp(a+jb)   = e^a (cos b + j sin b)
//    log(z)      = log(|z|) + j·arg(z)        (principal branch)
//    sin(a+jb)   = sin a · cosh b + j cos a · sinh b
//    cos(a+jb)   = cos a · cosh b − j sin a · sinh b
//    sqrt(z)     = √(|z|)·(cos(arg/2) + j sin(arg/2))
// ═══════════════════════════════════════════════════════════════════

export const ZERO = { re: 0, im: 0 };
export const ONE  = { re: 1, im: 0 };
export const I    = { re: 0, im: 1 };

/** Promote a value to complex form. Accepts number or {re,im}. */
export function c(x) {
    if (typeof x === 'number') return { re: x, im: 0 };
    if (x && typeof x === 'object' && 're' in x) return x;
    return { re: 0, im: 0 };
}

export function cAdd(a, b)  { a = c(a); b = c(b); return { re: a.re + b.re, im: a.im + b.im }; }
export function cSub(a, b)  { a = c(a); b = c(b); return { re: a.re - b.re, im: a.im - b.im }; }
export function cNeg(a)     { a = c(a); return { re: -a.re, im: -a.im }; }
export function cMul(a, b)  {
    a = c(a); b = c(b);
    return { re: a.re*b.re - a.im*b.im, im: a.re*b.im + a.im*b.re };
}
export function cDiv(a, b)  {
    a = c(a); b = c(b);
    const d = b.re*b.re + b.im*b.im;
    if (d === 0) return { re: NaN, im: NaN };
    return {
        re: (a.re*b.re + a.im*b.im) / d,
        im: (a.im*b.re - a.re*b.im) / d
    };
}
export function cConj(a)    { a = c(a); return { re: a.re, im: -a.im }; }
export function cMag(a)     { a = c(a); return { re: Math.hypot(a.re, a.im), im: 0 }; }
export function cAbs(a)     { return cMag(a); }   // alias
export function cArg(a)     { a = c(a); return { re: Math.atan2(a.im, a.re), im: 0 }; }
export function cRe(a)      { a = c(a); return { re: a.re, im: 0 }; }
export function cIm(a)      { a = c(a); return { re: a.im, im: 0 }; }

export function cExp(a) {
    a = c(a);
    const r = Math.exp(a.re);
    return { re: r * Math.cos(a.im), im: r * Math.sin(a.im) };
}
export function cLog(a) {
    a = c(a);
    return { re: Math.log(Math.hypot(a.re, a.im)), im: Math.atan2(a.im, a.re) };
}
export function cLog10(a) {
    const l = cLog(a);
    return { re: l.re * Math.LOG10E, im: l.im * Math.LOG10E };
}
export function cLog2(a) {
    const l = cLog(a);
    return { re: l.re * Math.LOG2E, im: l.im * Math.LOG2E };
}
export function cSqrt(a) {
    a = c(a);
    const r = Math.hypot(a.re, a.im);
    const t = Math.atan2(a.im, a.re) / 2;
    const sr = Math.sqrt(r);
    return { re: sr * Math.cos(t), im: sr * Math.sin(t) };
}
export function cCbrt(a) {
    return cPow(a, { re: 1/3, im: 0 });
}
export function cPow(a, b) {
    // z^w = exp(w · log z), handles complex exponents
    return cExp(cMul(b, cLog(a)));
}

// Trig: derived from Euler
export function cSin(a) {
    a = c(a);
    return { re: Math.sin(a.re) * Math.cosh(a.im), im: Math.cos(a.re) * Math.sinh(a.im) };
}
export function cCos(a) {
    a = c(a);
    return { re: Math.cos(a.re) * Math.cosh(a.im), im: -Math.sin(a.re) * Math.sinh(a.im) };
}
export function cTan(a) { return cDiv(cSin(a), cCos(a)); }
export function cSec(a) { return cDiv(ONE, cCos(a)); }
export function cCsc(a) { return cDiv(ONE, cSin(a)); }
export function cCot(a) { return cDiv(cCos(a), cSin(a)); }

export function cSinh(a) {
    a = c(a);
    return { re: Math.sinh(a.re) * Math.cos(a.im), im: Math.cosh(a.re) * Math.sin(a.im) };
}
export function cCosh(a) {
    a = c(a);
    return { re: Math.cosh(a.re) * Math.cos(a.im), im: Math.sinh(a.re) * Math.sin(a.im) };
}
export function cTanh(a) { return cDiv(cSinh(a), cCosh(a)); }

// Inverse trig (principal branches) — rare in user equations but cheap to add
export function cAsin(a) {
    // -j · log(j·z + sqrt(1 − z²))
    a = c(a);
    const z2 = cMul(a, a);
    const inner = cSqrt(cSub({ re: 1, im: 0 }, z2));
    const jz = cMul(I, a);
    return cMul(cNeg(I), cLog(cAdd(jz, inner)));
}
export function cAcos(a) {
    return cSub({ re: Math.PI / 2, im: 0 }, cAsin(a));
}
export function cAtan(a) {
    // 0.5j · log((1 - jz)/(1 + jz))
    a = c(a);
    const jz = cMul(I, a);
    const num = cSub(ONE, jz);
    const den = cAdd(ONE, jz);
    return cMul({ re: 0, im: 0.5 }, cLog(cDiv(num, den)));
}

// Special signal-processing functions extended naturally
export function cAbsBuiltin(a) { return cMag(a); }   // alias |z|

/** Pretty string for debugging only. */
export function cToString(a) {
    a = c(a);
    if (Math.abs(a.im) < 1e-12) return a.re.toFixed(4);
    if (Math.abs(a.re) < 1e-12) return `${a.im.toFixed(4)}j`;
    return `${a.re.toFixed(4)}${a.im >= 0 ? '+' : ''}${a.im.toFixed(4)}j`;
}

/** True if value is essentially real (|imag| below threshold). */
export function isReal(a, eps = 1e-9) {
    return Math.abs(c(a).im) < eps;
}

/** Extract real number if value is essentially real, else NaN. */
export function asReal(a) {
    a = c(a);
    return isReal(a) ? a.re : NaN;
}
