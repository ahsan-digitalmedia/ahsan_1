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

            // --- Modal Dynamic Class Fields ---
            const addClassBtn = e.target.closest('#add-modal-class-btn');
            if (addClassBtn) {
                const container = document.getElementById('modal-classes-container');
                const newRow = document.createElement('div');
                newRow.className = 'modal-class-row flex items-center gap-3 animate-fadeIn';
                newRow.innerHTML = `
                    <div class="flex-1 grid grid-cols-2 gap-2">
                        <select class="modal-class-level input-modern w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium">
                            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `<option value="${num}">Kelas ${num}</option>`).join('')}
                        </select>
                        <input type="text" class="modal-class-suffix input-modern w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium" placeholder="Rombel (A, B, dll)">
                    </div>
                    <button type="button" class="remove-modal-class-btn p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                    </button>
                `;
                container.appendChild(newRow);
                return;
            }

            const removeClassBtn = e.target.closest('.remove-modal-class-btn');
            if (removeClassBtn) {
                const row = removeClassBtn.closest('.modal-class-row');
                row.classList.add('scale-95', 'opacity-0');
                setTimeout(() => row.remove(), 200);
                return;
            }
        });
    }

    const closeModalBtn = document.getElementById('close-modal');
    const cancelModalBtn = document.getElementById('cancel-modal');
    const saveBtn = document.getElementById('save-teacher');
    const showPasswordCheck = document.getElementById('show-password');

    if (closeModalBtn) closeModalBtn.onclick = closeModal;
    if (cancelModalBtn) cancelModalBtn.onclick = closeModal;

    if (showPasswordCheck) {
        showPasswordCheck.onchange = (e) => {
            const passwordInput = document.getElementById('modal-password');
            if (passwordInput) {
                passwordInput.type = e.target.checked ? 'text' : 'password';
            }
        };
    }

    if (saveBtn) {
        saveBtn.onclick = async () => {
            if (saveBtn.disabled) return;
            saveBtn.disabled = true;

            const form = document.getElementById('teacher-form');
            if (!form.reportValidity()) {
                saveBtn.disabled = false;
                return;
            }

            const name = document.getElementById('modal-name').value;
            const school_name = document.getElementById('modal-school').value;
            const npsn = document.getElementById('modal-npsn').value;
            const nip = document.getElementById('modal-nip').value;
            const email = document.getElementById('modal-email').value;
            const phone = document.getElementById('modal-phone').value;
            const subject = document.getElementById('modal-subject').value;
            const password = document.getElementById('modal-password').value;
            const status = document.getElementById('modal-status').value;

            // Collect classes
            const classRows = document.querySelectorAll('.modal-class-row');
            const managedClasses = [];
            classRows.forEach(row => {
                const level = row.querySelector('.modal-class-level').value;
                const suffix = (row.querySelector('.modal-class-suffix').value || '').trim().toUpperCase();
                managedClasses.push(`${level}${suffix}`);
            });

            const teacherData = {
                name,
                school_name,
                npsn,
                nip,
                class: managedClasses.join(', '),
                email,
                phone,
                subject,
                password,
                status,
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
