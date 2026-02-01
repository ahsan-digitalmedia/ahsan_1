import { appState, updateState } from '../../core/state.js';
import { showToast } from '../../core/utils.js';

export function setupAdminSettingsHandlers() {
    const saveBtn = document.getElementById('save-settings-btn');

    if (saveBtn) {
        saveBtn.onclick = async () => {
            if (saveBtn.disabled) return;
            saveBtn.disabled = true;

            const newConfig = {
                ...appState.config,
                app_title: document.getElementById('settings-title').value,
                school_name: document.getElementById('settings-school').value
            };

            try {
                if (window.dataSdk) {
                    // Assuming settings are stored in a specific key or as a general config object
                    // For now, we update the state and the SDK if it supports a 'config' type
                    await window.dataSdk.update({ ...newConfig, id: 'app-config', type: 'config' });
                }

                updateState({ config: newConfig });
                showToast('Pengaturan berhasil disimpan', 'success');
                window.dispatchEvent(new CustomEvent('app-state-changed'));
            } catch (err) {
                showToast('Gagal menyimpan pengaturan', 'error');
                saveBtn.disabled = false;
            }
        };
    }
}
