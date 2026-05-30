// ═══════════════════════════════════════════════════════════════════
//  MATH UTILITIES — Shared helpers
// ═══════════════════════════════════════════════════════════════════

export const dirac = (x, w = 0.04, h = 9) => Math.abs(x) < w/2 ? h : 0;

export function linspace(start, end, n) {
    const arr = new Float64Array(n);
    const step = (end - start) / (n - 1);
    for (let i = 0; i < n; i++) arr[i] = start + i * step;
    return arr;
}

export function logspace(start, end, n) {
    const arr = new Float64Array(n);
    const step = (end - start) / (n - 1);
    for (let i = 0; i < n; i++) arr[i] = Math.pow(10, start + i * step);
    return arr;
}

export function factorial(n) {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

export function throttle(fn, wait) {
    let last = 0;
    return (...args) => {
        const now = Date.now();
        if (now - last >= wait) {
            fn(...args);
            last = now;
        }
    };
}

export function debounce(fn, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), wait);
    };
}

/** Find local maxima in magnitude spectrum */
export function findPeaks(data, threshold = 0.1) {
    const peaks = [];
    for (let i = 1; i < data.length - 1; i++) {
        if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > threshold) {
            peaks.push(i);
        }
    }
    return peaks;
}

/** Moving Average (Spectral Envelope) */
export function movingAverage(data, windowSize = 5) {
    const result = new Float64Array(data.length);
    const half = Math.floor(windowSize / 2);
    for (let i = 0; i < data.length; i++) {
        let sum = 0, count = 0;
        for (let j = Math.max(0, i - half); j <= Math.min(data.length - 1, i + half); j++) {
            sum += data[j];
            count++;
        }
        result[i] = sum / count;
    }
    return result;
}

// ─── WINDOWING FUNCTIONS ──────────────────────────────────────────
export function getWindow(type, N) {
    const w = new Float64Array(N);
    for (let n = 0; n < N; n++) {
        switch (type) {
            case 'hann':
                w[n] = 0.5 * (1 - Math.cos(2 * Math.PI * n / (N - 1)));
                break;
            case 'hamming':
                w[n] = 0.54 - 0.46 * Math.cos(2 * Math.PI * n / (N - 1));
                break;
            case 'blackman':
                w[n] = 0.42 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)) + 0.08 * Math.cos(4 * Math.PI * n / (N - 1));
                break;
            case 'rectangular':
            default:
                w[n] = 1.0;
                break;
        }
    }
    return w;
}

export function getContinuousWindow(type, frac) {
    if (frac < 0 || frac > 1) return 0;
    switch (type) {
        case 'hann':
            return 0.5 * (1 - Math.cos(2 * Math.PI * frac));
        case 'hamming':
            return 0.54 - 0.46 * Math.cos(2 * Math.PI * frac);
        case 'blackman':
            return 0.42 - 0.5 * Math.cos(2 * Math.PI * frac) + 0.08 * Math.cos(4 * Math.PI * frac);
        case 'rectangular':
        default:
            return 1.0;
    }
}

// ─── PHASE UNWRAPPING ─────────────────────────────────────────────
export function unwrap(phases) {
    const result = new Float64Array(phases.length);
    if (phases.length === 0) return result;
    result[0] = phases[0];
    let offset = 0;
    for (let i = 1; i < phases.length; i++) {
        let d = phases[i] - phases[i - 1];
        if (d > Math.PI) offset -= 2 * Math.PI;
        else if (d < -Math.PI) offset += 2 * Math.PI;
        result[i] = phases[i] + offset;
    }
    return result;
}

// ─── NOISE GENERATORS ─────────────────────────────────────────────
let pink_b0=0, pink_b1=0, pink_b2=0, pink_b3=0, pink_b4=0, pink_b5=0, pink_b6=0;
let brown_last = 0;

export function getNoise(type) {
    const white = Math.random() * 2 - 1;
    switch (type) {
        case 'pink': {
            pink_b0 = 0.99886 * pink_b0 + white * 0.0555179;
            pink_b1 = 0.99332 * pink_b1 + white * 0.0750759;
            pink_b2 = 0.96900 * pink_b2 + white * 0.1538520;
            pink_b3 = 0.86650 * pink_b3 + white * 0.3104856;
            pink_b4 = 0.55000 * pink_b4 + white * 0.5329522;
            pink_b5 = -0.7616 * pink_b5 - white * 0.0168980;
            const p = pink_b0 + pink_b1 + pink_b2 + pink_b3 + pink_b4 + pink_b5 + pink_b6 + white * 0.5362;
            pink_b6 = white * 0.115926;
            return p * 0.11;
        }
        case 'brown': {
            brown_last = (brown_last + (0.02 * white)) / 1.02;
            return brown_last * 3.5;
        }
        case 'white':
        default:
            return white;
    }
}
export function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }
export function sinc(x) { return x === 0 ? 1 : Math.sin(Math.PI * x) / (Math.PI * x); }
export function hzToMel(hz) { return 2595 * Math.log10(1 + hz / 700); }
export function melToHz(mel) { return 700 * (Math.pow(10, mel / 2595) - 1); }
