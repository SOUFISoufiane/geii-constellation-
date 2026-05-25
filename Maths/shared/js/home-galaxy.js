// ═══════════════════════════════════════════════════════════════════
//  HOME GALAXY — renders the cosmic landing page
//
//  Reads CONCEPTS + APPS from manifest.js and projects them into the
//  .galaxy container as a constellation of clickable stars.
//
//  Features:
//   • Hover star → popover with description + matières
//   • Click star → navigate to app
//   • Search bar → fuzzy filter on name / tagline / matières
//   • Matière chips → multi-select filter (OR across selected)
//   • "Show stubs" toggle → hide WIP apps
// ═══════════════════════════════════════════════════════════════════

import { CONCEPTS, APPS, TOOLBOX, allMatieres, appsForConcept } from './manifest.js';
import { getTheme, cycleTheme, THEME_META } from './theme-switcher.js';

const state = {
    search: '',
    matieres: new Set(),    // empty = no filter
    showStubs: true
};

export function mountHomeGalaxy(root = document.body) {
    document.title = TOOLBOX.name;
    document.body.classList.add('toolbox-home');

    root.innerHTML = `
        <div class="hud-scanlines"></div>
        <div class="vignette"></div>

        <header class="home-header">
            <div class="home-logo">
                <div class="title">${TOOLBOX.name}</div>
                <div class="sub">${TOOLBOX.tagline}</div>
            </div>
            <div class="home-controls">
                <input class="home-search" id="home-search" type="search"
                       placeholder="Rechercher une app, une matière…">
                <button class="home-toggle active" id="home-toggle-stubs"
                        title="Afficher / masquer les apps en construction">
                    <span>🚧</span><span>Stubs</span>
                </button>
                <button class="home-theme-btn" id="home-theme-btn"
                        title="Changer de thème">
                    <span id="home-theme-icon">${THEME_META[getTheme()].icon}</span>
                    <span id="home-theme-label">${THEME_META[getTheme()].label}</span>
                </button>
            </div>
        </header>

        <section class="home-hero">
            <h1>Constellation pédagogique</h1>
            <p>Explore les concepts transverses du BUT GEII en un coup d'œil.</p>
            <div class="counters">
                <div class="counter">
                    <span class="num" id="counter-apps">${Object.keys(APPS).length}</span>
                    <span class="lbl">apps</span>
                </div>
                <div class="counter">
                    <span class="num" id="counter-concepts">${CONCEPTS.length}</span>
                    <span class="lbl">concepts</span>
                </div>
                <div class="counter">
                    <span class="num" id="counter-stable">${Object.values(APPS).filter(a => a.status === 'stable').length}</span>
                    <span class="lbl">stables</span>
                </div>
            </div>
        </section>

        <nav class="matiere-filters" id="matiere-filters"></nav>

        <main class="galaxy" id="galaxy"></main>

        <div class="star-popover" id="star-popover" role="tooltip"></div>

        <footer class="home-footer">
            ${TOOLBOX.name} <span class="accent">${TOOLBOX.version}</span> ·
            BUT GEII · ${new Date().getFullYear()}
        </footer>
    `;

    renderMatiereChips();
    renderGalaxy();
    wireEvents();
}

function renderMatiereChips() {
    const container = document.getElementById('matiere-filters');
    container.innerHTML = allMatieres()
        .map(m => `<button class="matiere-chip" data-matiere="${escAttr(m)}">${esc(m)}</button>`)
        .join('');
}

function renderGalaxy() {
    const galaxy = document.getElementById('galaxy');
    galaxy.innerHTML = CONCEPTS.map(c => {
        const apps = appsForConcept(c.id);
        const starsHTML = apps.map(app => starHTML(app, c.color)).join('');
        const x = (c.position.x * 100).toFixed(1);
        const y = (c.position.y * 100).toFixed(1);
        return `
            <div class="constellation" data-concept="${c.id}"
                 style="left:${x}%; top:${y}%; --constellation-color:${c.color};">
                <div class="constellation-name" title="${esc(c.description)}">
                    ${c.icon}  ${esc(c.name)}
                </div>
                <div class="constellation-stars">${starsHTML}</div>
            </div>
        `;
    }).join('');

    applyFilters();
}

