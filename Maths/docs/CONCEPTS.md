# Concepts transverses — GEII Visual Toolbox

La toolbox est organisée par **concepts**, pas par matières. Un concept est une
idée qui touche **plusieurs matières** du cursus GEII et qui mérite un outil
visuel dédié. Une app vit dans un concept, mais peut être référencée par
plusieurs matières.

## Pourquoi par concepts plutôt que par matières ?

- Un cursus est un découpage **administratif**. Les vrais ponts mentaux se
  font autour d'idées : « la même TF apparaît en signal, en circuits, en
  automatique ».
- Quand on cherche un outil, on pense au **problème**, pas au prof.
- Cela rend la toolbox utile au-delà de GEII (cycle ingénieur, autres cursus).

---

## Arbre des concepts (actuels et futurs)

```
GEII Visual Toolbox   (les 6 apps sont construites — ⭐ stable)
├── 1. Signaux & Transformées        [signals-transforms]
│   ├── Signal Observatory ⭐
│   └── (futur) Spectrogramme Lab
│
├── 2. Systèmes & Asservissement     [systems-control]
│   ├── Servo Lab ⭐
│   └── (futur) State-space Visualizer
│
├── 3. Circuits Analogiques          [circuits-analog]
│   ├── Circuits Interactifs ⭐
│   └── (futur) AOP Designer
│
├── 4. Logique Numérique             [digital-logic]
│   ├── Digital Lab ⭐
│   └── (futur) HDL Playground
│
├── 5. Mathématiques (fondations)    [math-foundations]
│   ├── Math Visualizer ⭐
│   └── (futur) Linear Algebra Theater
│
├── 6. Robotique                     [robotics]
│   ├── Robotique ⭐  (2R, rotations, transf. homogènes, repères, 6-axes, VAL3)
│   └── (futur) Trajectoires & interpolation
│
├── (futur) 7. Énergie & Puissance   [power-energy]
│   ├── Triphasé Visualizer
│   ├── Convertisseur DC-DC Lab
│   └── Moteurs (DC, asynchrone)
│
├── (futur) 8. Communications        [communications]
│   ├── Modulation Lab (AM/FM/PSK)
│   ├── Codage de canal
│   └── Antennes & propagation
│
└── (futur) 9. Embarqué              [embedded]
    ├── Bus Lab (I2C, SPI, UART)
    ├── ARM Cortex Visualizer
    └── DSP Algorithms
```

---

## Matrice concepts ↔ matières GEII

| Concept                   | Matières touchées                                  | Semestres   |
|---------------------------|----------------------------------------------------|-------------|
| Signaux & Transformées    | Maths, Signal, Électronique                        | S3 → S6     |
| Systèmes & Asservissement | Automatique, Maths, Électronique                   | S4 → S6     |
| Circuits Analogiques      | Électronique, Énergie, Physique                    | S1 → S5     |
| Logique Numérique         | Élec. numérique, Informatique                      | S2 → S4     |
| Mathématiques             | Maths                                              | S1 → S6     |
| Robotique                 | Robotique industrielle, Maths                      | S4 → ing.   |
| (futur) Énergie           | Énergie, Électrotechnique                          | S3 → S5     |
| (futur) Communications    | Télécom, Signal                                    | S5 → S6     |
| (futur) Embarqué          | Informatique industrielle, Élec. numérique         | S4 → S6     |

---

## Critères d'ajout d'un nouveau concept

Un concept mérite son propre slot quand :
1. Il touche **au moins 2 matières** du cursus
2. Il a un **objet visuel central** qu'on peut manipuler (un signal, un circuit,
   une FSM, une fonction de transfert…)
3. Au moins **une app pédagogique** prévue (le concept ne tient pas tout seul)

Si un concept ne touche qu'une matière, ce n'est probablement pas un concept :
c'est juste un chapitre d'un manuel. Il faut chercher le **dénominateur commun**
avant de l'ajouter.

---

## Critères d'ajout d'une nouvelle app

Une app rentre dans la toolbox quand elle :
1. Apporte un **angle visuel inédit** (pas un simple solveur formel)
2. Couvre un **point précis** du curriculum (pas une encyclopédie)
3. Tient dans **un seul écran** (pas de scroll vertical infini)
4. Marche **sans inscription** ni backend (toute l'app vit en client)

Si une fonctionnalité grossit trop, elle est probablement une **app à part
entière** plutôt qu'un onglet dans une app existante.

---

## Liens conceptuels (à exploiter dans le futur)

Certaines paires d'apps partageraient avantageusement du code :

| Lien                                 | Apps                          | Code commun potentiel        |
|--------------------------------------|-------------------------------|------------------------------|
| Transformée de Laplace               | Servo Lab ↔ Math Visualizer   | Renderer pôles-zéros         |
| Réponse impulsionnelle / indicielle  | Circuits ↔ Servo Lab          | Simulateur transitoire RK4   |
| Filtre numérique                     | Signal Obs ↔ (futur DSP)      | Module IIR/FIR               |
| Diagramme de Bode                    | Signal Obs ↔ Servo Lab        | Renderer Bode log            |

Quand un module commun apparaît, il **doit** migrer dans `shared/js/lib/` plutôt
que d'être dupliqué. C'est précisément la raison d'être de la toolbox.
