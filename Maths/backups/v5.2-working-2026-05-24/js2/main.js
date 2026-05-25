// ═══════════════════════════════════════════════════════════════════
//  MAIN — Boot, wiring, render orchestration
// ═══════════════════════════════════════════════════════════════════

import { state, subscribe, notify } from './state.js';
import { findSignal } from './math/signals.js';
import { tRange, fRange, updateAxes } from './math/axes.js';
import { getFilterResponse } from './math/filters.js';
import { debounce, getNoise, getWindow, unwrap } from './math/utils.js';
import { renderRawTime, renderRawMag, renderRawPhase, renderWinding } from './plots/raw-telemetry.js';
import { renderFusion } from './plots/fusion-modes.js';
import { initSidebar, setActiveTab } from './ui/sidebar.js';
import { initControls, renderExtraControls } from './ui/controls.js';
import { renderFormulas, renderTauLine, initFormulaResize } from './ui/formula-strip.js';
import { initPlayer, playerState, togglePlayerPanel } from './ui/player.js';
import { initFreqPlayer, freqPlayerState, toggleFreqPlayerPanel } from './ui/freq-player.js';
import { initConvolutionUI, toggleConvPanel } from './ui/convolution-ui.js';
import { updateAllPlayheads, clearAllPlayheads, reinstallAfterRender } from './ui/playheads.js';
import { updateFreqIndicators, clearFreqIndicators, reinstallFreqAfterRender } from './ui/freq-indicators.js';
import { updateAliasingAlert, getSampledPoints, aliasState } from './ui/aliasing.js';

import { initParamsBoard, refreshParamsBoard } from './ui/params-board.js';
import { initSidebarToggle } from './ui/sidebar-toggle.js';

// ─── COMPUTE PIPELINE ────────────────────────────────────────────
function computeSignal(signal) {
    if (!signal) return null;
    const params = state.params || {};

    // Dynamic buffer resolution
    if (state.bufferSize && state.bufferSize !== tRange.length) {
        updateAxes(state.bufferSize);
    }

    // Windowing
    const win = getWindow(state.fftWindow || 'rectangular', tRange.length);

    // Time domain
    const timeData = tRange.map((t, i) => {
        let v = signal.calcTime(t, params) * (win[i] || 1);
        if (state.injectNoise) {
            v += 0.2 * getNoise(state.noiseType || 'white');
        }
        return v;
    });

    // Frequency domain
    const freqObjs = fRange.map(f => {
        const v = { ...signal.calcFreq(f, params) };
        if (state.injectNoise) {
            v.mag += 0.05 * Math.random();
            v.re += 0.05 * (Math.random() - 0.5);
        }
        return v;
    });
    const magData   = freqObjs.map(d => d.mag);
    let phaseData = freqObjs.map(d => d.phase);

    if (state.unwrapPhase) {
        phaseData = Array.from(unwrap(phaseData));
    }

    // Apply filter — full complex response
    const ftype = state.filterType || 'butterworth';
    const filterResp = fRange.map(f => getFilterResponse(ftype, f, state.cutoffFreq, state.filterOrder));
    const magFiltered = magData.map((m, i) => m * filterResp[i].mag);
    const phaseFiltered = phaseData.map((p, i) => p + filterResp[i].phase);

    const applyEverywhere = state.applyFilterEverywhere !== false;
    const displayMag = applyEverywhere ? magFiltered : magData;
    const displayPhase = applyEverywhere ? phaseFiltered : phaseData;

    return {
        timeData,
        magData,
        phaseData,
        magFiltered,
        phaseFiltered,
        displayMag,
        displayPhase,
        filterResp
    };
}

let lastComputed = null;
let lastSignal = null;

