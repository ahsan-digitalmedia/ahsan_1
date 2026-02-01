import { generateId, showToast } from './utils.js';

/**
 * LocalDataSdk
 * A lightweight SDK that mimics the external dataSdk interface but uses localStorage for persistence.
 */
export class LocalDataSdk {
    constructor() {
        this.storageKey = 'sdn1_poncowati_data';
        this.listeners = [];
        this.data = this._loadData();
    }

    _loadData() {
        try {
            const data = localStorage.getItem(this.storageKey);
            if (!data) return [];

            try {
                return JSON.parse(data);
            } catch (parseError) {
                console.error('Data corrupted, resetting storage:', parseError);
                localStorage.setItem(this.storageKey + '_corrupt_backup', data);
                return [];
            }
        } catch (e) {
            console.error('Failed to access localStorage:', e);
            if (typeof showToast === 'function') {
                showToast('Gagal memuat data lokal. Pastikan cookies/storage diaktifkan.', 'error');
            }
            return [];
        }
    }

    _saveData() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.data));
            this._notifyListeners();
        } catch (e) {
            console.error('Failed to save data to localStorage', e);
            if (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                showToast('Penyimpanan penuh! Hapus beberapa data lama.', 'error');
            } else {
                showToast('Gagal menyimpan data. Terjadi kesalahan sistem.', 'error');
            }
        }
    }

    _notifyListeners() {
        this.listeners.forEach(listener => listener.onDataChanged(this.data));
    }

    async init(handler) {
        if (handler && handler.onDataChanged) {
            this.listeners.push(handler);
            handler.onDataChanged(this.data);
        }
        return { isOk: true };
    }

    async create(item) {
        const newItem = { ...item, __backendId: item.id || generateId() };
        this.data.push(newItem);
        this._saveData();
        return { isOk: true, data: newItem };
    }

    async update(item) {
        const index = this.data.findIndex(d => (d.__backendId || d.id) === (item.__backendId || item.id));
        if (index !== -1) {
            this.data[index] = { ...this.data[index], ...item };
            this._saveData();
            return { isOk: true, data: this.data[index] };
        }
        return { isOk: false, error: 'Item not found' };
    }

    async delete(itemOrCollection, id) {
        let itemId;
        if (typeof itemOrCollection === 'string') {
            itemId = id;
        } else {
            itemId = itemOrCollection.__backendId || itemOrCollection.id;
        }

        const initialLength = this.data.length;
        this.data = this.data.filter(d => (d.__backendId || d.id) !== itemId);

        if (this.data.length !== initialLength) {
            this._saveData();
            return { isOk: true };
        }
        return { isOk: false, error: 'Item not found' };
    }
}
