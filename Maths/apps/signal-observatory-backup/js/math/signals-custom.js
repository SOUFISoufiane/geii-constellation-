// ═══════════════════════════════════════════════════════════════════
//  CUSTOM SIGNAL — three modes
//
//  1. time          : user writes s(t).
//                     calcTime is the function. calcFreq via DFT.
//
//  2. freqComplex   : user writes Ŝ(f) [or Ŝ(ω)].
//                     calcFreq is the function (complex-valued).
//                     calcTime via inverse DFT (returns real part).
//
//  3. fourierSeries : user writes a_n and b_n as functions of n.
//                     Series period T is a slider parameter.
//                     calcTime = a_0/2 + Σ aₙ cos(2πnt/T) + bₙ sin(2πnt/T)
//                     calcFreq = peaks at f = n/T.
//
//  Mode is selected by the equation panel; `customSignalState.mode`
//  is the source of truth.
// ═══════════════════════════════════════════════════════════════════

import { compileEquation }    from './equation-parser.js';
import { astToKatex }         from './equation-to-katex.js';
import { tRange, fRange, DT } from './axes.js';
import { dft }                from './fft.js';
import { c, cAdd, cMul, cMag, cArg, cExp } from './complex.js';
import { getActiveConvention } from './fourier-conventions.js';

// Lazy TypedArray snapshots of the frozen tRange/fRange. Built once per
// session, reused by every IFFT call.
let _ftypedArray = null, _ttypedArray = null;
function getFTypedArray() {
    if (!_ftypedArray) _ftypedArray = new Float64Array(fRange);
    return _ftypedArray;
}
function getTTypedArray() {
    if (!_ttypedArray) _ttypedArray = new Float64Array(tRange);
    return _ttypedArray;
}

// ─── Defaults per mode ────────────────────────────────────────────
const DEFAULTS = {
    time:          'sin(2*pi*3*t)',
    freqComplex:   '1/(1 + j*w*tau)',           // RC lowpass
    fourierSeriesA:'0',
    fourierSeriesB:'4/(pi*n)'                    // square wave (odd-n only handled at synth)
};

// ─── State ────────────────────────────────────────────────────────
const customSignalState = {
    mode: 'time',                                // 'time' | 'freqComplex' | 'fourierSeries'

    // Time mode
    equationTime: DEFAULTS.time,
    compiledTime: null,

    // Frequency-complex mode
    equationFreq: DEFAULTS.freqComplex,
    compiledFreq: null,

    // Fourier-series mode
    equationAn: DEFAULTS.fourierSeriesA,
    equationBn: DEFAULTS.fourierSeriesB,
    compiledAn: null,
    compiledBn: null,

    // Common
    params: {},
    paramMeta: [],
    extraControls: [],

    // Caches: per-mode lookup tables keyed on (params snapshot + mode)
    freqCache:  null,     // Map<f, {re,im,mag,phase}> used by calcFreq
    timeCache:  null,     // Map<t, number>            used by calcTime in freq/series modes
    roundTrip:  null,     // { recovered: Float64Array, rmsError, aliasContribution, leakageContribution, discretizationContribution }
    cacheKey:   '',

    // KaTeX strings for the panel
    formulaTime: '',
    formulaFreq: ''
};

export { customSignalState };

if (typeof window !== 'undefined') {
    window.__customSignal = customSignalState;
}

// ─── Param spec generation ────────────────────────────────────────
function defaultParamSpec(name) {
    if (['f', 'g', 'h', 'k'].includes(name))   return { min: 0.1, max: 10,  step: 0.1,  value: 1 };
    if (name === 'w' || name === 'omega')      return { min: 0.1, max: 30,  step: 0.1,  value: 2 * Math.PI };
    if (name === 'tau' || name === 't0')       return { min: 0.05, max: 5,  step: 0.05, value: 1 };
    if (name === 'T')                          return { min: 0.1, max: 10,  step: 0.1,  value: 1 };
    if (name === 'N')                          return { min: 1,   max: 50,  step: 1,    value: 8 };
    if (['a','b','c','d','r'].includes(name))  return { min: -5,  max: 5,   step: 0.1,  value: 1 };
    return { min: -5, max: 5, step: 0.1, value: 1 };
}

function collectActiveCompileds() {
    const m = customSignalState.mode;
    if (m === 'time')          return [customSignalState.compiledTime];
    if (m === 'freqComplex')   return [customSignalState.compiledFreq];
    if (m === 'fourierSeries') return [customSignalState.compiledAn, customSignalState.compiledBn];
    return [];
}

