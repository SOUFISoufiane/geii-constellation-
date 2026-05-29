// ═══════════════════════════════════════════════════════════════════
//  FILE AUDIO ENGINE — Decode audio files, drive DSP worklet,
//  manage playback, expose PCM + STFT data for visualization.
// ═══════════════════════════════════════════════════════════════════

import { state, notify } from '../state.js';

// ─── Engine States ──────────────────────────────────────────────────
export const AudioState = Object.freeze({
    IDLE:         'idle',          // Awaiting Upload
    DECODING:     'decoding',      // PCM extraction in progress
    READY:        'ready',         // Decoded, not playing
    PLAYING:      'playing',       // Active playback
    PAUSED:       'paused'         // Paused mid-playback
});

// ─── Exported reactive state ────────────────────────────────────────
export const audioAnalyzerState = {
    engineState:   AudioState.IDLE,
    fileName:      '',
    sampleRate:    0,
    duration:      0,
    currentTime:   0,
    // Full PCM data (Float32Array, mono)
    pcmData:       null,
    // Most recent FFT frame from the worklet
    lastFrame:     null,
    // Accumulated spectrogram matrix (rows = time, cols = freq bins)
    spectrogram:   [],
    spectrogramTimestamps: [],
    // Config
    fftSize:       2048,
    windowType:    'hann'
};

// ─── Private ────────────────────────────────────────────────────────
let _audioCtx   = null;
let _sourceNode = null;
let _workletNode = null;
let _audioBuffer = null;
let _startOffset = 0;
let _startTime   = 0;
let _rafId       = null;

// ─── Helpers ────────────────────────────────────────────────────────
function _setState(s) {
    audioAnalyzerState.engineState = s;
    notify();
}

function _resetSpectrogram() {
    audioAnalyzerState.spectrogram = [];
    audioAnalyzerState.spectrogramTimestamps = [];
}

// ─── Public API ─────────────────────────────────────────────────────

/**
 * Decode an audio file (File or Blob) into PCM and prepare for playback.
 */
export async function loadAudioFile(file) {
    _setState(AudioState.DECODING);
    audioAnalyzerState.fileName = file.name;
    _resetSpectrogram();

    try {
        const arrayBuf = await file.arrayBuffer();

        // Use a regular AudioContext for decoding — OfflineAudioContext with
        // minimal buffer (1 sample) can fail in some browsers.
        const tmpCtx = new (window.AudioContext || window.webkitAudioContext)();
        _audioBuffer = await tmpCtx.decodeAudioData(arrayBuf);
        tmpCtx.close();

        // Extract mono PCM
        const raw = _audioBuffer.getChannelData(0);
        audioAnalyzerState.pcmData     = raw;
        audioAnalyzerState.sampleRate  = _audioBuffer.sampleRate;
        audioAnalyzerState.duration    = _audioBuffer.duration;
        audioAnalyzerState.currentTime = 0;

        // Pre-compute offline spectrogram for the full file
        _computeOfflineSpectrogram(raw, _audioBuffer.sampleRate);

        _setState(AudioState.READY);
        console.log(`[audio-engine] Decoded "${file.name}" — ${_audioBuffer.sampleRate} Hz, ${_audioBuffer.duration.toFixed(2)}s`);
    } catch (err) {
        console.error('[audio-engine] Decode error:', err);
        _setState(AudioState.IDLE);
        throw err;
    }
}

/**
 * Pre-compute the full spectrogram offline (no worklet needed).
 * This gives us the complete time–frequency matrix for the heatmap/surface.
 */
