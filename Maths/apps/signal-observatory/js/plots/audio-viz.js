// ═══════════════════════════════════════════════════════════════════
//  AUDIO VIZ — Plotly renderers for the Audio DSP Analyzer mode
//  Three views: Oscilloscope (time), 2D Spectrogram, 3D Surface
// ═══════════════════════════════════════════════════════════════════

import { audioAnalyzerState, AudioState } from '../audio/file-audio-engine.js';
import {
    baseLayout, baseLayoutLegend, axisTitle,
    PALETTE, COSMIC_COLORSCALE, PLOTLY_CONFIG, getFont
} from './plotly-config.js';

// ─── Peak detection for the oscilloscope overlay ────────────────────
function detectTransients(pcm, sr, thresholdRMS = 0.15) {
    if (!pcm || pcm.length < 512) return [];
    const frameSize = 512;
    const hop = 256;
    const peaks = [];
    let prevRMS = 0;

    for (let i = 0; i < pcm.length - frameSize; i += hop) {
        let sum = 0;
        for (let j = 0; j < frameSize; j++) {
            sum += pcm[i + j] * pcm[i + j];
        }
        const rms = Math.sqrt(sum / frameSize);
        // Onset = sudden RMS increase
        if (rms > thresholdRMS && rms > prevRMS * 2.5 && peaks.length < 50) {
            peaks.push({ time: i / sr, rms });
        }
        prevRMS = rms;
    }
    return peaks;
}

// ─── Downsample long PCM for Plotly (keep it under ~8000 points) ────
function downsampleForPlot(pcm, sr, maxPoints = 8000) {
    const n = pcm.length;
    if (n <= maxPoints) {
        return {
            t: Array.from({ length: n }, (_, i) => i / sr),
            y: Array.from(pcm)
        };
    }
    const step = Math.ceil(n / maxPoints);
    const t = [];
    const y = [];
    for (let i = 0; i < n; i += step) {
        // Min-max decimation (preserves peaks)
        let lo = pcm[i], hi = pcm[i];
        const end = Math.min(i + step, n);
        for (let j = i; j < end; j++) {
            if (pcm[j] < lo) lo = pcm[j];
            if (pcm[j] > hi) hi = pcm[j];
        }
        const mid = (i + end - 1) / 2;
        t.push(mid / sr, (mid + 0.5) / sr);
        y.push(lo, hi);
    }
    return { t, y };
}

// ═══════════════════════════════════════════════════════════════════
//  MAIN FUSION RENDERER — dispatched from fusion-modes.js
// ═══════════════════════════════════════════════════════════════════

export function renderAudioAnalyzer() {
    const s = audioAnalyzerState;

    if (s.engineState === AudioState.IDLE) {
        _renderUploadPlaceholder();
        return;
    }
    if (s.engineState === AudioState.DECODING) {
        _renderDecodingSkeleton();
        return;
    }

    // READY / PLAYING / PAUSED → full visualization
    _renderFusionPanel(s);
    _renderTelemetryPanels(s);
}

// ─── Upload placeholder (fusion panel) ─────────────────────────────
function _renderUploadPlaceholder() {
    const layout = baseLayout({
        xaxis: { visible: false },
        yaxis: { visible: false },
        annotations: [{
            text: '🎵 Glissez un fichier audio ici<br>ou cliquez pour charger<br><span style="font-size:0.7em;color:' + PALETTE.textDim + '">WAV · MP3 · OGG · FLAC</span>',
            showarrow: false,
            font: { size: 16, color: PALETTE.textMid, family: 'Space Mono, monospace' },
            xref: 'paper', yref: 'paper', x: 0.5, y: 0.5
        }]
    });
    Plotly.react('plot-fusion', [], layout, PLOTLY_CONFIG);
    // Clear telemetry panels
    _clearTelemetry();
}

// ─── Decoding skeleton (fusion panel) ──────────────────────────────
function _renderDecodingSkeleton() {
    const layout = baseLayout({
        xaxis: { visible: false },
        yaxis: { visible: false },
        annotations: [{
            text: '⏳ Décodage PCM en cours…<br><span style="font-size:0.8em;color:' + PALETTE.cyan + '">' + (audioAnalyzerState.fileName || '') + '</span>',
            showarrow: false,
            font: { size: 14, color: PALETTE.textMid, family: 'Space Mono, monospace' },
            xref: 'paper', yref: 'paper', x: 0.5, y: 0.5
        }]
    });
    Plotly.react('plot-fusion', [], layout, PLOTLY_CONFIG);
    _clearTelemetry();
}

