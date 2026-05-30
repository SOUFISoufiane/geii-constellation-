// ═══════════════════════════════════════════════════════════════════
//  PARAMS BOARD — Hovering panel aggregating all parameters
//  Two-way binding with topbar sliders so both stay in sync.
//  Draggable header.
// ═══════════════════════════════════════════════════════════════════

import { state, notify } from '../state.js';
import { aliasState } from './aliasing.js';
import { throttle } from '../math/utils.js';

const FC_MIN_LOG = Math.log10(0.05);
const FC_MAX_LOG = Math.log10(20);

let initialized = false;

export function initParamsBoard() {
    if (initialized) return;

    const board    = document.getElementById('params-board');
    const toggle   = document.getElementById('params-toggle');
    const closeBtn = document.getElementById('params-close');
    const header   = document.getElementById('params-header');

    if (!board || !toggle || !closeBtn || !header) {
        console.warn("Params board elements missing");
        return;
    }

    initialized = true;

    // Toggle
    toggle.addEventListener('click', () => {
        const visible = board.classList.toggle('visible');
        toggle.classList.toggle('active', visible);
    });
    closeBtn.addEventListener('click', () => {
        board.classList.remove('visible');
        toggle.classList.remove('active');
    });

    // ─── Draggable header ──
    let dragging = false, offsetX = 0, offsetY = 0;
    header.addEventListener('mousedown', e => {
        if (e.target === closeBtn) return;
        dragging = true;
        const rect = board.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        document.body.style.userSelect = 'none';
    });
    document.addEventListener('mousemove', e => {
        if (!dragging) return;
        const newLeft = e.clientX - offsetX;
        const newTop  = e.clientY - offsetY;
        board.style.right = 'auto';
        board.style.left = Math.max(0, Math.min(window.innerWidth - board.offsetWidth, newLeft)) + 'px';
        board.style.top  = Math.max(0, Math.min(window.innerHeight - 40, newTop)) + 'px';
    });
    document.addEventListener('mouseup', () => {
        dragging = false;
        document.body.style.userSelect = '';
    });

    const updateThrottled = throttle(() => notify(), 16);

    // ─── FILTER controls ──
    const filterTypeSel = document.getElementById('params-filter-type');
    if (filterTypeSel) {
        filterTypeSel.value = state.filterType;
        filterTypeSel.addEventListener('change', e => {
            state.filterType = e.target.value;
            notify();
        });
    }

    const fcSlider = document.getElementById('params-fc');
    const fcVal    = document.getElementById('params-fc-val');
    if (fcSlider && fcVal) {
        fcSlider.addEventListener('input', e => {
            const s = parseFloat(e.target.value) / 1000;
            const logFc = FC_MIN_LOG + (s + 1) / 2 * (FC_MAX_LOG - FC_MIN_LOG);
            state.cutoffFreq = Math.pow(10, logFc);
            const formatted = state.cutoffFreq < 1 ? state.cutoffFreq.toFixed(3) : state.cutoffFreq.toFixed(2);
            fcVal.value = formatted;
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

    const orderSlider = document.getElementById('params-order');
    const orderVal    = document.getElementById('params-order-val');
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

    const applyChk = document.getElementById('params-apply-everywhere');
    if (applyChk) {
        applyChk.checked = state.applyFilterEverywhere !== false;
        applyChk.addEventListener('change', e => {
            state.applyFilterEverywhere = e.target.checked;
            notify();
        });
    }

    // ─── ROTATION ──
    const rotSlider = document.getElementById('params-rot');
    const rotVal    = document.getElementById('params-rot-val');
    if (rotSlider && rotVal) {
        rotSlider.addEventListener('input', e => {
            state.windingFreq = parseFloat(e.target.value);
            rotVal.value = state.windingFreq.toFixed(2);
            updateThrottled();
        });
        rotVal.addEventListener('change', e => {
            state.windingFreq = parseFloat(e.target.value);
            rotSlider.value = state.windingFreq;
            updateThrottled();
        });
    }

    // ─── fₛ sampling ──
    const fsSlider = document.getElementById('params-fs');
    const fsVal    = document.getElementById('params-fs-val');
    if (fsSlider && fsVal) {
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

    // ─── NOISE toggle ──
    const noiseChk = document.getElementById('params-noise');
    if (noiseChk) {
        noiseChk.checked = state.injectNoise;
        noiseChk.addEventListener('change', e => {
            state.injectNoise = e.target.checked;
            const topPill = document.getElementById('noise-pill');
            if (topPill) topPill.classList.toggle('on', state.injectNoise);
            notify();
        });
    }

    // ─── VISUALS (Pillar 1) ──
    const themeSel = document.getElementById('params-theme');
    if (themeSel) {
        themeSel.value = state.theme;
        themeSel.addEventListener('change', e => {
            state.theme = e.target.value;
            applyVisuals();
            notify();
        });
    }

    const bloomSlider = document.getElementById('params-bloom');
    const bloomVal    = document.getElementById('params-bloom-val');
    if (bloomSlider && bloomVal) {
        bloomSlider.addEventListener('input', e => {
            state.bloomIntensity = parseFloat(e.target.value);
            bloomVal.value = state.bloomIntensity.toFixed(1);
            applyVisuals();
        });
        bloomVal.addEventListener('change', e => {
            state.bloomIntensity = parseFloat(e.target.value);
            bloomSlider.value = state.bloomIntensity;
            applyVisuals();
        });
    }

    const scanSlider = document.getElementById('params-scanline');
    const scanVal    = document.getElementById('params-scanline-val');
    if (scanSlider && scanVal) {
        scanSlider.addEventListener('input', e => {
            state.scanlineOpacity = parseFloat(e.target.value);
            scanVal.value = state.scanlineOpacity.toFixed(1);
            applyVisuals();
        });
        scanVal.addEventListener('change', e => {
            state.scanlineOpacity = parseFloat(e.target.value);
            scanSlider.value = state.scanlineOpacity;
            applyVisuals();
        });
    }

    // ─── ADVANCED TREATMENT (Pillar 2) ──
    const fftWinSel = document.getElementById('params-fft-window');
    if (fftWinSel) {
        fftWinSel.value = state.fftWindow;
        fftWinSel.addEventListener('change', e => {
            state.fftWindow = e.target.value;
            notify();
        });
    }

    const noiseTypeSel = document.getElementById('params-noise-type');
    if (noiseTypeSel) {
        noiseTypeSel.value = state.noiseType;
        noiseTypeSel.addEventListener('change', e => {
            state.noiseType = e.target.value;
            notify();
        });
    }

    const unwrapChk = document.getElementById('params-unwrap-phase');
    if (unwrapChk) {
        unwrapChk.checked = state.unwrapPhase;
        unwrapChk.addEventListener('change', e => {
            state.unwrapPhase = e.target.checked;
            notify();
        });
    }

    // ─── PLOT INTERFACE (Pillar 3) ──
    const gridChk = document.getElementById('params-show-grids');
    if (gridChk) {
        gridChk.checked = state.showGrids;
        gridChk.addEventListener('change', e => {
            state.showGrids = e.target.checked;
            notify();
        });
    }

    const traceSel = document.getElementById('params-trace-style');
    if (traceSel) {
        traceSel.value = state.traceStyle;
        traceSel.addEventListener('change', e => {
            state.traceStyle = e.target.value;
            notify();
        });
    }

    const btnIso = document.getElementById('cam-iso');
    const btnTop = document.getElementById('cam-top');
    const btnSide = document.getElementById('cam-side');
    if (btnIso) btnIso.addEventListener('click',  () => { setCameraPreset('iso'); });
    if (btnTop) btnTop.addEventListener('click',  () => { setCameraPreset('top'); });
    if (btnSide) btnSide.addEventListener('click', () => { setCameraPreset('side'); });

    // ─── PERFORMANCE (Pillar 4) ──
    const fpsSlider = document.getElementById('params-fps');
    const fpsVal    = document.getElementById('params-fps-val');
    if (fpsSlider && fpsVal) {
        fpsSlider.addEventListener('input', e => {
            state.fpsLimit = parseInt(e.target.value);
            fpsVal.value = state.fpsLimit;
        });
        fpsVal.addEventListener('change', e => {
            state.fpsLimit = parseInt(e.target.value);
            fpsSlider.value = state.fpsLimit;
        });
    }

    const buffSlider = document.getElementById('params-buffer');
    const buffVal    = document.getElementById('params-buffer-val');
    if (buffSlider && buffVal) {
        buffSlider.addEventListener('input', e => {
            state.bufferSize = parseInt(e.target.value);
            buffVal.value = state.bufferSize;
            notify();
        });
        buffVal.addEventListener('change', e => {
            state.bufferSize = parseInt(e.target.value);
            buffSlider.value = state.bufferSize;
            notify();
        });
    }

    // Initial apply
    applyVisuals();
}

/** Apply Camera Preset to 3D plots */
function setCameraPreset(mode) {
    const eye = {
        iso:  { x: 1.5, y: 1.5, z: 1.2 },
        top:  { x: 0,   y: 0,   z: 2.2 },
        side: { x: 2.2, y: 0,   z: 0 }
    }[mode];

    const relayout = { 'scene.camera.eye': eye };
    // Apply to both fusion and winding if 3D
    if (document.getElementById('plot-fusion')) Plotly.relayout('plot-fusion', relayout);
    if (document.getElementById('plot-raw-circle')) Plotly.relayout('plot-raw-circle', relayout);
}

/** Apply CSS classes and variables based on visual state */
function applyVisuals() {
    // Theme
    document.body.classList.remove('theme-amber', 'theme-solarized');
    if (state.theme !== 'cosmic') {
        document.body.classList.add(state.theme);
    }

    // VFX Variables
    document.documentElement.style.setProperty('--bloom-intensity', state.bloomIntensity);
    // Baseline scanline opacity was 0.012 at intensity 1.0
    document.documentElement.style.setProperty('--scanline-opacity', state.scanlineOpacity * 0.012);
}

/** Update info section and mirror values from state */
export function refreshParamsBoard() {
    if (!document.getElementById('params-board')) return;

    // Mirror topbar slider values back into params board (when changed from topbar)
    const fcValEl = document.getElementById('params-fc-val');
    if (fcValEl) {
        fcValEl.value = state.cutoffFreq < 1 ? state.cutoffFreq.toFixed(3) : state.cutoffFreq.toFixed(2);
        const fcSlider = document.getElementById('params-fc');
        const topSlider = document.getElementById('fc-slider');
        if (fcSlider && topSlider) fcSlider.value = topSlider.value;
    }

    const orderValEl = document.getElementById('params-order-val');
    if (orderValEl) {
        orderValEl.value = state.filterOrder;
        const sl = document.getElementById('params-order');
        if (sl) sl.value = state.filterOrder;
    }

    const rotValEl = document.getElementById('params-rot-val');
    if (rotValEl) {
        rotValEl.value = state.windingFreq.toFixed(2);
        const sl = document.getElementById('params-rot');
        if (sl) sl.value = state.windingFreq;
    }

    const fsValEl = document.getElementById('params-fs-val');
    if (fsValEl) {
        fsValEl.value = aliasState.fSampling.toFixed(1);
        const sl = document.getElementById('params-fs');
        if (sl) sl.value = aliasState.fSampling;
    }

    const ftypeSel = document.getElementById('params-filter-type');
    if (ftypeSel) ftypeSel.value = state.filterType;

    const noiseChk = document.getElementById('params-noise');
    if (noiseChk) noiseChk.checked = state.injectNoise;

    const applyChk = document.getElementById('params-apply-everywhere');
    if (applyChk) applyChk.checked = state.applyFilterEverywhere !== false;

    // Visuals
    const themeSel = document.getElementById('params-theme');
    if (themeSel) themeSel.value = state.theme;

    const bloomVal = document.getElementById('params-bloom-val');
    if (bloomVal) {
        bloomVal.value = state.bloomIntensity.toFixed(1);
        const sl = document.getElementById('params-bloom');
        if (sl) sl.value = state.bloomIntensity;
    }

    const scanVal = document.getElementById('params-scanline-val');
    if (scanVal) {
        scanVal.value = state.scanlineOpacity.toFixed(1);
        const sl = document.getElementById('params-scanline');
        if (sl) sl.value = state.scanlineOpacity;
    }

    // Pillar 2
    const winSel = document.getElementById('params-fft-window');
    if (winSel) winSel.value = state.fftWindow;

    const noiseTSel = document.getElementById('params-noise-type');
    if (noiseTSel) noiseTSel.value = state.noiseType;

    const unwrapChk = document.getElementById('params-unwrap-phase');
    if (unwrapChk) unwrapChk.checked = state.unwrapPhase;

    // Pillar 3
    const gridChk = document.getElementById('params-show-grids');
    if (gridChk) gridChk.checked = state.showGrids;

    const traceSel = document.getElementById('params-trace-style');
    if (traceSel) traceSel.value = state.traceStyle;

    // Pillar 4
    const fpsVal = document.getElementById('params-fps-val');
    if (fpsVal) {
        fpsVal.value = state.fpsLimit;
        const sl = document.getElementById('params-fps');
        if (sl) sl.value = state.fpsLimit;
    }

    const buffVal = document.getElementById('params-buffer-val');
    if (buffVal) {
        buffVal.value = state.bufferSize;
        const sl = document.getElementById('params-buffer');
        if (sl) sl.value = state.bufferSize;
    }

    // Update calculated info
    const infoEl = document.getElementById('params-info-calc');
    if (infoEl) {
        const tau = 1 / (2 * Math.PI * state.cutoffFreq);
        const fNyq = aliasState.fSampling / 2;
        const slope = -20 * state.filterOrder;
        infoEl.innerHTML = `
            <span>τ filtre = <b>${tau.toFixed(3)} s</b></span><br>
            <span>Pente = <b>${slope} dB/déc</b></span><br>
            <span>f<sub>Nyquist</sub> = <b>${fNyq.toFixed(2)} Hz</b></span><br>
            <span>Période rot. = <b>${(1/Math.max(0.01, Math.abs(state.windingFreq))).toFixed(3)} s</b></span>
        `;
    }
}
