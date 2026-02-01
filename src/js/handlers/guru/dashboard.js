import { updateState } from '../../core/state.js';

export function setupGuruDashboardHandlers() {
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.onclick = (e) => {
            const navBtn = e.target.closest('[data-navigate]');
            if (navBtn) {
                const page = navBtn.getAttribute('data-navigate');
                updateState({ currentPage: page });
                window.dispatchEvent(new CustomEvent('app-state-changed'));
            }
        };
    }
}
