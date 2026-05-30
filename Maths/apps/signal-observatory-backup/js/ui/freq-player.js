// ═══════════════════════════════════════════════════════════════════
//  FREQ PLAYER — Animate frequency parameter over time
//  Sweeps state.windingFreq (the rotation freq used in winding 2D
//  and as f_signal for aliasing detection) within a user-defined
//  [fMin, fMax] range.
//
//  Modes:
//   - linear:   triangle wave (f0 → f1 → f0 → f1 …)
//   - log:      logarithmic sweep
//   - pingpong: oscillates back and forth (same as linear but explicit)
//   - sine:     smooth sinusoidal sweep
// ═══════════════════════════════════════════════════════════════════

let rafId = null;
let lastTimestamp = 0;
let onTickCallback = null;

export const freqPlayerState = {
    isPlaying:  false,
    fMin:       -3.0,
    fMax:       3.0,
    period:     4.0,         // seconds for a full sweep cycle
    mode:       'linear',    // 'linear' | 'log' | 'sine'
    speed:      1.0,         // multiplier
    currentT:   0,           // internal time accumulator
    currentFreq: 1.0
};

export function initFreqPlayer(onTick) {
    onTickCallback = onTick;

    const playBtn  = document.getElementById('fplay-play');
    const pauseBtn = document.getElementById('fplay-pause');
    const resetBtn = document.getElementById('fplay-reset');
    const fminIn   = document.getElementById('fplay-fmin');
    const fmaxIn   = document.getElementById('fplay-fmax');
    const periodIn = document.getElementById('fplay-period');
    const speedIn  = document.getElementById('fplay-speed');
    const modeSel  = document.getElementById('fplay-mode');

    if (!playBtn) return;

    playBtn.addEventListener('click',  () => play());
    pauseBtn.addEventListener('click', () => pause());
    resetBtn.addEventListener('click', () => {
        pause();
        freqPlayerState.currentT = 0;
        applyFreq();
        if (onTickCallback) onTickCallback(freqPlayerState);
    });

    fminIn.addEventListener('input', e => {
        freqPlayerState.fMin = parseFloat(e.target.value);
        document.getElementById('fplay-fmin-val').value = freqPlayerState.fMin.toFixed(1);
        applyFreq();
        if (onTickCallback) onTickCallback(freqPlayerState);
    });
    document.getElementById('fplay-fmin-val').addEventListener('change', e => {
        freqPlayerState.fMin = parseFloat(e.target.value);
        fminIn.value = freqPlayerState.fMin;
        applyFreq();
        if (onTickCallback) onTickCallback(freqPlayerState);
    });

    fmaxIn.addEventListener('input', e => {
        freqPlayerState.fMax = parseFloat(e.target.value);
        document.getElementById('fplay-fmax-val').value = freqPlayerState.fMax.toFixed(1);
        applyFreq();
        if (onTickCallback) onTickCallback(freqPlayerState);
    });
    document.getElementById('fplay-fmax-val').addEventListener('change', e => {
        freqPlayerState.fMax = parseFloat(e.target.value);
        fmaxIn.value = freqPlayerState.fMax;
        applyFreq();
        if (onTickCallback) onTickCallback(freqPlayerState);
    });

    periodIn.addEventListener('input', e => {
        freqPlayerState.period = parseFloat(e.target.value);
        document.getElementById('fplay-period-val').value = freqPlayerState.period.toFixed(1);
    });
    document.getElementById('fplay-period-val').addEventListener('change', e => {
        freqPlayerState.period = parseFloat(e.target.value);
        periodIn.value = freqPlayerState.period;
    });

    speedIn.addEventListener('input', e => {
        const s = parseFloat(e.target.value) / 1000;
        freqPlayerState.speed = Math.sign(s) * Math.pow(Math.abs(s), 3) * 10;
        const v = freqPlayerState.speed;
        const f = Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(2);
        document.getElementById('fplay-speed-val').value = f;
    });
    document.getElementById('fplay-speed-val').addEventListener('change', e => {
        const v = parseFloat(e.target.value);
        freqPlayerState.speed = v;
        const s = Math.sign(v) * Math.pow(Math.abs(v)/10, 1/3);
        speedIn.value = s * 1000;
    });
    modeSel.addEventListener('change', e => {
        freqPlayerState.mode = e.target.value;
    });

    document.getElementById('fplay-current').addEventListener('change', e => {
        const targetF = parseFloat(e.target.value);
        // This is tricky because currentFreq is derived from currentT and mode.
        // For simplicity, we just set currentFreq and let the next tick override it,
        // or we could try to solve for currentT.
        // For linear mode: currentT = (targetF - fMin) / (fMax - fMin) * period / 2 (approx)
        freqPlayerState.currentFreq = targetF;
        if (onTickCallback) onTickCallback(freqPlayerState);
    });
}

