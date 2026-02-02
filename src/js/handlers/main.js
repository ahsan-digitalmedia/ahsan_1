import { appState, updateState } from '../core/state.js';

export function setupMainAppHandlers() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const logoutBtn = document.getElementById('logout-btn');

    if (toggleBtn) {
        toggleBtn.onclick = () => {
            updateState({ sidebarOpen: !appState.sidebarOpen });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            updateState({
                isLoggedIn: false,
                currentUser: null,
                currentUserType: null,
                currentPage: 'login'
            });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }

    // Sidebar link handlers
    document.querySelectorAll('.sidebar-item').forEach(item => {
        item.onclick = () => {
            const page = item.getAttribute('data-page');
            const isMobile = window.innerWidth < 1024;
            updateState({
                currentPage: page,
                sidebarOpen: isMobile ? false : appState.sidebarOpen,
                showModal: false
            });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    });
}