// ─── Full visualization (fusion = 2D spectrogram + 3D surface) ─────
function _renderFusionPanel(s) {
    const { spectrogram, spectrogramTimestamps, sampleRate, fftSize, currentTime, duration } = s;

    if (!spectrogram || spectrogram.length === 0) {
        _renderUploadPlaceholder();
        return;
    }

    const nBins = fftSize >> 1;
    const nyquist = sampleRate / 2;

    // Frequency axis (Hz)
    const fAxis = Array.from({ length: nBins }, (_, i) => (i / nBins) * nyquist);
    // Time axis
    const tAxis = spectrogramTimestamps;

    // Transpose for heatmap: z[freq][time]
    const zData = Array.from({ length: nBins }, (_, f) => {
        return tAxis.map((_, t) => spectrogram[t] ? (spectrogram[t][f] || -100) : -100);
    });

    // Clamp dB range for better visual contrast
    const DB_FLOOR = -80;
    for (let f = 0; f < zData.length; f++) {
        for (let t = 0; t < zData[f].length; t++) {
            if (zData[f][t] < DB_FLOOR) zData[f][t] = DB_FLOOR;
        }
    }

    // Use subplots: left = 2D heatmap, right = 3D surface
    const layout = baseLayout({
        margin: { t: 28, b: 42, l: 55, r: 12 },
        grid: { rows: 1, columns: 2, pattern: 'independent', xgap: 0.08 },
        xaxis:  { title: axisTitle('Temps (s)'), gridcolor: PALETTE.bgGrid, domain: [0, 0.46] },
        yaxis:  { title: axisTitle('Fréquence (Hz)'), gridcolor: PALETTE.bgGrid, range: [0, Math.min(nyquist, 8000)] },
        scene:  {
            domain: { x: [0.54, 1], y: [0, 1] },
            bgcolor: 'rgba(0,0,0,0)',
            xaxis: { title: 'Temps (s)', gridcolor: PALETTE.bgGrid, tickfont: getFont() },
            yaxis: { title: 'Fréq (Hz)', gridcolor: PALETTE.bgGrid, tickfont: getFont(), range: [0, Math.min(nyquist, 8000)] },
            zaxis: { title: 'dB', gridcolor: PALETTE.bgGrid, tickfont: getFont() },
            camera: { eye: { x: -1.6, y: -1.4, z: 0.7 } }
        }
    });

    // Downsample spectrogram for 3D surface (limit to ~200 time frames × 128 freq bins)
    const maxFrames3D = 200;
    const maxBins3D = 128;
    const tStep3D = Math.max(1, Math.floor(tAxis.length / maxFrames3D));
    const fStep3D = Math.max(1, Math.floor(nBins / maxBins3D));

    const tAxis3D = [];
    const fAxis3D = [];
    const zData3D = [];

    for (let fi = 0; fi < nBins; fi += fStep3D) {
        fAxis3D.push(fAxis[fi]);
    }
    for (let ti = 0; ti < tAxis.length; ti += tStep3D) {
        tAxis3D.push(tAxis[ti]);
    }
    for (let fi = 0; fi < fAxis3D.length; fi++) {
        const row = [];
        for (let ti = 0; ti < tAxis3D.length; ti++) {
            const srcF = fi * fStep3D;
            const srcT = ti * tStep3D;
            const val = (spectrogram[srcT] && spectrogram[srcT][srcF]) || -80;
            row.push(Math.max(val, DB_FLOOR));
        }
        zData3D.push(row);
    }

    const data = [
        // 2D Spectrogram (heatmap)
        {
            z: zData, x: tAxis, y: fAxis,
            type: 'heatmap',
            colorscale: COSMIC_COLORSCALE,
            showscale: true,
            zsmooth: 'best',
            colorbar: {
                title: { text: 'dB', font: getFont() },
                tickfont: getFont(),
                len: 0.9,
                thickness: 10,
                x: 0.47
            },
            xaxis: 'x', yaxis: 'y',
            hovertemplate: 't=%{x:.3f}s<br>f=%{y:.0f}Hz<br>%{z:.1f}dB<extra></extra>'
        },
        // 3D Surface
        {
            z: zData3D, x: tAxis3D, y: fAxis3D,
            type: 'surface',
            colorscale: COSMIC_COLORSCALE,
            showscale: false,
            scene: 'scene',
            lighting: { ambient: 0.6, diffuse: 0.5, specular: 0.3, roughness: 0.7 },
            contours: {
                z: { show: true, usecolormap: true, project: { z: true } }
            }
        }
    ];

    // Playhead line on the 2D spectrogram
    if (currentTime > 0 && currentTime < duration) {
        data.push({
            x: [currentTime, currentTime],
            y: [0, Math.min(nyquist, 8000)],
            type: 'scatter', mode: 'lines',
            line: { color: PALETTE.gold, width: 2, dash: 'solid' },
            xaxis: 'x', yaxis: 'y',
            hoverinfo: 'skip', showlegend: false
        });
    }

    Plotly.react('plot-fusion', data, layout, PLOTLY_CONFIG);
}

