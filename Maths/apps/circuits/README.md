# Circuits Interactifs

**Status:** Stub — non implémenté
**Concept:** Circuits Analogiques
**Matières:** Électronique, Énergie

## Vision
Schémas électriques que l'étudiant manipule à la souris, avec calculs en temps réel des
tensions / courants / impédances. Pédagogique avant tout : voir l'effet d'un slider sur
les grandeurs, comprendre Kirchhoff sans calculs manuels fastidieux.

## Fonctionnalités prévues
- **Bibliothèque de composants SVG** (R, L, C, sources DC/AC, diodes, transistors, AOP)
- **Drag-and-drop** sur une grille de schéma (graphisme façon Falstad mais cosmic theme)
- **Solveur Kirchhoff** : analyse nodale automatique, résultats poussés dans des badges
  superposés au schéma
- **Modes** :
  - DC stationnaire (sources continues, R uniquement)
  - AC sinusoïdal (sources sinus, impédances complexes, vecteurs de Fresnel)
  - Transitoire (RLC en step input → tracé v(t), i(t) en temps réel)
- **Théorèmes** : Thévenin / Norton avec étape "découper le circuit" animée
- **Quiz** : pré-construit avec quelques circuits + trous à remplir

## Dépendances techniques
- Pas de framework UI ; vanilla JS + ES modules
- Plotly.js pour les tracés transitoires (déjà chargé)
- KaTeX pour les équations (déjà chargé)
- Solveur linéaire maison ou math.js (à décider)

## Concepts pédagogiques couverts
- Loi des nœuds (KCL) & loi des mailles (KVL)
- Diviseurs de tension / courant
- Théorèmes de superposition, Thévenin, Norton
- Réponse transitoire d'un RLC
- Impédances complexes en régime sinusoïdal
- Réseaux à AOP : suiveur, inverseur, non-inverseur, sommateur

## Lien avec Signal Observatory
La sortie d'un filtre RLC simulé ici devrait pouvoir être **importée comme signal**
dans Signal Observatory pour analyse fréquentielle.

## TODO d'amorçage
1. Définir le format de schéma (JSON canonique node-edge)
2. Prototyper le solveur nodal sur 2-3 circuits de référence
3. Esquisser l'UI : barre de composants à gauche, schéma au centre, panneau résultats à droite
