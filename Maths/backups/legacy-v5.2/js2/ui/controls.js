// ═══════════════════════════════════════════════════════════════════
//  CONTROLS — Sliders, toggles, mode selector, extra controls
// ═══════════════════════════════════════════════════════════════════

import { throttle } from '../math/utils.js';
import { findSignal } from '../math/signals.js';
import { aliasState } from './aliasing.js';

export function initControls(state, onChange) {
    const updateThrottled = throttle(onChange, 16);

    // Rotation slider (winding frequency)
    const freqSlider = document.getElementById('freq-slider');
    const freqVal    = document.getElementById('freq-val');
    if (freqSlider && freqVal) {
        freqSlider.addEventListener('input', e => {
            state.windingFreq = parseFloat(e.target.value);
            freqVal.value = state.windingFreq.toFixed(2);
            updateThrottled();
        });
        freqVal.addEventListener('change', e => {
            state.windingFreq = parseFloat(e.target.value);
            freqSlider.value = state.windingFreq;
            updateThrottled();
        });
    }

    // Cutoff slider — logarithmic mapping [0.05, 20] Hz
    const fcSlider = document.getElementById('fc-slider');
    const fcVal    = document.getElementById('fc-val');
    const FC_MIN_LOG = Math.log10(0.05);   // -1.301
    const FC_MAX_LOG = Math.log10(20);     //  1.301

    if (fcSlider && fcVal) {
        const updateFcFromLog = (logFc) => {
            state.cutoffFreq = Math.pow(10, logFc);
            fcVal.value = state.cutoffFreq < 1
                ? state.cutoffFreq.toFixed(3)
                : state.cutoffFreq.toFixed(2);
        };

        fcSlider.addEventListener('input', e => {
            // slider [-1000, 1000] → log [FC_MIN_LOG, FC_MAX_LOG]
            const s = parseFloat(e.target.value) / 1000;  // [-1, +1]
            const logFc = FC_MIN_LOG + (s + 1) / 2 * (FC_MAX_LOG - FC_MIN_LOG);
            updateFcFromLog(logFc);
            updateThrottled();
        });
        fcVal.addEventListener('change', e => {
            state.cutoffFreq = parseFloat(e.target.value);
            const logFc = Math.log10(state.cutoffFreq);
            const s = ((logFc - FC_MIN_LOG) / (FC_MAX_LOG - FC_MIN_LOG) * 2 - 1) * 1000;
            fcSlider.value = s;
            updateThrottled();
        });
    }

    // Filter order slider
    const orderSlider = document.getElementById('order-slider');
    const orderVal    = document.getElementById('order-val');
    if (orderSlider && orderVal) {
        orderSlider.addEventListener('input', e => {
            state.filterOrder = parseInt(e.target.value);
            orderVal.value = state.filterOrder;
            updateThrottled();
        });
        orderVal.addEventListener('change', e => {
            state.filterOrder = parseInt(e.target.value);
            orderSlider.value = state.filterOrder;
            updateThrottled();
        });
    }

    // Noise toggle
    const noiseWrap = document.getElementById('noise-toggle-wrap');
    const noisePill = document.getElementById('noise-pill');
    if (noiseWrap && noisePill) {
        noiseWrap.addEventListener('click', () => {
            state.injectNoise = !state.injectNoise;
            noisePill.classList.toggle('on', state.injectNoise);
            updateThrottled();
        });
    }

    // Mode selector
    const combo = document.getElementById('combo-selector');
    if (combo) {
        combo.addEventListener('change', e => {
            state.activeCombo = e.target.value;
            onChange();
        });
    }

    // Peak detection toggle
    const peaksChk = document.getElementById('params-peaks');
    if (peaksChk) {
        peaksChk.addEventListener('change', e => {
            state.showPeaks = e.target.checked;
            updateThrottled();
        });
    }

    // Envelope toggle
    const envChk = document.getElementById('params-envelope');
    if (envChk) {
        envChk.addEventListener('change', e => {
            state.showEnvelope = e.target.checked;
            updateThrottled();
        });
    }

    // Sampling frequency slider (fₛ for Shannon)
    const fsSlider = document.getElementById('fs-slider');
    const fsVal    = document.getElementById('fs-val');
    if (fsSlider) {
        fsSlider.addEventListener('input', e => {
            aliasState.fSampling = parseFloat(e.target.value);
            fsVal.value = aliasState.fSampling.toFixed(1);
            updateThrottled();
        });
        fsVal.addEventListener('change', e => {
            aliasState.fSampling = parseFloat(e.target.value);
            fsSlider.value = aliasState.fSampling;
            updateThrottled();
        });
    }

    // Filter type selector
    const filterSel = document.getElementById('filter-type');
    if (filterSel) {
        filterSel.value = state.filterType;
        filterSel.addEventListener('change', e => {
            state.filterType = e.target.value;
            onChange();
        });
    }
}

/** Render the extra controls panel for signals that need it (e.g. RLC) */
export function renderExtraControls(state, onChange) {
    const panel = document.getElementById('extra-controls');
    const sig = findSignal(state.funcId);
    if (!sig || !sig.extraControls) {
        panel.classList.remove('visible');
        panel.innerHTML = '';
        return;
    }

    state.params = state.params || {};
    panel.innerHTML = `<div style="font-family:'Space Mono',monospace;font-size:0.55rem;color:var(--text-mid);letter-spacing:0.12em;margin-bottom:0.5rem;text-transform:uppercase">▸ Paramètres du signal</div>`;

    sig.extraControls.forEach(ctrl => {
        if (state.params[ctrl.id] === undefined) state.params[ctrl.id] = ctrl.value;
        const valInput = `<input type="number" class="editable-val" id="extra-${ctrl.id}-val" value="${state.params[ctrl.id]}" step="${ctrl.step}" style="color:var(--accent-cyan); width:50px">`;
        panel.innerHTML += `
            <div class="extra-ctrl">
                <label>${ctrl.label} ${valInput}</label>
                <input type="range" id="extra-${ctrl.id}" min="${ctrl.min}" max="${ctrl.max}" step="${ctrl.step}" value="${state.params[ctrl.id]}" class="cyan">
            </div>
        `;
    });

    if (sig.id === 'live_audio') {
        panel.innerHTML += `
            <div style="margin-top: 10px; text-align: center;">
                <button id="mic-btn" style="background: rgba(255,0,110,0.1); border: 1px solid var(--accent-magenta); color: var(--accent-magenta); padding: 5px 10px; border-radius: 4px; cursor: pointer; font-family: 'Space Mono', monospace; font-size: 0.6rem;">
                    🎤 TOGGLE MIC
                </button>
            </div>
        `;
    }

    panel.classList.add('visible');

    // Attach listeners
    const throttled = throttle(onChange, 16);
    sig.extraControls.forEach(ctrl => {
        const inputRange = document.getElementById(`extra-${ctrl.id}`);
        const inputVal = document.getElementById(`extra-${ctrl.id}-val`);

        inputRange.addEventListener('input', e => {
            state.params[ctrl.id] = parseFloat(e.target.value);
            inputVal.value = state.params[ctrl.id];
            throttled();
        });

        inputVal.addEventListener('change', e => {
            state.params[ctrl.id] = parseFloat(e.target.value);
            inputRange.value = state.params[ctrl.id];
            throttled();
        });
    });

    if (sig.id === 'live_audio') {
        document.getElementById('mic-btn').addEventListener('click', () => {
            if (window.toggleMicrophone) window.toggleMicrophone();
        });
    }
}
