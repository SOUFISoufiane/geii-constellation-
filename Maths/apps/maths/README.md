# Math Visualizer

**Status:** Stub — non implémenté
**Concept:** Mathématiques (fondations)
**Matières:** Maths S3-S6

## Vision
La maths pure rendue visuelle. Pas un solveur formel (existent déjà), mais un
**théâtre** où on voit les objets mathématiques bouger : les solutions d'une EDO
serpenter dans le champ de vecteurs, les vecteurs propres se révéler comme des
directions invariantes.

## Fonctionnalités prévues
- **Équations différentielles**
  - Tracé interactif de y' = f(t, y) avec champ de pentes
  - Conditions initiales déplaçables à la souris → solution recalculée live
  - Cas particuliers : linéaire 1er ordre, 2nd ordre avec amortissement
  - Comparaison Euler / RK4 / solution analytique
- **Transformée de Laplace**
  - Table de transformations usuelles cliquable
  - Mode pas-à-pas : prendre une EDO, voir chaque étape (transformer, simplifier, inverser)
  - Visualisation pôles/zéros dans le plan complexe
- **Champs de vecteurs & portraits de phase**
  - Système 2D `(x', y') = (f, g)`
  - Trajectoires depuis n'importe quel point initial
  - Détection automatique des points fixes + classification (nœud, foyer, selle, centre)
- **Algèbre linéaire**
  - Visualisation 2D/3D d'applications linéaires (vecteurs avant/après)
  - Déterminant comme aire/volume signé
  - Valeurs propres : directions invariantes mises en évidence
  - Diagonalisation step-by-step
- **Suites & séries**
  - Affichage de Sn vs limite supposée
  - Tests de convergence : d'Alembert, Cauchy, comparaison
- **Nombres complexes**
  - Plan d'Argand interactif
  - Multiplication = rotation + homothétie animée
  - Exponentielle complexe sur le cercle unité

## Dépendances techniques
- Plotly.js pour les tracés 2D/3D
- KaTeX pour les équations
- Solveurs ODE maison (Euler / RK4) — c'est pédagogiquement intéressant de coder
- Outils d'algèbre linéaire : matrices 2x2 / 3x3 inversées à la main, valeurs propres
  par formule directe (2x2) ou itération de la puissance (3x3)

## Concepts pédagogiques couverts
- Équations différentielles linéaires et non-linéaires
- Transformée de Laplace inverse, fonctions de transfert
- Stabilité par linéarisation
- Espaces vectoriels, bases, changement de base
- Applications linéaires, diagonalisation
- Séries de Fourier (lien avec Signal Observatory !)
- Convergence de suites et séries
- Complexes : forme algébrique, exponentielle, polaire

## Lien avec les autres apps
- **Signal Observatory** : les séries de Fourier sont déjà là, mais visualisées sous l'angle
  spectral. Ici on les verrait sous l'angle "somme partielle qui converge".
- **Servo Lab** : la transformée de Laplace est le langage commun.
- **Circuits Interactifs** : EDO de Kirchhoff ↔ équation linéaire 2nd ordre.

## TODO d'amorçage
1. Module champ de vecteurs réutilisable (sera utile partout)
2. Solveurs ODE robustes
3. Renderer "plan complexe" interactif
