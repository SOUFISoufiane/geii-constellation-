// ═══════════════════════════════════════════════════════════════════
//  MAIN — Boot, wiring, render orchestration
// ═══════════════════════════════════════════════════════════════════

import { state, subscribe, notify } from './state.js';
import { findSignal } from './math/signals.js';
import { tRange, fRange, updateAxes } from './math/axes.js';
import { getFilterResponse } from './math/filters.js';
import { debounce, getNoise, getWindow, unwrap } from './math/utils.js';
import { readStateFromUrl, updateUrlSilently } from '../../../shared/js/state-serializer.js';
import { mountAppHeader } from '../../../shared/js/app-header.js';
import { mountGlossary } from '../../../shared/js/glossary.js';
import { startRecording, stopRecording, isRecording } from '../../../shared/js/recorder.js';
import { algebraState, resetAlgebraCache } from './plots/algebra.js';
import { renderRawTime, renderRawMag, renderRawPhase, renderWinding } from './plots/raw-telemetry.js';
import { renderFusion } from './plots/fusion-modes.js';
import { PALETTE } from './plots/plotly-config.js';
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
        renderWinding(signal,  state.params || {}, state.windingFreq, state, computed.timeData);

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
    const color = aliasState.aliasingActive ? PALETTE.red : PALETTE.gold;
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

// ─── URL STATE SYNC (Tier 1, Phase B) ───────────────────────────
// Whitelist of state keys we persist into URLs. Excludes transient runtime
// fields (lastComputed cache, subscriber state, etc.) and keeps share links
// short + forward-compatible.
const SHAREABLE_KEYS = [
    'funcId', 'windingFreq', 'cutoffFreq', 'filterOrder',
    'injectNoise', 'showPeaks', 'showEnvelope',
    'activeCombo', 'filterType', 'applyFilterEverywhere', 'params',
    'theme', 'bloomIntensity', 'scanlineOpacity',
    'fftWindow', 'noiseType', 'unwrapPhase',
    'showGrids', 'traceStyle', 'camera3D',
    'fpsLimit', 'bufferSize'
];

function snapshotState() {
    const snap = {};
    for (const k of SHAREABLE_KEYS) {
        if (state[k] !== undefined) snap[k] = state[k];
    }
    // Module-local sub-states attached under namespaced keys
    snap.algebra = { sigBId: algebraState.sigBId, op: algebraState.op };
    return snap;
}

function restoreFromUrl() {
    const incoming = readStateFromUrl();
    if (!incoming) return false;
    let restored = 0;
    for (const k of SHAREABLE_KEYS) {
        if (incoming[k] !== undefined) {
            state[k] = incoming[k];
            restored++;
        }
    }
    if (incoming.algebra && typeof incoming.algebra === 'object') {
        if (incoming.algebra.sigBId) algebraState.sigBId = incoming.algebra.sigBId;
        if (incoming.algebra.op)     algebraState.op     = incoming.algebra.op;
        resetAlgebraCache();
        restored++;
    }
    console.log(`[url-state] Restored ${restored} key(s) from URL`);
    return restored > 0;
}

// ─── BOOT ────────────────────────────────────────────────────────
function boot() {
    try {
        console.log("Observatory Booting...");

        // 1) Restore state from URL BEFORE any UI init, so controls read
        //    the restored values as their initial state.
        restoreFromUrl();

        // 2) Re-mount the app header with a getShareState callback so the
        //    🔗 Partager button copies a URL of the current state.
        mountAppHeader('signal-observatory', { getShareState: snapshotState });

        // 2b) Mount the glossary panel inside the formula sidebar.
        mountGlossary(document.getElementById('formula-glossary-section'));

        initSidebar(state, (id) => {
            state.funcId = id;
            setActiveTab(id);
            renderExtraControls(state, () => { notify(); });
            resetAlgebraCache();  // s₁ changed → recompute algebra result
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

        // URL stays in sync with state on a 500ms debounce — slow enough to
        // avoid spamming history.replaceState during drags, fresh enough that
        // the user can copy the address bar at any time.
        const syncUrl = debounce(() => updateUrlSilently(snapshotState()), 500);
        subscribe(syncUrl);

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
                if (!state.playerActive) {
                    clearAllPlayheads();
                    notify(); // Force a re-render so 3D winding reverts to full trace
                }
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

        // Tier 1 Phase 6 (C): Animation recorder toggle
        const recordToggle = document.getElementById('record-toggle');
        if (recordToggle) {
            const labelEl = recordToggle.querySelector('span');
            const defaultLabel = labelEl?.textContent || '🎥 REC';
            let tickHandle = null;
            recordToggle.addEventListener('click', async () => {
                if (!isRecording()) {
                    const ok = await startRecording({
                        plotElId: 'plot-fusion',
                        onTick: (ms) => {
                            const s = (ms / 1000).toFixed(1);
                            if (labelEl) labelEl.textContent = `⏺ ${s}s`;
                        }
                    });
                    if (ok) {
                        recordToggle.classList.add('active');
                        recordToggle.style.borderColor = '#f87171';
                    } else {
                        alert('Enregistrement impossible — voir la console.');
                    }
                } else {
                    const blob = await stopRecording();
                    recordToggle.classList.remove('active');
                    recordToggle.style.borderColor = '';
                    if (labelEl) labelEl.textContent = defaultLabel;
                    console.log('[recorder] WebM ready,', blob?.size, 'bytes — download triggered');
                }
            });
        }

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