function _computeOfflineSpectrogram(pcm, sr) {
    const N = audioAnalyzerState.fftSize;
    const hop = N >> 1;
    const win = _makeWindow(audioAnalyzerState.windowType, N);
    const nBins = N >> 1;
    const nFrames = Math.max(1, Math.floor((pcm.length - N) / hop) + 1);

    const matrix = [];
    const timestamps = [];

    for (let fr = 0; fr < nFrames; fr++) {
        const start = fr * hop;
        const re = new Float32Array(N);
        const im = new Float32Array(N);
        for (let i = 0; i < N; i++) {
            re[i] = (pcm[start + i] || 0) * win[i];
        }
        _fftInPlace(re, im);

        const row = new Float32Array(nBins);
        for (let k = 0; k < nBins; k++) {
            const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
            row[k] = 20 * Math.log10(mag + 1e-10);
        }
        matrix.push(row);
        timestamps.push((start + N / 2) / sr);
    }

    audioAnalyzerState.spectrogram = matrix;
    audioAnalyzerState.spectrogramTimestamps = timestamps;
}

/**
 * Start or resume playback.
 */
export async function playAudio() {
    if (!_audioBuffer) return;

    // Create context if needed
    if (!_audioCtx || _audioCtx.state === 'closed') {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') {
        await _audioCtx.resume();
    }

    // Try to init worklet (graceful fallback — playback works without it)
    await _initWorklet();

    // Stop any previous source
    _stopSource();

    // Create buffer source
    _sourceNode = _audioCtx.createBufferSource();
    _sourceNode.buffer = _audioBuffer;

    if (_workletNode) {
        _sourceNode.connect(_workletNode);
        _workletNode.connect(_audioCtx.destination);
    } else {
        _sourceNode.connect(_audioCtx.destination);
    }

    _sourceNode.onended = () => {
        if (audioAnalyzerState.engineState === AudioState.PLAYING) {
            audioAnalyzerState.currentTime = audioAnalyzerState.duration;
            _setState(AudioState.READY);
            _cancelTimeTrack();
        }
    };

    _startTime = _audioCtx.currentTime;
    _sourceNode.start(0, _startOffset);
    _setState(AudioState.PLAYING);
    _startTimeTrack();
}

/**
 * Pause playback.
 */
export function pauseAudio() {
    if (audioAnalyzerState.engineState !== AudioState.PLAYING) return;
    _startOffset = audioAnalyzerState.currentTime;
    _stopSource();
    _cancelTimeTrack();
    _setState(AudioState.PAUSED);
}

/**
 * Seek to a specific time (seconds).
 */
export function seekAudio(timeSec) {
    const t = Math.max(0, Math.min(timeSec, audioAnalyzerState.duration));
    _startOffset = t;
    audioAnalyzerState.currentTime = t;

    if (audioAnalyzerState.engineState === AudioState.PLAYING) {
        // Restart playback from new position
        playAudio();
    } else {
        notify();
    }
}

/**
 * Stop and reset.
 */
export function stopAudio() {
    _stopSource();
    _cancelTimeTrack();
    _startOffset = 0;
    audioAnalyzerState.currentTime = 0;
    _setState(AudioState.READY);
}

/**
 * Update FFT size — recomputes offline spectrogram.
 */
export function setFFTSize(size) {
    audioAnalyzerState.fftSize = size;
    if (_workletNode) {
        _workletNode.port.postMessage({ type: 'config', fftSize: size });
    }
    if (audioAnalyzerState.pcmData) {
        _computeOfflineSpectrogram(audioAnalyzerState.pcmData, audioAnalyzerState.sampleRate);
        notify();
    }
}

/**
 * Update window type — recomputes offline spectrogram.
 */
export function setWindowType(type) {
    audioAnalyzerState.windowType = type;
    if (_workletNode) {
        _workletNode.port.postMessage({ type: 'config', windowType: type });
    }
    if (audioAnalyzerState.pcmData) {
        _computeOfflineSpectrogram(audioAnalyzerState.pcmData, audioAnalyzerState.sampleRate);
        notify();
    }
}

/**
 * Cleanup everything.
 */
export function disposeAudioEngine() {
    _stopSource();
    _cancelTimeTrack();
    if (_audioCtx && _audioCtx.state !== 'closed') _audioCtx.close();
    _audioCtx = null;
    _workletNode = null;
    _audioBuffer = null;
    audioAnalyzerState.engineState = AudioState.IDLE;
    audioAnalyzerState.pcmData = null;
    _resetSpectrogram();
}

