export function initNotebook() {
    const toggleBtn = document.getElementById('notebook-toggle');
    const arrow = document.getElementById('notebook-arrow');
    const container = document.getElementById('notebook-container');
    const saveBtn = document.getElementById('notebook-save');
    const noteInput = document.getElementById('notebook-note');
    const list = document.getElementById('notebook-list');

    if (!toggleBtn || !container) return;

    let isOpen = false;
    toggleBtn.addEventListener('click', () => {
        isOpen = !isOpen;
        arrow.textContent = isOpen ? '▾' : '▸';
        container.style.display = isOpen ? 'block' : 'none';
        if (isOpen) renderList();
    });

    saveBtn.addEventListener('click', () => {
        const note = noteInput.value.trim() || 'Snapshot sans nom';
        const hash = window.location.hash;
        
        const snapshots = JSON.parse(localStorage.getItem('signal_obs_notebook') || '[]');
        snapshots.unshift({
            id: Date.now().toString(),
            date: new Date().toLocaleString(),
            note: note,
            hash: hash
        });
        localStorage.setItem('signal_obs_notebook', JSON.stringify(snapshots));
        
        noteInput.value = '';
        renderList();
    });

    function renderList() {
        const snapshots = JSON.parse(localStorage.getItem('signal_obs_notebook') || '[]');
        if (snapshots.length === 0) {
            list.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:8px 0;">Aucun snapshot sauvegardé.</div>';
            return;
        }

        list.innerHTML = snapshots.map(snap => `
            <div style="background:var(--void-soft); border:1px solid var(--rim); padding:6px; border-radius:4px; display:flex; flex-direction:column; gap:4px;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <b style="color:var(--accent-gold); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${snap.note}</b>
                    <button class="notebook-del-btn" data-id="${snap.id}" style="background:transparent; border:none; color:var(--accent-red); cursor:pointer;">✕</button>
                </div>
                <div style="font-size:9px; color:var(--text-dim); display:flex; justify-content:space-between; align-items:center;">
                    <span>${snap.date}</span>
                    <a href="${snap.hash}" style="color:var(--accent-cyan); text-decoration:none;">Ouvrir ↗</a>
                </div>
            </div>
        `).join('');

        // Attach delete listeners
        list.querySelectorAll('.notebook-del-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                const updated = snapshots.filter(s => s.id !== id);
                localStorage.setItem('signal_obs_notebook', JSON.stringify(updated));
                renderList();
            });
        });
    }
}
