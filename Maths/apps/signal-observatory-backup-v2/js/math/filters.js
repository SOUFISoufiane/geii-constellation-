// ═══════════════════════════════════════════════════════════════════
//  FILTERS — Butterworth, Chebyshev, RC, RLC, FIR/IIR
//  All filters return |H(f)|, φ(f), and h(t) (impulse response)
// ═══════════════════════════════════════════════════════════════════

import { factorial } from './utils.js';

/** Butterworth low-pass magnitude:  |H(f)|² = 1 / (1 + (f/fc)^(2n)) */
export function butterworthMag(f, fc, n) {
    return 1 / Math.sqrt(1 + Math.pow(Math.abs(f)/fc, 2*n));
}

/** Butterworth approximate phase (n-th order cascade of RC) */
export function butterworthPhase(f, fc, n) {
    return -n * Math.atan2(f/fc, 1);
}

/** Butterworth impulse response (Erlang-like, n-th order cascade) */
export function butterworthImpulse(t, fc, n) {
    if (t < 0) return 0;
    const a = 2*Math.PI*fc;
    return Math.pow(a, n) * Math.pow(t, n - 1) * Math.exp(-a*t) / factorial(n - 1);
}

/** Chebyshev Type I low-pass — ripple in passband */
export function chebyshevMag(f, fc, n, epsilon = 0.5) {
    const x = Math.abs(f) / fc;
    let Tn;
    if (x <= 1) Tn = Math.cos(n * Math.acos(x));
    else Tn = Math.cosh(n * Math.acosh(x));
    return 1 / Math.sqrt(1 + epsilon*epsilon * Tn*Tn);
}


/** RC low-pass — n-th order cascade of RC sections: H(s) = (1 / (1 + s/wc))^n */
export function rcLowpassMag(f, fc, n = 1) {
    return Math.pow(1 / Math.sqrt(1 + Math.pow(f/fc, 2)), n);
}

export function rcLowpassPhase(f, fc, n = 1) {
    return -n * Math.atan2(f/fc, 1);
}

/** RC high-pass:  H(jω) = jωRC / (1 + jωRC) */
export function rcHighpassMag(f, fc, n = 1) {
    const x = f/fc;
    return Math.pow(Math.abs(x) / Math.sqrt(1 + x*x), n);
}

/**
 * Series RLC band-pass / low-pass transfer function.
 *   H(jω) = 1 / (1 - LCω² + jRCω)   [output across C]
 * @returns {{mag: number, phase: number, re: number, im: number}}
 */
export function rlcSeries(omega, R, L, C, n = 1) {
    const w = omega;
    const reD = 1 - L*C*w*w;
    const imD = R*C*w;
    const den = reD*reD + imD*imD;
    const singleMag = 1 / Math.sqrt(den);
    const singlePhase = -Math.atan2(imD, reD);
    
    const totalMag = Math.pow(singleMag, n);
    const totalPhase = singlePhase * n;
    
    return {
        mag: totalMag,
        phase: totalPhase,
        re: totalMag * Math.cos(totalPhase),
        im: totalMag * Math.sin(totalPhase)
    };
}

/** RLC resonant frequency:  f₀ = 1 / (2π√(LC)) */
export function rlcResonance(L, C) {
    return 1 / (2*Math.PI*Math.sqrt(L*C));
}

/** RLC quality factor:  Q = (1/R)·√(L/C) */
export function rlcQ(R, L, C) {
    return Math.sqrt(L/C) / R;
}

/** Complex impedance of series RLC:  Z(jω) = R + jLω + 1/(jCω) */
export function impedanceRLC(omega, R, L, C) {
    const re = R;
    const im = L*omega - 1/(C*omega);
    return {
        re, im,
        mag: Math.sqrt(re*re + im*im),
        phase: Math.atan2(im, re)
    };
}

/** Apply Butterworth filter to a magnitude spectrum (multiplicative) */
export function applyButterworth(magArray, freqAxis, fc, n) {
    return magArray.map((m, i) => m * butterworthMag(freqAxis[i], fc, n));
}

/**
 * FIR filter design — windowed sinc (low-pass).
 * @param {number} N — Filter length (odd preferred)
 * @param {number} fcNorm — Normalized cutoff (0..0.5)
 * @returns {Float64Array} — Filter coefficients
 */
export function firLowpass(N, fcNorm) {
    const h = new Float64Array(N);
    const mid = (N - 1) / 2;
    for (let n = 0; n < N; n++) {
        const k = n - mid;
        // Sinc
        const sinc = k === 0 ? 2*fcNorm : Math.sin(2*Math.PI*fcNorm*k)/(Math.PI*k);
        // Hann window
        const w = 0.5 * (1 - Math.cos(2*Math.PI*n/(N-1)));
        h[n] = sinc * w;
    }
    return h;
}

