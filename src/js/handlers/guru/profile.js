import { appState, updateState } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

export function setupGuruProfileHandlers() {
    const editProfileBtn = document.getElementById('edit-profile-btn');
    const changePassBtn = document.getElementById('change-pass-btn');

    if (editProfileBtn) {
        editProfileBtn.onclick = () => {
            updateState({
                modalMode: 'edit',
                showModal: true,
                editingItem: { ...appState.currentUser }
            });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }

    if (changePassBtn) {
        changePassBtn.onclick = () => {
            alert('Fitur ubah kata sandi sedang dalam pengembangan');
        };
    }

    // Modal Handlers (Dynamically rendered)
    const setupModalHandlers = () => {
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

                if (!newName) {
                    showToast('Nama tidak boleh kosong', 'error');
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.innerText = 'Menyimpan...';

                try {
                    const updatedUser = {
                        ...appState.currentUser,
                        name: newName,
                        phone: newPhone
                    };

                    // Update in Supabase
                    const result = await window.dataSdk.update(updatedUser);

                    if (result.isOk) {
                        // Update local appState via updateState
                        updateState({
                            currentUser: updatedUser,
                            showModal: false
                        });

                        // Update in teachers list
                        const tIdx = appState.teachers.findIndex(t => t.__backendId === (updatedUser.__backendId || updatedUser.id));
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
                    saveBtn.innerText = 'Simpan Perubahan';
                }
            };
        }
    };

    // If modal is already showing (after re-render)
    if (appState.showModal) {
        setupModalHandlers();
    }
}
