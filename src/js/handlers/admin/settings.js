import { appState, updateState } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

export function setupAdminSettingsHandlers() {
    const saveBtn = document.getElementById('save-settings-btn');
    if (!saveBtn) return;

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

            console.log('Saving config...', { newValues, backendId });

            if (window.dataSdk) {
                // Construct the object for database
                // Note: We don't want to save __backendId INSIDE the content field
                const { __backendId: _, ...cleanConfig } = currentConfig;
                const dbItem = {
                    ...cleanConfig,
                    ...newValues,
                    type: 'config'
                };

                if (backendId) {
                    // Update existing
                    await window.dataSdk.update({ ...dbItem, __backendId: backendId });
                } else {
                    // Create new
                    await window.dataSdk.create(dbItem);
                }
            }

            // Local state update is handled by the real-time notification from SDK,
            // but we can also update it immediately for snappier UI
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
