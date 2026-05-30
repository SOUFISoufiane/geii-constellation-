// ═══════════════════════════════════════════════════════════════════
//  AUDIO VIZ — Plotly renderers for the Audio DSP Analyzer mode
//  Three views: Oscilloscope (time), 2D Spectrogram, 3D Surface
// ═══════════════════════════════════════════════════════════════════

import { audioAnalyzerState, AudioState } from '../audio/file-audio-engine.js';
import {
    baseLayout, baseLayoutLegend, axisTitle,
    PALETTE, COSMIC_COLORSCALE, PLOTLY_CONFIG, getFont
} from './plotly-config.js';
import { renderEqCanvas, stopEqCanvas } from './eq-canvas.js';

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
        _renderUploadPlaceholder(s);
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

// ─── Upload / Streaming placeholder (fusion panel) ─────────────────────────────
function _renderUploadPlaceholder(s) {
    const isStreamingReady = s && s.engineState !== AudioState.IDLE && s.fileName;
    
    if (isStreamingReady) {
        renderEqCanvas(s);
    } else {
        stopEqCanvas();
    }

    // Only render the text annotation if we are idle or not playing (if playing, EQ takes over)
    const showText = !isStreamingReady || s.engineState !== AudioState.PLAYING;
    const msg = isStreamingReady
        ? `🎵 <b>${s.fileName}</b> chargé (Streaming).<br>Appuyez sur ▶ PLAY pour l'analyse en temps réel.`
        : `🎵 Glissez un fichier audio ici<br>ou cliquez pour charger<br><span style="font-size:0.7em;color:${PALETTE.textDim}">WAV · MP3 · OGG · FLAC</span>`;

    const layout = baseLayout({
        xaxis: { visible: false },
        yaxis: { visible: false },
        annotations: showText ? [{
            text: msg,
            showarrow: false,
            font: { size: 16, color: PALETTE.textMid, family: 'Space Mono, monospace' },
            xref: 'paper', yref: 'paper', x: 0.5, y: 0.5
        }] : []
    });
    
    // We clear the plotly traces, the canvas sits on top
    Plotly.react('plot-fusion', [], layout, PLOTLY_CONFIG);
    
    // Clear telemetry panels only if actually idle
    if (!isStreamingReady) {
        _clearTelemetry();
    }
}

// ─── Decoding skeleton (fusion panel) ──────────────────────────────
function _renderDecodingSkeleton() {
    stopEqCanvas();
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
        _renderUploadPlaceholder(s);
        return;
    }

    renderEqCanvas(s);

    const nBins = fftSize >> 1;
    const nyquist = sampleRate / 2;

    // Frequency axis (Hz)
    const fAxis = Array.from({ length: nBins }, (_, i) => (i / nBins) * nyquist);
    // Time axis
    const tAxis = spectrogramTimestamps;

    const maxFrames3D = 200;
    const maxBins3D = 128;
    const tStep3D = Math.max(1, Math.floor(tAxis.length / maxFrames3D));
    const fStep3D = Math.max(1, Math.floor(nBins / maxBins3D));

    // Cache the heavy arrays on the window object to avoid massive 60fps allocations during playback
    if (!window._fusionCache || window._fusionCache.fileName !== s.fileName || window._fusionCache.specLength !== spectrogram.length) {
        
        const zData = Array.from({ length: nBins }, (_, f) => {
            return tAxis.map((_, t) => spectrogram[t] ? (spectrogram[t][f] || -100) : -100);
        });

        const DB_FLOOR = -80;
        for (let f = 0; f < zData.length; f++) {
            for (let t = 0; t < zData[f].length; t++) {
                if (zData[f][t] < DB_FLOOR) zData[f][t] = DB_FLOOR;
            }
        }

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

        window._fusionCache = {
            fileName: s.fileName,
            specLength: spectrogram.length,
            zData, zData3D, tAxis3D, fAxis3D, DB_FLOOR
        };
    }

    const { zData, zData3D, tAxis3D, fAxis3D } = window._fusionCache;

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
    const { pcmData, sampleRate, currentTime, fftSize, spectrogram, spectrogramTimestamps, lastFrame } = s;
    if (!pcmData && (!lastFrame || !lastFrame.timeDomain)) return;

    // Use state.telemetryMode to branch out 
    const mode = window.state ? window.state.telemetryMode : 'geii';
    
    // ① Panel 1: Time domain (Oscilloscope or related)
    if (mode === 'geii' || mode === 'job') {
        if (pcmData) {
            _renderOscilloscope(pcmData, sampleRate, currentTime);
        } else if (lastFrame && lastFrame.timeDomain) {
            _renderOscilloscopeStreaming(lastFrame.timeDomain, sampleRate, currentTime);
        }
    } else {
        // Fallback for other modes
        _renderEmptyPanel('plot-raw-time');
    }

    // ② Panel 2: Spectrum snapshot
    if (mode === 'geii' || mode === 'job' || mode === 'sys' || mode === 'acoustic') {
        _renderSpectrumSnapshot(s);
    } else {
        _renderEmptyPanel('plot-raw-mag');
    }

    // ③ Panel 3: Phase
    if (mode === 'geii' || mode === 'sys') {
        _renderPhaseSnapshot(s);
    } else {
        _renderEmptyPanel('plot-raw-phase');
    }

    // ④ Panel 4: Stats / RMS / Winding
    if (mode === 'geii' || mode === 'job' || mode === 'acoustic') {
        _renderAudioStats(s);
    } else {
        _renderEmptyPanel('plot-raw-circle');
    }
}