// ─────────────────────────────────────────────────────────────────
//  FILTER CATALOGUE — Unified interface for all filter types
// ─────────────────────────────────────────────────────────────────

/** Chebyshev Type II — equiripple in stopband */
export function chebyshev2Mag(f, fc, n, epsilon = 0.5) {
    const x = fc / Math.max(Math.abs(f), 1e-6);
    let Tn;
    if (x <= 1) Tn = Math.cos(n * Math.acos(x));
    else Tn = Math.cosh(n * Math.acosh(x));
    return 1 / Math.sqrt(1 + 1/(epsilon*epsilon * Tn*Tn));
}

/** Bessel filter — maximally flat group delay (linear phase).
 *  Approximation using normalized Bessel polynomial coefficients for orders 1-4. */
const BESSEL_COEFS = {
    1: [1, 1],
    2: [3, 3, 1],
    3: [15, 15, 6, 1],
    4: [105, 105, 45, 10, 1]
};

export function besselMag(f, fc, n) {
    const order = Math.min(4, Math.max(1, Math.round(n)));
    const c = BESSEL_COEFS[order];
    const s_re = 0;
    const s_im = f / fc;  // jω/ωc normalized
    // Evaluate polynomial B_n(s) at s = jω/ωc
    let re = 0, im = 0;
    for (let k = 0; k < c.length; k++) {
        // (jω)^k = j^k · ω^k
        const wk = Math.pow(s_im, k);
        switch (k % 4) {
            case 0: re += c[k] * wk; break;
            case 1: im += c[k] * wk; break;
            case 2: re -= c[k] * wk; break;
            case 3: im -= c[k] * wk; break;
        }
    }
    const denMag = Math.sqrt(re*re + im*im);
    const numMag = c[0]; // normalize to unity gain at DC
    return numMag / Math.max(denMag, 1e-10);
}

export function besselPhase(f, fc, n) {
    const order = Math.min(4, Math.max(1, Math.round(n)));
    const c = BESSEL_COEFS[order];
    const s_im = f / fc;
    let re = 0, im = 0;
    for (let k = 0; k < c.length; k++) {
        const wk = Math.pow(s_im, k);
        switch (k % 4) {
            case 0: re += c[k] * wk; break;
            case 1: im += c[k] * wk; break;
            case 2: re -= c[k] * wk; break;
            case 3: im -= c[k] * wk; break;
        }
    }
    return -Math.atan2(im, re);
}

/** FIR sinc-windowed (Hann) low-pass — magnitude via frequency response */
export function firSincMag(f, fc, n) {
    // For pedagogical visualization: approximated magnitude of windowed sinc
    // Higher n -> larger N -> sharper rolloff
    const N = 8 * Math.max(1, Math.round(n)) + 1;
    const ratio = Math.abs(f / fc);
    
    // Width of transition band is roughly 4/N
    const transitionWidth = 4 / N;
    const stopbandStart = 1 + transitionWidth/2;
    const passbandEnd = 1 - transitionWidth/2;
    
    if (ratio < passbandEnd) return 1;
    if (ratio > stopbandStart) return 0.01; // small leakage
    
    // Linear transition in the transition band
    return 1 - (ratio - passbandEnd) / transitionWidth;
}

/** IIR (single biquad section approximation) — same magnitude shape as Butterworth n=2 */
export function iirBiquadMag(f, fc, n) {
    const Q = 0.707;  // critically damped
    const w = f / fc;
    const magSingle = 1 / Math.sqrt(Math.pow(1 - w*w, 2) + Math.pow(w/Q, 2));
    return Math.pow(magSingle, n);
}

export function iirBiquadPhase(f, fc, n) {
    const Q = 0.707;
    const w = f / fc;
    return -n * Math.atan2(w/Q, 1 - w*w);
}

/** Get filter response by type (unified API) */
export function getFilterResponse(type, f, fc, n) {
    switch (type) {
        case 'butterworth':  return { mag: butterworthMag(f, fc, n),  phase: butterworthPhase(f, fc, n) };
        case 'chebyshev1':   return { mag: chebyshevMag(f, fc, n, 0.5), phase: butterworthPhase(f, fc, n) }; // phase approx
        case 'chebyshev2':   return { mag: chebyshev2Mag(f, fc, n, 0.5), phase: butterworthPhase(f, fc, n) };
        case 'bessel':       return { mag: besselMag(f, fc, n), phase: besselPhase(f, fc, n) };
        case 'rc':           return { mag: rcLowpassMag(f, fc, n), phase: rcLowpassPhase(f, fc, n) };
        case 'rlc':          {
            // Series RLC normalized to fc (use Q=1)
            const omega = 2*Math.PI*f;
            const w0 = 2*Math.PI*fc;
            const R = 1, L = 1/(w0), C = 1/(w0);
            const r = rlcSeries(omega, R, L, C, n);
            return { mag: r.mag, phase: r.phase };
        }
        case 'fir':          return { mag: firSincMag(f, fc, n), phase: 0 };  // linear phase = constant delay
        case 'iir':          return { mag: iirBiquadMag(f, fc, n), phase: iirBiquadPhase(f, fc, n) };
        default:             return { mag: butterworthMag(f, fc, n), phase: butterworthPhase(f, fc, n) };
    }
}

