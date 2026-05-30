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
let _audioEl     = null;
let _blobUrl     = null;
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

    if (_blobUrl) URL.revokeObjectURL(_blobUrl);
    _blobUrl = URL.createObjectURL(file);

    try {
        const isWav = file.name.toLowerCase().endsWith('.wav') || file.type === 'audio/wav';
        const isTooLarge = file.size > 10 * 1024 * 1024; // >10MB

        if (isWav) {
            await _parseWavAndChunkOfflineSpectrogram(file);
        } else if (!isTooLarge) {
            const arrayBuf = await file.arrayBuffer();
            let audioBuffer = null;
            try {
                const tmpCtx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 1, 44100);
                audioBuffer = await tmpCtx.decodeAudioData(arrayBuf);
            } catch (e) {
                console.warn('[audio-engine] decodeAudioData failed, falling back to streaming:', e);
            }

            if (audioBuffer) {
                const raw = audioBuffer.getChannelData(0);
                audioAnalyzerState.pcmData = raw;
                audioAnalyzerState.sampleRate = audioBuffer.sampleRate;
                audioAnalyzerState.duration = audioBuffer.duration;
                _computeOfflineSpectrogram(raw, audioBuffer.sampleRate);
            } else {
                // Fallback to streaming if decoding failed but size is small
                audioAnalyzerState.pcmData = null;
                await _fallbackToStreaming(file);
            }
        } else {
            console.warn('[audio-engine] File too large for offline spectrogram. Streaming only.');
            audioAnalyzerState.pcmData = null;
            await _fallbackToStreaming(file);
        }

        audioAnalyzerState.currentTime = 0;
        _setState(AudioState.READY);
        console.log(`[audio-engine] Decoded "${file.name}"`);
    } catch (err) {
        console.error('[audio-engine] Load error:', err);
        _setState(AudioState.IDLE);
        throw err;
    }
}

async function _fallbackToStreaming(file) {
    return new Promise((resolve, reject) => {
        const tempAudio = new Audio(_blobUrl);
        tempAudio.onloadedmetadata = () => {
            audioAnalyzerState.duration = tempAudio.duration;
            audioAnalyzerState.sampleRate = 44100; // Fallback guess
            resolve();
        };
        tempAudio.onerror = (e) => {
            reject(new Error("Audio tag failed to load metadata: " + (tempAudio.error?.message || "Unknown error")));
        };
    });
}

