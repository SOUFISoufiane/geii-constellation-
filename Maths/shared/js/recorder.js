// ═══════════════════════════════════════════════════════════════════
//  RECORDER — Capture the active plot as a WebM video
//
//  Tier 1, Phase 6 (C) of [[concepts/tier1-implementation-plan]].
//  Strategy: poll Plotly.toImage() at ~12 FPS into an offscreen canvas,
//  pipe canvas.captureStream() into MediaRecorder. On stop, auto-download
//  a .webm file. This works without extra deps and survives Plotly's
//  SVG/Canvas rendering quirks.
//
//  Why WebM and not GIF: GIF needs a heavy lib (gif.js, ~500KB). WebM is
//  browser-native, smaller, and slides/Discord/Notion accept it. Users who
//  truly need GIF can convert with one ffmpeg command.
// ═══════════════════════════════════════════════════════════════════

const TARGET_FPS = 12;
const FRAME_MS = Math.round(1000 / TARGET_FPS);

let recorderState = {
    isRecording: false,
    plotElId:   'plot-fusion',  // default — apps may override
    canvas:     null,
    ctx:        null,
    mediaRecorder: null,
    chunks:     [],
    pollTimer:  null,
    startTime:  0,
    onTick:     null  // optional callback for UI updates
};

/**
 * Start a recording session.
 * @param {object} opts
 * @param {string} [opts.plotElId='plot-fusion']  Id of the Plotly host element
 * @param {(elapsedMs:number) => void} [opts.onTick]  Called once per frame
 * @returns {Promise<boolean>} true if recording started
 */
export async function startRecording(opts = {}) {
    if (recorderState.isRecording) return false;
    if (!window.Plotly || !window.Plotly.toImage) {
        console.error('[recorder] Plotly.toImage unavailable');
        return false;
    }
    if (typeof MediaRecorder === 'undefined') {
        console.error('[recorder] MediaRecorder not supported in this browser');
        return false;
    }

    recorderState.plotElId = opts.plotElId || 'plot-fusion';
    recorderState.onTick = opts.onTick || null;

    const plotEl = document.getElementById(recorderState.plotElId);
    if (!plotEl) {
        console.error('[recorder] plot element not found:', recorderState.plotElId);
        return false;
    }

    // Size the offscreen canvas to match the plot's visible box
    const rect = plotEl.getBoundingClientRect();
    const w = Math.max(640, Math.round(rect.width));
    const h = Math.max(360, Math.round(rect.height));
    recorderState.canvas = document.createElement('canvas');
    recorderState.canvas.width = w;
    recorderState.canvas.height = h;
    recorderState.ctx = recorderState.canvas.getContext('2d');

    // Black background so transparent areas don't look broken
    recorderState.ctx.fillStyle = '#0a0a1a';
    recorderState.ctx.fillRect(0, 0, w, h);

    // Stream from the canvas
    const stream = recorderState.canvas.captureStream(TARGET_FPS);

    // Pick the best available codec
    const mimes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
    const mimeType = mimes.find(m => MediaRecorder.isTypeSupported(m)) || '';
    recorderState.mediaRecorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 2_500_000 });
    recorderState.chunks = [];
    recorderState.mediaRecorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) recorderState.chunks.push(e.data);
    };

    recorderState.mediaRecorder.start();
    recorderState.isRecording = true;
    recorderState.startTime = performance.now();

    // Frame poll loop — paints the latest Plotly snapshot onto the canvas
    const poll = async () => {
        if (!recorderState.isRecording) return;
        try {
            const url = await Plotly.toImage(recorderState.plotElId, { format: 'png', width: w, height: h });
            const img = new Image();
            img.onload = () => {
                if (!recorderState.isRecording) return;
                recorderState.ctx.fillStyle = '#0a0a1a';
                recorderState.ctx.fillRect(0, 0, w, h);
                recorderState.ctx.drawImage(img, 0, 0, w, h);
            };
            img.src = url;
        } catch (e) {
            // Plotly snapshot can occasionally fail mid-render — keep going
        }
        const elapsed = performance.now() - recorderState.startTime;
        if (recorderState.onTick) recorderState.onTick(elapsed);
        recorderState.pollTimer = setTimeout(poll, FRAME_MS);
    };
    poll();

    return true;
}

/**
 * Stop the recording and trigger download.
 * @param {string} [filename] — auto-generated if omitted
 * @returns {Promise<Blob|null>} the recorded blob (also downloaded)
 */
export function stopRecording(filename) {
    if (!recorderState.isRecording) return Promise.resolve(null);

    return new Promise((resolve) => {
        clearTimeout(recorderState.pollTimer);
        recorderState.pollTimer = null;
        recorderState.isRecording = false;

        const onStop = () => {
            const blob = new Blob(recorderState.chunks, { type: 'video/webm' });
            const name = filename || defaultFilename();
            triggerDownload(blob, name);
            resolve(blob);
        };
        recorderState.mediaRecorder.addEventListener('stop', onStop, { once: true });
        try { recorderState.mediaRecorder.stop(); } catch { onStop(); }
    });
}

export function isRecording() {
    return recorderState.isRecording;
}

function defaultFilename() {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return `signal-observatory-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}.webm`;
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Free the blob URL on next tick — give the browser time to start the download
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
