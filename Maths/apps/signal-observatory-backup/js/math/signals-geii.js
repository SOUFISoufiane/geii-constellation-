// ═══════════════════════════════════════════════════════════════════
//  GEII BUT2 — SIGNAL CATALOGUE
//  Programme officiel : Distributions, Continus, Exponentielles,
//  Formes, Oscillations, Théorèmes
// ═══════════════════════════════════════════════════════════════════

import { dirac, sinc, clamp } from './utils.js';

export const SIGNALS_GEII = [
    // ─── 1. DISTRIBUTIONS ─────────────────────────────────────────
    {
        id: 'dirac',
        category: 'DISTRIBUTIONS',
        name: 'Pic de Dirac δ(t)',
        desc: 'Impulsion parfaite — neutre de convolution',
        formulaTime: '\\delta(t)',
        formulaFreq: 'S(f) = 1',
        domain: 'geii',
        calcTime: t => dirac(t),
        calcFreq: _f => ({ re: 1, im: 0, mag: 1, phase: 0 })
    },
    {
        id: 'dirac_dec',
        category: 'DISTRIBUTIONS',
        name: 'Dirac Décalé δ(t−t₀)',
        desc: 'Retard pur — t₀ = 1s',
        formulaTime: '\\delta(t - t_0)',
        formulaFreq: 'S(f) = e^{-j2\\pi f t_0}',
        domain: 'geii',
        calcTime: t => dirac(t - 1),
        calcFreq: f => {
            const a = -2*Math.PI*f;
            return { re: Math.cos(a), im: Math.sin(a), mag: 1, phase: a };
        }
    },
    {
        id: 'peigne',
        category: 'DISTRIBUTIONS',
        name: 'Peigne de Dirac ⊥⊥⊥(t)',
        desc: 'Échantillonnage idéal Tₑ = 1s',
        formulaTime: '\\sum_{n=-\\infty}^{+\\infty}\\delta(t-nT_e)',
        formulaFreq: 'S(f) = f_e \\sum_k \\delta(f - kf_e)',
        domain: 'geii',
        calcTime: t => { const r = Math.round(t); return Math.abs(t - r) < 0.04 ? 7 : 0; },
        calcFreq: f => {
            const r = Math.round(f);
            const p = Math.abs(f - r) < 0.04;
            return { re: p ? 7 : 0, im: 0, mag: p ? 7 : 0, phase: 0 };
        }
    },

    // ─── 2. SIGNAUX CONTINUS ──────────────────────────────────────
    {
        id: 'heaviside',
        category: 'CONTINUS',
        name: 'Échelon Heaviside u(t)',
        desc: 'Fonction signe / Switch',
        formulaTime: 'u(t)=\\begin{cases}1 & t\\geq 0 \\\\ 0 & t<0\\end{cases}',
        formulaFreq: 'S(f)=\\tfrac{1}{2}\\delta(f)+\\dfrac{1}{j2\\pi f}',
        domain: 'geii',
        calcTime: t => t >= 0 ? 1 : 0,
        calcFreq: f => {
            const re = Math.abs(f) < 0.04 ? 5 : 0;
            const im = f === 0 ? 0 : clamp(-1/(2*Math.PI*f), -15, 15);
            return { re, im, mag: Math.sqrt(re*re + im*im), phase: Math.atan2(im, re) };
        }
    },
    {
        id: 'constante',
        category: 'CONTINUS',
        name: 'Constante DC',
        desc: 'Courant Continu — composante 0Hz',
        formulaTime: 's(t) = 1',
        formulaFreq: 'S(f) = \\delta(f)',
        domain: 'geii',
        calcTime: _t => 1,
        calcFreq: f => {
            const p = Math.abs(f) < 0.05;
            return { re: p ? 10 : 0, im: 0, mag: p ? 10 : 0, phase: 0 };
        }
    },
    {
        id: 'rampe',
        category: 'CONTINUS',
        name: 'Rampe r(t) = t·u(t)',
        desc: 'Intégrale de l\'échelon',
        formulaTime: 'r(t) = t \\cdot u(t)',
        formulaFreq: 'S(f) = \\dfrac{j}{(2\\pi f)^2}',
        domain: 'geii',
        calcTime: t => t >= 0 ? clamp(t, -3, 3) : 0,
        calcFreq: f => {
            if (Math.abs(f) < 0.05) return { re: 0, im: 8, mag: 8, phase: Math.PI/2 };
            const im = 1 / Math.pow(2*Math.PI*f, 2);
            return { re: 0, im: clamp(im, -8, 8), mag: Math.abs(im), phase: im > 0 ? Math.PI/2 : -Math.PI/2 };
        }
    },

    // ─── 3. EXPONENTIELLES ────────────────────────────────────────
    {
        id: 'exp_causale',
        category: 'EXPONENTIELLES',
        name: 'Exp. Causale e^(−at)',
        desc: 'Modèle RC / EMA — a = 1',
        formulaTime: 'e^{-at} \\cdot u(t),\\; a=1',
        formulaFreq: 'S(f) = \\dfrac{1}{a + j2\\pi f}',
        domain: 'geii',
        calcTime: t => t >= 0 ? Math.exp(-t) : 0,
        calcFreq: f => {
            const a = 1, w = 2*Math.PI*f, d = a*a + w*w;
            const re = a/d, im = -w/d;
            return { re, im, mag: Math.sqrt(re*re + im*im), phase: Math.atan2(im, re) };
        }
    },
    {
        id: 'exp_bilatere',
        category: 'EXPONENTIELLES',
        name: 'Exp. Bilatérale e^(−a|t|)',
        desc: 'Symétrique — Lorentzien',
        formulaTime: 'e^{-a|t|},\\; a = 1',
        formulaFreq: 'S(f) = \\dfrac{2a}{a^2 + (2\\pi f)^2}',
        domain: 'geii',
        calcTime: t => Math.exp(-Math.abs(t)),
        calcFreq: f => {
            const a = 1, w = 2*Math.PI*f;
            const v = 2*a/(a*a + w*w);
            return { re: v, im: 0, mag: v, phase: 0 };
        }
    },
    {
        id: 'exp_complex',
        category: 'EXPONENTIELLES',
        name: 'Exponentielle Complexe',
        desc: 'Onde pure e^(j2πf₀t), f₀ = 1Hz',
        formulaTime: 'e^{j2\\pi f_0 t}',
        formulaFreq: 'S(f) = \\delta(f - f_0)',
        domain: 'geii',
        calcTime: t => Math.cos(2*Math.PI*t),
        calcFreq: f => {
            const p = Math.abs(f - 1) < 0.05;
            return { re: p ? 8 : 0, im: 0, mag: p ? 8 : 0, phase: 0 };
        }
    },

    // ─── 4. FONCTIONS DE FORME ────────────────────────────────────
    {
        id: 'porte',
        category: 'FORMES',
        name: 'Fonction Porte Π(t)',
        desc: 'Impulsion rectangulaire',
        formulaTime: '\\Pi(t)=\\begin{cases}1 & |t|\\leq\\tfrac{1}{2}\\\\ 0 & \\text{sinon}\\end{cases}',
        formulaFreq: 'S(f) = \\text{sinc}(f)',
        domain: 'geii',
        calcTime: t => Math.abs(t) <= 0.5 ? 1 : 0,
        calcFreq: f => {
            const v = sinc(f);
            return { re: v, im: 0, mag: Math.abs(v), phase: v < 0 ? Math.PI : 0 };
        }
    },
    {
        id: 'sinc_fn',
        category: 'FORMES',
        name: 'Sinus Cardinal sinc(f₀t)',
        desc: 'Filtre PB idéal — f₀ = 1Hz',
        formulaTime: '\\text{sinc}(2t) = \\dfrac{\\sin(2\\pi t)}{2\\pi t}',
        formulaFreq: 'S(f) = \\tfrac{1}{2}\\Pi\\!\\left(\\tfrac{f}{2}\\right)',
        domain: 'geii',
        calcTime: t => sinc(2*t),
        calcFreq: f => {
            const v = Math.abs(f) <= 1 ? 0.5 : 0;
            return { re: v, im: 0, mag: v, phase: 0 };
        }
    },
    {
        id: 'triangle',
        category: 'FORMES',
        name: 'Triangle Λ(t)',
        desc: 'Auto-corrélation rectangulaire',
        formulaTime: '\\Lambda(t)=\\begin{cases}1-|t| & |t|\\leq 1 \\\\ 0 & \\text{sinon}\\end{cases}',
        formulaFreq: 'S(f) = \\text{sinc}^2(f)',
        domain: 'geii',
        calcTime: t => Math.abs(t) <= 1 ? 1 - Math.abs(t) : 0,
        calcFreq: f => { const v = sinc(f)*sinc(f); return { re: v, im: 0, mag: v, phase: 0 }; }
    },
    {
        id: 'gaussienne',
        category: 'FORMES',
        name: 'Gaussienne g(t)',
        desc: 'Auto-transformée de Fourier !',
        formulaTime: 'e^{-\\pi t^2}',
        formulaFreq: 'S(f) = e^{-\\pi f^2}\\;\\text{(invariante)}',
        domain: 'geii',
        calcTime: t => Math.exp(-Math.PI*t*t),
        calcFreq: f => { const v = Math.exp(-Math.PI*f*f); return { re: v, im: 0, mag: v, phase: 0 }; }
    },

    // ─── 5. OSCILLATIONS ──────────────────────────────────────────
    {
        id: 'cosinus',
        category: 'OSCILLATIONS',
        name: 'Cosinus cos(2πf₀t)',
        desc: 'Onde réelle paire — f₀ = 1Hz',
        formulaTime: '\\cos(2\\pi f_0 t)',
        formulaFreq: 'S(f) = \\tfrac{1}{2}[\\delta(f-f_0)+\\delta(f+f_0)]',
        domain: 'geii',
        calcTime: t => Math.cos(2*Math.PI*t),
        calcFreq: f => {
            const p = Math.abs(f - 1) < 0.05 || Math.abs(f + 1) < 0.05;
            return { re: p ? 5 : 0, im: 0, mag: p ? 5 : 0, phase: 0 };
        }
    },
    {
        id: 'sinus',
        category: 'OSCILLATIONS',
        name: 'Sinus sin(2πf₀t)',
        desc: 'Onde réelle impaire — f₀ = 1Hz',
        formulaTime: '\\sin(2\\pi f_0 t)',
        formulaFreq: 'S(f) = \\tfrac{1}{2j}[\\delta(f-f_0)-\\delta(f+f_0)]',
        domain: 'geii',
        calcTime: t => Math.sin(2*Math.PI*t),
        calcFreq: f => {
            const pp = Math.abs(f - 1) < 0.05 ? -5 : 0;
            const pn = Math.abs(f + 1) < 0.05 ?  5 : 0;
            const im = pp + pn;
            return { re: 0, im, mag: Math.abs(im), phase: Math.atan2(im, 0) };
        }
    },
    {
        id: 'carre',
        category: 'OSCILLATIONS',
        name: 'Signal Carré sq(t)',
        desc: 'Série de Fourier — harmoniques impaires',
        formulaTime: '\\text{sgn}(\\sin(2\\pi f_0 t))',
        formulaFreq: 'S(f)=\\sum_{k\\text{ impair}}\\dfrac{2}{jk\\pi}\\delta(f-kf_0)',
        domain: 'geii',
        calcTime: t => Math.sign(Math.sin(2*Math.PI*t)),
        calcFreq: f => {
            let im = 0;
            for (let k = 1; k <= 15; k += 2) {
                if (Math.abs(f - k) < 0.05) im -= 2/(k*Math.PI);
                if (Math.abs(f + k) < 0.05) im += 2/(k*Math.PI);
            }
            return { re: 0, im, mag: Math.abs(im), phase: im !== 0 ? Math.atan2(im, 0) : 0 };
        }
    },
    {
        id: 'chirp',
        category: 'OSCILLATIONS',
        name: 'Signal Chirp (FM)',
        desc: 'Fréquence linéairement croissante',
        formulaTime: '\\cos\\!\\left(2\\pi(f_0 + \\tfrac{\\mu}{2}t)t\\right)',
        formulaFreq: 'S(f) \\approx \\text{étalement bande }[f_0,f_1]',
        domain: 'geii',
        calcTime: t => { const f0 = 0.5, mu = 0.8; return Math.cos(2*Math.PI*(f0 + mu/2*t)*t); },
        calcFreq: f => {
            const inBand = f > 0.5 && f < 2.5;
            const v = inBand ? 0.8 : 0;
            return { re: v, im: 0, mag: v, phase: inBand ? -Math.PI*f*f/0.8 : 0 };
        }
    },

    // ─── 6. THÉORÈMES (visualisations conceptuelles) ──────────────
    {
        id: 'theorem_parseval',
        category: 'THÉORÈMES',
        name: 'Théorème de Parseval',
        desc: 'Conservation énergie temps↔fréq',
        formulaTime: '\\int_{-\\infty}^{+\\infty}|s(t)|^2\\,dt',
        formulaFreq: '= \\int_{-\\infty}^{+\\infty}|S(f)|^2\\,df',
        domain: 'geii',
        // Reuse Gaussienne for visualization
        calcTime: t => Math.exp(-Math.PI*t*t),
        calcFreq: f => { const v = Math.exp(-Math.PI*f*f); return { re: v, im: 0, mag: v, phase: 0 }; }
    },
    {
        id: 'theorem_convolution',
        category: 'THÉORÈMES',
        name: 'Convolution s ∗ h',
        desc: 'Devient produit en fréquence',
        formulaTime: '(s * h)(t) = \\int s(\\tau)h(t-\\tau)\\,d\\tau',
        formulaFreq: '\\mathcal{F}\\{s*h\\} = S(f) \\cdot H(f)',
        domain: 'geii',
        calcTime: t => Math.abs(t) <= 1 ? 1 - Math.abs(t) : 0, // Triangle = porte ∗ porte
        calcFreq: f => { const v = sinc(f)*sinc(f); return { re: v, im: 0, mag: v, phase: 0 }; }
    },
    {
        id: 'theorem_modulation',
        category: 'THÉORÈMES',
        name: 'Modulation (translation freq)',
        desc: 's(t)·cos(2πf₀t) ↔ S(f±f₀)/2',
        formulaTime: 's(t)\\cdot\\cos(2\\pi f_0 t)',
        formulaFreq: '\\tfrac{1}{2}[S(f-f_0) + S(f+f_0)]',
        domain: 'geii',
        calcTime: t => Math.exp(-Math.PI*(t-0)*(t-0)) * Math.cos(2*Math.PI*2*t),
        calcFreq: f => {
            const v = 0.5*Math.exp(-Math.PI*(f-2)*(f-2)) + 0.5*Math.exp(-Math.PI*(f+2)*(f+2));
            return { re: v, im: 0, mag: v, phase: 0 };
        }
    },
    {
        id: 'theorem_derivation',
        category: 'THÉORÈMES',
        name: 'Dérivation / Intégration',
        desc: 'd/dt ↔ ·(j2πf)',
        formulaTime: '\\dfrac{ds}{dt} \\quad\\longleftrightarrow\\quad j2\\pi f\\cdot S(f)',
        formulaFreq: '\\int s\\,dt \\quad\\longleftrightarrow\\quad \\dfrac{S(f)}{j2\\pi f}',
        domain: 'geii',
        calcTime: t => -2*Math.PI*t*Math.exp(-Math.PI*t*t), // dérivée de e^(-πt²)
        calcFreq: f => {
            const re = 0;
            const im = 2*Math.PI*f * Math.exp(-Math.PI*f*f);
            return { re, im, mag: Math.abs(im), phase: im > 0 ? Math.PI/2 : -Math.PI/2 };
        }
    }
];
