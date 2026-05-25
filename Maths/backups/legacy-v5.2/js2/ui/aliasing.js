// ═══════════════════════════════════════════════════════════════════
//  ALIASING DETECTOR — Shannon-Nyquist visualization
//  Compares signal frequency vs sampling frequency, shows alert
//  when 2·f_signal > f_sampling (aliasing threshold).
// ═══════════════════════════════════════════════════════════════════

import { fRange, DT } from '../math/axes.js';

export const aliasState = {
    fSampling: 8.0,         // user-controlled sampling frequency (Hz)
    showSamples: true,      // overlay sample dots on temporal plot
    aliasingActive: false
};

/**
 * Estimate the dominant frequency from the magnitude spectrum.
 * Returns the highest-magnitude positive frequency.
 */
export function estimateDominantFreq(magData) {
    if (!magData) return 0;
    let maxMag = 0, maxIdx = 0;
    for (let i = 0; i < magData.length; i++) {
        if (fRange[i] >= 0 && magData[i] > maxMag) {
            maxMag = magData[i];
            maxIdx = i;
        }
    }
    return fRange[maxIdx];
}

/**
 * Check Nyquist condition: f_s >= 2 · f_max
 * Returns object with status and computed values.
 */
export function checkAliasing(fSignal) {
    const fNyquist = aliasState.fSampling / 2;
    const aliasing = Math.abs(fSignal) > fNyquist;
    aliasState.aliasingActive = aliasing;

    let foldedFreq = Math.abs(fSignal);
    if (aliasing) {
        // Folded freq = f_signal mod f_s, then reflected if > f_s/2
        const mod = ((Math.abs(fSignal) % aliasState.fSampling) + aliasState.fSampling) % aliasState.fSampling;
        foldedFreq = mod > fNyquist ? aliasState.fSampling - mod : mod;
    }

    return {
        aliasing,
        fSignal: Math.abs(fSignal),
        fNyquist,
        fSampling: aliasState.fSampling,
        foldedFreq,
        ratio: Math.abs(fSignal) / fNyquist
    };
}

/** Update the alert badge in the DOM */
export function updateAliasingAlert(magData, freqVal) {
    // Use either rotation freq (if non-zero) or estimated dominant freq
    const fSig = freqVal && Math.abs(freqVal) > 0.01
        ? Math.abs(freqVal)
        : estimateDominantFreq(magData);

    const result = checkAliasing(fSig);
    const badge = document.getElementById('aliasing-badge');
    if (!badge) return result;

    if (result.aliasing) {
        badge.classList.add('active');
        badge.innerHTML = `
            <span class="alias-icon">⚠</span>
            <div>
                <div class="alias-title">ALIASING DÉTECTÉ</div>
                <div class="alias-detail">
                    f<sub>signal</sub> = ${result.fSignal.toFixed(2)} Hz > f<sub>Nyquist</sub> = ${result.fNyquist.toFixed(2)} Hz<br>
                    Repli à f' = <b>${result.foldedFreq.toFixed(2)} Hz</b>
                </div>
            </div>
        `;
    } else {
        badge.classList.remove('active');
        badge.innerHTML = `
            <span class="alias-icon ok">✓</span>
            <div>
                <div class="alias-title">SHANNON OK</div>
                <div class="alias-detail">
                    f<sub>s</sub> = ${result.fSampling.toFixed(1)} Hz ≥ 2·f<sub>max</sub> = ${(2*result.fSignal).toFixed(2)} Hz
                </div>
            </div>
        `;
    }
    return result;
}

/** Generate sampled points for a given signal at fSampling */
export function getSampledPoints(signal, params, tStart, tEnd) {
    const Ts = 1 / aliasState.fSampling;
    const points = { x: [], y: [] };
    for (let t = tStart; t <= tEnd; t += Ts) {
        points.x.push(t);
        points.y.push(signal.calcTime(t, params));
    }
    return points;
}
