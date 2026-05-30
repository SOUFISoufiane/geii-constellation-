// ═══════════════════════════════════════════════════════════════════
//  SIDEBAR — Collapsible tree (GEII + Extras)
// ═══════════════════════════════════════════════════════════════════

import { TREE } from '../math/signals.js';
import { showDerivation, hideDerivation } from './tooltips.js';
import { showEquationPanel, hideEquationPanel } from './equation-panel.js';

let collapseState = {
    GEII: false,    // Open by default
    EXTRAS: true,   // Closed by default
    CUSTOM: true,   // Closed by default (compact)
    // Per-category state (default open)
    cat: {}
};

export function initSidebar(state, onSelect) {
    const container = document.getElementById('tabs-container');
    container.innerHTML = '';

    // Render all roots in display order
    ['GEII', 'EXTRAS', 'CUSTOM'].forEach(rootKey => {
        const root = TREE[rootKey];
        if (!root) return;
        const rootDiv = document.createElement('div');
        rootDiv.className = 'tree-root' + (collapseState[rootKey] ? ' collapsed' : '');
        rootDiv.dataset.root = rootKey;

        const rootClassMap = { GEII: 'root-geii', EXTRAS: 'root-extras', CUSTOM: 'root-custom' };
        const header = document.createElement('div');
        header.className = 'tree-root-header ' + (rootClassMap[rootKey] || 'root-extras');
        header.innerHTML = `
            <span class="tree-caret">▼</span>
            <span>${root.label}</span>
        `;
        header.addEventListener('click', () => {
            collapseState[rootKey] = !collapseState[rootKey];
            rootDiv.classList.toggle('collapsed', collapseState[rootKey]);
        });
        rootDiv.appendChild(header);

        const body = document.createElement('div');
        body.className = 'tree-root-body';

        // Group signals by category
        const byCat = {};
        root.signals.forEach(sig => {
            if (!byCat[sig.category]) byCat[sig.category] = [];
            byCat[sig.category].push(sig);
        });

        // Render each category
        root.categories.forEach(cat => {
            const signals = byCat[cat] || [];
            if (signals.length === 0) return;

            const catKey = `${rootKey}_${cat}`;
            if (collapseState.cat[catKey] === undefined) {
                collapseState.cat[catKey] = false; // Open by default
            }

            const catDiv = document.createElement('div');
            catDiv.className = 'tree-category' + (collapseState.cat[catKey] ? ' collapsed' : '');

            const catHeader = document.createElement('div');
            catHeader.className = 'tree-category-header';
            catHeader.innerHTML = `<span class="tree-caret">▼</span><span>${cat}</span>`;
            catHeader.addEventListener('click', () => {
                collapseState.cat[catKey] = !collapseState.cat[catKey];
                catDiv.classList.toggle('collapsed', collapseState.cat[catKey]);
            });
            catDiv.appendChild(catHeader);

            const catBody = document.createElement('div');
            catBody.className = 'tree-category-body';

            signals.forEach(sig => {
                const tab = document.createElement('div');
                tab.className = 'tab-item' + (sig.id === state.funcId ? ' active' : '');
                tab.dataset.id = sig.id;
                tab.dataset.domain = sig.domain || 'geii';
                tab.innerHTML = `
                    <div class="tab-name">
                        ${sig.name}
                        <span class="help-icon" data-signal="${sig.id}">?</span>
                    </div>
                    <div class="tab-desc">${sig.desc}</div>
                `;
                tab.addEventListener('click', (e) => {
                    if (e.target.classList.contains('help-icon')) return;
                    onSelect(sig.id);
                });

                // Help icon → show derivation
                const helpIcon = tab.querySelector('.help-icon');
                helpIcon.addEventListener('mouseenter', e => showDerivation(sig.id, e.currentTarget));
                helpIcon.addEventListener('mouseleave', () => hideDerivation());

                // Tab hover (on name) → tooltip after delay
                let hoverTimer = null;
                tab.querySelector('.tab-name').addEventListener('mouseenter', e => {
                    hoverTimer = setTimeout(() => showDerivation(sig.id, e.currentTarget), 600);
                });
                tab.querySelector('.tab-name').addEventListener('mouseleave', () => {
                    clearTimeout(hoverTimer);
                    hideDerivation();
                });

                catBody.appendChild(tab);
            });

            catDiv.appendChild(catBody);
            body.appendChild(catDiv);
        });

        rootDiv.appendChild(body);
        container.appendChild(rootDiv);
    });
}

/** Update active highlight only (cheap re-render) */
export function setActiveTab(id) {
    document.querySelectorAll('.tab-item').forEach(el => {
        el.classList.toggle('active', el.dataset.id === id);
    });
    // Custom signal: pop the equation panel into view; other signals: hide it.
    if (id === 'custom') {
        showEquationPanel();
    } else {
        hideEquationPanel();
    }
}
