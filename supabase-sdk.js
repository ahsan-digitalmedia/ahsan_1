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

            // Map data to the internal format (extract content and add id/type/created_at)
            this.data = data.map(d => ({
                ...d.content,
                __backendId: d.id,
                type: d.type,
                created_at: d.created_at
            }));

            // 2. Notify initial data
            this._notifyListeners();

            // 3. Setup Auth State Listener and Initial Session
            this.client.auth.onAuthStateChange((event, session) => {
                console.log(`Supabase SDK Auth Event: ${event}`);
                if (session?.user) {
                    // Sync backend user to app state if needed
                    console.log('Supabase SDK: User authenticated:', session.user.email);
                }
            });

            // 4. Setup Realtime Subscription
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
                const newItem = {
                    ...newRecord.content,
                    __backendId: newRecord.id,
                    type: newRecord.type,
                    created_at: newRecord.created_at
                };
                this.data.push(newItem);
            }
        } else if (eventType === 'UPDATE') {
            const index = this.data.findIndex(d => d.__backendId === newRecord.id);
            const updatedItem = {
                ...newRecord.content,
                __backendId: newRecord.id,
                type: newRecord.type,
                created_at: newRecord.created_at
            };
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

        const session = await this.getSession();
        const payload = {
            type: type,
            content: content
        };
        if (session?.user) {
            payload.auth_id = session.user.id;
        }

        const { data, error } = await this.client
            .from(this.tableName)
            .insert([payload])
            .select();

        if (error) {
            console.error(`Supabase SDK: Create Error [${error.code}]:`, error.message);
            showToast(`Gagal menyimpan: ${error.message}`, 'error');
            throw error;
        }

        console.log('Supabase SDK: Record created successfully:', data[0].id);

        const createdItem = {
            ...data[0].content,
            __backendId: data[0].id,
            type: data[0].type,
            created_at: data[0].created_at
        };
        this.data.push(createdItem);
        this._notifyListeners();

        return { isOk: true, data: data[0] };
    }

    async update(item) {
        const id = item.__backendId || item.id;
        const type = item.type;
        const { __backendId, id: _, type: __, ...content } = item;

        console.log(`Supabase SDK: Attempting to UPDATE record "${id}" (type: "${type}")...`);

        const session = await this.getSession();
        const payload = { content: content, updated_at: new Date().toISOString() };
        if (session?.user) {
            payload.auth_id = session.user.id;
        }

        const { data, error } = await this.client
            .from(this.tableName)
            .update(payload)
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
            const updatedItem = {
                ...updatedRecord.content,
                __backendId: updatedRecord.id,
                type: updatedRecord.type,
                created_at: updatedRecord.created_at
            };
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

    /**
     * Bulk upsert functionality for complex updates (like Scores)
     */
    async batchUpsert(items) {
        if (!items || items.length === 0) return { isOk: true };

        console.log(`Supabase SDK: Batch upserting ${items.length} records...`);

        const session = await this.getSession();
        const upserts = items.map(item => {
            const id = item.__backendId || item.id;
            const type = item.type || 'unknown';
            const { __backendId: _, id: __, type: ___, ...content } = item;

            const payload = {
                type,
                content,
                updated_at: new Date().toISOString()
            };

            if (session?.user) {
                payload.auth_id = session.user.id;
            }

            if (id && !String(id).startsWith('id_')) {
                payload.id = id;
            }

            return payload;
        });

        const { data, error } = await this.client
            .from(this.tableName)
            .upsert(upserts)
            .select();

        if (error) {
            console.error('Supabase SDK: Batch Upsert Error:', error.message);
            showToast('Gagal memproses data massal', 'error');
            throw error;
        }

        // Update local cache
        data.forEach(updatedRecord => {
            const updatedItem = {
                ...updatedRecord.content,
                __backendId: updatedRecord.id,
                type: updatedRecord.type,
                created_at: updatedRecord.created_at
            };
            const index = this.data.findIndex(d => d.__backendId === updatedRecord.id);
            if (index !== -1) {
                this.data[index] = updatedItem;
            } else {
                this.data.push(updatedItem);
            }
        });

        this._notifyListeners();
        return { isOk: true, data };
    }

    // --- Authentication Methods ---

    /**
     * Official Supabase Sign Up
     */
    async signUp(email, password, metadata = {}) {
        const { data, error } = await this.client.auth.signUp({
            email,
            password,
            options: { data: metadata }
        });
        if (error) throw error;
        return data;
    }

    /**
     * Official Supabase Sign In
     */
    async signIn(email, password) {
        const { data, error } = await this.client.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    /**
     * Official Supabase Sign Out
     */
    async signOut() {
        const { error } = await this.client.auth.signOut();
        if (error) throw error;
        return { isOk: true };
    }

    /**
     * Get Current Active Session
     */
    async getSession() {
        const { data: { session }, error } = await this.client.auth.getSession();
        if (error) throw error;
        return session;
    }
}
