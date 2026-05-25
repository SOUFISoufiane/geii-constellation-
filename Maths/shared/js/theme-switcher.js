// ═══════════════════════════════════════════════════════════════════
//  THEME SWITCHER — shared across the entire toolbox
//
//  Themes are class names on <body>:
//    (none)            → cosmic (default)
//    theme-amber       → amber CRT
//    theme-solarized   → solarized
//
//  Persistence: localStorage key `geii-toolbox-theme`
//  Auto-applied on import (idempotent).
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'geii-toolbox-theme';
const THEMES = ['cosmic', 'amber', 'solarized'];

function classFor(theme) {
    return theme === 'cosmic' ? '' : `theme-${theme}`;
}

export function getTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.includes(stored) ? stored : 'cosmic';
}

export function setTheme(theme) {
    if (!THEMES.includes(theme)) theme = 'cosmic';
    THEMES.forEach(t => {
        const cls = classFor(t);
        if (cls) document.body.classList.remove(cls);
    });
    const cls = classFor(theme);
    if (cls) document.body.classList.add(cls);
    localStorage.setItem(STORAGE_KEY, theme);
    document.dispatchEvent(new CustomEvent('geii-theme-change', { detail: { theme } }));
}

export function cycleTheme() {
    const current = getTheme();
    const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
    setTheme(next);
    return next;
}

export const THEME_META = {
    cosmic:    { label: 'Cosmic',    icon: '🌌', desc: 'Deep space / nebula' },
    amber:     { label: 'Amber CRT', icon: '🟧', desc: 'Retro terminal'      },
    solarized: { label: 'Solarized', icon: '☀',  desc: 'Scientific contrast' }
};

// Auto-apply persisted theme on import — runs once per page.
if (typeof document !== 'undefined') {
    const apply = () => setTheme(getTheme());
    if (document.body) apply();
    else document.addEventListener('DOMContentLoaded', apply, { once: true });
}