/** Filter impulse response (approximated for visualization) */
export function getFilterImpulse(type, t, fc, n) {
    if (t < 0) return 0;
    const a = 2*Math.PI*fc;
    switch (type) {
        case 'butterworth':  return butterworthImpulse(t, fc, n);
        case 'rc':           return Math.pow(a, n) * Math.pow(t, n - 1) * Math.exp(-a*t) / factorial(n - 1);
        case 'rlc':          {
            // Simplified impulse for n-th order RLC cascade
            const w0 = 2*Math.PI*fc;
            const alpha = w0/2;
            const wd = w0 * Math.sqrt(3)/2; // Q=1 approx
            return Math.pow(w0, 2*n) * Math.pow(t, 2*n - 1) * Math.exp(-alpha*t) * Math.sin(wd*t) / factorial(2*n - 1);
        }
        case 'bessel':       return Math.pow(a, n) * Math.pow(t, n-1) * Math.exp(-a*t) / factorial(n-1);
        case 'chebyshev1':
        case 'chebyshev2':   {
            // Damped oscillation with frequency dependent on n
            return a * Math.exp(-a*t/2) * Math.cos(a*t*0.7 * n);
        }
        case 'fir':          {
            const N = 8*Math.max(1, Math.round(n)) + 1;
            const Ts = 1/(2*fc);
            const mid = N/2;
            const sample = t / Ts;
            if (sample < 0 || sample > N) return 0;
            const k = sample - mid;
            const sincVal = k === 0 ? 1 : Math.sin(Math.PI*k/4)/(Math.PI*k/4);
            const window = 0.5 * (1 - Math.cos(2*Math.PI*sample/N));
            return sincVal * window;
        }
        case 'iir':          {
            // Cascade of n biquads
            return Math.pow(a, 2*n) * Math.pow(t, 2*n - 1) * Math.exp(-a*t*0.707) * Math.sin(a*t*0.707) / factorial(2*n - 1);
        }
        default:             return butterworthImpulse(t, fc, n);
    }
}

/** Metadata about each filter type */
export const FILTER_TYPES = {
    butterworth: { label: 'Butterworth', cls: 'analog', formula: '\\dfrac{1}{\\sqrt{1+(f/f_c)^{2n}}}',
                   desc: 'Maximally flat passband — no ripple' },
    chebyshev1:  { label: 'Chebyshev I',  cls: 'analog', formula: '\\dfrac{1}{\\sqrt{1+\\varepsilon^2 T_n^2(f/f_c)}}',
                   desc: 'Equiripple in passband — sharper rolloff' },
    chebyshev2:  { label: 'Chebyshev II', cls: 'analog', formula: '\\dfrac{1}{\\sqrt{1+\\dfrac{1}{\\varepsilon^2 T_n^2(f_c/f)}}}',
                   desc: 'Equiripple in stopband — flat passband' },
    bessel:      { label: 'Bessel',       cls: 'analog', formula: '\\dfrac{B_n(0)}{B_n(jf/f_c)}',
                   desc: 'Linear phase — maximally flat group delay' },
    rc:          { label: 'RC (1er ordre)', cls: 'analog', formula: '\\dfrac{1}{1+j(f/f_c)}',
                   desc: 'Le plus simple — pente −20 dB/déc' },
    rlc:         { label: 'RLC (2nd ordre)', cls: 'analog', formula: '\\dfrac{1}{1-LC\\omega^2 + jRC\\omega}',
                   desc: 'Résonance LC — surtension Q possible' },
    fir:         { label: 'FIR (sinc-Hann)', cls: 'digital', formula: '\\sum b_k z^{-k}',
                   desc: 'Réponse finie — phase linéaire garantie' },
    iir:         { label: 'IIR (biquad)',  cls: 'digital', formula: '\\dfrac{b_0+b_1z^{-1}+b_2z^{-2}}{1+a_1z^{-1}+a_2z^{-2}}',
                   desc: 'Récursif — ordre faible, efficace' }
};

/** Convolve two signals (direct, O(N·M)) */
export function convolve(x, h) {
    const N = x.length, M = h.length;
    const y = new Float64Array(N + M - 1);
    for (let n = 0; n < N + M - 1; n++) {
        let s = 0;
        const kMin = Math.max(0, n - M + 1);
        const kMax = Math.min(N - 1, n);
        for (let k = kMin; k <= kMax; k++) s += x[k] * h[n - k];
        y[n] = s;
    }
    return y;
}
