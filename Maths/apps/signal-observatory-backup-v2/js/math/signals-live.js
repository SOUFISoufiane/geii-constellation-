// ═══════════════════════════════════════════════════════════════════
//  EXTRAS — LIVE AUDIO (Microphone Input)
// ═══════════════════════════════════════════════════════════════════

import { audioEngine } from './audio-engine.js';
import { tRange, fRange } from './axes.js';

let tIndex = 0;
let fIndex = 0;

export const SIGNALS_LIVE = [
    {
        id: 'live_audio',
        category: 'LIVE',
        name: 'Microphone (Web Audio)',
        desc: 'Analyse spectrale en temps réel',
        formulaTime: 's_{mic}(t)',
        formulaFreq: 'S_{mic}(f) \\xleftarrow{\\text{FFT}} s_{mic}(t)',
        domain: 'ai',
        extraControls: [
            { id: 'live_gain', label: 'Gain (x)', min: 1, max: 20, step: 0.5, value: 5 }
        ],
        calcTime: (t, params = {}) => {
            const gain = params.live_gain ?? 5;
            // Update the buffer exactly once at the beginning of the time sweep
            if (t === tRange[0]) {
                audioEngine.update();
                tIndex = 0;
            }
            const val = audioEngine.timeData[tIndex] || 0;
            tIndex = (tIndex + 1) % 1024;
            return val * gain;
        },
        calcFreq: (f, params = {}) => {
            const gain = params.live_gain ?? 5;
            // Reset index at the beginning of the frequency sweep
            if (f === fRange[0]) {
                fIndex = 0;
            }
            const val = audioEngine.freqData[fIndex] || 0;
            fIndex = (fIndex + 1) % 512;
            
            // Map byte frequency data [0, 255] to a linear magnitude scale roughly matching the UI
            const linear = (val / 255) * 10 * gain;
            return { re: linear, im: 0, mag: linear, phase: 0 };
        }
    }
];