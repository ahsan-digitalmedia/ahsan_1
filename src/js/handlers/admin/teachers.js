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
                const id = deleteBtn.getAttribute('data-id');
                const teacher = appState.teachers.find(t => (t.__backendId || t.id) == id);

                if (teacher && confirm(`⚠ PERINGATAN! Hapus guru ${teacher.name}?\n\nSemua data (Jurnal, Absensi, Siswa, dll) yang dibuat oleh guru ini akan ikut TERHAPUS PERMANEN.`)) {
                    try {
                        const teacherId = teacher.__backendId || teacher.id;

                        if (window.dataSdk) {
                            // 1. Cascading delete related data
                            await window.dataSdk.deleteByTeacherId(teacherId);
                            // 2. Delete teacher account
                            await window.dataSdk.delete(teacher);
                        }

                        showToast('Guru dan seluruh datanya berhasil dihapus', 'success');
                        window.dispatchEvent(new CustomEvent('app-state-changed'));
                    } catch (err) {
                        console.error('Cascading delete failed:', err);
                        showToast('Gagal menghapus data secara bersih', 'error');
                    }
                }
                return;
            }

            // Approve Button
            const approveBtn = e.target.closest('.approve-btn');
            if (approveBtn) {
                const id = approveBtn.getAttribute('data-id');
                const teacher = appState.teachers.find(t => (t.__backendId || t.id) == id);
                if (teacher && confirm(`Setujui pendaftaran guru ${teacher.name}?`)) {
                    try {
                        const updatedTeacher = { ...teacher, status: 'active' };
                        if (window.dataSdk) await window.dataSdk.update(updatedTeacher);
                        showToast('Guru berhasil disetujui', 'success');
                        window.dispatchEvent(new CustomEvent('app-state-changed'));
                    } catch (err) {
                        showToast('Gagal menyetujui guru', 'error');
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
                school_name: document.getElementById('modal-school').value,
                npsn: document.getElementById('modal-npsn').value,
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
