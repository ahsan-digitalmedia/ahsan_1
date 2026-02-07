import { appState, updateState } from '../core/state.js';

export function setupMainAppHandlers() {
    const toggleBtn = document.getElementById('toggle-sidebar');
    const logoutBtn = document.getElementById('logout-btn');

    if (toggleBtn) {
        toggleBtn.onclick = () => {
            updateState({ sidebarOpen: !appState.sidebarOpen });
        };
    }

    if (logoutBtn) {
        logoutBtn.onclick = async () => {
            if (window.dataSdk) {
                try {
                    await window.dataSdk.signOut();
                } catch (err) {
                    console.error('Logout error:', err);
                }
            }
            updateState({
                isLoggedIn: false,
                currentUser: null,
                currentUserType: null,
                currentPage: 'login'
            });
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
        };
    });
}
