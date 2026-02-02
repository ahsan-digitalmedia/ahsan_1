import { appState, updateState } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

export function setupAdminSettingsHandlers() {
    const saveBtn = document.getElementById('save-settings-btn');
    const updateAdminBtn = document.getElementById('update-admin-btn');

    // 1. General Settings Handler
    if (saveBtn) {
        saveBtn.onclick = async () => {
            if (saveBtn.disabled) return;
            saveBtn.disabled = true;

            try {
                const titleEl = document.getElementById('settings-title');
                const versionEl = document.getElementById('settings-version');
                const whatsappEl = document.getElementById('settings-whatsapp');
                const announcementEl = document.getElementById('settings-announcement');

                if (!titleEl || !versionEl || !whatsappEl || !announcementEl) {
                    throw new Error('Elemen input pengaturan tidak ditemukan');
                }

                const newValues = {
                    app_title: titleEl.value,
                    app_version: versionEl.value,
                    admin_whatsapp: whatsappEl.value,
                    announcement: announcementEl.value
                };

                const currentConfig = appState.config || {};
                const backendId = currentConfig.__backendId;

                if (window.dataSdk) {
                    const { __backendId: _, ...cleanConfig } = currentConfig;
                    const dbItem = { ...cleanConfig, ...newValues, type: 'config' };

                    if (backendId) {
                        await window.dataSdk.update({ ...dbItem, __backendId: backendId });
                    } else {
                        await window.dataSdk.create(dbItem);
                    }
                }

                updateState({ config: { ...appState.config, ...newValues } });
                showToast('Pengaturan berhasil disimpan', 'success');
                window.dispatchEvent(new CustomEvent('app-state-changed'));
            } catch (err) {
                console.error('Settings save failed:', err);
                showToast('Gagal menyimpan: ' + (err.message || 'Error Unknown'), 'error');
            } finally {
                saveBtn.disabled = false;
            }
        };
    }

    // 2. Admin Account Security Handler
    if (updateAdminBtn) {
        updateAdminBtn.onclick = async () => {
            if (updateAdminBtn.disabled) return;

            const emailEl = document.getElementById('settings-admin-email');
            const passwordEl = document.getElementById('settings-admin-password');
            const oldPasswordEl = document.getElementById('settings-admin-old-password');

            if (!emailEl || !passwordEl || !oldPasswordEl) return;

            const newEmail = emailEl.value.trim();
            const newPassword = passwordEl.value.trim();
            const oldPassword = oldPasswordEl.value.trim();

            if (!oldPassword) {
                showToast('Password lama wajib diisi!', 'error');
                oldPasswordEl.focus();
                return;
            }

            const currentConfig = appState.config || {};
            const currentPassword = currentConfig.admin_password || 'admin123';

            if (oldPassword !== currentPassword) {
                showToast('Password lama tidak sesuai!', 'error');
                oldPasswordEl.value = '';
                oldPasswordEl.focus();
                return;
            }

            if (!newEmail) {
                showToast('Email tidak boleh kosong!', 'error');
                return;
            }

            updateAdminBtn.disabled = true;

            try {
                const newAccountValues = {
                    admin_email: newEmail,
                    admin_password: newPassword || currentPassword // Keep old if new is empty
                };

                const backendId = currentConfig.__backendId;

                if (window.dataSdk) {
                    const { __backendId: _, ...cleanConfig } = currentConfig;
                    const dbItem = { ...cleanConfig, ...newAccountValues, type: 'config' };

                    if (backendId) {
                        await window.dataSdk.update({ ...dbItem, __backendId: backendId });
                    } else {
                        await window.dataSdk.create(dbItem);
                    }
                }

                updateState({ config: { ...appState.config, ...newAccountValues } });
                showToast('Akun Admin berhasil diperbarui', 'success');

                // Clear the password fields for safety
                passwordEl.value = '';
                oldPasswordEl.value = '';

                window.dispatchEvent(new CustomEvent('app-state-changed'));
            } catch (err) {
                console.error('Account update failed:', err);
                showToast('Gagal memperbarui akun: ' + (err.message || 'Error Unknown'), 'error');
            } finally {
                updateAdminBtn.disabled = false;
            }
        };
    }
}
