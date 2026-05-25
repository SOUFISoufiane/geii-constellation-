// ═══════════════════════════════════════════════════════════════════
//  EXTRAS — AI / MACHINE LEARNING SIGNAL FEATURES
//  Spectral centroid, ZCR, MFCC, autocorrelation
// ═══════════════════════════════════════════════════════════════════

import { hzToMel, melToHz } from './utils.js';

export const SIGNALS_AI = [
    {
        id: 'ai_centroid',
        category: 'AI / ML',
        name: 'Spectral Centroid',
        desc: 'Barycentre fréquentiel — "brightness"',
        formulaTime: 's(t) = \\sum_k a_k\\cos(2\\pi k f_0 t)',
        formulaFreq: 'C = \\dfrac{\\sum_f f\\cdot|S(f)|}{\\sum_f |S(f)|}',
        domain: 'ai',
        calcTime: t => {
            // Mix of frequencies to show centroid
            return 0.6*Math.cos(2*Math.PI*1*t) + 0.3*Math.cos(2*Math.PI*3*t) + 0.1*Math.cos(2*Math.PI*5*t);
        },
        calcFreq: f => {
            let mag = 0;
            if (Math.abs(f-1) < 0.05 || Math.abs(f+1) < 0.05) mag = 0.6*4;
            if (Math.abs(f-3) < 0.05 || Math.abs(f+3) < 0.05) mag = 0.3*4;
            if (Math.abs(f-5) < 0.05 || Math.abs(f+5) < 0.05) mag = 0.1*4;
            return { re: mag, im: 0, mag, phase: 0 };
        },
        computeFeature: (magData, fAxis) => {
            let sumWeighted = 0, sumMag = 1e-10;
            for (let i = 0; i < magData.length; i++) {
                if (fAxis[i] > 0) {
                    sumWeighted += fAxis[i] * magData[i];
                    sumMag += magData[i];
                }
            }
            return sumWeighted / sumMag;
        }
    },
    {
        id: 'ai_zcr',
        category: 'AI / ML',
        name: 'Zero-Crossing Rate',
        desc: 'Compteur passages par zéro — texture',
        formulaTime: 'Z = \\dfrac{1}{2N}\\sum_n |\\text{sgn}(s_n) - \\text{sgn}(s_{n-1})|',
        formulaFreq: 'Indicateur de fréquence moyenne',
        domain: 'ai',
        calcTime: t => Math.cos(2*Math.PI*1.5*t) + 0.3*Math.random(),
        calcFreq: f => {
            const v = Math.abs(f-1.5) < 0.1 || Math.abs(f+1.5) < 0.1 ? 4 : 0;
            return { re: v, im: 0, mag: v, phase: 0 };
        },
        computeFeature: (signal) => {
            let count = 0;
            for (let i = 1; i < signal.length; i++) {
                if ((signal[i] >= 0) !== (signal[i-1] >= 0)) count++;
            }
            return count / signal.length;
        }
    },
    {
        id: 'ai_mfcc',
        category: 'AI / ML',
        name: 'MFCC — Mel-Cepstre',
        desc: 'Coefficients perceptifs (audio ML)',
        formulaTime: 's(t) \\xrightarrow{FFT} |S(f)| \\xrightarrow{\\text{Mel}} \\text{log} \\xrightarrow{DCT} MFCC',
        formulaFreq: 'M_k = \\sum_b \\log(E_b)\\cos\\!\\left[k(b-\\tfrac{1}{2})\\tfrac{\\pi}{B}\\right]',
        domain: 'ai',
        // Use chirp-like signal for interesting MFCC
        calcTime: t => Math.cos(2*Math.PI*(0.5 + 0.4*t)*t) * Math.exp(-Math.abs(t)/4),
        calcFreq: f => {
            const v = (f > 0.5 && f < 2.5) ? Math.exp(-Math.pow(f-1.5, 2)/0.8) : 0;
            return { re: v, im: 0, mag: v, phase: 0 };
        },
        computeFeature: (magData, fAxis, nMfcc = 13) => {
            // Mel filterbank
            const nFilters = 26;
            const fMin = 0.1, fMax = Math.max(...fAxis);
            const melMin = hzToMel(fMin), melMax = hzToMel(fMax);
            const melPts = Array.from({length: nFilters+2}, (_, i) => melMin + i*(melMax-melMin)/(nFilters+1));
            const hzPts = melPts.map(melToHz);
            const filterEnergies = new Float64Array(nFilters);
            for (let i = 0; i < nFilters; i++) {
                const fL = hzPts[i], fC = hzPts[i+1], fR = hzPts[i+2];
                let e = 0;
                for (let j = 0; j < fAxis.length; j++) {
                    const f = fAxis[j];
                    if (f >= fL && f <= fC) e += magData[j] * (f-fL)/(fC-fL);
                    else if (f > fC && f <= fR) e += magData[j] * (fR-f)/(fR-fC);
                }
                filterEnergies[i] = Math.log(e + 1e-10);
            }
            // DCT
            const mfcc = new Float64Array(nMfcc);
            for (let k = 0; k < nMfcc; k++) {
                let s = 0;
                for (let b = 0; b < nFilters; b++) {
                    s += filterEnergies[b] * Math.cos(k * (b + 0.5) * Math.PI / nFilters);
                }
                mfcc[k] = s;
            }
            return mfcc;
        }
    },
    {
        id: 'ai_autocorr',
        category: 'AI / ML',
        name: 'Autocorrélation R(τ)',
        desc: 'Détection de période / pitch',
        formulaTime: 'R(\\tau) = \\int s(t)\\,s(t+\\tau)\\,dt',
        formulaFreq: '\\mathcal{F}\\{R(\\tau)\\} = |S(f)|^2',
        domain: 'ai',
        calcTime: t => Math.cos(2*Math.PI*1*t) + 0.5*Math.cos(2*Math.PI*2*t),
        calcFreq: f => {
            const v = (Math.abs(f-1) < 0.05 || Math.abs(f+1) < 0.05) ? 4
                    : (Math.abs(f-2) < 0.05 || Math.abs(f+2) < 0.05) ? 2 : 0;
            return { re: v, im: 0, mag: v, phase: 0 };
        }
    }
];
