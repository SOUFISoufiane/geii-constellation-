# GEII Visual Toolbox (geii-constellation)

*[Lire en français](README.fr.md)*

> "Tell me and I forget, teach me and I may remember, involve me and I learn." — Benjamin Franklin

When I started studying Electrical Engineering and Industrial IT (GEII), I wanted to find out how to truly visualize complex concepts. How does one person wrap their head around Fourier transforms, Root Locus, and Kinematics without just staring at static textbook pages? 

[SOUFI Soufiane](https://github.com/SOUFISoufiane) Here. I've spent 2 full-time years navigating through dense applied mathematics and physics, going from the analogical world to the digital world, passing through filters, control systems, signal processing, to Fourier and Z transforms. Through the years, I have discovered that I learn 10x better by linking the theoretical dry world with the visual world by using drawings, schématisation, and even my own Imagination, but drawings and schemas are put in a folder and forgotten, Imagination lasts for minutes, but I know that code lasts forever. So I decided to create an interactive tools to help myself visualizing and understanding the concepts and also memorise my months of hard work and studying with easy access to close the memory gap, and surprisingly, I'm learning more effectively than I ever have, I can recall things much faster, apply a TD exercice (theoretical) into a visual simulation and validate my reasoning, then never forget it again. In the last few months I have gathered all of that, and built a production-grade interactive modules, entirely visual, running on simulations, covering the core GEII curriculum, but it will grow into engineering as I grow. Tailored on logical understanding not rote memorization as the point isn't how many pages you read, it's what you truly understand.

Same student. Different era. The difference is the tooling.

**GEII Visual Toolbox was my solution.** It turns abstract equations into a virtual engineering lab—an oscilloscope that reacts in real-time, a circuit simulator that instantly shows Thévenin equivalents, a digital logic board that dynamically updates Karnaugh maps, and a robotic arm that moves as you tweak coordinates and parameters. Six specialized modules (more incoming000), all interactive, all built with web technologies, all free, MIT license.

This is my open source educational factory. I use it every day. I'm sharing it because first I know so many amazing people can add on to this project and make it even greater and that could help out even another student, and second this could be a good legacy and a good memory of my hard work and dedication during my years in IUT.

Fork it. Improve it. Make it yours 😊

**Who this is for:**
- **Students** — especially those who need to *see* it to understand it.
- **Curious Minds** — anyone wanting to understand signal processing, control systems, and electronics.

## Quick start

1. Install the GEII Visual Toolbox (30 seconds — see below)
2. Open **Signal Observatory** — visualize live audio and Fourier transforms.
3. Open **Automatique (Servo Lab)** — plot Root Locus and Bode diagrams dynamically.
4. Explore the **Knowledge Base (My2ndBrain)** — read the SOPs and study notes.
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

### 4. CLI Tool
Run the application interface directly from your command line:
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

This repository includes a central Knowledge Base (KB) for all theoretical concepts seamlessly integrated into the application.

Inside, you'll find:
- **Concepts & Entities:** Deep-dives into Fourier series, Laplace transforms, and more.
- **SOPs (Standard Operating Procedures):** Step-by-step guides on how to approach engineering problems.
- **Token Optimization Logs:** Records of how this knowledge base is maintained and optimized.

**How to access it:**
All KBAs (Knowledge Base Articles) and SOPs are fully integrated and ready to read. Simply click the **📖 Knowledge Base** link directly inside the app's main dashboard!

---
*Built with ❤️ for the GEII community.*
