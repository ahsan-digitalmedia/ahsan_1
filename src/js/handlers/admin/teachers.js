import { appState, updateState } from '../../core/state.js';
import { showToast, generateId, closeModal } from '../../core/utils.js';


export function setupAdminTeachersHandlers() {
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.addEventListener('click', async (e) => {
            // Edit Button
            const editBtn = e.target.closest('.edit-btn');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                const teacher = appState.teachers.find(t => (t.__backendId || t.id) == id);
                if (teacher) {
                    updateState({ showModal: true, modalMode: 'edit', editingItem: { ...teacher } });
                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                }
                return;
            }

            // Delete Button
            const deleteBtn = e.target.closest('.delete-btn');
            if (deleteBtn) {
                if (confirm('Apakah Anda yakin ingin menghapus guru ini?')) {
                    const id = deleteBtn.getAttribute('data-id');
                    const teacher = appState.teachers.find(t => (t.__backendId || t.id) == id);
                    if (teacher) {
                        try {
                            if (window.dataSdk) await window.dataSdk.delete(teacher);
                            showToast('Guru berhasil dihapus', 'success');
                            window.dispatchEvent(new CustomEvent('app-state-changed'));
                        } catch (err) {
                            showToast('Gagal menghapus guru', 'error');
                        }
                    }
                }
                return;
            }

            // Add button delegation
            const addBtn = e.target.closest('#add-teacher-btn');
            if (addBtn) {
                updateState({ showModal: true, modalMode: 'add', editingItem: null });
                window.dispatchEvent(new CustomEvent('app-state-changed'));
                return;
            }
        });
    }

    const closeModalBtn = document.getElementById('close-modal');
    const cancelModalBtn = document.getElementById('cancel-modal');
    const saveBtn = document.getElementById('save-teacher');

    if (closeModalBtn) closeModalBtn.onclick = closeModal;
    if (cancelModalBtn) cancelModalBtn.onclick = closeModal;

    if (saveBtn) {
        saveBtn.onclick = async () => {
            if (saveBtn.disabled) return;
            saveBtn.disabled = true;

            const form = document.getElementById('teacher-form');
            if (!form.reportValidity()) {
                saveBtn.disabled = false;
                return;
            }

            const teacherData = {
                name: document.getElementById('modal-name').value,
                nip: document.getElementById('modal-nip').value,
                class: document.getElementById('modal-class').value,
                email: document.getElementById('modal-email').value,
                phone: document.getElementById('modal-phone').value,
                subject: document.getElementById('modal-subject').value,
                password: document.getElementById('modal-password').value,
                status: document.getElementById('modal-status').value,
                type: 'teacher'
            };

            try {
                if (appState.modalMode === 'add') {
                    teacherData.id = generateId();
                    if (window.dataSdk) await window.dataSdk.create(teacherData);
                    showToast('Guru berhasil ditambahkan', 'success');
                } else {
                    teacherData.id = appState.editingItem.id || appState.editingItem.__backendId;
                    teacherData.__backendId = appState.editingItem.__backendId;
                    if (window.dataSdk) await window.dataSdk.update(teacherData);
                    showToast('Guru berhasil diperbarui', 'success');
                }
                closeModal();
            } catch (err) {
                showToast('Gagal menyimpan data guru', 'error');
                saveBtn.disabled = false;
            }
        };
    }
}
