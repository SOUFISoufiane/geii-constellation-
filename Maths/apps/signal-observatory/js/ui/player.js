// ═══════════════════════════════════════════════════════════════════
//  PLAYER — Temporal playback (period, timeframe, scrubbing)
//  Animates a "playhead" through the signal, optionally scrolling
//  the time axis and rendering a phasor / current sample marker.
// ═══════════════════════════════════════════════════════════════════

import { tRange } from '../math/axes.js';

let rafId = null;
let lastTimestamp = 0;
let onTickCallback = null;

export const playerState = {
    isPlaying:    false,
    currentTime:  0,        // current playback position (seconds)
    speed:        1.0,      // playback rate multiplier
    period:       2.0,      // user-chosen period T (sec) — used as loop length
    frameStart:   -3,       // displayed window start
    frameEnd:     5,        // displayed window end
    loop:         true
};

/**
 * Initialise player controls. Hooks up DOM events.
 * @param {Function} onTick - called every frame with playerState
 */
export function initPlayer(onTick) {
    onTickCallback = onTick;

    // Set defaults from tRange
    playerState.frameStart = tRange[0];
    playerState.frameEnd   = tRange[tRange.length - 1];

    const playBtn   = document.getElementById('player-play');
    const pauseBtn  = document.getElementById('player-pause');
    const resetBtn  = document.getElementById('player-reset');
    const speedIn   = document.getElementById('player-speed');
    const periodIn  = document.getElementById('player-period');
    const frameInS  = document.getElementById('player-frame-start');
    const frameInE  = document.getElementById('player-frame-end');
    const loopChk   = document.getElementById('player-loop');
    const scrubber  = document.getElementById('player-scrubber');

    if (!playBtn) return; // DOM not ready

    playBtn.addEventListener('click',  () => play());
    pauseBtn.addEventListener('click', () => pause());
    resetBtn.addEventListener('click', () => {
        pause();
        playerState.currentTime = playerState.frameStart;
        updateScrubber();
        if (onTickCallback) onTickCallback(playerState);
    });

    speedIn.addEventListener('input', e => {
        // Cubic mapping: slider [-1000, 1000] → speed [-10, +10]
        const s = parseFloat(e.target.value) / 1000;
        playerState.speed = Math.sign(s) * Math.pow(Math.abs(s), 3) * 10;
        const v = playerState.speed;
        const formatted = Math.abs(v) < 1 ? v.toFixed(3) : v.toFixed(2);
        document.getElementById('player-speed-val').value = formatted;
    });
    document.getElementById('player-speed-val').addEventListener('change', e => {
        const v = parseFloat(e.target.value);
        playerState.speed = v;
        const s = Math.sign(v) * Math.pow(Math.abs(v)/10, 1/3);
        speedIn.value = s * 1000;
    });

    periodIn.addEventListener('input', e => {
        playerState.period = parseFloat(e.target.value);
        document.getElementById('player-period-val').value = playerState.period.toFixed(1);
    });
    document.getElementById('player-period-val').addEventListener('change', e => {
        playerState.period = parseFloat(e.target.value);
        periodIn.value = playerState.period;
    });

    frameInS.addEventListener('input', e => {
        playerState.frameStart = parseFloat(e.target.value);
        document.getElementById('player-frame-start-val').value = playerState.frameStart.toFixed(1);
        if (playerState.currentTime < playerState.frameStart) {
            playerState.currentTime = playerState.frameStart;
        }
        updateScrubber();
        if (onTickCallback) onTickCallback(playerState);
    });
    document.getElementById('player-frame-start-val').addEventListener('change', e => {
        playerState.frameStart = parseFloat(e.target.value);
        frameInS.value = playerState.frameStart;
        if (playerState.currentTime < playerState.frameStart) {
            playerState.currentTime = playerState.frameStart;
        }
        updateScrubber();
        if (onTickCallback) onTickCallback(playerState);
    });

    frameInE.addEventListener('input', e => {
        playerState.frameEnd = parseFloat(e.target.value);
        document.getElementById('player-frame-end-val').value = playerState.frameEnd.toFixed(1);
        if (playerState.currentTime > playerState.frameEnd) {
            playerState.currentTime = playerState.frameEnd;
        }
        updateScrubber();
        if (onTickCallback) onTickCallback(playerState);
    });
    document.getElementById('player-frame-end-val').addEventListener('change', e => {
        playerState.frameEnd = parseFloat(e.target.value);
        frameInE.value = playerState.frameEnd;
        if (playerState.currentTime > playerState.frameEnd) {
            playerState.currentTime = playerState.frameEnd;
        }
        updateScrubber();
        if (onTickCallback) onTickCallback(playerState);
    });

    loopChk.addEventListener('change', e => {
        playerState.loop = e.target.checked;
    });

    scrubber.addEventListener('input', e => {
        const frac = parseFloat(e.target.value) / 1000;
        playerState.currentTime = playerState.frameStart + frac*(playerState.frameEnd - playerState.frameStart);
        document.getElementById('player-time-val').value = playerState.currentTime.toFixed(2);
        if (onTickCallback) onTickCallback(playerState);
    });

    document.getElementById('player-time-val').addEventListener('change', e => {
        playerState.currentTime = parseFloat(e.target.value);
        updateScrubber();
        if (onTickCallback) onTickCallback(playerState);
    });

    // Initial sync of UI
    updateScrubber();
}

function play() {
    if (playerState.isPlaying) return;
    playerState.isPlaying = true;
    lastTimestamp = performance.now();
    document.getElementById('player-play').classList.add('playing');
    document.getElementById('player-status').textContent = '▶ PLAYING';
    document.getElementById('player-status').style.color = 'var(--accent-green)';
    rafId = requestAnimationFrame(tick);
}

function pause() {
    if (!playerState.isPlaying) return;
    playerState.isPlaying = false;
    document.getElementById('player-play').classList.remove('playing');
    document.getElementById('player-status').textContent = '⏸ PAUSED';
    document.getElementById('player-status').style.color = 'var(--text-mid)';
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
}

function tick(now) {
    if (!playerState.isPlaying) return;
    const dt = (now - lastTimestamp) / 1000;  // seconds elapsed
    lastTimestamp = now;
    playerState.currentTime += dt * playerState.speed;

    if (playerState.currentTime > playerState.frameEnd) {
        if (playerState.loop) {
            playerState.currentTime = playerState.frameStart;
        } else {
            playerState.currentTime = playerState.frameEnd;
            pause();
        }
    }

    updateScrubber();
    if (onTickCallback) onTickCallback(playerState);
    rafId = requestAnimationFrame(tick);
}

function updateScrubber() {
    const scrubber = document.getElementById('player-scrubber');
    const timeVal  = document.getElementById('player-time-val');
    if (!scrubber) return;
    const span = playerState.frameEnd - playerState.frameStart;
    const frac = span > 0 ? (playerState.currentTime - playerState.frameStart) / span : 0;
    scrubber.value = Math.max(0, Math.min(1000, frac * 1000));
    if (timeVal) timeVal.value = playerState.currentTime.toFixed(2);
}

/** Toggle the player panel visibility */
export function togglePlayerPanel(visible) {
    const panel = document.getElementById('player-panel');
    if (!panel) return;
    if (visible === undefined) {
        panel.classList.toggle('visible');
    } else {
        panel.classList.toggle('visible', visible);
    }
}