async function _parseWavAndChunkOfflineSpectrogram(file) {
    const headerBuf = await file.slice(0, 4096).arrayBuffer();
    const dv = new DataView(headerBuf);

    if (dv.getUint32(0, false) !== 0x52494646) throw new Error("Not a RIFF file");
    if (dv.getUint32(8, false) !== 0x57415645) throw new Error("Not a WAVE file");

    let offset = 12;
    let format = null;
    let dataOffset = 0;
    let dataLength = 0;

    while (offset < dv.byteLength) {
        const chunkId = dv.getUint32(offset, false);
        const chunkSize = dv.getUint32(offset + 4, true);
        if (chunkId === 0x666d7420) { // "fmt "
            format = {
                audioFormat: dv.getUint16(offset + 8, true),
                numChannels: dv.getUint16(offset + 10, true),
                sampleRate: dv.getUint32(offset + 12, true),
                byteRate: dv.getUint32(offset + 16, true),
                blockAlign: dv.getUint16(offset + 20, true),
                bitsPerSample: dv.getUint16(offset + 22, true)
            };
        } else if (chunkId === 0x64617461) { // "data"
            dataOffset = offset + 8;
            dataLength = chunkSize;
            break;
        }
        offset += 8 + chunkSize;
    }

    if (!format || !dataOffset) throw new Error("Invalid WAV header");

    audioAnalyzerState.sampleRate = format.sampleRate;
    audioAnalyzerState.duration = dataLength / format.byteRate;
    audioAnalyzerState.pcmData = null; // Streamed mode, no full PCM array

    if (format.audioFormat !== 1 && format.audioFormat !== 3) {
        console.warn('[audio-engine] Unsupported WAV format for chunking. Skipping offline spectrogram.');
        return;
    }

    const N = audioAnalyzerState.fftSize;
    const hop = N >> 1;
    const win = _makeWindow(audioAnalyzerState.windowType, N);
    const nBins = N >> 1;
    const bytesPerSample = format.bitsPerSample / 8;
    const frameByteSize = format.numChannels * bytesPerSample;
    
    const CHUNK_SIZE = 1024 * 1024; // 1MB
    let currentByte = dataOffset;
    const matrix = [];
    const timestamps = [];
    let leftoverSamples = new Float32Array(0);

    while (currentByte < dataOffset + dataLength) {
        const endByte = Math.min(currentByte + CHUNK_SIZE, dataOffset + dataLength);
        const chunkBuf = await file.slice(currentByte, endByte).arrayBuffer();
        const chunkDv = new DataView(chunkBuf);
        const numSamples = Math.floor(chunkBuf.byteLength / frameByteSize);
        
        const floatSamples = new Float32Array(numSamples);
        for (let i = 0; i < numSamples; i++) {
            let val = 0;
            if (format.audioFormat === 1 && format.bitsPerSample === 16) {
                val = chunkDv.getInt16(i * frameByteSize, true) / 32768.0;
            } else if (format.audioFormat === 3 && format.bitsPerSample === 32) {
                val = chunkDv.getFloat32(i * frameByteSize, true);
            }
            floatSamples[i] = val;
        }
        
        const combined = new Float32Array(leftoverSamples.length + floatSamples.length);
        combined.set(leftoverSamples, 0);
        combined.set(floatSamples, leftoverSamples.length);
        
        let pos = 0;
        let globalSamplePos = ((currentByte - dataOffset) / frameByteSize) - leftoverSamples.length;
        
        while (pos + N <= combined.length) {
            const re = new Float32Array(N);
            const im = new Float32Array(N);
            for (let i = 0; i < N; i++) {
                re[i] = combined[pos + i] * win[i];
            }
            _fftInPlace(re, im);
            const row = new Float32Array(nBins);
            for (let k = 0; k < nBins; k++) {
                const mag = Math.sqrt(re[k] * re[k] + im[k] * im[k]);
                row[k] = 20 * Math.log10(mag + 1e-10);
            }
            matrix.push(row);
            timestamps.push((globalSamplePos + pos + N / 2) / format.sampleRate);
            pos += hop;
        }
        
        leftoverSamples = combined.slice(pos);
        currentByte = endByte;
    }
    
    audioAnalyzerState.spectrogram = matrix;
    audioAnalyzerState.spectrogramTimestamps = timestamps;
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
    if (!_blobUrl) return;

    if (!_audioCtx || _audioCtx.state === 'closed') {
        _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (_audioCtx.state === 'suspended') {
        await _audioCtx.resume();
    }

    await _initWorklet();

    if (!_audioEl) {
        _audioEl = new Audio(_blobUrl);
        _sourceNode = _audioCtx.createMediaElementSource(_audioEl);

        if (_workletNode) {
            _sourceNode.connect(_workletNode);
            _workletNode.connect(_audioCtx.destination);
        } else {
            _sourceNode.connect(_audioCtx.destination);
        }

        _audioEl.onended = () => {
            if (audioAnalyzerState.engineState === AudioState.PLAYING) {
                audioAnalyzerState.currentTime = audioAnalyzerState.duration;
                _setState(AudioState.READY);
                _cancelTimeTrack();
            }
        };
    } else if (_audioEl.src !== _blobUrl) {
        _audioEl.src = _blobUrl;
    }

    _audioEl.currentTime = _startOffset;
    await _audioEl.play();
    _setState(AudioState.PLAYING);
    _startTimeTrack();
}

/**
 * Pause playback.
 */
export function pauseAudio() {
    if (audioAnalyzerState.engineState !== AudioState.PLAYING) return;
    if (_audioEl) {
        _audioEl.pause();
        _startOffset = _audioEl.currentTime;
    }
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
    if (_audioEl) _audioEl.currentTime = t;

    if (audioAnalyzerState.engineState !== AudioState.PLAYING) {
        notify();
    }
}

/**
 * Stop and reset.
 */
export function stopAudio() {
    if (_audioEl) {
        _audioEl.pause();
        _audioEl.currentTime = 0;
    }
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
    if (_audioEl) {
        _audioEl.pause();
        _audioEl.removeAttribute('src');
        _audioEl = null;
    }
    if (_blobUrl) {
        URL.revokeObjectURL(_blobUrl);
        _blobUrl = null;
    }
    _cancelTimeTrack();
    if (_audioCtx && _audioCtx.state !== 'closed') _audioCtx.close();
    _audioCtx = null;
    _workletNode = null;
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
                    timeDomain: msg.timeDomain ? new Float32Array(msg.timeDomain) : null,
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
    // Only used conceptually now, replaced by _audioEl.pause()
}

function _startTimeTrack() {
    _cancelTimeTrack();
    const tick = () => {
        if (audioAnalyzerState.engineState !== AudioState.PLAYING) return;
        if (_audioEl) {
            audioAnalyzerState.currentTime = _audioEl.currentTime;
        }
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
