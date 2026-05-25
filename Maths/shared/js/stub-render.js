// ═══════════════════════════════════════════════════════════════════
//  STUB RENDER — turns a stub app page into a "Coming soon" card
//  driven by the manifest entry. Read README.md from the app folder
//  if available (best effort) and surface "planned features".
// ═══════════════════════════════════════════════════════════════════

import { APPS, TOOLBOX } from './manifest.js';

/**
 * Render a stub card. Pass the app id; the rest is hydrated from manifest.
 * Optionally pass an array of `plannedFeatures` to show under a heading.
 */
export function renderStub(appId, plannedFeatures = []) {
    const app = APPS[appId];
    if (!app) {
        document.body.innerHTML += `<div class="stub-page"><div class="stub-card">
            <h1>App inconnue</h1>
            <p>L'app "${appId}" n'est pas dans le manifeste.</p>
        </div></div>`;
        return;
    }

    const matieresHTML = app.matieres
        .map(m => `<span class="stub-matiere">${esc(m)}</span>`)
        .join('');

    const featuresHTML = plannedFeatures.length
        ? `<h2>Fonctionnalités prévues</h2><ul>${
            plannedFeatures.map(f => `<li>${esc(f)}</li>`).join('')
          }</ul>`
        : '';

    const wrapper = document.createElement('div');
    wrapper.className = 'stub-page';
    wrapper.innerHTML = `
        <article class="stub-card">
            <div class="stub-icon">${app.icon}</div>
            <h1>${esc(app.name)}</h1>
            <div class="stub-tagline">${esc(app.tagline)}</div>
            <span class="stub-status">🚧 ${app.status === 'stub' ? 'En construction' : app.status}</span>
            <p class="stub-desc">${esc(app.description)}</p>
            ${featuresHTML}
            <h2>Matières concernées</h2>
            <div class="stub-matieres">${matieresHTML}</div>
            <a class="stub-cta" href="../../index.html">← Retour à la ${TOOLBOX.name}</a>
        </article>
    `;
    document.body.appendChild(wrapper);
}

function esc(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
