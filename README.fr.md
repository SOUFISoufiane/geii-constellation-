# GEII Visual Toolbox (geii-constellation)

*[Read in English](README.md)*

> "Dis-le-moi et je l'oublierai, enseigne-le-moi et je m'en souviendrai peut-être, implique-moi et j'apprendrai." — Benjamin Franklin

Quand j'ai commencé mes études en Génie Électrique et Informatique Industrielle (GEII), je voulais trouver comment véritablement visualiser des concepts complexes. Comment peut-on comprendre les transformées de Fourier, les lieux des racines et la cinématique sans se contenter de fixer les pages statiques d'un manuel ?

Je suis [SOUFI Soufiane](https://github.com/SOUFISoufiane), et c'est moi qui ai construit ça. J'ai passé d'innombrables heures à naviguer à travers des notions denses en mathématiques et en physique, et aujourd'hui j'apprends plus efficacement que jamais. Au cours des derniers mois : 6 modules interactifs de qualité production, entièrement visuels, couvrant le cœur du programme de GEII. Sur le plan de la compréhension logique — et non de l'apprentissage par cœur — mon rythme d'apprentissage est **exponentiellement plus rapide**. Depuis le début de l'année, cette approche visuelle m'a apporté **10× plus de clarté** que l'étude traditionnelle. L'important n'est pas le nombre de pages que vous lisez, c'est ce que vous comprenez vraiment.

Même étudiant. Époque différente. La différence, ce sont les outils.

**GEII Visual Toolbox est ma solution.** Cet outil transforme des équations abstraites en un laboratoire d'ingénierie virtuel — un oscilloscope qui réagit en temps réel, un simulateur de circuits qui affiche instantanément les équivalents de Thévenin, une carte logique numérique qui met à jour dynamiquement les tableaux de Karnaugh, et un bras robotique qui bouge lorsque vous modifiez les paramètres de Denavit-Hartenberg. Six modules spécialisés, tous interactifs, tous conçus avec des technologies web, tous gratuits, sous licence MIT.

Ceci est mon usine éducative open source. Je l'utilise tous les jours. Je la partage car ces outils devraient être à la disposition de chaque étudiant en ingénierie.

Forkez-le. Améliorez-le. Appropriez-le-vous.

**À qui cela s'adresse-t-il :**
- **Étudiants en ingénierie** — particulièrement ceux qui ont besoin de *voir* les mathématiques pour les comprendre.
- **Professeurs et éducateurs** — supports interactifs pour des sujets complexes.
- **Esprits curieux** — quiconque souhaite comprendre le traitement du signal, l'automatique et l'électronique.

## Démarrage rapide

1. Installez le GEII Visual Toolbox (30 secondes — voir ci-dessous)
2. Ouvrez **Signal Observatory** — visualisez l'audio en direct et les transformées de Fourier.
3. Ouvrez **Automatique (Servo Lab)** — tracez dynamiquement les lieux des racines et les diagrammes de Bode.
4. Explorez la **Base de connaissances (My2ndBrain)** — lisez les procédures (SOPs) et les notes de cours.
5. Arrêtez-vous là. Vous saurez si cet outil est fait pour vous.

## Installation — 30 secondes

**Prérequis :** [Git](https://git-scm.com/), [Node.js](https://nodejs.org/)

### Étape 1 : Cloner et installer

```bash
git clone https://github.com/SOUFISoufiane/geii-constellation-.git
cd geii-constellation-
npm install
```

### Étape 2 : Lancer l'application

Lancez l'application de bureau interactive complète (Electron) :
```bash
npm start
```

*Vous préférez le navigateur web ?* Ouvrez simplement `Maths/index.html` dans votre navigateur favori !

## La Constellation (Modules Principaux)

Le GEII Visual Toolbox est une suite d'applications interactives. Chaque module est conçu pour aborder un domaine spécifique du programme GEII :

| Module | Votre Labo Virtuel | Ce qu'il fait |
|--------|------------------|---------------|
| 📡 **Signal Observatory** | **Analyseur DSP** | Visualisation audio en temps réel, FFT, dérivations et analyse d'équations personnalisées. Observez les harmoniques et la convolution des signaux en action. |
| ⚙️ **Automatique** | **Systèmes de contrôle** | Laboratoire d'asservissement pour la théorie du contrôle. Visualisez dynamiquement les lieux des racines, les marges de Bode et la stabilité du système. |
| 🔌 **Circuits** | **Labo d'électronique** | Outil d'analyse de circuits comprenant des circuits RLC, les lois de Kirchhoff et des modules pour les équivalents de Thévenin. |
| 🔢 **Numérique** | **Labo numérique** | Terrain de jeu de la logique numérique avec des tableaux de Karnaugh interactifs et de la génération VHDL. |
| 📐 **Maths** | **Visualiseur mathématique** | Outil complet de visualisation mathématique avec résolveur d'équations différentielles, transformées de Laplace et tracé de fonctions. |
| 🤖 **Robotique** | **Moteur cinématique**| Visualisation d'un bras robotique à 6 axes. Explorez le contrôle articulaire/cartésien, la cinématique directe/inverse et les matrices de transformation homogènes. |

## La base de connaissances (My2ndBrain)

Le code et les visualisations ne représentent que la moitié du travail. L'autre moitié, c'est la théorie.

Ce dépôt inclut un vaste coffre-fort Obsidian (Vault) interconnecté appelé **My2ndBrain**, qui sert de base de connaissances centrale (KB) pour tous les concepts théoriques.

**Comment y accéder :**
1. Téléchargez [Obsidian](https://obsidian.md/).
2. Ouvrez Obsidian et sélectionnez **"Open folder as vault"** (Ouvrir un dossier en tant que coffre).
3. Sélectionnez le répertoire `Maths/vault/My2ndBrain` dans ce dépôt.

À l'intérieur, vous trouverez :
- **Concepts & Entités :** Explorations approfondies des séries de Fourier, des transformées de Laplace, etc.
- **SOPs (Procédures Opérationnelles Standards) :** Guides étape par étape sur la manière d'aborder les problèmes d'ingénierie.
- **Logs d'optimisation des tokens :** Historique de l'entretien et de l'optimisation de cette base de connaissances.

Ou, si vous préférez le web, cliquez sur le lien **📖 Knowledge Base** directement sur le tableau de bord principal de l'application !

---
*Construit avec ❤️ pour la communauté GEII.*
