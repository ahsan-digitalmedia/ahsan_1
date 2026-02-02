import { appState, updateState } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

export function setupGuruProfileHandlers() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    if (contentArea._profileHandler) {
        contentArea.removeEventListener('click', contentArea._profileHandler);
    }

    const handler = (e) => {
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
                const newClass = document.getElementById('profile-class')?.value || '';
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
    }
}