function _renderEmptyPanel(id) {
    const layout = baseLayout({
        xaxis: { visible: false },
        yaxis: { visible: false },
        annotations: [{
            text: '—', showarrow: false,
            font: { size: 14, color: PALETTE.textDim, family: 'Space Mono, monospace' }
        }]
    });
    Plotly.react(id, [], layout, PLOTLY_CONFIG);
}

function _renderOscilloscopeStreaming(timeDomain, sr, currentTime) {
    const t = [];
    const y = [];
    const N = timeDomain.length;
    // Current time represents the end of the window (approx)
    const startT = Math.max(0, currentTime - (N / sr));
    
    let rms = 0;
    for (let i = 0; i < N; i++) {
        t.push(startT + (i / sr));
        y.push(timeDomain[i]);
        rms += timeDomain[i] * timeDomain[i];
    }
    rms = Math.sqrt(rms / N);

    // Normalize intensity (RMS ~0.2 is very loud)
    const intensity = Math.min(1, rms * 4);
    const styles = getComputedStyle(document.body);
    const hStart = parseFloat(styles.getPropertyValue('--eq-hue-start').trim()) || 260;
    const hEnd = parseFloat(styles.getPropertyValue('--eq-hue-end').trim()) || 0;
    const dynHue = hStart + intensity * (hEnd - hStart);
    const dynColor = `hsl(${dynHue}, 100%, 65%)`;

    const traces = [{
        x: t, y, type: 'scattergl', mode: 'lines',
        line: { color: dynColor, width: 1.5 },
        fill: 'tozeroy', fillcolor: `hsla(${dynHue}, 100%, 65%, 0.1)`,
        name: 'PCM'
    }];

    const layout = baseLayout({
        xaxis: { ...baseLayout().xaxis, title: axisTitle('t (s)') },
        yaxis: { ...baseLayout().yaxis, title: axisTitle('Amplitude'), range: [-1.05, 1.05] }
    });

    Plotly.react('plot-raw-time', traces, layout, PLOTLY_CONFIG);
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
    let rms = 0;
    for (let i = start; i < end; i++) {
        t.push(i / sr);
        y.push(pcm[i]);
        rms += pcm[i] * pcm[i];
    }
    const winLen = end - start;
    if (winLen > 0) rms = Math.sqrt(rms / winLen);

    const intensity = Math.min(1, rms * 4);
    const styles = getComputedStyle(document.body);
    const hStart = parseFloat(styles.getPropertyValue('--eq-hue-start').trim()) || 260;
    const hEnd = parseFloat(styles.getPropertyValue('--eq-hue-end').trim()) || 0;
    const dynHue = hStart + intensity * (hEnd - hStart);
    const dynColor = `hsl(${dynHue}, 100%, 65%)`;

    // Peak detection for transient overlay
    const transients = detectTransients(pcm, sr);
    const visibleTransients = transients.filter(
        p => p.time >= (start / sr) && p.time <= (end / sr)
    );

    const traces = [{
        x: t, y, type: 'scattergl', mode: 'lines',
        line: { color: dynColor, width: 1.5 },
        fill: 'tozeroy', fillcolor: `hsla(${dynHue}, 100%, 65%, 0.1)`,
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
    const { spectrogram, spectrogramTimestamps, sampleRate, fftSize, currentTime, lastFrame } = s;
    let magData = null;
    let nBins = 0;

    if (spectrogram && spectrogram.length > 0) {
        // Find nearest offline frame
        let bestIdx = 0;
        let bestDist = Infinity;
        for (let i = 0; i < spectrogramTimestamps.length; i++) {
            const d = Math.abs(spectrogramTimestamps[i] - currentTime);
            if (d < bestDist) { bestDist = d; bestIdx = i; }
        }
        const frame = spectrogram[bestIdx];
        if (frame) {
            magData = Array.from(frame);
            nBins = frame.length;
        }
    } else if (lastFrame && lastFrame.magnitude) {
        // Streaming fallback
        magData = Array.from(lastFrame.magnitude);
        nBins = lastFrame.magnitude.length;
    }

    if (!magData) return;

    const nyquist = sampleRate / 2;
    const fAxis = Array.from({ length: nBins }, (_, i) => (i / nBins) * nyquist);

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

    // Generate rainbow color array based on current CSS variables
    const styles = getComputedStyle(document.body);
    const hStart = parseFloat(styles.getPropertyValue('--eq-hue-start').trim()) || 260;
    const hEnd = parseFloat(styles.getPropertyValue('--eq-hue-end').trim()) || 0;
    const colors = [];
    for (let i = 0; i < nBins; i++) {
        const t = i / nBins;
        const hue = hStart + t * (hEnd - hStart);
        colors.push(`hsl(${hue}, 100%, 60%)`);
    }

    const traces = [{
        x: fAxis, y: magData, type: 'bar',
        marker: { color: colors },
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

    // ─── Update HUD Overlay ───
    const hud = document.getElementById('fusion-hud');
    if (hud) {
        hud.style.display = 'flex';
        const f0 = topPeaks.length > 0 ? topPeaks[0] : 0;
        
        let sumMag = 0, sumFMag = 0;
        let maxDb = -Infinity;
        for(let i=0; i<nBins; i++) { 
            const m = Math.pow(10, magData[i]/20); 
            sumMag += m; 
            sumFMag += fAxis[i] * m; 
            if(magData[i] > maxDb) maxDb = magData[i];
        }
        
        const centroid = sumMag > 0 ? sumFMag / sumMag : 0;
        const pitchEl = document.getElementById('hud-pitch');
        const centroidEl = document.getElementById('hud-centroid');
        const rmsEl = document.getElementById('hud-rms');
        const noteEl = document.getElementById('hud-note');
        
        if (pitchEl) pitchEl.textContent = f0 > 0 ? `${f0.toFixed(1)} Hz` : '-- Hz';
        if (centroidEl) centroidEl.textContent = centroid > 0 ? `${centroid.toFixed(0)} Hz` : '-- Hz';
        if (rmsEl) rmsEl.textContent = isFinite(maxDb) ? `${maxDb.toFixed(1)} dBFS` : '-- dBFS';
        
        if(f0 > 0 && noteEl) {
            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const halfSteps = Math.round(12 * Math.log2(f0 / 440));
            const idx = (halfSteps + 9) % 12; // A is 9
            const noteIdx = idx < 0 ? idx + 12 : idx;
            const octave = 4 + Math.floor((halfSteps + 9) / 12);
            noteEl.textContent = `${noteNames[noteIdx]}${octave}`;
        } else if (noteEl) {
            noteEl.textContent = '--';
        }
        
        // Piano active keys highlight
        if (f0 > 0 && noteEl) {
            const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
            const halfSteps = Math.round(12 * Math.log2(f0 / 440));
            const idx = (halfSteps + 9) % 12; 
            const noteIdx = idx < 0 ? idx + 12 : idx;
            const octave = 4 + Math.floor((halfSteps + 9) / 12);
            
            // clear all piano active states
            const keys = document.querySelectorAll('.piano-key');
            keys.forEach(k => {
                const isBlack = k.classList.contains('black');
                k.style.backgroundColor = k.classList.contains('black') ? '#222' : '#ddd';
            });
            
            const activeKeyId = `key-${noteNames[noteIdx].replace('#','s')}${octave}`;
            const activeKey = document.getElementById(activeKeyId);
            if (activeKey) {
                activeKey.style.backgroundColor = 'var(--accent-cyan)';
            }
        }
    }
}

function _renderPhaseSnapshot(s) {
    const { lastFrame, spectrogram, spectrogramTimestamps, sampleRate, fftSize, currentTime } = s;

    // If we have a live frame from the worklet, use it; otherwise derive from spectrogram
    // For phase we need the raw FFT — we'll compute it on the fly from PCM around currentTime
    const { pcmData } = s;
    
    let phaseData = null;
    const nBins = fftSize >> 1;
    const nyquist = sampleRate / 2;
    const fAxis = Array.from({ length: nBins }, (_, i) => (i / nBins) * nyquist);

    if (lastFrame && lastFrame.phase && lastFrame.phase.length > 0) {
        phaseData = lastFrame.phase;
    } else if (pcmData) {
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
        phaseData = Array.from({ length: nBins }, (_, k) => Math.atan2(im[k], re[k]));
    }

    if (!phaseData) return;

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
    const { pcmData, sampleRate, currentTime, duration, fftSize, lastFrame } = s;
    if (!pcmData && (!lastFrame || !lastFrame.timeDomain)) return;

    let tAxis = [];
    let rmsData = [];

    if (pcmData) {
        // Full file RMS computation
        const windowSamples = 2048;
        const hop = 1024;
        const nFrames = Math.floor((pcmData.length - windowSamples) / hop) + 1;
        const maxFrames = 300;
        const frameStep = Math.max(1, Math.floor(nFrames / maxFrames));

        for (let fr = 0; fr < nFrames; fr += frameStep) {
            const start = fr * hop;
            let sum = 0;
            for (let i = 0; i < windowSamples && (start + i) < pcmData.length; i++) {
                sum += pcmData[start + i] * pcmData[start + i];
            }
            tAxis.push((start + windowSamples / 2) / sampleRate);
            rmsData.push(Math.sqrt(sum / windowSamples));
        }
    } else if (lastFrame && lastFrame.timeDomain) {
        // Streaming mode: just compute current RMS and append to a rolling array
        window._streamingRMS = window._streamingRMS || { t: [], y: [] };
        const hist = window._streamingRMS;
        
        // Reset if we loop or seek backwards
        if (hist.t.length > 0 && currentTime < hist.t[hist.t.length - 1]) {
            hist.t = [];
            hist.y = [];
        }

        let sum = 0;
        const N = lastFrame.timeDomain.length;
        for (let i = 0; i < N; i++) {
            sum += lastFrame.timeDomain[i] * lastFrame.timeDomain[i];
        }
        const rms = Math.sqrt(sum / N);
        
        hist.t.push(currentTime);
        hist.y.push(rms);
        
        // Keep last 300 values to prevent massive arrays
        if (hist.t.length > 300) {
            hist.t.shift();
            hist.y.shift();
        }
        
        tAxis = hist.t;
        rmsData = hist.y;
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
