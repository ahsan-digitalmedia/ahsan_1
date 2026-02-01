import { appState, updateState } from '../../core/state.js';
import { showToast, generateId, closeModal } from '../../core/utils.js';

export function setupGuruJournalHandlers() {
    const { journals, currentUser } = appState;

    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.addEventListener('click', async (e) => {
            // Edit Button
            const editBtn = e.target.closest('.edit-journal-btn');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                const item = appState.journals.find(j => (j.__backendId || j.id) == id);
                if (item) {
                    updateState({ showModal: true, modalMode: 'edit', editingItem: { ...item } });
                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                }
                return;
            }

            // Delete Button
            const deleteBtn = e.target.closest('.delete-journal-btn');
            if (deleteBtn) {
                if (confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
                    const id = deleteBtn.getAttribute('data-id');
                    const item = appState.journals.find(j => (j.__backendId || j.id) == id);
                    if (item) {
                        try {
                            if (window.dataSdk) await window.dataSdk.delete(item);
                            showToast('Jurnal berhasil dihapus', 'success');
                            window.dispatchEvent(new CustomEvent('app-state-changed'));
                        } catch (err) {
                            showToast('Gagal menghapus jurnal', 'error');
                        }
                    }
                }
                return;
            }

            // Add button delegation
            const addBtn = e.target.closest('#add-journal-btn') || e.target.closest('#add-journal-first-btn');
            if (addBtn) {
                updateState({ showModal: true, modalMode: 'add', editingItem: null });
                window.dispatchEvent(new CustomEvent('app-state-changed'));
                return;
            }
        });
    }

    const closeJouBtn = document.getElementById('close-journal-modal');
    const cancelJouBtn = document.getElementById('cancel-journal-modal');
    const saveJouBtn = document.getElementById('save-journal-btn');

    if (closeJouBtn) closeJouBtn.onclick = closeModal;
    if (cancelJouBtn) cancelJouBtn.onclick = closeModal;

    if (saveJouBtn) {
        saveJouBtn.onclick = async () => {
            if (saveJouBtn.disabled) return;
            saveJouBtn.disabled = true;

            const form = document.getElementById('journal-form');
            if (!form.reportValidity()) {
                saveJouBtn.disabled = false;
                return;
            }

            const journalData = {
                journal_date: document.getElementById('jou-date').value,
                journal_content: document.getElementById('jou-content').value,
                journal_class: appState.currentUser?.class,
                journal_teacher_nip: appState.currentUser?.nip,
                type: 'journal'
            };

            try {
                if (appState.modalMode === 'add') {
                    journalData.id = generateId();
                    if (window.dataSdk) await window.dataSdk.create(journalData);
                    showToast('Jurnal berhasil disimpan', 'success');
                } else {
                    journalData.id = appState.editingItem.id || appState.editingItem.__backendId;
                    journalData.__backendId = appState.editingItem.__backendId;
                    if (window.dataSdk) await window.dataSdk.update(journalData);
                    showToast('Jurnal berhasil diperbarui', 'success');
                }
                closeModal();
            } catch (err) {
                showToast('Gagal menyimpan jurnal', 'error');
                saveJouBtn.disabled = false;
            }
        };
    }
}
