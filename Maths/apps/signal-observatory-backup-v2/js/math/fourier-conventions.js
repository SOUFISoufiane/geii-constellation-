// ═══════════════════════════════════════════════════════════════════
//  FOURIER CONVENTIONS — Hz vs ω vs symmetric
//
//  Three textbook conventions are supported. The forward DFT is computed
//  identically in all three; only the SCALING factors differ. This module
//  centralises the factor table so the FFT pipeline and the IFFT pipeline
//  stay in sync.
//
//  Notation:
//    FORWARD  : Ŝ(·) = α · ∫ s(t) e^{−β j ω(·) t} dt
//    INVERSE  : s(t) = γ · ∫ Ŝ(·) e^{+β j ω(·) t} d(·)
//
//  Where ω(·) = 2πf for Hz convention, or just · for ω convention.
//
//  The constraint α·γ·∫dω·… = 1 ensures the round-trip is unity.
//
//  Conventions (Cooley-Tukey discrete FFT outputs raw bins; we apply
//  scaling AFTER):
//   • Hz convention      : forward × Δt          ; inverse × Δf
//   • ω convention       : forward × Δt          ; inverse × Δω/(2π)
//   • symmetric          : forward × Δt/√(2π)    ; inverse × Δω/√(2π)
// ═══════════════════════════════════════════════════════════════════

export const CONVENTIONS = {
    hz: {
        id: 'hz',
        label: 'Hz',
        // Math expressions for the display badge
        formulaForward: '\\hat{s}(f) = \\int_{-\\infty}^{+\\infty} s(t)\\,e^{-2\\pi j f t}\\,dt',
        formulaInverse: 's(t) = \\int_{-\\infty}^{+\\infty} \\hat{s}(f)\\,e^{+2\\pi j f t}\\,df',
        // ω = 2πf
        omegaFactor: 2 * Math.PI,
        // The kernel exponent uses 2πf already, so forward scale = Δt (Riemann
        // approximation of the integral), inverse = Δf.
        forwardScale: (dt, df) => dt,
        inverseScale: (dt, df) => df
    },
    omega: {
        id: 'omega',
        label: 'ω · 1/2π',
        formulaForward: '\\hat{s}(\\omega) = \\int_{-\\infty}^{+\\infty} s(t)\\,e^{-j\\omega t}\\,dt',
        formulaInverse: 's(t) = \\frac{1}{2\\pi}\\int_{-\\infty}^{+\\infty} \\hat{s}(\\omega)\\,e^{+j\\omega t}\\,d\\omega',
        omegaFactor: 1,
        forwardScale: (dt, df) => dt,
        // ∫dω = 2π·∫df, so the inverse picks up an extra 2π in the integral,
        // cancelled by the 1/2π prefactor. Net: inverseScale = df (not dω).
        inverseScale: (dt, df) => df
    },
    symmetric: {
        id: 'symmetric',
        label: 'sym · 1/√(2π)',
        formulaForward: '\\hat{s}(\\omega) = \\frac{1}{\\sqrt{2\\pi}}\\int_{-\\infty}^{+\\infty} s(t)\\,e^{-j\\omega t}\\,dt',
        formulaInverse: 's(t) = \\frac{1}{\\sqrt{2\\pi}}\\int_{-\\infty}^{+\\infty} \\hat{s}(\\omega)\\,e^{+j\\omega t}\\,d\\omega',
        omegaFactor: 1,
        forwardScale: (dt, df) => dt / Math.sqrt(2 * Math.PI),
        inverseScale: (dt, df) => df * Math.sqrt(2 * Math.PI)
    }
};

let activeId = 'hz';

export function getConvention(id) {
    return CONVENTIONS[id] || CONVENTIONS.hz;
}

export function getActiveConvention() {
    return getConvention(activeId);
}

export function setActiveConvention(id) {
    if (CONVENTIONS[id]) activeId = id;
    return getActiveConvention();
}

export function listConventions() {
    return Object.values(CONVENTIONS);
}
