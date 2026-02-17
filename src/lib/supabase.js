import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase credentials missing! Check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Utility to handle common data operations
export const supabaseData = {
    async fetchAll(tableName = 'app_data', authId = null) {
        let query = supabase
            .from(tableName)
            .select('*');

        if (authId) {
            query = query.eq('auth_id', authId);
        }

        const { data, error } = await query.order('updated_at', { ascending: true });

        if (error) throw error;

        return data.map(d => {
            const content = d.content || {};
            return {
                ...content,
                __backendId: d.id,
                type: d.type,
                created_at: d.created_at,
                // Prioritize top-level column, fallback to content, but ensure it's not nullified if content has it
                auth_id: d.auth_id || content.auth_id || null
            };
        });
    },

    async create(record, tableName = 'app_data') {
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
            .from(tableName)
            .insert([{
                type: record.type,
                content: record,
                auth_id: user?.id || null
            }])
            .select();

        if (error) throw error;
        return data[0];
    },

    async update(id, record, tableName = 'app_data') {
        const { data, error } = await supabase
            .from(tableName)
            .update({
                content: record,
                updated_at: new Date().toISOString()
            })
            .eq('id', id)
            .select();

        if (error) throw error;
        return data[0];
    },

    async delete(id, tableName = 'app_data') {
        const { error } = await supabase
            .from(tableName)
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async fetchConfig() {
        const { data, error } = await supabase
            .from('app_data')
            .select('*')
            .eq('type', 'config')
            .single();

        if (error && error.code !== 'PGRST116') throw error; // PGRST116 is 'no rows'
        return data ? { ...data.content, __backendId: data.id } : null;
    },

    async updateConfig(newConfig) {
        const existing = await this.fetchConfig();
        if (existing) {
            return await this.update(existing.__backendId, { ...newConfig, type: 'config' });
        } else {
            return await this.create({ ...newConfig, type: 'config' });
        }
    },

    async fetchRecentAuditLogs(limit = 15) {
        const { data, error } = await supabase
            .from('audit_logs')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) throw error;
        return data;
    }
};

// Dedicated operations for the flat 'students' table
export const studentOperations = {
    async fetchAll(teacherId = null) {
        let query = supabase
            .from('students')
            .select('*')
            .order('name', { ascending: true });

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query;
        if (error) throw error;

        return data;
    },

    async create(studentData) {
        const { type, ...payload } = studentData;

        const { data, error } = await supabase
            .from('students')
            .insert([payload])
            .select();

        if (error) throw error;
        return data[0];
    },

    async update(id, studentData) {
        const { type, ...payload } = studentData;

        const { data, error } = await supabase
            .from('students')
            .update(payload)
            .eq('id', id)
            .select();

        if (error) throw error;
        return { ...data[0], __backendId: data[0].id, type: 'student' };
    },

    async delete(id) {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async batchUpsert(students) {
        if (!students || students.length === 0) return;

        const { data, error } = await supabase
            .from('students')
            .upsert(students, { onConflict: 'nisn' }) // Assuming NISN is unique enough or use something else
            .select();

        if (error) throw error;
        return data;
    }
};

// Dedicated operations for 'attendance' table
export const attendanceOperations = {
    async fetchAll(teacherId = null) {
        let query = supabase
            .from('attendance')
            .select('*')
            .order('date', { ascending: false });

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async fetchByDateAndClass(date, className, teacherId = null) {
        let query = supabase
            .from('attendance')
            .select('*')
            .eq('date', date)
            .eq('class', className);

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data; // Returns array of { student_id, status, ... }
    },

    async upsert(attendanceRecords) {
        // attendanceRecords should be array of { student_id, class, date, status, teacher_id }
        if (!attendanceRecords || attendanceRecords.length === 0) return;

        const { data, error } = await supabase
            .from('attendance')
            .upsert(attendanceRecords, { onConflict: 'student_id, date' })
            .select();

        if (error) throw error;
        return data;
    },

    async fetchByRange(className, startDate, endDate, teacherId = null) {
        let query = supabase
            .from('attendance')
            .select('*')
            .eq('class', className)
            .gte('date', startDate)
            .lte('date', endDate);

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data;
    }
};

export const scoreOperations = {
    async fetchAll(teacherId = null) {
        let query = supabase
            .from('scores')
            .select('*')
            .order('updated_at', { ascending: false });

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async fetchByClassAndSubject(className, subject, teacherId = null) {
        let query = supabase
            .from('scores')
            .select('*')
            .eq('class', className)
            .eq('subject', subject);

        if (teacherId) {
            query = query.eq('teacher_id', teacherId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return data; // Returns array of score records
    },

    async upsert(scoreRecords) {
        if (!scoreRecords || scoreRecords.length === 0) return;

        const { data, error } = await supabase
            .from('scores')
            .upsert(scoreRecords, { onConflict: 'student_id, subject, academic_year, semester' })
            .select();

        if (error) throw error;
        return data;
    }
};
