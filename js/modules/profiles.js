/**
 * Profile management logic
 */
import { store } from './store.js';
import { db } from './db.js';

export const loadProfiles = async () => {
    // Populate profile selector in sidebar
    const selectorContainer = document.getElementById('profile-selector');
    if (!selectorContainer) return;

    const profiles = store.state.profiles;
    const activeId = store.state.activeProfileId;

    let html = `
        <div class="form-group" style="margin-bottom: 0;">
            <select id="profile-select" class="form-control" style="background-color: var(--bg-body); border-color: var(--border-color);">
                ${profiles.map(p => `<option value="${p.id}" ${p.id === activeId ? 'selected' : ''}>${p.name}</option>`).join('')}
            </select>
        </div>
    `;

    selectorContainer.innerHTML = html;

    const selectEl = document.getElementById('profile-select');
    if (selectEl) {
        selectEl.addEventListener('change', async (e) => {
            const newProfileId = e.target.value;
            await store.setActiveProfile(newProfileId);
            // Router will handle re-rendering the view automatically because components will re-render on state change
            // Actually, we should trigger a full re-render of the current view
            const currentHash = window.location.hash;
            window.dispatchEvent(new HashChangeEvent('hashchange', { newURL: currentHash, oldURL: currentHash }));
        });
    }
};

// Listen for state changes to update the selector if profiles are added/removed
store.subscribe((state) => {
    const selectEl = document.getElementById('profile-select');
    if (selectEl) {
        // Only update if options length differs to avoid losing focus
        if (selectEl.options.length !== state.profiles.length) {
            loadProfiles();
        } else {
             // Just update selected index
             Array.from(selectEl.options).forEach(opt => {
                 opt.selected = opt.value === state.activeProfileId;
             });
        }
    }
});