// ─── MASTER RENDER ──────────────────────────────────────────────
function renderAll() {
    try {
        const signal = findSignal(state.funcId);
        if (!signal) return;

        // Update title
        const titleEl = document.getElementById('func-title');
        if (titleEl) {
            const domainBadge = signal.domain ? `<span class="badge">${signal.domain.toUpperCase()}</span>` : '';
            titleEl.innerHTML = `${domainBadge}<span>${signal.name}</span><span style="color:var(--text-dim);font-weight:400">— ${signal.desc}</span>`;
        }

        const computed = computeSignal(signal);
        if (!computed) return;
        lastComputed = computed;
        lastSignal = signal;

        renderRawTime(signal,  computed.timeData, signal.domain, state);
        renderRawMag(signal,   computed.displayMag,  signal.domain, state);
        renderRawPhase(signal, computed.displayPhase, state);
        renderWinding(signal,  state.params || {}, state.windingFreq, state);

        renderFusion(state.activeCombo, signal, state, computed);
        refreshParamsBoard();
        toggleConvPanel(state.activeCombo === 'convolution');
        renderFormulas(signal, state);
        renderTauLine(state);
        updateAliasingAlert(computed.magData, state.windingFreq);
        addSamplesOverlay(signal);

        if (state.playerActive) {
            reinstallAfterRender();
            requestAnimationFrame(() => updateAllPlayheads(signal, state, computed));
        }
        if (state.freqPlayerActive) {
            reinstallFreqAfterRender();
            requestAnimationFrame(() => updateFreqIndicators(signal, state, computed));
        }
    } catch (e) {
        console.error("Render Error:", e);
    }
}

function addSamplesOverlay(signal) {
    const plot = document.getElementById('plot-raw-time');
    if (!plot || !plot.data) return;
    const oldIdx = plot.data.map((tr, i) => tr.name === '__samples__' ? i : -1).filter(i => i >= 0);
    if (oldIdx.length) {
        try { Plotly.deleteTraces('plot-raw-time', oldIdx); } catch (e) {}
    }
    const samples = getSampledPoints(signal, state.params || {}, -3, 5);
    const color = aliasState.aliasingActive ? '#ff4d6d' : '#ffd60a';
    try {
        Plotly.addTraces('plot-raw-time', [{
            x: samples.x, y: samples.y,
            type: 'scatter', mode: 'markers',
            marker: { color, size: 5, line: { color: '#fff', width: 0.8 }, symbol: 'circle' },
            name: '__samples__',
            hoverinfo: 'skip',
            showlegend: false
        }]);
    } catch (e) {}
}

// ─── BOOT ────────────────────────────────────────────────────────
function boot() {
    try {
        console.log("Observatory Booting...");
        initSidebar(state, (id) => {
            state.funcId = id;
            setActiveTab(id);
            renderExtraControls(state, () => { notify(); });
            notify();
        });

        initControls(state, () => notify());
        renderExtraControls(state, () => notify());
        initParamsBoard();
        initSidebarToggle();
        initFormulaResize();

        let lastNotifyTime = 0;
        subscribe(() => {
            const now = performance.now();
            const limit = state.fpsLimit || 60;
            const interval = 1000 / limit;
            if (now - lastNotifyTime >= interval) {
                lastNotifyTime = now;
                renderAll();
            }
        });

        initPlayer((ps) => {
            if (lastSignal && lastComputed && state.playerActive) {
                updateAllPlayheads(lastSignal, state, lastComputed);
            }
        });

        const playerToggle = document.getElementById('player-toggle');
        if (playerToggle) {
            playerToggle.addEventListener('click', () => {
                state.playerActive = !state.playerActive;
                playerToggle.classList.toggle('active', state.playerActive);
                togglePlayerPanel(state.playerActive);
                if (!state.playerActive) clearAllPlayheads();
                else if (lastSignal && lastComputed) updateAllPlayheads(lastSignal, state, lastComputed);
            });
        }

        initFreqPlayer((fps) => {
            if (!state.freqPlayerActive) return;
            state.windingFreq = fps.currentFreq;
            notify();
        });

        const fplayerToggle = document.getElementById('fplayer-toggle');
        if (fplayerToggle) {
            fplayerToggle.addEventListener('click', () => {
                state.freqPlayerActive = !state.freqPlayerActive;
                fplayerToggle.classList.toggle('active', state.freqPlayerActive);
                toggleFreqPlayerPanel(state.freqPlayerActive);
                if (!state.freqPlayerActive) clearFreqIndicators();
                else if (lastSignal && lastComputed) updateFreqIndicators(lastSignal, state, lastComputed);
            });
        }

        initConvolutionUI();

        setTimeout(() => {
            renderAll();
            console.log("Observatory Ready.");
        }, 150);

        const debounced = debounce(() => renderAll(), 120);
        window.addEventListener('resize', debounced);
    } catch (e) {
        console.error("Boot Error:", e);
        alert("Observatory failed to boot. Check console.");
    }
}

function whenReady(fn) {
    if (window.Plotly && window.renderMathInElement) {
        fn();
    } else {
        setTimeout(() => whenReady(fn), 50);
    }
}

whenReady(boot);