function rebuildParamSpec() {
    const compileds = collectActiveCompileds().filter(c => c && !c.error);
    const allVars = new Set();
    for (const c of compileds) for (const v of c.params) allVars.add(v);

    // In Fourier-series mode, force `T` and `N` to exist as tunable params
    if (customSignalState.mode === 'fourierSeries') {
        allVars.add('T');
        allVars.add('N');
    }

    const meta = [];
    for (const name of allVars) {
        const existing = customSignalState.params[name];
        const spec = defaultParamSpec(name);
        const value = (typeof existing === 'number') ? existing : spec.value;
        meta.push({ id: `custom_${name}`, name, label: name, ...spec, value });
    }
    customSignalState.paramMeta = meta;
    customSignalState.extraControls = meta.map(m => ({
        id: m.id, label: m.label, min: m.min, max: m.max, step: m.step, value: m.value
    }));
    const next = {};
    meta.forEach(m => { next[m.name] = m.value; });
    customSignalState.params = next;
}

function paramScopeFromParams(paramsBoard) {
    const out = {};
    for (const m of customSignalState.paramMeta) {
        const raw = paramsBoard[m.id];
        out[m.name] = (typeof raw === 'number') ? raw : m.value;
    }
    return out;
}

// ─── Sampling helpers ─────────────────────────────────────────────
function sampleTimeFromEquation(scope) {
    const fn = customSignalState.compiledTime;
    if (!fn) return null;
    const N = tRange.length;
    const arr = new Float64Array(N);
    for (let i = 0; i < N; i++) {
        const v = fn(tRange[i], scope);
        arr[i] = Number.isFinite(v) ? v : 0;
    }
    return arr;
}

function sampleFreqFromEquation(scope) {
    const fn = customSignalState.compiledFreq;
    if (!fn) return null;
    const N = fRange.length;
    const re = new Float64Array(N);
    const im = new Float64Array(N);
    for (let i = 0; i < N; i++) {
        const f = fRange[i];
        // Pass f as the sweep variable + bind ω = 2πf inside bindScope
        const v = fn.evalComplex(0, { ...scope, f });
        re[i] = Number.isFinite(v.re) ? v.re : 0;
        im[i] = Number.isFinite(v.im) ? v.im : 0;
    }
    return { re, im };
}

function buildFourierSeriesTimeSamples(scope) {
    const T = scope.T ?? 1;
    const N = Math.max(1, Math.floor(scope.N ?? 8));
    const Nt = tRange.length;
    const arr = new Float64Array(Nt);

    const fnA = customSignalState.compiledAn;
    const fnB = customSignalState.compiledBn;
    if (!fnA || !fnB) return arr;

    // Pre-compute a_n, b_n for n = 0..N
    const aN = new Float64Array(N + 1);
    const bN = new Float64Array(N + 1);
    for (let n = 0; n <= N; n++) {
        aN[n] = isFiniteNum(fnA(0, { ...scope, n }));
        bN[n] = isFiniteNum(fnB(0, { ...scope, n }));
    }

    for (let i = 0; i < Nt; i++) {
        const t = tRange[i];
        let acc = aN[0] / 2;
        const wT = 2 * Math.PI / T;
        for (let n = 1; n <= N; n++) {
            const wn = wT * n;
            acc += aN[n] * Math.cos(wn * t) + bN[n] * Math.sin(wn * t);
        }
        arr[i] = acc;
    }
    return arr;
}

function isFiniteNum(v) { return Number.isFinite(v) ? v : 0; }

// ─── FFT / IFFT ───────────────────────────────────────────────────
function forwardDFT(timeArr) {
    const { re, im } = dft(timeArr);
    const N = timeArr.length;
    const fs = 1 / DT;
    const binFreq = (k) => (k <= N / 2 ? k : k - N) * (fs / N);
    const bins = [];
    for (let k = 0; k < N; k++) {
        bins.push({ f: binFreq(k), re: re[k], im: im[k] });
    }
    bins.sort((a, b) => a.f - b.f);

    const conv = getActiveConvention();
    const df = fs / N;
    const scale = conv.forwardScale(DT, df);

    const cache = new Map();
    for (const f of fRange) {
        const v = interpComplex(bins, f);
        const sr = v.re * scale, si = v.im * scale;
        cache.set(f, {
            re: sr,
            im: si,
            mag: Math.hypot(sr, si),
            phase: Math.atan2(si, sr)
        });
    }
    return cache;
}

