# Servo Lab

**Status:** Stub — non implémenté
**Concept:** Systèmes & Asservissement
**Matières:** Automatique S4, Maths

## Vision
Comprendre l'asservissement non pas comme un empilement de formules, mais comme une
boucle vivante : on bouge un pôle, la réponse s'adapte. On change Kp, le dépassement
explose. Tout en visuel et temps réel.

## Fonctionnalités prévues
- **PID interactif** sur plant `G(s) = K/(1+τs)(1+τ²s²)` :
  - Sliders Kp / Ki / Kd
  - Réponse indicielle live + critère IAE/ISE en bas
  - Toggle perturbation à mi-course
- **Lieu des racines (root locus)** :
  - Tracé canonique + déplacement des pôles dominants à la souris
  - Affichage du gain K correspondant
- **Bode / Nyquist** du système bouclé avec :
  - Marges de gain et phase calculées + affichées
  - Cercle unité, point critique (-1, 0)
- **Identification visuelle** :
  - Réponse fournie → l'étudiant ajuste une FT pour matcher → score
- **Modes pédagogiques** :
  - "Pôle dominant" : voir un système 3e ordre comparé à son équivalent 2nd
  - "Effet du dérivateur" : montrer le bruit amplifié par D
  - "Saturation" : effet d'un anti-windup

## Dépendances techniques
- Plotly.js (lourd usage pour Bode log, Nyquist polaire, root locus)
- Routines numériques : roots() polynomiale (Durand-Kerner ou Bairstow)
- KaTeX pour afficher les FT

## Concepts pédagogiques couverts
- Stabilité (Routh-Hurwitz, lieu des pôles)
- Marges de gain / phase
- Conception PID (méthodes Ziegler-Nichols, placement de pôles)
- Lieu des racines de Evans
- Bode + Nyquist appliqués à un système bouclé
- Identification à partir de la réponse indicielle

## Lien avec Signal Observatory
- Les **filtres** déjà implémentés (Butterworth, Chebyshev) deviennent des
  blocs de précompensation dans cette app.
- La réponse d'un système d'ordre N est aussi visualisable comme un signal dans
  Signal Observatory.

## TODO d'amorçage
1. Solveur racines de polynôme robuste (jusqu'à degré 8)
2. UI Bode + Nyquist réutilisable depuis Signal Observatory
3. Plant simulator (Euler ou RK4) pour la réponse temporelle
