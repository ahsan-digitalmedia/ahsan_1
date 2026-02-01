import { appState, updateState } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

export function setupGuruAssignmentsHandlers() {
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.addEventListener('click', (e) => {
            const viewBtn = e.target.closest('.view-assignment-btn');
            if (viewBtn) {
                const id = viewBtn.getAttribute('data-id');
                alert('Detail tugas ID: ' + id + ' (Fitur ini dalam pengembangan)');
            }
        });
    }

    const filterAll = document.getElementById('filter-all');
    const filterPending = document.getElementById('filter-pending');
    const filterGraded = document.getElementById('filter-graded');

    if (filterAll) {
        filterAll.onclick = () => {
            updateState({ filterAssignments: 'all' });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }

    if (filterPending) {
        filterPending.onclick = () => {
            updateState({ filterAssignments: 'pending' });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }

    if (filterGraded) {
        filterGraded.onclick = () => {
            updateState({ filterAssignments: 'graded' });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }
}
