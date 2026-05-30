# GEII Visual Toolbox (geii-constellation)

*[Read in English](README.md)*

> "Dis-le-moi et je l'oublierai, enseigne-le-moi et je m'en souviendrai peut-être, implique-moi et j'apprendrai." — Benjamin Franklin

Quand j'ai commencé mes études en Génie Électrique et Informatique Industrielle (GEII), je voulais trouver comment véritablement visualiser les concepts complexes qu'on voyait chaque jour. Comment peut-on comprendre les transformées de Fourier, les lieux des racines et la cinématique sans se contenter de se fixer sur les pages d'un livret de maths ? 😪

Je suis [SOUFI Soufiane](https://github.com/SOUFISoufiane). Ces deux dernières années, j'ai navigué à travers les mondes denses des mathématiques et de la physique appliquées, faisant le pont entre les systèmes analogiques et numériques à travers les filtres, la théorie du contrôle, le traitement du signal, et les transformées de Fourier. En chemin, j'ai réalisé que j'apprends 10 fois mieux en reliant la théorie aux concepts visuels.

Si les dessins finissent classés et si l'imagination s'estompe en quelques minutes, le code, lui, dure éternellement. J'ai construit ces outils interactifs pour visualiser des concepts complexes, capturer des mois de travail acharné, et combler mes propres lacunes de mémoire. Étonnamment, cela a mieux fonctionné que je ne l'aurais jamais imaginé. Je peux maintenant me remémorer les concepts instantanément, intégrer un exercice théorique dans une simulation visuelle pour valider mon raisonnement, et ne plus jamais l'oublier.

Récemment, j'ai tout consolidé dans ces modules interactifs, basés sur des simulations. Ils couvrent actuellement le programme de base du GEII, mais s'étendront à des sujets d'ingénierie plus vastes au fur et à mesure de ma progression. Ceci est conçu pour la compréhension logique et non pour l'apprentissage par cœur, car l'important n'est pas le nombre de pages que vous lisez, c'est ce que vous comprenez vraiment.

Même étudiant. Époque différente. La différence, ce sont les outils.

**GEII Visual Toolbox étais ma solution.** Il transforme des équations abstraites en un laboratoire virtuel fluide. Que vous soyez un étudiant simulant un circuit, un maker analysant un signal, ou un développeur autodidacte explorant la cinématique robotique, cette boîte à outils s'adapte à vous. Elle comprend un oscilloscope qui réagit en temps réel, un simulateur de circuits qui calcule les équivalents de Thévenin instantanément, des cartes logiques numériques qui résolvent dynamiquement les tableaux de Karnaugh, et un bras robotique à 6 axes qui répond aux modifications de vos coordonnées.

Six modules spécialisés (d'autres sont à venir), tous hautement interactifs, construits avec des technologies web modernes.

Ceci est mon usine éducative open source. Je l'utilise tous les jours. Je la partage car premièrement, je sais que d'autres personnes peuvent s'en servir pour l'améliorer pour d'autres étudiants, et deuxièmement, parce qu'elle fait partie du témoignage de mon acharnement et de mon investissement durant mon passage à l'IUT.

Forkez-le. Améliorez-le. Appropriez-le-vous 😊

**À qui cela s'adresse-t-il :**
- **Apprenants visuels & Étudiants** — Particulièrement ceux qui ont besoin de *voir* pour vraiment comprendre (statut : visualisations de base terminées, s'enrichit au fil de ma progression).
- **Hackers Hardware & Makers** — Toute personne construisant de l'électronique DIY ayant besoin de simuler rapidement des circuits ou de la logique numérique (statut : en amélioration continue...).
- **Constructeurs Autodidactes** — Ceux qui recherchent des moyens pratiques et interactifs pour saisir des systèmes de contrôle complexes et la cinématique (statut : en amélioration continue...).
- **Professeurs** — Professeurs à la recherche de laboratoires virtuels interactifs pour vulgariser des théories abstraites auprès d'un public plus jeune (statut : en amélioration continue...).

## Démarrage rapide

1. Installez le GEII Visual Toolbox (30 secondes — voir ci-dessous)
2. Ouvrez **Signal Observatory** — visualisez l'audio en direct et les transformées de Fourier.
3. Ouvrez **Automatique (Servo Lab)** — tracez dynamiquement les lieux des racines et les diagrammes de Bode.
4. Explorez la **Base de connaissances** — lisez les SOPs et les notes d'étude.
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

### 4. Serveur Web Local (Sans Electron)
Si vous préférez ne pas utiliser Electron, vous pouvez lancer un serveur HTTP local léger qui sert l'application directement dans votre navigateur web par défaut :
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

Ce dépôt inclut une base de connaissances centrale (KB) pour tous les concepts théoriques, parfaitement intégrée à l'application. Vous pouvez la trouver sur la page d'accueil.

À l'intérieur, vous trouverez :
- **Concepts & Entités :** Explorations visuelles des séries de Fourier, des transformées de Laplace, des filtres sur un large éventail de signaux et d'équations, et plus encore.
- **SOPs (Procédures Opérationnelles Standards) :** Guides étape par étape sur la manière d'aborder les problèmes d'ingénierie.
- **Logs d'optimisation des tokens :** Historique de l'entretien et de l'optimisation de cette base de connaissances.

**Comment y accéder :**
Tous les articles de la base de connaissances (KBA) et les SOPs sont entièrement intégrés et prêts à être lus. Cliquez simplement sur le lien **📖 Knowledge Base** directement sur le tableau de bord principal de l'application !

---
*Construit avec ❤️ pour la communauté GEII.*
