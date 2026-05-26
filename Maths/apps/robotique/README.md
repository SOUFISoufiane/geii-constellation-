# Robotique — Cinématique

**Status:** Stable
**Concept:** Robotique
**Matières:** Robotique industrielle

Visualiseur de cinématique pour le BUT GEII, construit à partir du TD
« RoboIndus — Cinématique TD1 et TD2 ». Trois modules, notation alignée sur le TD
(θ, q, R, T).

## Modules

### 🦾 Bras planaire 2R
Robot 2R à deux articulations rotoïdes, longueurs L₁ et L₂ réglables.
- **MGD (modèle géométrique direct)** : sliders θ₁, θ₂ → position de l'effecteur,
  avec les équations exactes du TD1 Ex. 7 :
  - x = L₁·cos θ₁ + L₂·cos(θ₁+θ₂)
  - y = L₁·sin θ₁ + L₂·sin(θ₁+θ₂)
- **MGI (modèle géométrique inverse)** : on fixe une cible (x, y), l'app résout par
  loi des cosinus et affiche les **deux** solutions « coude haut / coude bas ».
  Détection des cibles hors d'atteinte (r ∉ [|L₁−L₂|, L₁+L₂]).
- Anneau de l'espace de travail affiché en pointillés.

### 🔄 Matrices de rotation
Rotations élémentaires Rx(θ), Ry(θ), Rz(θ) (TD2 §1.3), avec composition R = R_A·R_B.
- Repère 3D : axes initiaux en gris, axes tournés en rouge/vert/bleu.
- Matrice R affichée en LaTeX (KaTeX), vérification det(R)=1 et Rᵀ=R⁻¹.

### ⌨ VAL3 / trsf
Le bac à sable géométrique sous VAL3 — pensé pour travailler à la maison ce qui
sera tapé dans le simulateur à l'école. Un point robot = pose (x,y,z,rx,ry,rz)
que le contrôleur stocke en matrice 4×4. Convention d'angles = Euler Stäubli /
cours (R = Rz·Ry·Rx, rotations autour des axes fixes ; voir TD2 p.12).
- **compose(point, frame, trsf)** — point relatif à un repère + décalage.
- **appro(point, trsf)** — décalage exprimé dans le repère propre du point.
- **setFrame(O, PA, PB)** — construit un repère à partir de 3 points (origine,
  point sur X, point sur le plan XY).
- Affiche la ligne VAL3 exacte, la matrice 4×4 résultante et la pose résultat à
  **recopier telle quelle dans le simulateur**.

### 📐 Transformations homogènes
Matrice 4×4 T = [ R | p ; 0 0 0 1 ] (TD2 Ex. 5-8).
- Rotation autour d'un axe + translation p réglables.
- Application de T à un point q : ᴬq = R·q + p.
- Inverse T⁻¹ = [ Rᵀ | −Rᵀp ; … ], affichée dans le readout.
- Repères A (monde) et B (transformé) tracés en 3D avec le point dans les deux repères.

### 🌐 Repères & points
Repère World + un repère REF1 (position + orientation). Un point appris dans REF1
est exprimé dans World (ᵂp = T·ᴿp), avec un point d'approche décalé selon l'axe z de
REF1 — l'idée « appro » du TP Stäubli, en 3D.

### 🦿 Bras 6 axes
Robot sériel 6R (type Stäubli TX, paramètres de Denavit–Hartenberg). Deux modes de
commande, comme le pupitre :
- **Articulaire (movej)** : jog de chaque axe q₁..q₆.
- **Cartésien (movel)** : commande de la pose de l'outil (X/Y/Z + RX/RY/RZ) ; la
  cinématique inverse (moindres carrés amortis, amorcée depuis la config courante)
  résout les 6 axes pour suivre la consigne. Pose hors d'atteinte → le bras se place
  au plus près et le signale.
Les deux modes restent synchronisés. Détection des singularités poignet/coude/épaule.
FK & IK partagées dans `robokit.js` (testées : 3000 allers-retours FK∘IK, erreur < 2·10⁻³).

## Dépendances techniques
- Vanilla JS + ES modules ; pas de framework.
- Plotly.js pour les tracés 2D (bras) et 3D (repères) — chargé via CDN.
- KaTeX pour les matrices R et T.
- `shared/js/plot-fit.js` (renderPlot) pour le dimensionnement robuste des plots.

## Concepts pédagogiques couverts
- Degrés de liberté, articulations rotoïde/prismatique (TD1 §1).
- Modèle géométrique direct et inverse d'un bras 2R.
- Solutions multiples de la cinématique inverse.
- Matrices de rotation orthogonales et leurs propriétés.
- Transformations homogènes : composition, inverse, action sur un point.

## Notes de vérification
Valeurs de contrôle issues du TD (L₁=2, L₂=1) :
- θ₁=θ₂=0  → effecteur (3, 0).
- θ₁=90°, θ₂=0 → effecteur (0, 3).
- θ₁=0, θ₂=90° → effecteur (2, 1).
