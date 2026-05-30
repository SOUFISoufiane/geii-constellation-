// ═══════════════════════════════════════════════════════════════════
//  DSP WORKLET — AudioWorkletProcessor for real-time FFT
//  Runs in a dedicated AudioWorkletGlobalScope (separate thread).
//  Posts STFT frames back to main thread via this.port.
// ═══════════════════════════════════════════════════════════════════

/**
 * In-place Cooley-Tukey radix-2 FFT (duplicated from math/fft.js
 * because AudioWorkletGlobalScope cannot import ES modules).
 */
function fftInPlace(re, im) {
    const n = re.length;
    if (n <= 1) return;

    // Bit-reversal permutation (iterative, no recursion overhead)
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
        if (i < j) {
            let tmp = re[i]; re[i] = re[j]; re[j] = tmp;
            tmp = im[i]; im[i] = im[j]; im[j] = tmp;
        }
        let m = n >> 1;
        while (m >= 1 && j >= m) { j -= m; m >>= 1; }
        j += m;
    }

    // Butterfly stages
    for (let step = 2; step <= n; step <<= 1) {
        const half = step >> 1;
        const angle = -2 * Math.PI / step;
        const wRe = Math.cos(angle);
        const wIm = Math.sin(angle);

        for (let group = 0; group < n; group += step) {
            let tRe = 1, tIm = 0;
            for (let pair = 0; pair < half; pair++) {
                const even = group + pair;
                const odd  = even + half;

                const oRe = re[odd] * tRe - im[odd] * tIm;
                const oIm = re[odd] * tIm + im[odd] * tRe;

                re[odd] = re[even] - oRe;
                im[odd] = im[even] - oIm;
                re[even] += oRe;
                im[even] += oIm;

                const nextRe = tRe * wRe - tIm * wIm;
                const nextIm = tRe * wIm + tIm * wRe;
                tRe = nextRe;
                tIm = nextIm;
            }
        }
    }
}

/**
 * Generate a window function array.
 */
function makeWindow(type, n) {
    const w = new Float32Array(n);
    switch (type) {
        case 'hann':
            for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
            break;
        case 'hamming':
            for (let i = 0; i < n; i++) w[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
            break;
        case 'blackman':
            for (let i = 0; i < n; i++)
                w[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (n - 1));
            break;
        default: // rectangular
            w.fill(1);
    }
    return w;
}

class DSPWorkletProcessor extends AudioWorkletProcessor {
    constructor() {
        super();

        // Config defaults
        this._fftSize = 2048;
        this._windowType = 'hann';
        this._window = makeWindow('hann', 2048);
        this._smoothingTimeConstant = 0.8;
        this._previousMagnitude = new Float32Array(this._fftSize >> 1);
        this._previousMagnitude.fill(-100); // Initialize to silence (-100dB)

        // Ring buffer for accumulating samples
        this._buffer = new Float32Array(this._fftSize);
        this._writePos = 0;
        this._hopSize = this._fftSize >> 1; // 50% overlap
        this._samplesSinceLastFrame = 0;

        // Listen for config changes from main thread
        this.port.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'config') {
                if (msg.fftSize && msg.fftSize !== this._fftSize) {
                    this._fftSize = msg.fftSize;
                    this._buffer = new Float32Array(this._fftSize);
                    this._writePos = 0;
                    this._hopSize = this._fftSize >> 1;
                    this._samplesSinceLastFrame = 0;
                    this._window = makeWindow(this._windowType, this._fftSize);
                    this._previousMagnitude = new Float32Array(this._fftSize >> 1);
                    this._previousMagnitude.fill(-100);
                }
                if (msg.windowType && msg.windowType !== this._windowType) {
                    this._windowType = msg.windowType;
                    this._window = makeWindow(this._windowType, this._fftSize);
                }
            }
        };
    }

    process(inputs, outputs, parameters) {
        const input = inputs[0];
        if (!input || !input[0]) return true;

        const channel = input[0]; // mono (first channel)
        const N = this._fftSize;

        // Also pass-through audio to outputs for playback
        const output = outputs[0];
        if (output) {
            for (let ch = 0; ch < output.length; ch++) {
                const src = inputs[0][ch] || channel;
                output[ch].set(src);
            }
        }

        // Accumulate into ring buffer
        for (let i = 0; i < channel.length; i++) {
            this._buffer[this._writePos] = channel[i];
            this._writePos = (this._writePos + 1) % N;
            this._samplesSinceLastFrame++;
        }

        // Emit a frame every hop
        if (this._samplesSinceLastFrame >= this._hopSize) {
            this._samplesSinceLastFrame = 0;

            // Build windowed frame from ring buffer (most recent N samples)
            const re = new Float32Array(N);
            const im = new Float32Array(N);
            for (let i = 0; i < N; i++) {
                const idx = (this._writePos + i) % N;
                re[i] = this._buffer[idx] * this._window[i];
            }

            // Copy time domain BEFORE in-place FFT destroys it
            const timeBuffer = new Float32Array(re);

            fftInPlace(re, im);

            // Compute magnitude in dB for the first N/2 bins
            const nBins = N >> 1;
            const magnitude = new Float32Array(nBins);
            const phase = new Float32Array(nBins);
            const alpha = this._smoothingTimeConstant;

            for (let k = 0; k < nBins; k++) {
                const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
                const currentDB = 20 * Math.log10(mag + 1e-10);
                
                // Temporal Smoothing
                magnitude[k] = (alpha * this._previousMagnitude[k]) + ((1 - alpha) * currentDB);
                this._previousMagnitude[k] = magnitude[k];
                
                phase[k] = Math.atan2(im[k], re[k]);
            }

            // Post frame to main thread (transferable for zero-copy)
            this.port.postMessage({
                type: 'fft-frame',
                magnitude: magnitude.buffer,
                phase: phase.buffer,
                timeDomain: timeBuffer.buffer,
                timestamp: currentTime
            }, [magnitude.buffer, phase.buffer, timeBuffer.buffer]);
        }

        return true; // keep processor alive
    }
}

registerProcessor('dsp-worklet-processor', DSPWorkletProcessor);
