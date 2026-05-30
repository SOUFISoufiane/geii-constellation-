# GEII Visual Toolbox (geii-constellation)

*[Lire en français](README.fr.md)*

> "Tell me and I forget, teach me and I may remember, involve me and I learn." — Benjamin Franklin

When I started studying Electrical Engineering and Industrial IT (GEII), I wanted to find out how to truly visualize complex concepts. How does one person wrap their head around Fourier transforms, Root Locus, and Kinematics without just staring at static textbook pages? 😪 

[SOUFI Soufiane](https://github.com/SOUFISoufiane) here. Over the past two years, I've navigated through the dense worlds of applied mathematics and physics, bridging the gap between analog and digital systems through filters, control theory, signal processing, and Fourier transforms. Along the way, I realized I learn 10x better by connecting dry theory to visual concepts.

While drawings get filed away and imagination fades in minutes, code lasts forever. I built these interactive tools to visualize complex concepts, capture months of hard work, and close my own memory gaps. Surprisingly, it worked better than I ever expected. I can now recall concepts instantly, plug a theoretical exercise into a visual simulation to validate my reasoning, and never forget it again. 

Recently, I consolidated everything into these production grade, simulation driven modules. They currently cover the core GEII curriculum, but will expand into broader engineering topics as I grow. This is tailored for logical understanding, not rote memorization because the point isn't how many pages you read, it's what you truly understand.

Same student. Different era. The difference is the tooling.

**GEII Visual Toolbox is the solution.** It transforms abstract equations into a frictionless virtual engineering lab. Whether you're a student simulating a circuit, a maker analyzing a signal, or a self-taught developer exploring robotic kinematics, this toolbox adapts to you. It features an oscilloscope that reacts in real-time, a circuit simulator that calculates Thévenin equivalents instantly, digital logic boards that dynamically solve Karnaugh maps, and a 6-axis robotic arm that responds to your coordinate tweaks. 

Six specialized modules (with more on the way), all highly interactive, built with modern web technologies, and 100% open-source.

This is my open source educational factory. I use it every day. I'm sharing it because first, I know the community can build upon this to make it even greater for other students, and second, because it stands as a legacy to my hard work and dedication during my time at the IUT.

Fork it. Improve it. Make it yours 😊

**Who this is for:**
- **Visual Learners & Students** — Especially those who need to *see* it to truly understand it (status : completed basic visualisations, grows as I grow).
- **Hardware Hackers & Makers** — Anyone building DIY electronics who needs to quickly simulate circuits or digital logic (status in continuous improvement...).
- **Self-Taught Builders** — Those looking for practical, interactive ways to grasp complex control systems and kinematics (status in continuous improvement...).
- **Teachers** — Teachers looking for interactive virtual labs to popularize abstract theories for a younger audience (status in continuous improvement...).

## Quick start

1. Install the GEII Visual Toolbox (30 seconds — see below)
2. Open **Signal Observatory** — visualize live audio and Fourier transforms.
3. Open **Automatique (Servo Lab)** — plot Root Locus and Bode diagrams dynamically.
4. Explore the **Knowledge Base** — read the SOPs and study notes.
5. Stop there. You'll know if this is for you.

## Installation Options

**Requirements:** [Git](https://git-scm.com/), [Node.js](https://nodejs.org/)

### 1. The Web Version (No Installation)
The core web app lives in the `Maths` directory. Just open `Maths/index.html` in your favorite web browser! It runs entirely locally.

### 2. Desktop App (Development)
Clone the repo and run the full Electron app locally. Works perfectly on Windows, Mac, Linux, and WSL.
```bash
git clone https://github.com/SOUFISoufiane/geii-constellation-.git
cd geii-constellation-
npm install
npm start
```

### 3. Build Standalone Executables (.exe, .dmg, AppImage)
Want to build the app as a standalone program for your operating system?
```bash
npm install
npm run dist:win    # For Windows
npm run dist:mac    # For macOS
npm run dist:linux  # For Linux
```
Your compiled installer will be available in the `dist/` folder.

### 4. Local Web Server (No Electron)
If you prefer not to use Electron, you can spin up a lightweight local HTTP server that serves the app directly to your default web browser:
```bash
npm run cli
```

## The Constellation (Core Modules)

The GEII Visual Toolbox is a suite of interactive applications. Each module is designed to tackle a specific domain of the GEII curriculum:

| Module | Your Virtual Lab | What it does |
|--------|----------------|--------------|
| 📡 **Signal Observatory** | **DSP Analyzer** | Real-time audio visualization (upload and instantaneous scan), FFT, derivations, and custom equation parsing. See harmonics and signal convolution in action. |
| ⚙️ **Automatique** | **Control Systems** | Servo Lab for control theory. Visualize Root Locus, Bode margins, and system stability dynamically. |
| 🔌 **Circuits** | **Electronics Lab** | Circuit analysis tool featuring RLC circuits, Kirchhoff's laws, and Thévenin equivalent modules. |
| 🔢 **Numérique** | **Digital Lab** | Digital logic playground with interactive Karnaugh maps and VHDL generation. |
| 📐 **Maths** | **Math Visualizer** | Full scope math visualizer featuring ODE solvers, Laplace transforms, and function plotting. |
| 🤖 **Robotique** | **Kinematics Engine**| 6-axis robotic arm visualization. Explore joint/cartesian control, forward/inverse kinematics, and homogeneous transforms. |

## The Knowledge Base

Code and visualizations are only half the battle. The other half is the theory.

This repository includes a central Knowledge Base (KB) for all theoretical concepts seamlessly integrated into the application, you can find it in the homepage.

Inside, you'll find:
- **Concepts & Entities:** Visual-dives into Fourier series, Laplace transforms, filters on a wide range of signals and equations,and more.
- **SOPs (Standard Operating Procedures):** Step-by-step guides on how to approach engineering problems.
- **Token Optimization Logs:** Records of how this knowledge base is maintained and optimized.

**How to access it:**
All KBAs (Knowledge Base Articles) and SOPs are fully integrated and ready to read. Simply click the **📖 Knowledge Base** link directly inside the app's main dashboard!

---
*Built with ❤️ for the GEII community.*