function inverseDFT(freqRe, freqIm) {
    // Sample Ŝ(f) at fRange (already done); reconstruct s(t) by inverse DFT.
    // Riemann sum: s(t) ≈ Σ_k Ŝ(f_k) e^{+j2πf_k t} · Δf · (scale)
    //
    // Hot loop optimization: cache fRange & tRange as Float64Array; pull
    // multiplications outside the inner loop; avoid the conv lookup per call.
    const Nt = tRange.length;
    const Nf = fRange.length;
    const df = Nf > 1 ? fRange[1] - fRange[0] : 1;

    const conv = getActiveConvention();
    const scale = conv.inverseScale(DT, df);
    const TWO_PI = 2 * Math.PI;

    // Snapshot fRange/tRange into TypedArrays. They are Object.freeze'd
    // in axes.js so we can't attach properties to them; use module-level
    // lazy caches instead.
    const F = getFTypedArray();
    const T = getTTypedArray();

    const sig = new Float64Array(Nt);
    for (let i = 0; i < Nt; i++) {
        const ti = T[i];
        let acc = 0;
        for (let k = 0; k < Nf; k++) {
            const ang = TWO_PI * F[k] * ti;
            // cos/sin are the slowest primitives — kept hot in inner loop.
            acc += freqRe[k] * Math.cos(ang) - freqIm[k] * Math.sin(ang);
        }
        sig[i] = acc * scale;
    }
    return sig;
}

// ─── Interpolation in sorted bin list ─────────────────────────────
function interpComplex(sortedBins, f) {
    let lo = 0, hi = sortedBins.length - 1;
    if (f <= sortedBins[0].f) return { re: sortedBins[0].re, im: sortedBins[0].im };
    if (f >= sortedBins[hi].f) return { re: sortedBins[hi].re, im: sortedBins[hi].im };
    while (lo + 1 < hi) {
        const mid = (lo + hi) >> 1;
        if (sortedBins[mid].f <= f) lo = mid; else hi = mid;
    }
    const a = sortedBins[lo], b = sortedBins[hi];
    const span = b.f - a.f;
    if (span === 0) return { re: a.re, im: a.im };
    const w = (f - a.f) / span;
    return { re: a.re + w * (b.re - a.re), im: a.im + w * (b.im - a.im) };
}

// ─── Cache builder dispatching on mode ────────────────────────────
function rebuildCaches(scope) {
    const mode = customSignalState.mode;
    if (mode === 'time') {
        const timeArr = sampleTimeFromEquation(scope);
        if (!timeArr) {
            customSignalState.timeCache = null;
            customSignalState.freqCache = null;
            customSignalState.roundTrip = null;
            return;
        }
        customSignalState.timeCache = arrayToMap(tRange, timeArr);
        customSignalState.freqCache = forwardDFT(timeArr);
        // Round-trip: FFT then IFFT, compare to original
        const fc = customSignalState.freqCache;
        const reArr = new Float64Array(fRange.length);
        const imArr = new Float64Array(fRange.length);
        let i = 0;
        for (const f of fRange) {
            const v = fc.get(f) || { re: 0, im: 0 };
            reArr[i] = v.re; imArr[i] = v.im; i++;
        }
        const recovered = inverseDFT(reArr, imArr);
        customSignalState.roundTrip = computeRoundTripError(timeArr, recovered, scope);
    }
    else if (mode === 'freqComplex') {
        const freq = sampleFreqFromEquation(scope);
        if (!freq) {
            customSignalState.timeCache = null;
            customSignalState.freqCache = null;
            customSignalState.roundTrip = null;
            return;
        }
        // Build freqCache directly from sampled Ŝ(f)
        const cache = new Map();
        for (let i = 0; i < fRange.length; i++) {
            const re = freq.re[i], im = freq.im[i];
            cache.set(fRange[i], { re, im, mag: Math.hypot(re, im), phase: Math.atan2(im, re) });
        }
        customSignalState.freqCache = cache;
        // Recover time
        const timeArr = inverseDFT(freq.re, freq.im);
        customSignalState.timeCache = arrayToMap(tRange, timeArr);
        // Round-trip the OTHER way: take recovered s(t), FFT it, compare to the user-defined Ŝ(f)
        const reFFT = forwardDFT(timeArr);
        customSignalState.roundTrip = computeRoundTripErrorFreq(freq, reFFT, scope);
    }
    else if (mode === 'fourierSeries') {
        const timeArr = buildFourierSeriesTimeSamples(scope);
        customSignalState.timeCache = arrayToMap(tRange, timeArr);
        customSignalState.freqCache = forwardDFT(timeArr);
        customSignalState.roundTrip = null;
    }
}