function play() {
    if (freqPlayerState.isPlaying) return;
    freqPlayerState.isPlaying = true;
    lastTimestamp = performance.now();
    document.getElementById('fplay-play').classList.add('playing');
    document.getElementById('fplay-status').textContent = '▶ SWEEPING';
    document.getElementById('fplay-status').style.color = 'var(--accent-magenta)';
    rafId = requestAnimationFrame(tick);
}

function pause() {
    if (!freqPlayerState.isPlaying) return;
    freqPlayerState.isPlaying = false;
    document.getElementById('fplay-play').classList.remove('playing');
    document.getElementById('fplay-status').textContent = '⏸ PAUSED';
    document.getElementById('fplay-status').style.color = 'var(--text-mid)';
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
}

function tick(now) {
    if (!freqPlayerState.isPlaying) return;
    const dt = (now - lastTimestamp) / 1000;
    lastTimestamp = now;
    freqPlayerState.currentT += dt * freqPlayerState.speed;

    applyFreq();
    if (onTickCallback) onTickCallback(freqPlayerState);
    rafId = requestAnimationFrame(tick);
}

/** Compute current frequency from internal time, mode, range, period */
function applyFreq() {
    const { fMin, fMax, period, mode, currentT } = freqPlayerState;
    const T = Math.max(0.1, period);
    const phase = ((currentT % T) + T) % T;   // [0, T)
    const u = phase / T;                       // [0, 1)

    let freq;
    switch (mode) {
        case 'log': {
            // Logarithmic sweep — ping-pong in log space
            const absMin = Math.max(0.05, Math.abs(fMin));
            const absMax = Math.max(absMin + 0.1, Math.abs(fMax));
            const triangle = u < 0.5 ? 2*u : 2*(1-u);  // [0, 1] triangle
            const logF = Math.log10(absMin) + triangle * (Math.log10(absMax) - Math.log10(absMin));
            freq = Math.pow(10, logF) * Math.sign(fMax >= 0 ? 1 : -1);
            break;
        }
        case 'sine': {
            // Smooth sinusoidal sweep
            const center = (fMin + fMax) / 2;
            const amp = (fMax - fMin) / 2;
            freq = center + amp * Math.sin(2*Math.PI*u);
            break;
        }
        case 'linear':
        default: {
            // Triangle wave (ping-pong)
            const triangle = u < 0.5 ? 2*u : 2*(1-u);
            freq = fMin + triangle * (fMax - fMin);
            break;
        }
    }

    freqPlayerState.currentFreq = freq;

    // Update the visible "current freq" indicator in the panel
    const curEl = document.getElementById('fplay-current');
    if (curEl) curEl.value = freq.toFixed(3);
}

/** Toggle visibility of freq player panel */
export function toggleFreqPlayerPanel(visible) {
    const panel = document.getElementById('fplayer-panel');
    if (!panel) return;
    if (visible === undefined) {
        panel.classList.toggle('visible');
    } else {
        panel.classList.toggle('visible', visible);
    }
}
