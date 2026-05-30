// ═══════════════════════════════════════════════════════════════════
//  TOOLTIPS — Derivation popover (KaTeX)
// ═══════════════════════════════════════════════════════════════════

import { findDerivation } from '../derivations/derivations.js';
import { findSignal }     from '../math/signals.js';

let popover = null;
let currentId = null;
let hideTimer = null;

function ensurePopover() {
    if (popover) return popover;
    popover = document.createElement('div');
    popover.id = 'derivation-popover';
    document.body.appendChild(popover);
    return popover;
}

export function showDerivation(signalId, anchorEl) {
    clearTimeout(hideTimer);
    const deriv = findDerivation(signalId);
    const signal = findSignal(signalId);
    if (!deriv || !signal) return;

    if (currentId === signalId && popover && popover.classList.contains('visible')) return;
    currentId = signalId;

    const pop = ensurePopover();

    // Build HTML
    let html = `<div class="popover-title">${deriv.title}</div>`;
    html += `<div class="popover-steps">`;
    deriv.steps.forEach(step => {
        html += `
            <div class="popover-step">
                <div class="popover-step-formula">$${step.latex}$</div>
                <div class="popover-step-note">${step.note}</div>
            </div>
        `;
    });
    html += `</div>`;

    if (deriv.intuition) {
        html += `
            <div class="popover-section">
                <div class="popover-section-label">▸ Intuition</div>
                <div class="popover-intuition">${deriv.intuition}</div>
            </div>
        `;
    }
    if (deriv.geiiContext) {
        html += `
            <div class="popover-section">
                <div class="popover-section-label">▸ Contexte GEII / Application</div>
                <div class="popover-geii">${deriv.geiiContext}</div>
            </div>
        `;
    }
    pop.innerHTML = html;

    // Render KaTeX
    if (window.renderMathInElement) {
        window.renderMathInElement(pop, {
            delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$',  right: '$',  display: false }
            ],
            throwOnError: false
        });
    }

    // Position popover near anchor
    const rect = anchorEl.getBoundingClientRect();
    pop.style.visibility = 'hidden';
    pop.classList.add('visible');
    const popRect = pop.getBoundingClientRect();

    let left = rect.right + 12;
    if (left + popRect.width > window.innerWidth - 10) {
        left = rect.left - popRect.width - 12;
    }
    if (left < 10) left = 10;

    let top = rect.top;
    if (top + popRect.height > window.innerHeight - 10) {
        top = window.innerHeight - popRect.height - 10;
    }
    if (top < 10) top = 10;

    pop.style.left = `${left}px`;
    pop.style.top = `${top}px`;
    pop.style.visibility = 'visible';
}

export function hideDerivation() {
    clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        if (popover) popover.classList.remove('visible');
        currentId = null;
    }, 100);
}

// Allow hover into popover to keep it open (for future scrolling support)
document.addEventListener('mousemove', (e) => {
    if (!popover) return;
    const rect = popover.getBoundingClientRect();
    if (e.clientX >= rect.left && e.clientX <= rect.right &&
        e.clientY >= rect.top  && e.clientY <= rect.bottom) {
        clearTimeout(hideTimer);
    }
});

export function initTooltips() {
    // Initialization is handled by top-level event listeners above.
    // Export provided to satisfy main.js boot sequence.
}
