// ═══════════════════════════════════════════════════════════════════
//  GLOSSARY — Self-contained mathematical reference panel
//
//  Tier 1, Phase 5 (D) of [[concepts/tier1-implementation-plan]].
//  Loads `shared/data/glossary.json` lazily on first open. Renders
//  searchable categorized entries with KaTeX. Clicking an entry with
//  an `insert` payload appends it to the active equation input (if any).
// ═══════════════════════════════════════════════════════════════════

const STORAGE_OPEN = 'geii-toolbox-glossary-open';

const CATEGORY_LABELS = {
    symboles:    '✦ Symboles',
    fonctions:   'ƒ Fonctions',
    operateurs:  '⊕ Opérateurs',
    concepts:    '💡 Concepts',
    conventions: '∫ Conventions'
};

let glossaryData = null;        // loaded JSON
let openState = (() => { try { return localStorage.getItem(STORAGE_OPEN) === '1'; } catch { return false; } })();
let searchFilter = '';
let wired = false;

async function loadGlossary() {
    if (glossaryData) return glossaryData;
    try {
        // Path resolved relative to the document (so it works from any app)
        const resp = await fetch('/shared/data/glossary.json?v=' + Date.now());
        glossaryData = await resp.json();
    } catch (e) {
        console.error('[glossary] load failed:', e);
        glossaryData = { entries: [] };
    }
    return glossaryData;
}

/**
 * Mount the glossary into a host element (e.g. a div in the formula sidebar).
 * Called once at app boot. Auto-loads + renders on toggle.
 */
export function mountGlossary(hostElement, opts = {}) {
    if (!hostElement) return;
    const targetInputSelector = opts.targetInputSelector || '#eq-input-time, #eq-input-freq';

    hostElement.innerHTML = `
        <div class="formula-label glossary-toggle" id="glossary-toggle" style="cursor:pointer; user-select:none;">
            <span id="glossary-arrow">▸</span> GLOSSAIRE — référence intégrée
        </div>
        <div id="glossary-body" style="display:none; margin-top:8px;">
            <input id="glossary-search" type="text" placeholder="🔍 Rechercher un symbole, une fonction…"
                   style="width:100%; padding:5px 8px; background:rgba(0,0,0,0.3); border:1px solid var(--rim); border-radius:3px; color:var(--text-bright); font-family:inherit; font-size:0.7rem; margin-bottom:8px;">
            <div id="glossary-list"></div>
        </div>
    `;

    const toggle = hostElement.querySelector('#glossary-toggle');
    const body = hostElement.querySelector('#glossary-body');
    const arrow = hostElement.querySelector('#glossary-arrow');
    const search = hostElement.querySelector('#glossary-search');
    const list = hostElement.querySelector('#glossary-list');

    const applyOpenState = () => {
        body.style.display = openState ? 'block' : 'none';
        arrow.textContent = openState ? '▾' : '▸';
    };
    applyOpenState();

    if (!wired) {
        wired = true;
        toggle.addEventListener('click', async () => {
            openState = !openState;
            try { localStorage.setItem(STORAGE_OPEN, openState ? '1' : '0'); } catch {}
            applyOpenState();
            if (openState && !glossaryData) {
                await loadGlossary();
                renderList(list, searchFilter, targetInputSelector);
            } else if (openState) {
                renderList(list, searchFilter, targetInputSelector);
            }
        });

        search.addEventListener('input', (e) => {
            searchFilter = e.target.value.toLowerCase().trim();
            renderList(list, searchFilter, targetInputSelector);
        });
    }

    // If we boot already open, populate now
    if (openState) {
        loadGlossary().then(() => renderList(list, searchFilter, targetInputSelector));
    }
}

function renderList(listEl, filter, targetInputSelector) {
    if (!glossaryData) return;

    const entries = glossaryData.entries.filter(e => {
        if (!filter) return true;
        const hay = `${e.label} ${e.id} ${e.desc}`.toLowerCase();
        return hay.includes(filter);
    });

    // Group by category
    const byCat = {};
    for (const e of entries) {
        (byCat[e.cat] = byCat[e.cat] || []).push(e);
    }

    const html = Object.entries(byCat).map(([cat, items]) => `
        <div class="glossary-cat" style="margin-bottom: 10px;">
            <div style="color: var(--accent-cyan); font-family:'Space Mono',monospace; font-size: 0.62rem; font-weight: 700; margin-bottom: 4px; letter-spacing: 0.08em;">
                ${CATEGORY_LABELS[cat] || cat.toUpperCase()}
            </div>
            ${items.map(e => `
                <div class="glossary-entry" data-id="${e.id}" data-insert="${escapeAttr(e.insert || '')}"
                     style="display:flex; gap:8px; padding:5px 6px; margin:2px 0; border-left:2px solid var(--rim); cursor: ${e.insert ? 'pointer' : 'default'}; border-radius:2px; transition: background 100ms, border-color 100ms;"
                     onmouseover="this.style.background='rgba(0,245,212,0.05)'; this.style.borderLeftColor='var(--accent-cyan)';"
                     onmouseout="this.style.background=''; this.style.borderLeftColor='var(--rim)';"
                     title="${escapeAttr(e.insert ? `Cliquer pour insérer « ${e.insert} » dans l'éditeur d'équation` : e.desc)}">
                    <span style="min-width: 60px; color: var(--accent-gold); font-family:'Space Mono',monospace; font-size:0.72rem;">$${e.latex || e.label}$</span>
                    <span style="flex:1; color: var(--text-dim); font-size: 0.62rem; line-height: 1.4;">${escapeHtml(e.desc)}</span>
                </div>
            `).join('')}
        </div>
    `).join('') || `<div style="color:var(--text-dim); font-style:italic; font-size:0.65rem;">Aucun résultat pour « ${escapeHtml(filter)} »</div>`;

    listEl.innerHTML = html;

    // KaTeX render the LaTeX labels
    if (window.renderMathInElement) {
        window.renderMathInElement(listEl, {
            delimiters: [{ left: '$', right: '$', display: false }],
            throwOnError: false
        });
    }

    // Click-to-insert wiring
    listEl.querySelectorAll('.glossary-entry').forEach(el => {
        el.addEventListener('click', () => {
            const insert = el.dataset.insert;
            if (!insert) return;
            insertIntoActiveInput(targetInputSelector, insert);
            flashEntry(el);
        });
    });
}

function insertIntoActiveInput(selector, text) {
    const inputs = document.querySelectorAll(selector);
    // Prefer the one currently focused; else the first visible one
    const target = [...inputs].find(i => i === document.activeElement)
                || [...inputs].find(i => i.offsetParent !== null)
                || inputs[0];
    if (!target) return;
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.value = target.value.slice(0, start) + text + target.value.slice(end);
    target.focus();
    const cursor = start + text.length;
    target.setSelectionRange(cursor, cursor);
    // Fire input event so the equation panel re-parses
    target.dispatchEvent(new Event('input', { bubbles: true }));
}

function flashEntry(el) {
    const prevBg = el.style.background;
    el.style.background = 'rgba(74,222,128,0.18)';
    setTimeout(() => { el.style.background = prevBg; }, 400);
}

function escapeHtml(s) {
    return String(s ?? '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function escapeAttr(s) {
    return escapeHtml(s);
}
