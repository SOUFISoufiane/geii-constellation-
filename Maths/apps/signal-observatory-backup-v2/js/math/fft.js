// ═══════════════════════════════════════════════════════════════════
//  FFT — Cooley-Tukey radix-2 + STFT + windowing
// ═══════════════════════════════════════════════════════════════════

/**
 * In-place complex FFT (Cooley-Tukey, radix-2).
 * Requires length to be a power of 2.
 */
export function fft(re, im) {
    const n = re.length;
    if (n <= 1) return;
    if ((n & (n - 1)) !== 0) {
        throw new Error(`FFT length must be a power of 2, got ${n}`);
    }
    const half = n >> 1;
    const reE = new Float64Array(half), imE = new Float64Array(half);
    const reO = new Float64Array(half), imO = new Float64Array(half);
    for (let i = 0; i < half; i++) {
        reE[i] = re[2*i];     imE[i] = im[2*i];
        reO[i] = re[2*i + 1]; imO[i] = im[2*i + 1];
    }
    fft(reE, imE);
    fft(reO, imO);
    for (let k = 0; k < half; k++) {
        const a  = -2 * Math.PI * k / n;
        const cr = Math.cos(a), ci = Math.sin(a);
        const pr = cr*reO[k] - ci*imO[k];
        const pi = cr*imO[k] + ci*reO[k];
        re[k]        = reE[k] + pr;  im[k]        = imE[k] + pi;
        re[k + half] = reE[k] - pr;  im[k + half] = imE[k] - pi;
    }
}

/** Inverse FFT */
export function ifft(re, im) {
    for (let i = 0; i < im.length; i++) im[i] = -im[i];
    fft(re, im);
    const n = re.length;
    for (let i = 0; i < n; i++) {
        re[i] /= n;
        im[i] = -im[i] / n;
    }
}

/** Hann window */
export function hann(n) {
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos(2*Math.PI*i/(n-1)));
    return w;
}

/** Hamming window */
export function hamming(n) {
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) w[i] = 0.54 - 0.46*Math.cos(2*Math.PI*i/(n-1));
    return w;
}

/** Blackman window */
export function blackman(n) {
    const w = new Float64Array(n);
    for (let i = 0; i < n; i++) {
        w[i] = 0.42 - 0.5*Math.cos(2*Math.PI*i/(n-1)) + 0.08*Math.cos(4*Math.PI*i/(n-1));
    }
    return w;
}

/**
 * Short-Time Fourier Transform.
 * @param {number[]} signal — Time-domain samples
 * @param {number}   winSize — Window length (power of 2)
 * @param {number}   hop — Hop size between successive windows
 * @param {Function} windowFn — Optional window factory (defaults to Hann)
 * @returns {{matrix: number[][], nFrames: number, nBins: number}}
 */
export function stft(signal, winSize = 64, hop = 16, windowFn = hann) {
    const W = windowFn(winSize);
    const nFrames = Math.max(1, Math.floor((signal.length - winSize) / hop) + 1);
    const nBins = winSize >> 1;
    const matrix = [];
    for (let fr = 0; fr < nFrames; fr++) {
        const start = fr * hop;
        const re = new Float64Array(winSize);
        const im = new Float64Array(winSize);
        for (let i = 0; i < winSize; i++) re[i] = (signal[start + i] || 0) * W[i];
        fft(re, im);
        const row = new Float32Array(nBins);
        for (let k = 0; k < nBins; k++) row[k] = Math.sqrt(re[k]*re[k] + im[k]*im[k]);
        matrix.push(row);
    }
    return { matrix, nFrames, nBins };
}

/** Discrete Fourier Transform (O(N²) — only for small N or non-power-of-2) */
export function dft(signal) {
    const N = signal.length;
    const re = new Float64Array(N);
    const im = new Float64Array(N);
    for (let k = 0; k < N; k++) {
        let sr = 0, si = 0;
        for (let n = 0; n < N; n++) {
            const a = -2*Math.PI*k*n/N;
            sr += signal[n] * Math.cos(a);
            si += signal[n] * Math.sin(a);
        }
        re[k] = sr; im[k] = si;
    }
    return { re, im };
}

/** Autocorrelation via FFT (Wiener-Khinchin) */
export function autocorrelation(signal) {
    // Zero-pad to next power of 2
    let N = 1;
    while (N < signal.length * 2) N <<= 1;
    const re = new Float64Array(N);
    const im = new Float64Array(N);
    for (let i = 0; i < signal.length; i++) re[i] = signal[i];
    fft(re, im);
    // Power spectrum
    for (let i = 0; i < N; i++) {
        re[i] = re[i]*re[i] + im[i]*im[i];
        im[i] = 0;
    }
    ifft(re, im);
    // Normalize
    const R0 = re[0] || 1;
    const out = new Float64Array(signal.length);
    for (let i = 0; i < signal.length; i++) out[i] = re[i] / R0;
    return out;
}
