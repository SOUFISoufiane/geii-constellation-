// ═══════════════════════════════════════════════════════════════════
//  DERIVATIONS — Step-by-step LaTeX derivations for each signal
//  Pedagogical popovers triggered on hover
// ═══════════════════════════════════════════════════════════════════

export const DERIVATIONS = {

    // ─── DISTRIBUTIONS ────────────────────────────────────────────
    dirac: {
        title: 'Transformée du Pic de Dirac δ(t)',
        steps: [
            { latex: 'S(f) = \\int_{-\\infty}^{+\\infty}\\delta(t)\\,e^{-j2\\pi f t}\\,dt', note: 'Définition de la TF' },
            { latex: 'S(f) = e^{-j2\\pi f \\cdot 0}', note: 'Propriété de l\'élément neutre : ⟨δ, φ⟩ = φ(0)' },
            { latex: 'S(f) = 1 \\quad \\forall f', note: 'Spectre uniforme — "bruit blanc idéal"' }
        ],
        intuition: 'Un choc infiniment court contient toutes les fréquences avec amplitude égale. Plus le pic est étroit dans le temps, plus son spectre s\'étale — illustre directement le principe d\'incertitude temps-fréquence.',
        geiiContext: 'Modélise un choc électrique, une impulsion d\'horloge, ou la réponse impulsionnelle d\'un système.'
    },

    dirac_dec: {
        title: 'Transformée de δ(t − t₀)',
        steps: [
            { latex: 'S(f) = \\int_{-\\infty}^{+\\infty}\\delta(t-t_0)\\,e^{-j2\\pi f t}\\,dt', note: 'Définition' },
            { latex: 'S(f) = e^{-j2\\pi f t_0}', note: 'Translation dans le temps (filtrage du Dirac)' },
            { latex: '|S(f)| = 1, \\quad \\varphi(f) = -2\\pi f t_0', note: 'Module unitaire, phase linéaire' }
        ],
        intuition: 'Décaler dans le temps ne change PAS le spectre d\'amplitude — seulement la phase. La phase devient linéaire en f avec une pente proportionnelle au retard.',
        geiiContext: 'Théorème du retard : tout délai pur introduit une phase linéaire. Crucial pour les lignes à retard, les filtres à phase linéaire (FIR).'
    },

    peigne: {
        title: 'Transformée du Peigne de Dirac ⊥⊥⊥(t)',
        steps: [
            { latex: '\\text{III}(t) = \\sum_{n=-\\infty}^{+\\infty}\\delta(t - nT_e)', note: 'Définition (série d\'impulsions)' },
            { latex: '\\mathcal{F}\\{\\text{III}(t)\\} = f_e\\sum_{k}\\delta(f - kf_e)', note: 'TF d\'un peigne = peigne (auto-dual !)' },
            { latex: 'f_e = 1/T_e', note: 'Période fréquentielle = inverse période temporelle' }
        ],
        intuition: 'L\'échantillonnage périodique dans le temps duplique le spectre tous les fₑ Hz. C\'est précisément ce qui cause l\'aliasing quand fₑ < 2·fₘₐₓ (théorème de Shannon).',
        geiiContext: 'Cœur de la théorie de l\'échantillonnage. Modélise un CAN (Convertisseur Analogique-Numérique) idéal.'
    },

    heaviside: {
        title: 'Transformée de l\'échelon Heaviside u(t)',
        steps: [
            { latex: 'u(t) = \\tfrac{1}{2} + \\tfrac{1}{2}\\text{sgn}(t)', note: 'Décomposition pair/impair' },
            { latex: '\\mathcal{F}\\{1/2\\} = \\tfrac{1}{2}\\delta(f)', note: 'TF de la partie constante' },
            { latex: '\\mathcal{F}\\{\\text{sgn}(t)\\} = \\dfrac{1}{j\\pi f}', note: 'TF de la fonction signe (impair)' },
            { latex: 'U(f) = \\tfrac{1}{2}\\delta(f) + \\dfrac{1}{j2\\pi f}', note: 'Sum des deux contributions' }
        ],
        intuition: 'L\'échelon contient à la fois une composante DC (le 1/2 permanent) et un spectre 1/f qui décroît lentement — d\'où les "ringing" lors de transitions brutales dans les circuits.',
        geiiContext: 'Modélise un allumage, un front montant, ou la réponse indicielle d\'un système (step response).'
    },

    constante: {
        title: 'Transformée de la constante DC',
        steps: [
            { latex: 'S(f) = \\int_{-\\infty}^{+\\infty} 1 \\cdot e^{-j2\\pi f t}\\,dt', note: 'Définition' },
            { latex: 'S(f) = \\delta(f)', note: 'Toute l\'énergie concentrée en f=0' }
        ],
        intuition: 'Une tension DC pure n\'a qu\'une seule "fréquence" : zéro. Le spectre est un Dirac à l\'origine. Réciproquement, un signal à spectre étroit autour de 0 est presque DC.',
        geiiContext: 'Composante DC d\'un signal = sa valeur moyenne = S(0). Indispensable pour les alimentations stabilisées et la mesure d\'offset.'
    },

    rampe: {
        title: 'Transformée de la rampe r(t) = t·u(t)',
        steps: [
            { latex: 'r(t) = t \\cdot u(t)', note: 'Définition (intégrale de u(t))' },
            { latex: '\\mathcal{F}\\{t\\cdot s(t)\\} = \\dfrac{j}{2\\pi}\\dfrac{dS}{df}', note: 'Théorème de multiplication par t' },
            { latex: 'R(f) = \\dfrac{j}{4\\pi^2 f^2} + \\dfrac{j}{2}\\delta\'(f)', note: 'Dérivée de la TF de u(t)' }
        ],
        intuition: 'La rampe est l\'intégrale de l\'échelon. En fréquence, intégrer dans le temps = diviser par jω (sauf composante DC). Le spectre décroît en 1/f².',
        geiiContext: 'Modélise une montée linéaire (chargement de condensateur, calibration de rampe ADC).'
    },

    exp_causale: {
        title: 'Transformée de l\'exponentielle causale e^(−at)·u(t)',
        steps: [
            { latex: 'S(f) = \\int_{0}^{+\\infty} e^{-at}\\,e^{-j2\\pi f t}\\,dt', note: 'Support causal : t ≥ 0' },
            { latex: 'S(f) = \\int_{0}^{+\\infty} e^{-(a+j2\\pi f)t}\\,dt', note: 'Combinaison des exposants' },
            { latex: 'S(f) = \\left[\\dfrac{-e^{-(a+j2\\pi f)t}}{a+j2\\pi f}\\right]_0^{+\\infty}', note: 'Primitive' },
            { latex: 'S(f) = \\dfrac{1}{a + j2\\pi f}', note: 'Évaluation aux bornes (a > 0)' },
            { latex: '|S(f)| = \\dfrac{1}{\\sqrt{a^2+(2\\pi f)^2}}', note: 'Module — filtre passe-bas du 1er ordre !' }
        ],
        intuition: 'C\'est exactement la réponse impulsionnelle d\'un filtre RC. Le module |S(f)| chute à −3dB à fc = a/(2π). Plus a est grand, plus la coupure est haute.',
        geiiContext: 'Modèle de base du filtre RC, EMA (moyenne mobile exponentielle), décharge de condensateur.'
    },

    exp_bilatere: {
        title: 'Transformée de e^(−a|t|)',
        steps: [
            { latex: 'S(f) = \\int_{-\\infty}^{+\\infty} e^{-a|t|}\\,e^{-j2\\pi f t}\\,dt', note: 'Définition' },
            { latex: 'S(f) = 2\\int_{0}^{+\\infty} e^{-at}\\cos(2\\pi f t)\\,dt', note: 'Symétrie paire ⇒ TF réelle' },
            { latex: 'S(f) = \\dfrac{2a}{a^2+(2\\pi f)^2}', note: 'Forme lorentzienne classique' }
        ],
        intuition: 'Le profil lorentzien apparaît partout en physique : résonance d\'oscillateur amorti, raies spectrales en RMN/spectroscopie, largeur de bande naturelle.',
        geiiContext: 'Profil de raie de résonance d\'un système RLC à amortissement faible. Q = ω₀/(2a).'
    },

    exp_complex: {
        title: 'Transformée de e^(j2πf₀t)',
        steps: [
            { latex: 'e^{j2\\pi f_0 t} = \\cos(2\\pi f_0 t) + j\\sin(2\\pi f_0 t)', note: 'Formule d\'Euler' },
            { latex: '\\mathcal{F}\\{e^{j2\\pi f_0 t}\\} = \\delta(f - f_0)', note: 'Translation fréquentielle' }
        ],
        intuition: 'L\'exponentielle complexe est LA brique fondamentale de Fourier : c\'est le seul signal dont la TF est un Dirac unique (pas de couple +f₀/-f₀ comme le cosinus).',
        geiiContext: 'Représentation phaseur en électrotechnique : V(t) = V₀·e^(jωt). Permet de remplacer les EDO par des équations algébriques.'
    },

    porte: {
        title: 'Transformée de la Porte Π(t)',
        steps: [
            { latex: 'S(f) = \\int_{-1/2}^{1/2} e^{-j2\\pi f t}\\,dt', note: 'Support compact [-1/2, 1/2]' },
            { latex: 'S(f) = \\left[\\dfrac{e^{-j2\\pi f t}}{-j2\\pi f}\\right]_{-1/2}^{1/2}', note: 'Primitive' },
            { latex: 'S(f) = \\dfrac{e^{j\\pi f} - e^{-j\\pi f}}{j2\\pi f}', note: 'Différence' },
            { latex: 'S(f) = \\dfrac{\\sin(\\pi f)}{\\pi f} = \\text{sinc}(f)', note: 'Identité d\'Euler : (e^{jx}-e^{-jx})/(2j) = sin(x)' }
        ],
        intuition: 'Plus la porte est étroite dans le temps, plus son sinc est large en fréquence : c\'est la racine du compromis Heisenberg/Gabor. Une porte parfaite implique un spectre infiniment large.',
        geiiContext: 'Modélise un pulse de commande, un échantillon temporel, ou la fenêtre d\'une mesure. Les lobes secondaires (sinc) expliquent le "spectral leakage" en analyse spectrale.'
    },

    sinc_fn: {
        title: 'Transformée du sinus cardinal',
        steps: [
            { latex: '\\text{sinc}(2t) = \\dfrac{\\sin(2\\pi t)}{2\\pi t}', note: 'Définition' },
            { latex: '\\mathcal{F}\\{\\text{sinc}(2t)\\} = \\tfrac{1}{2}\\Pi(f/2)', note: 'Dualité avec la porte' },
            { latex: 'S(f) = \\begin{cases}1/2 & |f|\\leq 1 \\\\ 0 & \\text{sinon}\\end{cases}', note: 'Porte rectangulaire' }
        ],
        intuition: 'Le sinc est la réponse impulsionnelle du filtre passe-bas IDÉAL (coupure parfaite). Mais il est non causal et infini → irréalisable physiquement. Tous les filtres réels approchent cette forme.',
        geiiContext: 'Interpolation de Whittaker-Shannon pour la reconstruction parfaite d\'un signal échantillonné. Base théorique de la conversion NA.'
    },

    triangle: {
        title: 'Transformée du Triangle Λ(t)',
        steps: [
            { latex: '\\Lambda(t) = \\Pi(t) * \\Pi(t)', note: 'Triangle = porte ∗ porte' },
            { latex: '\\mathcal{F}\\{\\Pi*\\Pi\\} = \\mathcal{F}\\{\\Pi\\}^2', note: 'Convolution → produit' },
            { latex: 'S(f) = \\text{sinc}^2(f)', note: 'Spectre positif, lobes très atténués' }
        ],
        intuition: 'L\'autocorrélation d\'une porte donne un triangle. Et la TF d\'une autocorrélation = densité spectrale (théorème de Wiener-Khinchin) → toujours positive !',
        geiiContext: 'Apparaît naturellement en autocorrélation. Utilisé comme fenêtre douce en analyse spectrale (moins de leakage que la porte rectangulaire).'
    },

    gaussienne: {
        title: 'Transformée de la Gaussienne',
        steps: [
            { latex: 'g(t) = e^{-\\pi t^2}', note: 'Gaussienne normalisée' },
            { latex: 'S(f) = \\int_{-\\infty}^{+\\infty} e^{-\\pi t^2}\\,e^{-j2\\pi f t}\\,dt', note: 'Définition' },
            { latex: '= e^{-\\pi f^2}\\int_{-\\infty}^{+\\infty} e^{-\\pi(t+jf)^2}\\,dt', note: 'Complétion du carré' },
            { latex: 'S(f) = e^{-\\pi f^2}', note: 'L\'intégrale gaussienne vaut 1 ! ⇒ INVARIANCE' }
        ],
        intuition: 'La gaussienne est sa propre transformée de Fourier — un point fixe extraordinaire de l\'opérateur 𝓕. Elle minimise aussi le produit Δt·Δf (Heisenberg).',
        geiiContext: 'Forme optimale pour une fenêtre d\'analyse (Gabor). Modélise le bruit thermique. Au cœur de l\'analyse temps-fréquence.'
    },

    cosinus: {
        title: 'Transformée du cosinus cos(2πf₀t)',
        steps: [
            { latex: '\\cos(2\\pi f_0 t) = \\tfrac{1}{2}(e^{j2\\pi f_0 t} + e^{-j2\\pi f_0 t})', note: 'Formule d\'Euler' },
            { latex: '\\mathcal{F}\\{e^{j2\\pi f_0 t}\\} = \\delta(f-f_0)', note: 'Exponentielle complexe' },
            { latex: 'S(f) = \\tfrac{1}{2}\\delta(f-f_0) + \\tfrac{1}{2}\\delta(f+f_0)', note: 'Deux raies symétriques' }
        ],
        intuition: 'Tout signal réel a un spectre HERMITIEN : S(-f) = S(f)*. Le cosinus, étant réel et pair, a un spectre réel pair (deux Diracs symétriques).',
        geiiContext: 'Onde porteuse pure en modulation AM/FM. Phaseur en régime sinusoïdal forcé.'
    },

    sinus: {
        title: 'Transformée du sinus sin(2πf₀t)',
        steps: [
            { latex: '\\sin(2\\pi f_0 t) = \\dfrac{1}{2j}(e^{j2\\pi f_0 t} - e^{-j2\\pi f_0 t})', note: 'Formule d\'Euler' },
            { latex: 'S(f) = \\dfrac{1}{2j}[\\delta(f-f_0) - \\delta(f+f_0)]', note: 'Différence de Diracs' },
            { latex: 'S(f) = \\tfrac{j}{2}\\delta(f+f_0) - \\tfrac{j}{2}\\delta(f-f_0)', note: 'Spectre purement imaginaire' }
        ],
        intuition: 'Comme le sinus est réel et IMPAIR, son spectre est imaginaire et impair. La phase saute de ±π/2 aux fréquences ±f₀.',
        geiiContext: 'Quadrature avec le cosinus : ensemble ils forment une base orthogonale pour les signaux périodiques (séries de Fourier).'
    },

    carre: {
        title: 'Transformée du signal carré',
        steps: [
            { latex: 's(t) = \\dfrac{4}{\\pi}\\sum_{k=1,3,5,\\ldots}\\dfrac{\\sin(2\\pi k f_0 t)}{k}', note: 'Série de Fourier (harmoniques impaires)' },
            { latex: 'S(f) = \\sum_{k\\,\\text{impair}}\\dfrac{2}{jk\\pi}[\\delta(f-kf_0)-\\delta(f+kf_0)]', note: 'TF terme à terme' },
            { latex: 'A_k = \\dfrac{4}{\\pi k} \\;\\text{(pour k impair)}', note: 'Décroissance en 1/k' }
        ],
        intuition: 'Plus on additionne d\'harmoniques impaires, plus on s\'approche d\'un carré. Mais on n\'y arrive jamais parfaitement → phénomène de Gibbs (overshoot de ~9%) aux discontinuités.',
        geiiContext: 'Forme d\'onde PWM, signal d\'horloge numérique. Les harmoniques impaires expliquent les EMI (compatibilité électromagnétique).'
    },

    chirp: {
        title: 'Transformée du chirp linéaire',
        steps: [
            { latex: 's(t) = \\cos\\!\\left(2\\pi(f_0 + \\tfrac{\\mu}{2}t)t\\right)', note: 'Fréquence instantanée linéaire' },
            { latex: 'f_i(t) = f_0 + \\mu t', note: 'Fréquence locale (dérivée de la phase)' },
            { latex: '|S(f)| \\approx \\sqrt{\\dfrac{1}{|\\mu|}}\\Pi\\!\\left(\\dfrac{f - f_0}{B}\\right)', note: 'Spectre étalé sur la bande B = μT' }
        ],
        intuition: 'Le spectre du chirp est "plat" sur la bande balayée — c\'est pourquoi on l\'utilise en radar/sonar : impulsion longue (bonne énergie) mais bande large (bonne résolution) après compression.',
        geiiContext: 'Compression d\'impulsion en radar (Pulse Compression). FMCW (Frequency Modulated Continuous Wave) en télémétrie automobile. EEG visual evoked potentials.'
    },

    theorem_parseval: {
        title: 'Théorème de Parseval — Conservation de l\'énergie',
        steps: [
            { latex: 'E = \\int_{-\\infty}^{+\\infty} |s(t)|^2\\,dt', note: 'Énergie temporelle' },
            { latex: 'E = \\int_{-\\infty}^{+\\infty} |S(f)|^2\\,df', note: 'Énergie spectrale' },
            { latex: '\\boxed{\\int|s(t)|^2\\,dt = \\int|S(f)|^2\\,df}', note: 'Égalité fondamentale' }
        ],
        intuition: 'La TF est une rotation dans l\'espace de Hilbert L²(ℝ) : elle préserve la norme (et le produit scalaire). L\'énergie totale ne dépend pas du domaine d\'observation.',
        geiiContext: 'Justifie le filtrage en fréquence : pour réduire le bruit hors-bande, on coupe |S(f)|² au-delà de fc. La quantité rejetée = énergie du bruit.'
    },

    theorem_convolution: {
        title: 'Théorème de Convolution',
        steps: [
            { latex: '(s * h)(t) = \\int_{-\\infty}^{+\\infty} s(\\tau)\\,h(t-\\tau)\\,d\\tau', note: 'Définition — intégrale glissante' },
            { latex: '\\text{1. Retourner } h: \\quad h(\\tau) \\to h(-\\tau)', note: 'Étape 1 : symétrie' },
            { latex: '\\text{2. Décaler de } t: \\quad h(-\\tau) \\to h(t-\\tau)', note: 'Étape 2 : translation' },
            { latex: '\\text{3. Multiplier point par point: } s(\\tau)\\cdot h(t-\\tau)', note: 'Étape 3 : produit' },
            { latex: '\\text{4. Intégrer (aire totale)}', note: 'Étape 4 : sommer toute l\'aire' },
            { latex: '\\mathcal{F}\\{s * h\\} = S(f)\\cdot H(f)', note: 'Théorème de Plancherel — produit en fréquence' }
        ],
        intuition: 'La convolution coûteuse dans le temps (O(N²)) devient un simple PRODUIT dans la fréquence. C\'est pourquoi on filtre numériquement via FFT × H(f) × IFFT. Le mode CONVOLUTION ⑥ permet de visualiser le retournement et la translation pas-à-pas.',
        geiiContext: 'Cœur de la théorie des systèmes linéaires. Un filtre = convolution avec h(t) = multiplication par H(f). Π ∗ Π = Λ est l\'exemple classique du cours BUT2.'
    },

    theorem_modulation: {
        title: 'Théorème de Modulation — Translation fréquentielle',
        steps: [
            { latex: 'm(t) = s(t)\\cdot\\cos(2\\pi f_0 t)', note: 'Multiplication par porteuse' },
            { latex: '\\cos(2\\pi f_0 t) = \\tfrac{1}{2}(e^{j2\\pi f_0 t} + e^{-j2\\pi f_0 t})', note: 'Euler' },
            { latex: 'M(f) = \\tfrac{1}{2}[S(f-f_0) + S(f+f_0)]', note: 'Spectre dupliqué et translaté' }
        ],
        intuition: 'Multiplier par une cosinusoïde déplace le spectre sur l\'axe des fréquences. C\'est le principe de l\'AM, du downconverter SDR, et du mélangeur RF.',
        geiiContext: 'Modulation AM/SSB, transposition de fréquence (hétérodyne), MIXAGE en radio logicielle (SDR).'
    },

    theorem_derivation: {
        title: 'Théorème de Dérivation/Intégration',
        steps: [
            { latex: '\\mathcal{F}\\{\\tfrac{ds}{dt}\\} = j2\\pi f \\cdot S(f)', note: 'Dérivée temporelle' },
            { latex: '\\mathcal{F}\\{\\int s\\,dt\\} = \\dfrac{S(f)}{j2\\pi f} + \\tfrac{1}{2}\\delta(f)\\,S(0)', note: 'Intégrale (constante d\'intégration en DC)' }
        ],
        intuition: 'Dériver = filtre passe-haut idéal en gain (|H| = 2πf). Intégrer = filtre passe-bas en gain (|H| = 1/(2πf)). Ces propriétés transforment les EDO en équations algébriques.',
        geiiContext: 'Résolution des EDO linéaires par TF. Modélisation des circuits L (V = L·dI/dt) et C (I = C·dV/dt). Filtres dérivateur/intégrateur opamp.'
    },

    // ─── EXTRAS ───────────────────────────────────────────────────
    rlc_series: {
        title: 'Circuit RLC Série — Réponse aux bornes de C',
        steps: [
            { latex: 'V_C(s) = \\dfrac{1/Cs}{R + Ls + 1/Cs}\\cdot V_{in}(s)', note: 'Diviseur de tension (Laplace)' },
            { latex: 'H(s) = \\dfrac{1}{1 + RCs + LCs^2}', note: 'Forme canonique 2nd ordre' },
            { latex: '\\omega_0 = \\dfrac{1}{\\sqrt{LC}}, \\quad Q = \\dfrac{1}{R}\\sqrt{\\dfrac{L}{C}}', note: 'Résonance et facteur de qualité' },
            { latex: '|H(j\\omega_0)| = Q', note: 'Surtension à la résonance !' }
        ],
        intuition: 'À la résonance, l\'impédance de L et C s\'annulent exactement (jLω = 1/jCω). Il ne reste que R, et la tension aux bornes de C est multipliée par Q. Q > 1 = circuit résonant.',
        geiiContext: 'Filtres passifs en télécom (sélectif). Compensation de facteur de puissance en énergie. Oscillateurs LC (Colpitts, Hartley).'
    },

    impedance_rlc: {
        title: 'Impédance Complexe Z(jω)',
        steps: [
            { latex: 'Z_R = R, \\quad Z_L = jL\\omega, \\quad Z_C = \\dfrac{1}{jC\\omega}', note: 'Impédances élémentaires' },
            { latex: 'Z(j\\omega) = R + jL\\omega - \\dfrac{j}{C\\omega}', note: 'Mise en série' },
            { latex: '|Z| = \\sqrt{R^2 + (L\\omega - 1/C\\omega)^2}', note: 'Module' },
            { latex: '\\arg Z = \\arctan\\!\\left(\\dfrac{L\\omega - 1/C\\omega}{R}\\right)', note: 'Argument' }
        ],
        intuition: 'À basse fréquence, le condensateur domine (Z → ∞ en DC). À haute fréquence, l\'inductance domine (Z → ∞). À ω₀, les deux s\'annulent et Z = R (minimum).',
        geiiContext: 'Calcul de courant en alternatif : I = V/Z. Diagramme de Fresnel. Adaptation d\'impédance en RF.'
    },

    thd: {
        title: 'THD — Taux de Distorsion Harmonique',
        steps: [
            { latex: 's(t) = V_1\\cos(2\\pi f_0 t) + \\sum_{k\\geq 2} V_k\\cos(2\\pi k f_0 t)', note: 'Décomposition harmonique' },
            { latex: '\\text{THD} = \\dfrac{\\sqrt{V_2^2 + V_3^2 + V_4^2 + \\cdots}}{V_1}', note: 'Ratio harmoniques/fondamentale' },
            { latex: '\\text{THD}_{dB} = 20\\log_{10}(\\text{THD})', note: 'En décibels' }
        ],
        intuition: 'Une THD faible (< 1%) = signal très "pur". Les amplis Hi-Fi vise 0.01%, les onduleurs solaires < 5% pour respecter EN 50160.',
        geiiContext: 'Qualité réseau électrique (normes IEEE 519, EN 50160). Test de linéarité d\'ampli audio. Compensation harmonique active.'
    },

    smith_chart: {
        title: 'Smith Chart — Coefficient de Réflexion',
        steps: [
            { latex: '\\Gamma = \\dfrac{Z_L - Z_0}{Z_L + Z_0}', note: 'Définition (ligne d\'impédance Z₀)' },
            { latex: 'Z_L = Z_0\\dfrac{1+\\Gamma}{1-\\Gamma}', note: 'Inverse (du plan Γ vers impédance)' },
            { latex: '|\\Gamma|^2 = \\dfrac{P_{\\text{réfléchi}}}{P_{\\text{incident}}}', note: 'ROS = (1+|Γ|)/(1−|Γ|)' }
        ],
        intuition: 'Le diagramme de Smith mappe le demi-plan droit complexe (Z avec Re ≥ 0) sur le disque unité (|Γ| ≤ 1). C\'est une transformation de Möbius. Idéal pour l\'adaptation d\'impédance graphique.',
        geiiContext: 'Conception RF/Hyperfréquences : adaptation antenne, matching network, mesure VNA.'
    },

    ai_centroid: {
        title: 'Spectral Centroid',
        steps: [
            { latex: 'C = \\dfrac{\\sum_{k} f_k \\cdot |S(f_k)|}{\\sum_{k} |S(f_k)|}', note: 'Barycentre pondéré' },
            { latex: 'C \\approx \\text{"fréquence moyenne perçue"}', note: 'Corrélé à la "brillance" sonore' }
        ],
        intuition: 'Le centroid est le "centre de masse" du spectre. Un son sombre (basse) a C faible, un son brillant (sifflement) a C élevé. Feature numéro 1 en classification audio.',
        geiiContext: 'Audio fingerprinting (Shazam), classification musique/parole, détection d\'instruments.'
    },

    ai_zcr: {
        title: 'Zero-Crossing Rate',
        steps: [
            { latex: 'Z = \\dfrac{1}{2N}\\sum_{n=1}^{N-1}|\\text{sgn}(s_n) - \\text{sgn}(s_{n-1})|', note: 'Comptage discret' },
            { latex: 'Z \\propto \\text{fréquence dominante}', note: 'Approximation rapide' }
        ],
        intuition: 'Pour un sinus pur de fréquence f, ZCR = 2f. Pour un signal bruité, ZCR augmente avec la haute fréquence. Très rapide à calculer (pas de FFT).',
        geiiContext: 'Détection voicing en parole (voisé/non-voisé). Estimation rapide de fréquence en embedded systems.'
    },

    ai_mfcc: {
        title: 'MFCC — Mel-Frequency Cepstral Coefficients',
        steps: [
            { latex: 's(t) \\xrightarrow{|\\text{FFT}|^2} \\text{Spectre de puissance}', note: '1. Spectre' },
            { latex: '\\xrightarrow{\\text{Banc filtres Mel}} E_b', note: '2. Filtrage perceptif (26 bandes mel)' },
            { latex: '\\xrightarrow{\\log} \\log(E_b)', note: '3. Compression logarithmique (loi de Weber-Fechner)' },
            { latex: 'M_k = \\sum_{b=1}^{B} \\log(E_b)\\cos\\!\\left[k(b-\\tfrac{1}{2})\\tfrac{\\pi}{B}\\right]', note: '4. DCT pour décorrélation' }
        ],
        intuition: 'Les MFCC modélisent la perception auditive : échelle mel (logarithmique aux hautes fréquences), log d\'énergie (sensibilité de Weber), DCT (décorrélation). 13 coefficients suffisent pour caractériser un phonème.',
        geiiContext: 'Standard de facto en reconnaissance vocale (Whisper, Wav2Vec, anciens HMM). Speaker recognition. Music information retrieval.'
    },

    ai_autocorr: {
        title: 'Autocorrélation R(τ)',
        steps: [
            { latex: 'R(\\tau) = \\int_{-\\infty}^{+\\infty} s(t)\\,s(t+\\tau)\\,dt', note: 'Définition (continue)' },
            { latex: 'R(\\tau) = \\mathcal{F}^{-1}\\{|S(f)|^2\\}', note: 'Wiener-Khinchin' },
            { latex: 'R(0) = \\text{énergie totale}', note: 'Maximum en 0' },
            { latex: '\\tau_{\\max} = 1/f_0', note: 'Pour signal périodique : pic à la période' }
        ],
        intuition: 'L\'autocorrélation révèle les périodicités cachées : un pic à τ ≠ 0 indique une période. Théorème de Wiener-Khinchin : R = TF inverse de la densité spectrale.',
        geiiContext: 'Détection de pitch (YIN, autocorrelation method). GPS/radar : corrélation entre signal émis et reçu. Détection séquence PRBS.'
    },

    shannon: {
        title: 'Théorème de Shannon-Nyquist',
        steps: [
            { latex: 's_n = s(nT_e)', note: 'Échantillonnage à fₑ = 1/Tₑ' },
            { latex: 'S_s(f) = f_e\\sum_k S(f - kf_e)', note: 'Spectre = répétition tous les fₑ Hz' },
            { latex: '\\boxed{f_e \\geq 2 f_{\\max}}', note: 'Condition de Nyquist (pas de repliement)' },
            { latex: 's(t) = \\sum_n s_n\\,\\text{sinc}\\!\\left(\\dfrac{t-nT_e}{T_e}\\right)', note: 'Formule de reconstruction (Whittaker-Shannon)' }
        ],
        intuition: 'Si on échantillonne trop lentement, les répliques spectrales se chevauchent → aliasing irréversible. C\'est pourquoi on met un filtre anti-aliasing AVANT le CAN.',
        geiiContext: 'Choix de la fréquence d\'échantillonnage CD audio = 44.1 kHz (couvre 20 kHz audible × 2 + marge filtre). Sous-échantillonnage volontaire pour les SDR.'
    },

    quantization: {
        title: 'Quantification & ENOB',
        steps: [
            { latex: '\\Delta = \\dfrac{V_{pp}}{2^N}', note: 'Pas de quantification (N bits)' },
            { latex: 's_q[n] = \\Delta\\cdot\\text{round}(s[n]/\\Delta)', note: 'Arrondi vers le niveau le plus proche' },
            { latex: 'e_q = s - s_q,\\;\\;\\sigma_q^2 = \\Delta^2/12', note: 'Bruit de quantification (uniforme)' },
            { latex: '\\text{SNR}_{dB} = 6.02\\,N + 1.76', note: 'SNR idéal pour signal sinusoïdal pleine échelle' }
        ],
        intuition: 'Chaque bit supplémentaire ajoute ~6 dB de SNR. ENOB (Effective Number Of Bits) = SNR_mesuré/6.02 — souvent < N à cause du bruit et non-linéarités.',
        geiiContext: 'Choix de CAN : 12 bits → 74 dB SNR (capteurs industriels), 16 bits → 98 dB (audio), 24 bits → 146 dB (instrumentation labo).'
    },

    fir_iir: {
        title: 'FIR vs IIR',
        steps: [
            { latex: '\\text{FIR}: y_n = \\sum_{k=0}^{M} b_k\\,x_{n-k}', note: 'Réponse finie — pas de récursion' },
            { latex: '\\text{IIR}: y_n = \\sum_{k=0}^{M} b_k\\,x_{n-k} - \\sum_{k=1}^{N} a_k\\,y_{n-k}', note: 'Récursion sur sortie' },
            { latex: 'H_{FIR}(z) = \\sum b_k z^{-k}, \\;\\; H_{IIR}(z) = \\dfrac{B(z)}{A(z)}', note: 'Forme transfert' }
        ],
        intuition: 'FIR : stable par construction, phase linéaire possible, mais ordre élevé pour bonne sélectivité. IIR : très efficace (ordre faible), mais peut être instable et phase non linéaire.',
        geiiContext: 'FIR pour filtres à phase linéaire (audio Hi-Fi). IIR pour économie de ressources (DSP temps réel, ARM Cortex-M).'
    },

    reconstruction: {
        title: 'Reconstruction Sinc — Whittaker-Shannon',
        steps: [
            { latex: 's(t) = \\sum_{n=-\\infty}^{+\\infty} s_n\\,\\text{sinc}\\!\\left(\\dfrac{t-nT_e}{T_e}\\right)', note: 'Interpolation idéale' },
            { latex: '\\text{Équivalent: } s(t) = s_s(t) * h_{LP}(t)', note: 'Filtrage PB du signal échantillonné' },
            { latex: 'h_{LP}(t) = \\dfrac{1}{T_e}\\text{sinc}(t/T_e)', note: 'Filtre PB idéal de bande [-fₑ/2, +fₑ/2]' }
        ],
        intuition: 'La reconstruction parfaite existe MATHÉMATIQUEMENT mais nécessite un sinc infini → on approxime avec un PB analogique en sortie de CNA (anti-imaging filter).',
        geiiContext: 'CNA audio (zero-order hold + filtre reconstruction). Suréchantillonnage pour relaxer le filtre analogique.'
    }
};

export function findDerivation(id) {
    return DERIVATIONS[id] || null;
}