// ─── Internals ──────────────────────────────────────────────────────

async function _initWorklet() {
    if (_workletNode || !_audioCtx) return;
    try {
        // Resolve path relative to the HTML file
        const workletUrl = new URL('./js/audio/dsp-worklet.js', location.href).href;
        await _audioCtx.audioWorklet.addModule(workletUrl);
        _workletNode = new AudioWorkletNode(_audioCtx, 'dsp-worklet-processor');

        _workletNode.port.onmessage = (e) => {
            const msg = e.data;
            if (msg.type === 'fft-frame') {
                audioAnalyzerState.lastFrame = {
                    magnitude: new Float32Array(msg.magnitude),
                    phase: new Float32Array(msg.phase),
                    timestamp: msg.timestamp
                };
            }
        };

        // Send initial config
        _workletNode.port.postMessage({
            type: 'config',
            fftSize: audioAnalyzerState.fftSize,
            windowType: audioAnalyzerState.windowType
        });

        console.log('[audio-engine] AudioWorklet initialized');
    } catch (err) {
        console.warn('[audio-engine] AudioWorklet not available, falling back to offline analysis:', err.message);
        _workletNode = null;
    }
}

function _stopSource() {
    if (_sourceNode) {
        try { _sourceNode.stop(); } catch (e) {}
        try { _sourceNode.disconnect(); } catch (e) {}
        _sourceNode = null;
    }
}

function _startTimeTrack() {
    _cancelTimeTrack();
    const tick = () => {
        if (audioAnalyzerState.engineState !== AudioState.PLAYING) return;
        audioAnalyzerState.currentTime = _startOffset + (_audioCtx.currentTime - _startTime);
        notify();
        _rafId = requestAnimationFrame(tick);
    };
    _rafId = requestAnimationFrame(tick);
}

function _cancelTimeTrack() {
    if (_rafId) {
        cancelAnimationFrame(_rafId);
        _rafId = null;
    }
}

// ─── Duplicate FFT for offline use (no module import available in engine) ─
function _fftInPlace(re, im) {
    const n = re.length;
    if (n <= 1) return;
    let j = 0;
    for (let i = 0; i < n - 1; i++) {
        if (i < j) {
            let tmp = re[i]; re[i] = re[j]; re[j] = tmp;
            tmp = im[i]; im[i] = im[j]; im[j] = tmp;
        }
        let m = n >> 1;
        while (m >= 1 && j >= m) { j -= m; m >>= 1; }
        j += m;
    }
    for (let step = 2; step <= n; step <<= 1) {
        const half = step >> 1;
        const angle = -2 * Math.PI / step;
        const wRe = Math.cos(angle);
        const wIm = Math.sin(angle);
        for (let group = 0; group < n; group += step) {
            let tRe = 1, tIm = 0;
            for (let pair = 0; pair < half; pair++) {
                const even = group + pair;
                const odd = even + half;
                const oRe = re[odd] * tRe - im[odd] * tIm;
                const oIm = re[odd] * tIm + im[odd] * tRe;
                re[odd] = re[even] - oRe;
                im[odd] = im[even] - oIm;
                re[even] += oRe;
                im[even] += oIm;
                const nextRe = tRe * wRe - tIm * wIm;
                const nextIm = tRe * wIm + tIm * wRe;
                tRe = nextRe;
                tIm = nextIm;
            }
        }
    }
}

function _makeWindow(type, n) {
    const w = new Float32Array(n);
    switch (type) {
        case 'hann':
            for (let i = 0; i < n; i++) w[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (n - 1)));
            break;
        case 'hamming':
            for (let i = 0; i < n; i++) w[i] = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (n - 1));
            break;
        case 'blackman':
            for (let i = 0; i < n; i++)
                w[i] = 0.42 - 0.5 * Math.cos(2 * Math.PI * i / (n - 1)) + 0.08 * Math.cos(4 * Math.PI * i / (n - 1));
            break;
        default:
            w.fill(1);
    }
    return w;
}