// ─── Telemetry panels (oscilloscope, spectrum snapshot, phase, stats) ─
function _renderTelemetryPanels(s) {
    const { pcmData, sampleRate, currentTime, fftSize, spectrogram, spectrogramTimestamps } = s;
    if (!pcmData) return;

    // ① Oscilloscope — time-domain waveform
    _renderOscilloscope(pcmData, sampleRate, currentTime);

    // ② Spectrum snapshot at current playhead time
    _renderSpectrumSnapshot(s);

    // ③ Phase display (from current frame)
    _renderPhaseSnapshot(s);

    // ④ Winding / Statistics panel
    _renderAudioStats(s);
}

function _renderOscilloscope(pcm, sr, currentTime) {
    // Show a window around the current playhead (±50ms)
    const windowSec = 0.05;
    const centerSample = Math.floor(currentTime * sr);
    const halfWin = Math.floor(windowSec * sr);
    const start = Math.max(0, centerSample - halfWin);
    const end = Math.min(pcm.length, centerSample + halfWin);

    const t = [];
    const y = [];
    for (let i = start; i < end; i++) {
        t.push(i / sr);
        y.push(pcm[i]);
    }

    // Peak detection for transient overlay
    const transients = detectTransients(pcm, sr);
    const visibleTransients = transients.filter(
        p => p.time >= (start / sr) && p.time <= (end / sr)
    );

    const traces = [{
        x: t, y, type: 'scattergl', mode: 'lines',
        line: { color: PALETTE.blue, width: 1.5 },
        fill: 'tozeroy', fillcolor: 'rgba(79,140,255,0.08)',
        name: 'PCM'
    }];

    // Playhead marker
    if (currentTime > 0) {
        traces.push({
            x: [currentTime, currentTime],
            y: [-1, 1],
            type: 'scatter', mode: 'lines',
            line: { color: PALETTE.gold, width: 1.5 },
            hoverinfo: 'skip', showlegend: false
        });
    }

    // Transient markers
    if (visibleTransients.length > 0) {
        traces.push({
            x: visibleTransients.map(p => p.time),
            y: visibleTransients.map(p => p.rms),
            type: 'scatter', mode: 'markers',
            marker: { color: PALETTE.red, size: 6, symbol: 'triangle-up', line: { width: 1, color: '#fff' } },
            name: 'Transients', hoverinfo: 'text',
            text: visibleTransients.map(p => `t=${p.time.toFixed(3)}s RMS=${p.rms.toFixed(3)}`)
        });
    }

    const layout = baseLayout({
        xaxis: { ...baseLayout().xaxis, title: axisTitle('t (s)') },
        yaxis: { ...baseLayout().yaxis, title: axisTitle('Amplitude'), range: [-1.05, 1.05] }
    });

    Plotly.react('plot-raw-time', traces, layout, PLOTLY_CONFIG);
}

function _renderSpectrumSnapshot(s) {
    const { spectrogram, spectrogramTimestamps, sampleRate, fftSize, currentTime } = s;
    if (!spectrogram || spectrogram.length === 0) return;

    // Find nearest frame to currentTime
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < spectrogramTimestamps.length; i++) {
        const d = Math.abs(spectrogramTimestamps[i] - currentTime);
        if (d < bestDist) { bestDist = d; bestIdx = i; }
    }

    const frame = spectrogram[bestIdx];
    if (!frame) return;

    const nBins = frame.length;
    const nyquist = sampleRate / 2;
    const fAxis = Array.from({ length: nBins }, (_, i) => (i / nBins) * nyquist);
    const magData = Array.from(frame);

    // Find peaks
    const peakIndices = [];
    for (let i = 2; i < magData.length - 2; i++) {
        if (magData[i] > magData[i - 1] && magData[i] > magData[i + 1] &&
            magData[i] > magData[i - 2] && magData[i] > magData[i + 2] &&
            magData[i] > -40) {
            peakIndices.push(i);
        }
    }
    // Keep top 10 peaks
    peakIndices.sort((a, b) => magData[b] - magData[a]);
    const topPeaks = peakIndices.slice(0, 10);

    const traces = [{
        x: fAxis, y: magData, type: 'scattergl', mode: 'lines',
        line: { color: PALETTE.cyan, width: 1.5 },
        fill: 'tozeroy', fillcolor: 'rgba(0,245,212,0.06)',
        name: '|S(f)| dB'
    }];

    if (topPeaks.length > 0) {
        traces.push({
            x: topPeaks.map(i => fAxis[i]),
            y: topPeaks.map(i => magData[i]),
            type: 'scatter', mode: 'markers+text',
            marker: { color: PALETTE.gold, size: 5, symbol: 'circle' },
            text: topPeaks.map(i => `${fAxis[i].toFixed(0)} Hz`),
            textposition: 'top center',
            textfont: { size: 8, color: PALETTE.gold, family: 'Space Mono, monospace' },
            name: 'Peaks', showlegend: false
        });
    }

    const layout = baseLayout({
        xaxis: { ...baseLayout().xaxis, title: axisTitle('f (Hz)'), range: [0, Math.min(nyquist, 8000)] },
        yaxis: { ...baseLayout().yaxis, title: axisTitle('dB') }
    });

    Plotly.react('plot-raw-mag', traces, layout, PLOTLY_CONFIG);
}

