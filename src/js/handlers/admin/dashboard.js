import { updateState } from '../../core/state.js';

export function setupAdminDashboardHandlers() {
    const addFirstBtn = document.getElementById('add-first-teacher-btn');
    const quickAddBtn = document.getElementById('quick-add-teacher-btn');
    const quickViewTeachersBtn = document.getElementById('quick-view-teachers-btn');
    const quickViewReportsBtn = document.getElementById('quick-view-reports-btn');

    const openTeacherAddModal = () => {
        updateState({
            currentPage: 'teachers',
            showModal: true,
            modalMode: 'add',
            editingItem: null
        });
        window.dispatchEvent(new CustomEvent('app-state-changed'));
    };

    if (addFirstBtn) addFirstBtn.onclick = openTeacherAddModal;
    if (quickAddBtn) quickAddBtn.onclick = openTeacherAddModal;

    if (quickViewTeachersBtn) {
        quickViewTeachersBtn.onclick = () => {
            updateState({ currentPage: 'teachers' });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }

    if (quickViewReportsBtn) {
        quickViewReportsBtn.onclick = () => {
            updateState({ currentPage: 'reports' });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }
}