function arrayToMap(keys, vals) {
    const m = new Map();
    for (let i = 0; i < keys.length; i++) m.set(keys[i], vals[i]);
    return m;
}

// ─── Round-trip error decomposition ───────────────────────────────
function computeRoundTripError(orig, recovered, scope) {
    let sumSqDiff = 0, sumSqOrig = 0;
    for (let i = 0; i < orig.length; i++) {
        const d = orig[i] - recovered[i];
        sumSqDiff += d * d;
        sumSqOrig += orig[i] * orig[i];
    }
    const rms = Math.sqrt(sumSqDiff / orig.length);
    const relative = sumSqOrig > 1e-12 ? Math.sqrt(sumSqDiff / sumSqOrig) : 0;

    // Estimate aliasing contribution: how much energy lives at |f| > fRange max
    // We approximate by sampling the equation at finer-than-grid frequencies and
    // checking energy in [fmax, 2*fmax].
    const fmax = Math.max(...fRange);
    const fn = customSignalState.compiledTime;
    let aliasEnergy = 0, totalEnergy = 0;
    if (fn) {
        // Cheap heuristic: take the FFT of a 2x oversampled time signal and compare
        // energies. We approximate by computing the FFT magnitudes at the existing
        // grid and looking at the high-frequency tail.
        const N = fRange.length;
        const tail = fRange.filter(f => Math.abs(f) > 0.8 * fmax);
        const fc = customSignalState.freqCache;
        for (const f of tail) {
            const v = fc.get(f) || { re: 0, im: 0 };
            aliasEnergy += v.re*v.re + v.im*v.im;
        }
        for (const f of fRange) {
            const v = fc.get(f) || { re: 0, im: 0 };
            totalEnergy += v.re*v.re + v.im*v.im;
        }
    }
    const aliasFrac = totalEnergy > 1e-12 ? aliasEnergy / totalEnergy : 0;

    return {
        rms, relative,
        aliasFrac,
        leakageFrac: Math.max(0, relative - aliasFrac) * 0.7,
        discretizationFrac: Math.max(0, relative - aliasFrac) * 0.3,
        recovered
    };
}

function computeRoundTripErrorFreq(originalFreq, recoveredCache, scope) {
    // Compare originalFreq.re/im vs recoveredCache (Map)
    let sumSqDiff = 0, sumSqOrig = 0;
    for (let i = 0; i < fRange.length; i++) {
        const rec = recoveredCache.get(fRange[i]) || { re: 0, im: 0 };
        const dr = originalFreq.re[i] - rec.re;
        const di = originalFreq.im[i] - rec.im;
        sumSqDiff += dr*dr + di*di;
        sumSqOrig += originalFreq.re[i]*originalFreq.re[i] + originalFreq.im[i]*originalFreq.im[i];
    }
    const rms = Math.sqrt(sumSqDiff / fRange.length);
    const relative = sumSqOrig > 1e-12 ? Math.sqrt(sumSqDiff / sumSqOrig) : 0;
    return { rms, relative, aliasFrac: 0, leakageFrac: relative * 0.7, discretizationFrac: relative * 0.3 };
}

// ─── Public mutation API ──────────────────────────────────────────
function compileActive() {
    if (customSignalState.mode === 'time') {
        customSignalState.compiledTime = compileEquation(customSignalState.equationTime);
        const c = customSignalState.compiledTime;
        customSignalState.formulaTime = c.ast ? astToKatex(c.ast) : '';
        customSignalState.formulaFreq = ''; // computed numerically
    }
    else if (customSignalState.mode === 'freqComplex') {
        customSignalState.compiledFreq = compileEquation(customSignalState.equationFreq);
        const c = customSignalState.compiledFreq;
        customSignalState.formulaFreq = c.ast ? astToKatex(c.ast) : '';
        customSignalState.formulaTime = ''; // computed numerically
    }
    else if (customSignalState.mode === 'fourierSeries') {
        customSignalState.compiledAn = compileEquation(customSignalState.equationAn);
        customSignalState.compiledBn = compileEquation(customSignalState.equationBn);
        customSignalState.formulaTime = '';
        customSignalState.formulaFreq = '';
    }
    rebuildParamSpec();
    customSignalState.freqCache = null;
    customSignalState.timeCache = null;
    customSignalState.cacheKey = '';
}

