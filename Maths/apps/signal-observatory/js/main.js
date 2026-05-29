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
import { exportToCsv } from './csv-exporter.js';
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
import { initTooltips } from './ui/tooltips.js';
import { initSidebarToggle } from './ui/sidebar-toggle.js';
import { initNotebook } from './ui/notebook.js';

// Audio DSP Analyzer
import {
    audioAnalyzerState, AudioState,
    loadAudioFile, playAudio, pauseAudio, seekAudio, stopAudio,
    setFFTSize, setWindowType
} from './audio/file-audio-engine.js';
import { renderAudioAnalyzer } from './plots/audio-viz.js';

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
let _wasAudioMode = false;

// ─── MASTER RENDER ──────────────────────────────────────────────
function renderAll() {
    try {
        // ── Audio Analyzer mode: bypass the synthetic signal pipeline ──
        if (state.activeCombo === 'audio_analyzer') {
            _wasAudioMode = true;
            renderAudioAnalyzerMode();
            return;
        }

        // Restore telemetry labels when leaving audio mode
        if (_wasAudioMode) {
            _wasAudioMode = false;
            _setTelemetryLabels(ORIGINAL_LABELS);
        }

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

// ─── AUDIO ANALYZER RENDER PATH ─────────────────────────────────
const ORIGINAL_LABELS = ['①TEMPOREL s(t)', '②AMPLITUDE |S(f)|', '③PHASE φ(f)', '④ENROULEMENT 2D'];
const AUDIO_LABELS    = ['①OSCILLOSCOPE PCM', '②SPECTRE @ PLAYHEAD', '③PHASE φ(f)', '④RMS ENERGY'];

function _setTelemetryLabels(labels) {
    const els = document.querySelectorAll('.panel-label');
    // Bottom 4 panels (last 4 .panel-label elements in raw telemetry section)
    const bottomLabels = Array.from(els).slice(-4);
    bottomLabels.forEach((el, i) => {
        if (labels[i]) {
            const numMatch = labels[i].match(/^([\u2460-\u2469])/);
            const num = numMatch ? numMatch[1] : '';
            const text = labels[i].replace(/^[\u2460-\u2469]/, '');
            el.innerHTML = `<span class="num">${num}</span>${text}`;
        }
    });
}

function renderAudioAnalyzerMode() {
    // Title update
    const titleEl = document.getElementById('func-title');
    if (titleEl) {
        const s = audioAnalyzerState;
        const badge = '<span class="badge">DSP</span>';
        const name = s.fileName || 'Audio DSP Analyzer';
        const desc = s.engineState === AudioState.IDLE
            ? 'Glissez ou chargez un fichier audio'
            : `${s.sampleRate} Hz · FFT ${s.fftSize} · ${s.windowType}`;
        titleEl.innerHTML = `${badge}<span>${name}</span><span style="color:var(--text-dim);font-weight:400">— ${desc}</span>`;
    }

    // Update telemetry labels for audio mode
    _setTelemetryLabels(AUDIO_LABELS);

    // Render via the audio-viz module (handles all 4 states)
    renderAudioAnalyzer();
    refreshParamsBoard();
    toggleConvPanel(false);

    // Update the transport bar
    _syncAudioTransport();
}

function _syncAudioTransport() {
    const s = audioAnalyzerState;
    const scrubber = document.getElementById('audio-scrubber');
    const timeDisp = document.getElementById('audio-time-display');
    const badge    = document.getElementById('audio-state-badge');
    const bar      = document.getElementById('audio-transport-bar');

    if (scrubber && s.duration > 0) {
        scrubber.value = (s.currentTime / s.duration) * 1000;
    }
    if (timeDisp) {
        timeDisp.textContent = `${_fmtTime(s.currentTime)} / ${_fmtTime(s.duration)}`;
    }
    if (badge) {
        badge.className = '';
        switch (s.engineState) {
            case AudioState.PLAYING:
                badge.textContent = '▶ PLAYING';
                badge.classList.add('playing');
                break;
            case AudioState.PAUSED:
                badge.textContent = '⏸ PAUSED';
                badge.classList.add('paused');
                break;
            case AudioState.DECODING:
                badge.textContent = '⏳ DECODING';
                badge.classList.add('decoding');
                break;
            case AudioState.READY:
                badge.textContent = '● READY';
                break;
            default:
                badge.textContent = '⏸ IDLE';
        }
    }
    if (bar) {
        bar.classList.toggle('playing', s.engineState === AudioState.PLAYING);
    }
}

function _fmtTime(sec) {
    if (!sec || !isFinite(sec)) return '0:00.0';
    const m = Math.floor(sec / 60);
    const s = (sec % 60).toFixed(1);
    return `${m}:${s.padStart(4, '0')}`;
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
    'injectNoise', 'showPeaks', 'showEnvelope', 'showHarmonics',
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
        initTooltips();
        initSidebarToggle();
        initNotebook();
        initParamsBoard();
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

        // ── Audio DSP Analyzer controls ──
        initAudioAnalyzerControls();

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

        // Tier 2 Phase 1: CSV export toggle
        const exportCsvToggle = document.getElementById('export-csv-toggle');
        if (exportCsvToggle) {
            exportCsvToggle.addEventListener('click', () => {
                const signal = findSignal(state.funcId);
                const name = signal ? signal.name : 'signal';
                exportToCsv(name, lastComputed);
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

// Hotkeys: Up/Down to cycle signals
window.addEventListener('keydown', e => {
    if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') return;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const sel1 = document.getElementById('sel-s1');
        if (!sel1) return;
        e.preventDefault();
        const opts = Array.from(sel1.options);
        let idx = sel1.selectedIndex;
        if (e.key === 'ArrowDown') idx = (idx + 1) % opts.length;
        if (e.key === 'ArrowUp') idx = (idx - 1 + opts.length) % opts.length;
        sel1.selectedIndex = idx;
        const sigId = opts[idx].value;
        state.funcId = sigId;
        setActiveTab(sigId);
        renderExtraControls(state, () => { notify(); });
        resetAlgebraCache();
        notify();
    }
});

whenReady(boot);

// ─── AUDIO ANALYZER CONTROLS ────────────────────────────────────
function initAudioAnalyzerControls() {
    const audioGroup    = document.getElementById('audio-controls-group');
    const fileInput     = document.getElementById('audio-file-input');
    const fileLabel     = document.getElementById('audio-file-label');
    const fftSizeSelect = document.getElementById('audio-fft-size');
    const windowSelect  = document.getElementById('audio-window-type');
    const playBtn       = document.getElementById('audio-play');
    const pauseBtn      = document.getElementById('audio-pause');
    const stopBtn       = document.getElementById('audio-stop');
    const scrubber      = document.getElementById('audio-scrubber');
    const transportBar  = document.getElementById('audio-transport-bar');
    const dropOverlay   = document.getElementById('audio-drop-overlay');
    const mainEl        = document.getElementById('main');

    // Toggle visibility of audio controls when combo mode changes
    const comboSel = document.getElementById('combo-selector');
    function syncAudioUI() {
        const isAudio = state.activeCombo === 'audio_analyzer';
        if (audioGroup)   audioGroup.style.display   = isAudio ? 'flex' : 'none';
        if (transportBar) transportBar.classList.toggle('visible', isAudio);
    }
    if (comboSel) {
        comboSel.addEventListener('change', syncAudioUI);
    }
    // Initial sync
    syncAudioUI();

    // ── File input ──
    async function handleFile(file) {
        if (!file) return;
        try {
            if (fileLabel) fileLabel.textContent = file.name;
            await loadAudioFile(file);
            notify();
        } catch (err) {
            alert('Erreur de décodage audio — voir la console.');
        }
    }

    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
        });
    }

    // ── Drag-and-Drop ──
    if (mainEl && dropOverlay) {
        let dragCounter = 0;

        mainEl.addEventListener('dragenter', (e) => {
            if (state.activeCombo !== 'audio_analyzer') return;
            e.preventDefault();
            dragCounter++;
            dropOverlay.classList.add('visible');
        });

        mainEl.addEventListener('dragover', (e) => {
            if (state.activeCombo !== 'audio_analyzer') return;
            e.preventDefault();
        });

        mainEl.addEventListener('dragleave', (e) => {
            if (state.activeCombo !== 'audio_analyzer') return;
            dragCounter--;
            if (dragCounter <= 0) {
                dragCounter = 0;
                dropOverlay.classList.remove('visible');
            }
        });

        mainEl.addEventListener('drop', (e) => {
            if (state.activeCombo !== 'audio_analyzer') return;
            e.preventDefault();
            dragCounter = 0;
            dropOverlay.classList.remove('visible');
            const file = e.dataTransfer.files?.[0];
            if (file && file.type.startsWith('audio/')) {
                handleFile(file);
            }
        });
    }

    // ── Transport controls ──
    if (playBtn)  playBtn.addEventListener('click',  () => { playAudio(); });
    if (pauseBtn) pauseBtn.addEventListener('click', () => { pauseAudio(); });
    if (stopBtn)  stopBtn.addEventListener('click',  () => { stopAudio(); notify(); });

    if (scrubber) {
        scrubber.addEventListener('input', (e) => {
            const ratio = parseFloat(e.target.value) / 1000;
            const t = ratio * audioAnalyzerState.duration;
            seekAudio(t);
        });
    }

    // ── FFT params ──
    if (fftSizeSelect) {
        fftSizeSelect.addEventListener('change', (e) => {
            setFFTSize(parseInt(e.target.value));
        });
    }
    if (windowSelect) {
        windowSelect.addEventListener('change', (e) => {
            setWindowType(e.target.value);
        });
    }
}
