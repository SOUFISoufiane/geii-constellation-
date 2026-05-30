// ═══════════════════════════════════════════════════════════════════
//  EXTRAS — ELECTRICAL / POWER ENGINEERING
//  RLC, impedance, Smith chart, THD
// ═══════════════════════════════════════════════════════════════════

import { rlcSeries, impedanceRLC, rlcResonance, rlcQ } from './filters.js';

// Default RLC values (modifiable via UI later)
const R_DEFAULT = 1, L_DEFAULT = 0.1, C_DEFAULT = 0.1;

export const SIGNALS_ELECTRICAL = [
    {
        id: 'rlc_series',
        category: 'ELECTRICAL',
        name: 'Circuit RLC Série',
        desc: 'Résonance — sortie aux bornes de C',
        formulaTime: 'h(t) = \\dfrac{1}{LC}e^{-\\alpha t}\\sin(\\omega_d t)\\cdot u(t)',
        formulaFreq: 'H(j\\omega)=\\dfrac{1}{1-LC\\omega^2 + jRC\\omega}',
        domain: 'electrical',
        extraControls: [
            { id: 'rlc_R', label: 'R (Ω)', min: 0.1, max: 10, step: 0.1, value: R_DEFAULT },
            { id: 'rlc_L', label: 'L (H)', min: 0.01, max: 1, step: 0.01, value: L_DEFAULT },
            { id: 'rlc_C', label: 'C (F)', min: 0.01, max: 1, step: 0.01, value: C_DEFAULT }
        ],
        calcTime: (t, params = {}) => {
            const R = params.rlc_R ?? R_DEFAULT;
            const L = params.rlc_L ?? L_DEFAULT;
            const C = params.rlc_C ?? C_DEFAULT;
            if (t < 0) return 0;
            const alpha = R/(2*L);
            const w0 = 1/Math.sqrt(L*C);
            const wd2 = w0*w0 - alpha*alpha;
            if (wd2 <= 0) return Math.exp(-alpha*t); // overdamped → simple decay
            const wd = Math.sqrt(wd2);
            return (1/(L*C*wd)) * Math.exp(-alpha*t) * Math.sin(wd*t);
        },
        calcFreq: (f, params = {}) => {
            const R = params.rlc_R ?? R_DEFAULT;
            const L = params.rlc_L ?? L_DEFAULT;
            const C = params.rlc_C ?? C_DEFAULT;
            return rlcSeries(2*Math.PI*f, R, L, C);
        },
        info: (params = {}) => {
            const R = params.rlc_R ?? R_DEFAULT;
            const L = params.rlc_L ?? L_DEFAULT;
            const C = params.rlc_C ?? C_DEFAULT;
            return {
                f0: rlcResonance(L, C),
                Q: rlcQ(R, L, C),
                bw: rlcResonance(L, C) / rlcQ(R, L, C)
            };
        }
    },
    {
        id: 'impedance_rlc',
        category: 'ELECTRICAL',
        name: 'Impédance Complexe Z(jω)',
        desc: 'Z = R + jLω − j/(Cω)',
        formulaTime: 'i(t) = \\dfrac{v(t)}{|Z|}\\cos(\\omega t - \\arg Z)',
        formulaFreq: 'Z(j\\omega) = R + jL\\omega + \\dfrac{1}{jC\\omega}',
        domain: 'electrical',
        extraControls: [
            { id: 'rlc_R', label: 'R (Ω)', min: 0.1, max: 10, step: 0.1, value: 1 },
            { id: 'rlc_L', label: 'L (H)', min: 0.01, max: 1, step: 0.01, value: 0.1 },
            { id: 'rlc_C', label: 'C (F)', min: 0.01, max: 1, step: 0.01, value: 0.1 }
        ],
        calcTime: (t, _p) => {
            // Show current i(t) for v(t) = cos(ω₀t) with ω₀ = 2π·1
            const omega = 2*Math.PI*1;
            const phi = Math.atan2(0.1*omega - 1/(0.1*omega), 1);
            return Math.cos(omega*t - phi);
        },
        calcFreq: (f, params = {}) => {
            const R = params.rlc_R ?? 1;
            const L = params.rlc_L ?? 0.1;
            const C = params.rlc_C ?? 0.1;
            const omega = 2*Math.PI*Math.abs(f) + 1e-6;
            return impedanceRLC(omega, R, L, C);
        }
    },
    {
        id: 'thd',
        category: 'ELECTRICAL',
        name: 'THD — Distorsion Harmonique',
        desc: 'Fondamentale + harmoniques 3, 5, 7',
        formulaTime: 's(t)=\\sum_{k=1}^{7}\\dfrac{1}{k}\\cos(2\\pi k f_0 t)',
        formulaFreq: '\\text{THD}=\\dfrac{\\sqrt{\\sum_{k\\geq2}V_k^2}}{V_1}',
        domain: 'electrical',
        calcTime: t => {
            let s = 0;
            for (let k = 1; k <= 7; k += 2) s += (1/k)*Math.cos(2*Math.PI*k*t);
            return s;
        },
        calcFreq: f => {
            let mag = 0;
            for (let k = 1; k <= 7; k += 2) {
                if (Math.abs(f - k) < 0.06 || Math.abs(f + k) < 0.06) mag = (1/k) * 4;
            }
            return { re: mag, im: 0, mag, phase: 0 };
        }
    },
    {
        id: 'smith_chart',
        category: 'ELECTRICAL',
        name: 'Smith Chart',
        desc: 'Coefficient de réflexion Γ',
        formulaTime: 'v_r(t) = \\Gamma\\, v_i(t)',
        formulaFreq: '\\Gamma=\\dfrac{Z_L-Z_0}{Z_L+Z_0}',
        domain: 'electrical',
        calcTime: t => Math.exp(-Math.abs(t))*Math.cos(2*Math.PI*2*t), // visualization
        calcFreq: f => {
            // Γ as function of f for a typical reactive load
            const Z0 = 50;
            const ZL_re = 50, ZL_im = 30*Math.sign(f); // example load
            const num_re = ZL_re - Z0, num_im = ZL_im;
            const den_re = ZL_re + Z0, den_im = ZL_im;
            const denMag2 = den_re*den_re + den_im*den_im;
            const re = (num_re*den_re + num_im*den_im) / denMag2;
            const im = (num_im*den_re - num_re*den_im) / denMag2;
            return { re, im, mag: Math.sqrt(re*re + im*im), phase: Math.atan2(im, re) };
        }
    }
];