function _renderPhaseSnapshot(s) {
    const { lastFrame, spectrogram, spectrogramTimestamps, sampleRate, fftSize, currentTime } = s;

    // If we have a live frame from the worklet, use it; otherwise derive from spectrogram
    // For phase we need the raw FFT — we'll compute it on the fly from PCM around currentTime
    const { pcmData } = s;
    if (!pcmData) return;

    const N = fftSize;
    const centerSample = Math.floor(currentTime * sampleRate);
    const start = Math.max(0, centerSample - (N >> 1));

    const re = new Float32Array(N);
    const im = new Float32Array(N);
    // Hann window
    for (let i = 0; i < N; i++) {
        const sample = pcmData[start + i] || 0;
        const w = 0.5 * (1 - Math.cos(2 * Math.PI * i / (N - 1)));
        re[i] = sample * w;
    }
    _quickFFT(re, im);

    const nBins = N >> 1;
    const nyquist = sampleRate / 2;
    const fAxis = Array.from({ length: nBins }, (_, i) => (i / nBins) * nyquist);
    const phaseData = Array.from({ length: nBins }, (_, k) => Math.atan2(im[k], re[k]));

    const layout = baseLayout({
        xaxis: { ...baseLayout().xaxis, title: axisTitle('f (Hz)'), range: [0, Math.min(nyquist, 8000)] },
        yaxis: { ...baseLayout().yaxis, title: axisTitle('φ (rad)'), range: [-Math.PI - 0.2, Math.PI + 0.2] }
    });

    Plotly.react('plot-raw-phase', [{
        x: fAxis, y: phaseData, type: 'scattergl', mode: 'lines',
        line: { color: PALETTE.gold, width: 1 }
    }], layout, PLOTLY_CONFIG);
}

function _renderAudioStats(s) {
    const { pcmData, sampleRate, currentTime, duration, fftSize } = s;
    if (!pcmData) return;

    // RMS energy over time (for the winding panel area)
    const windowSamples = 2048;
    const hop = 1024;
    const nFrames = Math.floor((pcmData.length - windowSamples) / hop) + 1;
    const maxFrames = 300;
    const frameStep = Math.max(1, Math.floor(nFrames / maxFrames));

    const tAxis = [];
    const rmsData = [];

    for (let fr = 0; fr < nFrames; fr += frameStep) {
        const start = fr * hop;
        let sum = 0;
        for (let i = 0; i < windowSamples && (start + i) < pcmData.length; i++) {
            sum += pcmData[start + i] * pcmData[start + i];
        }
        tAxis.push((start + windowSamples / 2) / sampleRate);
        rmsData.push(Math.sqrt(sum / windowSamples));
    }

    const traces = [{
        x: tAxis, y: rmsData, type: 'scatter', mode: 'lines',
        line: { color: PALETTE.green, width: 1.5 },
        fill: 'tozeroy', fillcolor: 'rgba(6,255,165,0.08)',
        name: 'RMS Energy'
    }];

    // Playhead
    if (currentTime > 0 && currentTime < duration) {
        const maxRMS = Math.max(...rmsData, 0.01);
        traces.push({
            x: [currentTime, currentTime],
            y: [0, maxRMS],
            type: 'scatter', mode: 'lines',
            line: { color: PALETTE.gold, width: 1.5 },
            hoverinfo: 'skip', showlegend: false
        });
    }

    const layout = baseLayout({
        xaxis: { ...baseLayout().xaxis, title: axisTitle('t (s)') },
        yaxis: { ...baseLayout().yaxis, title: axisTitle('RMS') }
    });

    Plotly.react('plot-raw-circle', traces, layout, PLOTLY_CONFIG);
}

function _clearTelemetry() {
    const empty = baseLayout({ xaxis: { visible: false }, yaxis: { visible: false } });
    ['plot-raw-time', 'plot-raw-mag', 'plot-raw-phase', 'plot-raw-circle'].forEach(id => {
        const el = document.getElementById(id);
        if (el) Plotly.react(id, [], empty, PLOTLY_CONFIG);
    });
}

// ─── Minimal in-place FFT (for phase computation) ───────────────────
function _quickFFT(re, im) {
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
