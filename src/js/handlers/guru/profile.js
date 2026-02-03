import { appState, updateState } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

export function setupGuruProfileHandlers() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    if (contentArea._profileHandler) {
        contentArea.removeEventListener('click', contentArea._profileHandler);
    }

    const handler = (e) => {
        // Edit Profile Button
        const editBtn = e.target.closest('#edit-profile-btn');
        if (editBtn) {
            updateState({
                modalMode: 'edit',
                showModal: true,
                editingItem: { ...appState.currentUser }
            });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
            return;
        }

        const passBtn = e.target.closest('#change-pass-btn');
        if (passBtn) {
            alert('Fitur ubah kata sandi sedang dalam pengembangan');
            return;
        }
    };

    contentArea.addEventListener('click', handler);
    contentArea._profileHandler = handler;

    // Modal Handlers (Dynamically rendered)
    if (appState.showModal) {
        const modalContainer = document.getElementById('modal-container');
        if (modalContainer) {
            modalContainer.onclick = (e) => {
                // Add class row in profile modal
                const addClassBtn = e.target.closest('#add-profile-class-btn');
                if (addClassBtn) {
                    const container = document.getElementById('profile-classes-container');
                    if (container) {
                        const newRow = document.createElement('div');
                        newRow.className = 'profile-class-row flex items-center gap-3 animate-fadeIn';
                        newRow.innerHTML = `
                            <div class="flex-1 grid grid-cols-2 gap-2">
                               <select class="profile-class-level input-modern w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium">
                                 ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `<option value="${num}">Kelas ${num}</option>`).join('')}
                               </select>
                               <input type="text" class="profile-class-suffix input-modern w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm font-medium" value="" placeholder="Rombel (A, B, dll)">
                            </div>
                            <button type="button" class="remove-profile-class-btn p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                        `;
                        container.appendChild(newRow);
                        updateRemoveButtonsVisibility();
                    }
                    return;
                }

                // Remove class row in profile modal
                const removeBtn = e.target.closest('.remove-profile-class-btn');
                if (removeBtn) {
                    const row = removeBtn.closest('.profile-class-row');
                    if (row) {
                        row.remove();
                        updateRemoveButtonsVisibility();
                    }
                    return;
                }
            };
        }

        const closeBtn = document.getElementById('close-profile-modal');
        const cancelBtn = document.getElementById('cancel-profile-btn');
        const saveBtn = document.getElementById('save-profile-btn');

        if (closeBtn) closeBtn.onclick = () => {
            updateState({ showModal: false });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
        if (cancelBtn) cancelBtn.onclick = () => {
            updateState({ showModal: false });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };

        if (saveBtn) {
            saveBtn.onclick = async () => {
                const newName = document.getElementById('profile-name').value;
                const newPhone = document.getElementById('profile-phone').value;
                const newNip = document.getElementById('profile-nip')?.value || '';
                const newSchool = document.getElementById('profile-school')?.value || '';
                const newNpsn = document.getElementById('profile-npsn')?.value || '';

                // Get all managed classes from rows
                const classRows = document.querySelectorAll('.profile-class-row');
                const classes = Array.from(classRows).map(row => {
                    const level = row.querySelector('.profile-class-level').value;
                    const suffix = row.querySelector('.profile-class-suffix').value.trim();
                    return `${level}${suffix}`;
                }).filter(c => c).join(', ');

                const newClass = classes;
                const newSubject = document.getElementById('profile-subject')?.value || '';

                if (!newName || !newSchool || !newNpsn || !newClass || !newSubject || !newPhone) {
                    showToast('Mohon lengkapi seluruh data wajib (*)', 'error');
                    return;
                }

                saveBtn.disabled = true;
                const originalText = saveBtn.innerHTML;
                saveBtn.innerHTML = `
                    <svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Menyimpan...</span>
                `;

                try {
                    const updatedUser = {
                        ...appState.currentUser,
                        name: newName,
                        phone: newPhone,
                        nip: newNip,
                        school_name: newSchool,
                        npsn: newNpsn,
                        class: newClass,
                        subject: newSubject
                    };

                    const result = await window.dataSdk.update(updatedUser);

                    if (result.isOk) {
                        updateState({
                            currentUser: updatedUser,
                            showModal: false
                        });

                        const tIdx = appState.teachers.findIndex(t => (t.__backendId || t.id) === (updatedUser.__backendId || updatedUser.id));
                        if (tIdx !== -1) {
                            appState.teachers[tIdx] = updatedUser;
                        }

                        showToast('Profil berhasil diperbaharui', 'success');
                        window.dispatchEvent(new CustomEvent('app-state-changed'));
                    }
                } catch (error) {
                    console.error('Profile Update Error:', error);
                    showToast('Gagal memperbaharui profil', 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = originalText;
                }
            };
        }

        updateRemoveButtonsVisibility();
    }

    function updateRemoveButtonsVisibility() {
        const rows = document.querySelectorAll('.profile-class-row');
        rows.forEach(row => {
            const btn = row.querySelector('.remove-profile-class-btn');
            if (btn) {
                btn.style.display = rows.length > 1 ? 'flex' : 'none';
            }
        });
    }
}