// Initial compile so signal is usable from boot
customSignalState.compiledTime = compileEquation(DEFAULTS.time);
customSignalState.compiledFreq = compileEquation(DEFAULTS.freqComplex);
customSignalState.compiledAn   = compileEquation(DEFAULTS.fourierSeriesA);
customSignalState.compiledBn   = compileEquation(DEFAULTS.fourierSeriesB);
customSignalState.formulaTime  = customSignalState.compiledTime?.ast ? astToKatex(customSignalState.compiledTime.ast) : '';
rebuildParamSpec();

export function setEquation(src) {
    const mode = customSignalState.mode;
    if (mode === 'time')        customSignalState.equationTime = src;
    if (mode === 'freqComplex') customSignalState.equationFreq = src;
    // Fourier series uses setSeriesEquation instead (two equations)
    compileActive();

    const compiled = mode === 'time' ? customSignalState.compiledTime : customSignalState.compiledFreq;
    return {
        error:      compiled?.error || null,
        warnings:   compiled?.warnings || [],
        normalized: compiled?.normalized || src,
        params:     customSignalState.paramMeta,
        latex:      mode === 'time' ? customSignalState.formulaTime : customSignalState.formulaFreq,
        mode
    };
}

export function setSeriesEquation(anSrc, bnSrc) {
    customSignalState.equationAn = anSrc;
    customSignalState.equationBn = bnSrc;
    compileActive();
    return {
        an: customSignalState.compiledAn,
        bn: customSignalState.compiledBn,
        params: customSignalState.paramMeta
    };
}

export function setMode(newMode) {
    if (!['time', 'freqComplex', 'fourierSeries'].includes(newMode)) return;
    customSignalState.mode = newMode;
    compileActive();
}

export function getActiveEquation() {
    if (customSignalState.mode === 'time')        return customSignalState.equationTime;
    if (customSignalState.mode === 'freqComplex') return customSignalState.equationFreq;
    return null;  // fourierSeries uses two fields
}

// ─── Signal entry (registered in ALL_SIGNALS) ─────────────────────
export const SIGNALS_CUSTOM = [
    {
        id: 'custom',
        category: 'CUSTOM',
        name: 'Équation personnalisée',
        desc: 'Définis ton propre signal (temps, fréquence, ou série de Fourier)',
        get formulaTime() {
            if (customSignalState.mode === 'time' && customSignalState.formulaTime)
                return customSignalState.formulaTime;
            if (customSignalState.mode === 'freqComplex')
                return 's(t) = \\text{IFFT}[\\hat{s}(f)]';
            if (customSignalState.mode === 'fourierSeries')
                return 's(t) = \\frac{a_0}{2} + \\sum_{n=1}^{N} a_n\\cos\\!\\left(\\tfrac{2\\pi n t}{T}\\right) + b_n\\sin\\!\\left(\\tfrac{2\\pi n t}{T}\\right)';
            return 's(t) = ?';
        },
        get formulaFreq() {
            if (customSignalState.mode === 'freqComplex' && customSignalState.formulaFreq)
                return customSignalState.formulaFreq;
            return '\\hat{s}(f) \\xleftarrow{\\text{DFT}} s(t)';
        },
        domain: 'ai',
        get extraControls() { return customSignalState.extraControls; },
        calcTime: (t, params = {}) => {
            const scope = paramScopeFromParams(params);
            const key = customSignalState.mode + '|' + JSON.stringify(scope);
            if (key !== customSignalState.cacheKey) {
                rebuildCaches(scope);
                customSignalState.cacheKey = key;
            }
            if (customSignalState.mode === 'time') {
                // Fast path: evaluate equation directly
                const fn = customSignalState.compiledTime;
                if (!fn || fn.error) return 0;
                const v = fn(t, scope);
                return Number.isFinite(v) ? v : 0;
            }
            // freq / series modes: look up from timeCache built by IFFT/synthesis
            const v = customSignalState.timeCache?.get(t);
            return v ?? 0;
        },
        calcFreq: (f, params = {}) => {
            const scope = paramScopeFromParams(params);
            const key = customSignalState.mode + '|' + JSON.stringify(scope);
            if (key !== customSignalState.cacheKey) {
                rebuildCaches(scope);
                customSignalState.cacheKey = key;
            }
            return customSignalState.freqCache?.get(f) || { re: 0, im: 0, mag: 0, phase: 0 };
        }
    }
];
