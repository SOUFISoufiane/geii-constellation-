// ═══════════════════════════════════════════════════════════════════
//  SIDEBAR COLLAPSE — Toggle button + keyboard shortcut + persist
// ═══════════════════════════════════════════════════════════════════

const STORAGE_KEY = 'signal-obs-sidebar-collapsed';

let attached = false;

export function initSidebarToggle() {
    if (attached) return;       // Prevent double-attach
    const sidebar = document.getElementById('sidebar');
    const btn = document.getElementById('sidebar-collapse-btn');
    if (!sidebar || !btn) return;
    attached = true;

    // Restore state
    try {
        if (localStorage.getItem(STORAGE_KEY) === '1') {
            sidebar.classList.add('collapsed');
        }
    } catch (e) {}

    function toggle(e) {
        if (e) e.stopPropagation();
        const isNowCollapsed = sidebar.classList.toggle('collapsed');
        try {
            localStorage.setItem(STORAGE_KEY, isNowCollapsed ? '1' : '0');
        } catch (e) {}
        // Trigger plot resize after CSS transition
        setTimeout(() => window.dispatchEvent(new Event('resize')), 320);
    }

    btn.addEventListener('click', toggle);

    // Keyboard shortcut Ctrl+B
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
            const t = e.target;
            if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT')) return;
            e.preventDefault();
            toggle();
        }
    });
}
