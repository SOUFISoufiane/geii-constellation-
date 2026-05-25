# Digital Lab

**Status:** Stub — non implémenté
**Concept:** Logique Numérique
**Matières:** Électronique numérique, Informatique

## Vision
Visualiser la logique combinatoire et séquentielle : tables de vérité, K-maps, circuits,
FSM, le tout en mode "on touche → ça réagit". L'étudiant simplifie une fonction
booléenne et voit immédiatement les groupements de Karnaugh.

## Fonctionnalités prévues
- **Éditeur de tables de vérité**
  - 1 à 6 variables
  - Clic sur une cellule → toggle 0/1
  - Génération automatique de l'expression sous forme canonique
- **Diagrammes de Karnaugh interactifs**
  - 2, 3, 4, 5 variables
  - Groupements automatiques détectés et coloriés
  - Affichage de l'expression minimale
- **Simulateur de circuits logiques**
  - Bibliothèque : ET, OU, XOR, NAND, NOR, NOT, bascules D / JK / SR / T
  - Drag-and-drop sur grille
  - Sondes pour observer les états en temps réel
- **Machines à états (FSM)**
  - Éditeur de graphe états + transitions
  - Génération du timing diagram en fonction d'une entrée
  - Détection des états inatteignables
- **Conversions**
  - Expression ↔ table ↔ K-map ↔ schéma
- **Quiz**
  - "Trouve l'expression minimale" / "complète la table" / "implémente la fonction avec uniquement des NAND"

## Dépendances techniques
- Vanilla JS + ES modules
- SVG pour les schémas + K-maps
- Pas de simulateur lourd : événements discrets propagés à la main

## Concepts pédagogiques couverts
- Algèbre de Boole, lois de De Morgan
- Forme canonique SOP / POS
- Simplification de Karnaugh (jusqu'à 5 variables)
- Quine-McCluskey (mode "avancé")
- Bascules synchrones / asynchrones, métastabilité
- FSM Moore / Mealy
- Codages : binaire, BCD, Gray, ASCII

## Lien avec les autres apps
- Une FSM ici pourrait piloter un signal de test envoyé à Signal Observatory.
- Logique de seuillage (comparateur → ADC) comme pont vers Circuits Interactifs.

## TODO d'amorçage
1. Algorithme de couverture pour K-maps jusqu'à 5 variables (essentiel pour la valeur pédagogique)
2. Renderer SVG des K-maps (réflexion : 5 vars = double K-map)
3. Mini-éditeur FSM
