# GEII Visual Toolbox (geii-constellation)

*[Read in English](README.md)*

> "Dis-le-moi et je l'oublierai, enseigne-le-moi et je m'en souviendrai peut-être, implique-moi et j'apprendrai." — Benjamin Franklin

Quand j'ai commencé mes études en Génie Électrique et Informatique Industrielle (GEII), je voulais trouver comment véritablement visualiser des concepts complexes. Comment peut-on comprendre les transformées de Fourier, les lieux des racines et la cinématique sans se contenter de fixer les pages statiques d'un manuel ?

Ici [SOUFI Soufiane](https://github.com/SOUFISoufiane). J'ai passé deux années entières à naviguer à travers des notions denses de mathématiques appliquées et de physique, passant du monde analogique au monde numérique, à travers les filtres, les systèmes de contrôle, le traitement du signal, jusqu'aux transformées de Fourier et en Z. Au fil des années, j'ai découvert que j'apprends 10 fois mieux en reliant le monde théorique aride au monde visuel par des dessins, des schématisations, et même ma propre Imagination. Mais les dessins et les schémas finissent dans un dossier et sont oubliés, l'Imagination ne dure que quelques minutes, alors que je sais que le code dure éternellement. J'ai donc décidé de créer des outils interactifs pour m'aider à visualiser et à comprendre les concepts, mais aussi pour mémoriser mes mois de travail acharné et d'étude avec un accès facile pour combler les lacunes de mémoire. Et étonnamment, j'apprends plus efficacement que jamais, je me souviens des choses beaucoup plus vite, je peux appliquer un exercice de TD (théorique) dans une simulation visuelle et valider mon raisonnement, puis ne plus jamais l'oublier. Ces derniers mois, j'ai rassemblé tout cela et construit des modules interactifs de qualité production, entièrement visuels, fonctionnant sur des simulations et couvrant le cœur du programme de GEII, mais cela s'étendra à l'ingénierie à mesure que je progresserai. Conçu pour la compréhension logique et non l'apprentissage par cœur, car l'important n'est pas le nombre de pages que vous lisez, c'est ce que vous comprenez vraiment.

Même étudiant. Époque différente. La différence, ce sont les outils.

**GEII Visual Toolbox a été ma solution.** Cet outil transforme des équations abstraites en un laboratoire d'ingénierie virtuel — un oscilloscope qui réagit en temps réel, un simulateur de circuits qui affiche instantanément les équivalents de Thévenin, une carte logique numérique qui met à jour dynamiquement les tableaux de Karnaugh, et un bras robotique qui bouge lorsque vous modifiez des coordonnées et des paramètres. Six modules spécialisés (d'autres sont à venir...), tous interactifs, tous conçus avec des technologies web, tous gratuits, sous licence MIT.

Ceci est mon usine éducative open source. Je l'utilise tous les jours. Je la partage car premièrement, je sais que de nombreuses personnes extraordinaires peuvent enrichir ce projet et le rendre encore plus grand, ce qui pourrait aider d'autres étudiants. Et deuxièmement, cela pourrait être un bel héritage et un bon souvenir de mon travail acharné et de mon dévouement durant mes années à l'IUT.

Forkez-le. Améliorez-le. Appropriez-le-vous 😊

**À qui cela s'adresse-t-il :**
- **Étudiants** — particulièrement ceux qui ont besoin de *voir* pour comprendre.
- **Esprits curieux** — quiconque souhaite comprendre le traitement du signal, l'automatique et l'électronique.

## Démarrage rapide

1. Installez le GEII Visual Toolbox (30 secondes — voir ci-dessous)
2. Ouvrez **Signal Observatory** — visualisez l'audio en direct et les transformées de Fourier.
3. Ouvrez **Automatique (Servo Lab)** — tracez dynamiquement les lieux des racines et les diagrammes de Bode.
4. Explorez la **Base de connaissances (My2ndBrain)** — lisez les procédures (SOPs) et les notes de cours.
5. Arrêtez-vous là. Vous saurez si cet outil est fait pour vous.

## Options d'installation

**Prérequis :** [Git](https://git-scm.com/), [Node.js](https://nodejs.org/)

### 1. La version Web (Sans installation)
L'application web principale se trouve dans le dossier `Maths`. Ouvrez simplement `Maths/index.html` dans votre navigateur web favori ! Elle s'exécute entièrement en local.

### 2. Application de bureau (Développement)
Clonez le dépôt et exécutez l'application Electron complète localement. Fonctionne parfaitement sur Windows, Mac, Linux et WSL.
```bash
git clone https://github.com/SOUFISoufiane/geii-constellation-.git
cd geii-constellation-
npm install
npm start
```

### 3. Créer des exécutables autonomes (.exe, .dmg, AppImage)
Vous souhaitez compiler l'application en un programme autonome pour votre système d'exploitation ?
```bash
npm install
npm run dist:win    # Pour Windows
npm run dist:mac    # Pour macOS
npm run dist:linux  # Pour Linux
```
Votre installeur compilé sera disponible dans le dossier `dist/`.

### 4. Outil CLI (Ligne de commande)
Lancez l'interface de l'application directement depuis votre terminal :
```bash
npm run cli
```

## La Constellation (Modules Principaux)

Le GEII Visual Toolbox est une suite d'applications interactives. Chaque module est conçu pour aborder un domaine spécifique du programme GEII :

| Module | Votre Labo Virtuel | Ce qu'il fait |
|--------|------------------|---------------|
| 📡 **Signal Observatory** | **Analyseur DSP** | Visualisation audio en temps réel (téléchargement et balayage instantané), FFT, dérivations et analyse d'équations personnalisées. Observez les harmoniques et la convolution des signaux en action. |
| ⚙️ **Automatique** | **Systèmes de contrôle** | Laboratoire d'asservissement pour la théorie du contrôle. Visualisez dynamiquement les lieux des racines, les marges de Bode et la stabilité du système. |
| 🔌 **Circuits** | **Labo d'électronique** | Outil d'analyse de circuits comprenant des circuits RLC, les lois de Kirchhoff et des modules pour les équivalents de Thévenin. |
| 🔢 **Numérique** | **Labo numérique** | Terrain de jeu de la logique numérique avec des tableaux de Karnaugh interactifs et de la génération VHDL. |
| 📐 **Maths** | **Visualiseur mathématique** | Outil complet de visualisation mathématique avec résolveur d'équations différentielles, transformées de Laplace et tracé de fonctions. |
| 🤖 **Robotique** | **Moteur cinématique**| Visualisation d'un bras robotique à 6 axes. Explorez le contrôle articulaire/cartésien, la cinématique directe/inverse et les matrices de transformation homogènes. |

## La base de connaissances

Le code et les visualisations ne représentent que la moitié du travail. L'autre moitié, c'est la théorie.

Ce dépôt inclut une base de connaissances centrale (KB) pour tous les concepts théoriques, parfaitement intégrée à l'application.

À l'intérieur, vous trouverez :
- **Concepts & Entités :** Explorations approfondies des séries de Fourier, des transformées de Laplace, etc.
- **SOPs (Procédures Opérationnelles Standards) :** Guides étape par étape sur la manière d'aborder les problèmes d'ingénierie.
- **Logs d'optimisation des tokens :** Historique de l'entretien et de l'optimisation de cette base de connaissances.

**Comment y accéder :**
Tous les articles de la base de connaissances (KBA) et les SOPs sont entièrement intégrés et prêts à être lus. Cliquez simplement sur le lien **📖 Knowledge Base** directement sur le tableau de bord principal de l'application !

---
*Construit avec ❤️ pour la communauté GEII.*
