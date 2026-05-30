# GEII Visual Toolbox (geii-constellation)

*[Lire en français](README.fr.md)*

> "Tell me and I forget, teach me and I may remember, involve me and I learn." — Benjamin Franklin

When I started studying Electrical Engineering and Industrial IT (GEII), I wanted to find out how to truly visualize complex concepts. How does one person wrap their head around Fourier transforms, Root Locus, and Kinematics without just staring at static textbook pages? 

I'm [SOUFI Soufiane](https://github.com/SOUFISoufiane), and I built this. I've spent countless hours navigating through dense mathematics and physics, and right now I'm learning more effectively than I ever have. In the last few months: 6 production-grade interactive modules, entirely visual, covering the core GEII curriculum. On logical understanding—not rote memorization—my learning pace is **exponentially faster**. Year-to-date, this visual approach has produced **10× the clarity** of traditional studying. The point isn't how many pages you read, it's what you truly understand.

Same student. Different era. The difference is the tooling.

**GEII Visual Toolbox is how I do it.** It turns abstract equations into a virtual engineering lab—an oscilloscope that reacts in real-time, a circuit simulator that instantly shows Thévenin equivalents, a digital logic board that dynamically updates Karnaugh maps, and a robotic arm that moves as you tweak Denavit-Hartenberg parameters. Six specialized modules, all interactive, all built with web technologies, all free, MIT license.

This is my open source educational factory. I use it every day. I'm sharing it because these tools should be available to every engineering student.

Fork it. Improve it. Make it yours.

**Who this is for:**
- **Engineering Students** — especially those who need to *see* math to understand it.
- **Instructors and Educators** — interactive aids for complex topics.
- **Curious Minds** — anyone wanting to understand signal processing, control systems, and electronics.

## Quick start

1. Install the GEII Visual Toolbox (30 seconds — see below)
2. Open **Signal Observatory** — visualize live audio and Fourier transforms.
3. Open **Automatique (Servo Lab)** — plot Root Locus and Bode diagrams dynamically.
4. Explore the **Knowledge Base (My2ndBrain)** — read the SOPs and study notes.
5. Stop there. You'll know if this is for you.

## Install — 30 seconds

**Requirements:** [Git](https://git-scm.com/), [Node.js](https://nodejs.org/)

### Step 1: Clone and Install

```bash
git clone https://github.com/SOUFISoufiane/geii-constellation-.git
cd geii-constellation-
npm install
```

### Step 2: Run the App

Launch the full interactive Electron Desktop application:
```bash
npm start
```

*Prefer the web browser?* Just open `Maths/index.html` in your favorite browser!

## The Constellation (Core Modules)

The GEII Visual Toolbox is a suite of interactive applications. Each module is designed to tackle a specific domain of the GEII curriculum:

| Module | Your Virtual Lab | What it does |
|--------|----------------|--------------|
| 📡 **Signal Observatory** | **DSP Analyzer** | Real-time audio visualization, FFT, derivations, and custom equation parsing. See harmonics and signal convolution in action. |
| ⚙️ **Automatique** | **Control Systems** | Servo Lab for control theory. Visualize Root Locus, Bode margins, and system stability dynamically. |
| 🔌 **Circuits** | **Electronics Lab** | Circuit analysis tool featuring RLC circuits, Kirchhoff's laws, and Thévenin equivalent modules. |
| 🔢 **Numérique** | **Digital Lab** | Digital logic playground with interactive Karnaugh maps and VHDL generation. |
| 📐 **Maths** | **Math Visualizer** | Full scope math visualizer featuring ODE solvers, Laplace transforms, and function plotting. |
| 🤖 **Robotique** | **Kinematics Engine**| 6-axis robotic arm visualization. Explore joint/cartesian control, forward/inverse kinematics, and homogeneous transforms. |

## The Knowledge Base (My2ndBrain)

Code and visualizations are only half the battle. The other half is the theory.

This repository includes a massive, interconnected Obsidian Vault called **My2ndBrain**, which acts as the central Knowledge Base (KB) for all theoretical concepts.

**How to access it:**
1. Download [Obsidian](https://obsidian.md/).
2. Open Obsidian and select **"Open folder as vault"**.
3. Select the `Maths/vault/My2ndBrain` directory in this repository.

Inside, you'll find:
- **Concepts & Entities:** Deep-dives into Fourier series, Laplace transforms, and more.
- **SOPs (Standard Operating Procedures):** Step-by-step guides on how to approach engineering problems.
- **Token Optimization Logs:** Records of how this knowledge base is maintained and optimized.

Or, if you prefer the web, click the **📖 Knowledge Base** link directly inside the app's main dashboard!

---
*Built with ❤️ for the GEII community.*
