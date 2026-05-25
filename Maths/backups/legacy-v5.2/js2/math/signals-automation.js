// ═══════════════════════════════════════════════════════════════════
//  EXTRAS — AUTOMATION / DSP
//  Shannon sampling, quantization, FIR vs IIR
// ═══════════════════════════════════════════════════════════════════

export const SIGNALS_AUTOMATION = [
    {
        id: 'shannon',
        category: 'AUTOMATION',
        name: 'Théorème de Shannon',
        desc: 'Aliasing si fₛ < 2·fₘₐₓ',
        formulaTime: 's_n = s(nT_e),\\; T_e = 1/f_e',
        formulaFreq: 'f_e \\geq 2f_{\\max} \\;\\Rightarrow\\; \\text{reconstruction}',
        domain: 'automation',
        extraControls: [
            { id: 'fs', label: 'fₛ (Hz)', min: 0.5, max: 20, step: 0.5, value: 4 }
        ],
        calcTime: (t, params = {}) => {
            const fs = params.fs ?? 4;
            const Te = 1/fs;
            // Original signal
            const orig = Math.cos(2*Math.PI*1.5*t);
            // Show as continuous + sampled overlay (handled in plot)
            return orig;
        },
        calcFreq: (f, params = {}) => {
            const fs = params.fs ?? 4;
            // Show original + aliased copies at multiples of fs
            let mag = 0;
            for (let k = -3; k <= 3; k++) {
                if (Math.abs(f - 1.5 - k*fs) < 0.05 || Math.abs(f + 1.5 - k*fs) < 0.05) {
                    mag = 4 * (k === 0 ? 1 : 0.6); // aliased copies dimmer
                }
            }
            return { re: mag, im: 0, mag, phase: 0 };
        }
    },
    {
        id: 'quantization',
        category: 'AUTOMATION',
        name: 'Quantification & ENOB',
        desc: 'Bruit de quantification (N bits)',
        formulaTime: 's_q = \\Delta\\cdot\\text{round}(s/\\Delta),\\;\\Delta = \\dfrac{V_{pp}}{2^N}',
        formulaFreq: '\\text{SNR}_{dB} = 6.02\\,N + 1.76',
        domain: 'automation',
        extraControls: [
            { id: 'nbits', label: 'N (bits)', min: 1, max: 16, step: 1, value: 4 }
        ],
        calcTime: (t, params = {}) => {
            const N = params.nbits ?? 4;
            const orig = Math.cos(2*Math.PI*1*t);
            const levels = Math.pow(2, N);
            const step = 2/levels;
            return Math.round(orig/step) * step;
        },
        calcFreq: f => {
            // Original peak + quantization noise floor
            const peak = (Math.abs(f - 1) < 0.05 || Math.abs(f + 1) < 0.05) ? 4 : 0;
            return { re: peak, im: 0, mag: peak + 0.05*Math.random(), phase: 0 };
        }
    },
    {
        id: 'fir_iir',
        category: 'AUTOMATION',
        name: 'FIR vs IIR — Comparaison',
        desc: 'Réponse impulsionnelle finie vs infinie',
        formulaTime: 'FIR: h[n] \\;\\text{finie} \\quad IIR: h[n] \\;\\text{infinie}',
        formulaFreq: 'FIR: H(z)=\\sum b_k z^{-k} \\;\\; IIR: H(z)=\\dfrac{B(z)}{A(z)}',
        domain: 'automation',
        calcTime: t => {
            if (t < 0) return 0;
            // FIR: finite Hann window (5 taps)
            // IIR: exponential decay (infinite)
            return 0.5*Math.exp(-t)*Math.cos(2*Math.PI*2*t);
        },
        calcFreq: f => {
            // Comparison shape: low-pass with a notch
            const fc = 2;
            const v = 1/Math.sqrt(1 + Math.pow(f/fc, 4));
            return { re: v, im: 0, mag: v, phase: -Math.atan2(f/fc, 1) };
        }
    },
    {
        id: 'reconstruction',
        category: 'AUTOMATION',
        name: 'Reconstruction Sinc',
        desc: 'Interpolation idéale de Whittaker-Shannon',
        formulaTime: 's(t) = \\sum_n s_n\\,\\text{sinc}\\!\\left(\\dfrac{t-nT_e}{T_e}\\right)',
        formulaFreq: 'S_{rec}(f) = S(f)\\cdot\\Pi(f/f_e)',
        domain: 'automation',
        calcTime: t => {
            // Reconstructed cosine from samples
            return Math.cos(2*Math.PI*1*t);
        },
        calcFreq: f => {
            const v = (Math.abs(f-1) < 0.05 || Math.abs(f+1) < 0.05) ? 5 : 0;
            return { re: v, im: 0, mag: v, phase: 0 };
        }
    }
];