function starHTML(app, glow) {
    const matieresAttr = encodeURIComponent(JSON.stringify(app.matieres));
    return `
        <a class="star status-${app.status}"
           href="${esc(app.path)}"
           data-app-id="${esc(app.id)}"
           data-name="${escAttr(app.name)}"
           data-tagline="${escAttr(app.tagline)}"
           data-matieres="${matieresAttr}"
           style="--star-glow:${glow};">
            <span class="star-icon">${app.icon}</span>
            <span class="star-name">${esc(app.name)}</span>
            <span class="star-status">${app.status}</span>
        </a>
    `;
}

function wireEvents() {
    // Search
    const search = document.getElementById('home-search');
    search.addEventListener('input', e => {
        state.search = e.target.value.trim().toLowerCase();
        applyFilters();
    });

    // Matière chips (multi-select)
    document.getElementById('matiere-filters').addEventListener('click', e => {
        const chip = e.target.closest('.matiere-chip');
        if (!chip) return;
        const m = chip.dataset.matiere;
        if (state.matieres.has(m)) state.matieres.delete(m);
        else state.matieres.add(m);
        chip.classList.toggle('active');
        applyFilters();
    });

    // Show stubs toggle
    const stubBtn = document.getElementById('home-toggle-stubs');
    stubBtn.addEventListener('click', () => {
        state.showStubs = !state.showStubs;
        stubBtn.classList.toggle('active', state.showStubs);
        applyFilters();
    });

    // Theme cycle
    document.getElementById('home-theme-btn').addEventListener('click', () => {
        const next = cycleTheme();
        document.getElementById('home-theme-icon').textContent = THEME_META[next].icon;
        document.getElementById('home-theme-label').textContent = THEME_META[next].label;
    });

    // Hotkey: '/' to focus search
    window.addEventListener('keydown', e => {
        if (e.key === '/' && document.activeElement !== search) {
            e.preventDefault();
            search.focus();
        }
    });

    // Star hover → popover
    const popover = document.getElementById('star-popover');
    document.getElementById('galaxy').addEventListener('mouseover', e => {
        const star = e.target.closest('.star');
        if (!star) return;
        const appId = star.dataset.appId;
        const app = APPS[appId];
        if (!app) return;

        const matieres = (app.matieres || []).map(m =>
            `<span class="pop-matiere">${esc(m)}</span>`).join('');
        popover.innerHTML = `
            <h3>${app.icon}  ${esc(app.name)}</h3>
            <div class="pop-tagline">${esc(app.tagline)}</div>
            <div class="pop-desc">${esc(app.description)}</div>
            <div class="pop-matieres">${matieres}</div>
        `;

        const r = star.getBoundingClientRect();
        // Position popover above the star, clamped to viewport
        const w = 280, h = popover.offsetHeight || 160;
        let x = r.left + r.width / 2 - w / 2;
        let y = r.top - h - 12;
        x = Math.max(8, Math.min(window.innerWidth - w - 8, x));
        if (y < 8) y = r.bottom + 12;
        popover.style.left = `${x}px`;
        popover.style.top  = `${y}px`;
        popover.classList.add('visible');
    });
    document.getElementById('galaxy').addEventListener('mouseout', e => {
        if (!e.target.closest('.star')) return;
        popover.classList.remove('visible');
    });
}

function applyFilters() {
    document.querySelectorAll('.star').forEach(star => {
        const name = star.dataset.name.toLowerCase();
        const tagline = star.dataset.tagline.toLowerCase();
        const matieres = JSON.parse(decodeURIComponent(star.dataset.matieres));
        const status = [...star.classList].find(c => c.startsWith('status-'))?.replace('status-', '');

        let visible = true;

        if (state.search) {
            const q = state.search;
            visible = visible && (
                name.includes(q) ||
                tagline.includes(q) ||
                matieres.some(m => m.toLowerCase().includes(q))
            );
        }

        if (state.matieres.size > 0) {
            visible = visible && matieres.some(m => state.matieres.has(m));
        }

        if (!state.showStubs && status === 'stub') {
            visible = false;
        }

        star.classList.toggle('hidden', !visible);
    });
}

// ─── HTML escape helpers ─────────────────────────────────────────────
function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
function escAttr(s) {
    return esc(s).replace(/"/g, '&quot;');
}
