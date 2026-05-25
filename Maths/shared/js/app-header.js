// ═══════════════════════════════════════════════════════════════════
//  APP HEADER — injected at top of every app page
//
//  Usage in app's index.html:
//    <script type="module">
//      import { mountAppHeader } from '../../shared/js/app-header.js';
//      mountAppHeader('signal-observatory');   // app id from manifest
//    </script>
//
//  Provides:
//   ← TOOLBOX button   → goes back to home
//   App name + tagline → pulled from manifest
//   Theme cycler chip  → 🌌 / 🟧 / ☀
// ═══════════════════════════════════════════════════════════════════

import { APPS, TOOLBOX } from './manifest.js';
import { getTheme, cycleTheme, THEME_META } from './theme-switcher.js';
import { copyShareUrl } from './state-serializer.js';

const HEADER_ID = 'geii-app-header';

/**
 * Mount the shared header at the top of <body>.
 * Safe to call multiple times — replaces an existing header.
 * @param {string} appId  — key into APPS map
 * @param {object} [opts]
 * @param {() => object} [opts.getShareState]  — if provided, a 🔗 button appears
 *        that copies a shareable URL encoding the value this function returns.
 */
export function mountAppHeader(appId, opts = {}) {
    const meta = APPS[appId] || {
        name: appId, tagline: '', icon: '·'
    };
    const { getShareState } = opts;

    // Remove existing
    const existing = document.getElementById(HEADER_ID);
    if (existing) existing.remove();

    const header = document.createElement('header');
    header.id = HEADER_ID;
    header.innerHTML = `
        <a class="gh-back" href="../../index.html" title="Retour à la toolbox">
            <span class="gh-arrow">←</span>
            <span class="gh-back-label">TOOLBOX</span>
        </a>
        <div class="gh-sep"></div>
        <div class="gh-app">
            <span class="gh-icon">${meta.icon}</span>
            <span class="gh-name">${meta.name}</span>
            <span class="gh-tagline">${meta.tagline || ''}</span>
        </div>
        <div class="gh-spacer"></div>
        ${getShareState ? `
            <button class="gh-share" id="gh-share-btn" title="Copier un lien partageable de l'état actuel">
                <span class="gh-share-icon">🔗</span>
                <span class="gh-share-label">Partager</span>
            </button>
        ` : ''}
        <button class="gh-theme" id="gh-theme-btn" title="Changer de thème">
            <span class="gh-theme-icon">${THEME_META[getTheme()].icon}</span>
            <span class="gh-theme-label">${THEME_META[getTheme()].label}</span>
        </button>
    `;
    document.body.insertBefore(header, document.body.firstChild);

    const themeBtn = header.querySelector('#gh-theme-btn');
    themeBtn.addEventListener('click', () => {
        const next = cycleTheme();
        themeBtn.querySelector('.gh-theme-icon').textContent = THEME_META[next].icon;
        themeBtn.querySelector('.gh-theme-label').textContent = THEME_META[next].label;
    });

    if (getShareState) {
        const shareBtn = header.querySelector('#gh-share-btn');
        shareBtn.addEventListener('click', async () => {
            const ok = await copyShareUrl(getShareState());
            flashShareButton(shareBtn, ok);
        });
    }

    document.title = `${meta.name} — ${TOOLBOX.name}`;
}

/**
 * Visual confirmation that the share URL was copied.
 * Briefly swaps the label to "Copié ✓" (or "Erreur ✗"), then restores.
 */
function flashShareButton(btn, ok) {
    const labelEl = btn.querySelector('.gh-share-label');
    const iconEl = btn.querySelector('.gh-share-icon');
    const prevLabel = labelEl.textContent;
    const prevIcon = iconEl.textContent;
    labelEl.textContent = ok ? 'Copié' : 'Erreur';
    iconEl.textContent = ok ? '✓' : '✗';
    btn.classList.add(ok ? 'gh-share-ok' : 'gh-share-err');
    setTimeout(() => {
        labelEl.textContent = prevLabel;
        iconEl.textContent = prevIcon;
        btn.classList.remove('gh-share-ok', 'gh-share-err');
    }, 1400);
}
