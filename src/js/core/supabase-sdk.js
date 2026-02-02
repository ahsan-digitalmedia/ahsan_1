import { createClient } from '@supabase/supabase-js';
import { generateId, showToast } from './utils.js';

/**
 * SupabaseDataSdk
 * Implements the DataSdk interface using Supabase for centralized persistence and real-time updates.
 */
export class SupabaseDataSdk {
    constructor(supabaseUrl, supabaseKey) {
        this.client = createClient(supabaseUrl, supabaseKey);
        this.listeners = [];
        this.data = [];
        this.tableName = 'app_data';
        this.isInitialized = false;
    }

    async init(handler) {
        if (handler && handler.onDataChanged) {
            this.listeners.push(handler);
        }

        console.log(`Supabase SDK: Initializing for table "${this.tableName}"...`);

        try {
            // 1. Initial Load
            const { data, error, status } = await this.client
                .from(this.tableName)
                .select('*')
                .order('updated_at', { ascending: true });

            if (error) {
                console.error(`Supabase Fetch Error [${status}]:`, error.message);
                if (status === 401) {
                    console.warn('Unauthorized! Attempting to clear stale session...');
                    const storageKey = `sb-${new URL(this.client.supabaseUrl).hostname.split('.')[0]}-auth-token`;
                    localStorage.removeItem(storageKey);
                }
                throw error;
            }

            console.log(`Supabase SDK: Loaded ${data.length} records successfully.`);

            // Map data to the internal format (extract content and add id/type)
            this.data = data.map(d => ({
                ...d.content,
                __backendId: d.id,
                type: d.type
            }));

            // 2. Notify initial data
            this._notifyListeners();

            // 3. Setup Realtime Subscription
            this.client
                .channel('schema-db-changes')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: this.tableName },
                    (payload) => this._handleRealtimeUpdate(payload)
                )
                .subscribe((status) => {
                    console.log(`Supabase SDK: Realtime status: ${status}`);
                });

            this.isInitialized = true;
            return { isOk: true };
        } catch (err) {
            console.error('Supabase SDK: Init Failed:', err);
            const status = err.status || (err.error && err.error.status);
            return { isOk: false, error: err, status: status };
        }
    }

    _handleRealtimeUpdate(payload) {
        const { eventType, new: newRecord, old: oldRecord } = payload;

        if (eventType === 'INSERT') {
            const exists = this.data.some(d => d.__backendId === newRecord.id);
            if (!exists) {
                const newItem = { ...newRecord.content, __backendId: newRecord.id, type: newRecord.type };
                this.data.push(newItem);
            }
        } else if (eventType === 'UPDATE') {
            const index = this.data.findIndex(d => d.__backendId === newRecord.id);
            const updatedItem = { ...newRecord.content, __backendId: newRecord.id, type: newRecord.type };
            if (index !== -1) {
                this.data[index] = updatedItem;
            } else {
                this.data.push(updatedItem);
            }
        } else if (eventType === 'DELETE') {
            this.data = this.data.filter(d => d.__backendId !== oldRecord.id);
        }

        this._notifyListeners();
    }

    _notifyListeners() {
        this.listeners.forEach(listener => listener.onDataChanged(this.data));
    }

    async create(item) {
        const type = item.type || 'unknown';
        const { type: _, ...content } = item;

        console.log(`Supabase SDK: Attempting to CREATE record of type "${type}"...`);

        const { data, error } = await this.client
            .from(this.tableName)
            .insert([{
                type: type,
                content: content
            }])
            .select();

        if (error) {
            console.error(`Supabase SDK: Create Error [${error.code}]:`, error.message);
            showToast(`Gagal menyimpan: ${error.message}`, 'error');
            throw error;
        }

        console.log('Supabase SDK: Record created successfully:', data[0].id);

        const createdItem = { ...data[0].content, __backendId: data[0].id, type: data[0].type };
        this.data.push(createdItem);
        this._notifyListeners();

        return { isOk: true, data: data[0] };
    }

    async update(item) {
        const id = item.__backendId || item.id;
        const type = item.type;
        const { __backendId, id: _, type: __, ...content } = item;

        console.log(`Supabase SDK: Attempting to UPDATE record "${id}" (type: "${type}")...`);

        const { data, error } = await this.client
            .from(this.tableName)
            .update({ content: content, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select();

        if (error) {
            console.error(`Supabase SDK: Update Error [${error.code}]:`, error.message);
            showToast(`Gagal memperbarui: ${error.message}`, 'error');
            throw error;
        }

        const updatedRecord = data && data[0] ? data[0] : null;
        if (updatedRecord) {
            console.log('Supabase SDK: Record updated successfully.');
            const updatedItem = { ...updatedRecord.content, __backendId: updatedRecord.id, type: updatedRecord.type };
            const index = this.data.findIndex(d => d.__backendId === updatedRecord.id);
            if (index !== -1) {
                this.data[index] = updatedItem;
            } else {
                this.data.push(updatedItem);
            }
        }
        this._notifyListeners();

        return { isOk: true, data: data[0] };
    }

    async delete(itemOrCollection, id) {
        let itemId;
        if (typeof itemOrCollection === 'string') {
            itemId = id;
        } else {
            itemId = itemOrCollection.__backendId || itemOrCollection.id;
        }

        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .eq('id', itemId);

        if (error) {
            showToast('Gagal menghapus data', 'error');
            throw error;
        }

        this.data = this.data.filter(d => d.__backendId !== itemId);
        this._notifyListeners();

        return { isOk: true };
    }

    /**
     * Cascading delete for teacher data
     */
    async deleteByTeacherId(teacherId) {
        console.log(`Supabase SDK: Cascading delete for teacher_id "${teacherId}"...`);

        const { error } = await this.client
            .from(this.tableName)
            .delete()
            .filter('content->>teacher_id', 'eq', teacherId);

        if (error) {
            console.error('Supabase SDK: Bulk Delete Error:', error.message);
            throw error;
        }

        // Clean up local data - remove any item where teacher_id matches
        this.data = this.data.filter(d => d.teacher_id !== teacherId);
        this._notifyListeners();

        return { isOk: true };
    }
}
