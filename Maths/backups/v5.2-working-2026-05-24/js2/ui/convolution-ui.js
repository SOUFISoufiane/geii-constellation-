// ═══════════════════════════════════════════════════════════════════
//  CONVOLUTION UI — Populate selects, wire listeners
// ═══════════════════════════════════════════════════════════════════

import { convState, renderConvolution, resetConvCache, animateConvolution, stopAnimation, getConvEligibleSignals } from '../plots/convolution.js';
import { tRange } from '../math/axes.js';
import { throttle } from '../math/utils.js';

let initialized = false;

export function initConvolutionUI() {
    if (initialized) return;
    initialized = true;

    const selA = document.getElementById('conv-fn-a');
    const selB = document.getElementById('conv-fn-b');

    // Populate dropdowns
    const eligible = getConvEligibleSignals();
    eligible.forEach(sig => {
        selA.appendChild(makeOption(sig.id, sig.name));
        selB.appendChild(makeOption(sig.id, sig.name));
    });
    selA.value = convState.fnA;
    selB.value = convState.fnB;

    selA.addEventListener('change', e => {
        convState.fnA = e.target.value;
        resetConvCache();
        renderConvolution();
    });
    selB.addEventListener('change', e => {
        convState.fnB = e.target.value;
        resetConvCache();
        renderConvolution();
    });

    const tauSlider = document.getElementById('conv-tau-slider');
    const tauVal = document.getElementById('conv-tau-val');
    const tauThrottled = throttle(() => renderConvolution(), 16);
    
    tauSlider.addEventListener('input', e => {
        convState.tau = parseFloat(e.target.value);
        tauVal.value = convState.tau.toFixed(2);
        tauThrottled();
    });

    tauVal.addEventListener('change', e => {
        convState.tau = parseFloat(e.target.value);
        tauSlider.value = convState.tau;
        tauThrottled();
    });

    const animateBtn = document.getElementById('conv-animate-btn');
    animateBtn.addEventListener('click', () => {
        if (convState.isAnimating) {
            stopAnimation();
            animateBtn.textContent = '▶ ANIMER LA CONVOLUTION';
        } else {
            const t0 = tRange[0];
            const t1 = tRange[tRange.length - 1];
            animateConvolution(t0, t1, 5000);
            animateBtn.textContent = '⏸ STOPPER';
            // Reset label when done
            const check = setInterval(() => {
                if (!convState.isAnimating) {
                    animateBtn.textContent = '▶ ANIMER LA CONVOLUTION';
                    clearInterval(check);
                }
            }, 200);
        }
    });
}

function makeOption(value, label) {
    const opt = document.createElement('option');
    opt.value = value;
    opt.textContent = label;
    return opt;
}

export function toggleConvPanel(visible) {
    const panel = document.getElementById('conv-controls');
    if (!panel) return;
    panel.classList.toggle('visible', visible);
}
