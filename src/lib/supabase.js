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

// Helper to clean and format student payload before database operations
function cleanStudentRecord(record) {
    if (!record) return {};
    const clean = {};

    for (const [key, val] of Object.entries(record)) {
        if (key === 'type' || key === '__backendId' || key === 'npsn') continue; // strip internal UI / non-column metadata

        if (val === null || val === undefined) {
            clean[key] = null;
            continue;
        }

        if (typeof val === 'string') {
            // Remove zero-width & non-breaking spaces, then trim
            let trimmed = val.replace(/[\u00A0\u200B]/g, ' ').trim();
            // Remove surrounding single/double quotes
            trimmed = trimmed.replace(/^["']|["']$/g, '').trim();

            if (trimmed === "" || trimmed === "-" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") {
                clean[key] = null;
            } else {
                clean[key] = trimmed;
            }
        } else {
            clean[key] = val;
        }
    }

    // Ensure birth_date (and any key ending with _date or date) is strictly YYYY-MM-DD ISO string or null (never empty string "")
    for (const key of Object.keys(clean)) {
        if (key === 'birth_date' || key.endsWith('_date') || key === 'date') {
            const dateVal = clean[key];
            if (!dateVal || dateVal === "" || dateVal === "null" || dateVal === "undefined") {
                clean[key] = null;
            } else if (typeof dateVal === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateVal)) {
                // Valid ISO YYYY-MM-DD
            } else if (typeof dateVal === 'string') {
                const ms = Date.parse(dateVal);
                if (!isNaN(ms)) {
                    const d = new Date(ms);
                    if (!isNaN(d.getTime())) {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        clean[key] = `${yyyy}-${mm}-${dd}`;
                    } else {
                        clean[key] = null;
                    }
                } else {
                    clean[key] = null;
                }
            } else {
                clean[key] = null;
            }
        }
    }

    return clean;
}

// Dedicated operations for the flat 'students' table
export const studentOperations = {
    async fetchAll(teacherId = null) {
        let query = supabase
            .from('students')
            .select('*')
            .order('name', { ascending: true });

        if (teacherId) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id && user.id !== teacherId) {
                    query = query.or(`teacher_id.eq.${teacherId},teacher_id.eq.${user.id}`);
                } else {
                    query = query.eq('teacher_id', teacherId);
                }
            } catch (e) {
                query = query.eq('teacher_id', teacherId);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        return data;
    },

    async create(studentData) {
        const payload = cleanStudentRecord(studentData);
        const { data: { user } } = await supabase.auth.getUser();
        if (user && (!payload.teacher_id || payload.teacher_id.startsWith('teacher_'))) {
            payload.teacher_id = user.id;
        }

        const { data, error } = await supabase
            .from('students')
            .insert([payload])
            .select();

        if (error) throw error;
        return data[0];
    },

    async update(id, studentData) {
        const payload = cleanStudentRecord(studentData);
        delete payload.id; // Strip primary key from SET payload
        const { data: { user } } = await supabase.auth.getUser();
        if (user && (!payload.teacher_id || payload.teacher_id.startsWith('teacher_'))) {
            payload.teacher_id = user.id;
        }

        const { data, error } = await supabase
            .from('students')
            .update(payload)
            .eq('id', id)
            .select();

        if (error) throw error;
        return { ...data[0], __backendId: data[0].id, type: 'student' };
    },

    async delete(id) {
        if (!id) throw new Error("ID Siswa tidak valid.");

        // Clean up linked attendance and score records first to prevent foreign key constraint issues
        try {
            await supabase.from('attendance').delete().eq('student_id', id);
            await supabase.from('scores').delete().eq('student_id', id);
        } catch (cascadeErr) {
            console.warn("Cascade delete notice for student attendance/scores:", cascadeErr);
        }

        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);

        if (error) throw error;
    },

    async batchDelete(ids) {
        if (!ids || ids.length === 0) return;
        const validIds = ids.filter(Boolean);
        if (validIds.length === 0) return;

        // Clean up linked attendance and score records first for batch deletion
        try {
            await supabase.from('attendance').delete().in('student_id', validIds);
            await supabase.from('scores').delete().in('student_id', validIds);
        } catch (cascadeErr) {
            console.warn("Cascade batch delete notice for student attendance/scores:", cascadeErr);
        }

        const { error } = await supabase
            .from('students')
            .delete()
            .in('id', validIds);

        if (error) throw error;
    },

    async batchUpsert(students) {
        if (!students || students.length === 0) return;

        // Resolve active auth user ID (Auth UID) to guarantee RLS compliance
        let authUid = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user?.id) {
                authUid = user.id;
            } else {
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user?.id) {
                    authUid = session.user.id;
                }
            }
        } catch (authErr) {
            console.warn("Could not fetch Supabase auth user:", authErr);
        }

        // 1. Sanitize payload: strip internal fields, trim strings, enforce null for empty values, attach authUid
        const sanitized = students.map(s => {
            const clean = cleanStudentRecord(s);
            if (authUid) {
                clean.teacher_id = authUid;
            }
            return clean;
        });

        // 2. In-memory deduplication within the incoming payload
        const nisnSeen = new Map();
        const nisSeen = new Map();
        const deduplicatedPayload = [];

        for (const student of sanitized) {
            let existingIdx = -1;
            if (student.nisn && nisnSeen.has(student.nisn)) {
                existingIdx = nisnSeen.get(student.nisn);
            } else if (student.nis && nisSeen.has(student.nis)) {
                existingIdx = nisSeen.get(student.nis);
            }

            if (existingIdx !== -1) {
                // Merge/override with latest info from duplicate row in CSV
                deduplicatedPayload[existingIdx] = {
                    ...deduplicatedPayload[existingIdx],
                    ...student
                };
            } else {
                const idx = deduplicatedPayload.length;
                deduplicatedPayload.push(student);
                if (student.nisn) nisnSeen.set(student.nisn, idx);
                if (student.nis) nisSeen.set(student.nis, idx);
            }
        }

        // 3. Fetch existing students belonging strictly to this active teacher for cross-referencing
        let existingQuery = supabase.from('students').select('id, nisn, nis, name, teacher_id');
        if (authUid) {
            existingQuery = existingQuery.eq('teacher_id', authUid);
        }
        const { data: existingAll } = await existingQuery;

        const rawInsert = [];
        const rawUpdate = [];

        for (const student of deduplicatedPayload) {
            let existing = null;
            if (student.nisn) {
                existing = existingAll?.find(e => e.nisn && String(e.nisn).trim() === student.nisn);
            }
            if (!existing && student.nis) {
                existing = existingAll?.find(e => e.nis && String(e.nis).trim() === student.nis);
            }

            if (existing) {
                rawUpdate.push({ ...student, id: existing.id });
            } else {
                rawInsert.push(student);
            }
        }

        const toInsert = rawInsert.map(s => {
            const clean = cleanStudentRecord(s);
            if (authUid) clean.teacher_id = authUid;
            return clean;
        });
        const toUpdate = rawUpdate.map(s => {
            const clean = cleanStudentRecord(s);
            if (authUid) clean.teacher_id = authUid;
            return clean;
        });

        // Helper to get active teacher_id for single operations
        const ensureTeacherId = async (item) => {
            if (authUid) {
                item.teacher_id = authUid;
            } else {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id) {
                    authUid = user.id;
                    item.teacher_id = user.id;
                }
            }
            return item;
        };

        // 4. Perform insertions & updates with conflict resilience
        if (toInsert.length > 0) {
            const { error: errInsert } = await supabase.from('students').insert(toInsert);
            if (errInsert) {
                console.warn("Batch insert hit constraint/error, executing fallback per-record update/insert:", errInsert.message || errInsert);
                for (const student of toInsert) {
                    const cleanItem = await ensureTeacherId(cleanStudentRecord(student));

                    // Try to find if student already exists by NISN or NIS
                    let existingRecord = null;
                    if (cleanItem.nisn) {
                        const { data: foundByNisn } = await supabase.from('students').select('id').eq('nisn', cleanItem.nisn).maybeSingle();
                        if (foundByNisn) existingRecord = foundByNisn;
                    }
                    if (!existingRecord && cleanItem.nis) {
                        const { data: foundByNis } = await supabase.from('students').select('id').eq('nis', cleanItem.nis).maybeSingle();
                        if (foundByNis) existingRecord = foundByNis;
                    }

                    if (existingRecord?.id) {
                        const { id: existingId, ...updatePayload } = cleanItem;
                        const { error: updateErr } = await supabase.from('students').update(updatePayload).eq('id', existingRecord.id);
                        if (updateErr) {
                            console.error("Single update fallback failed for NISN:", cleanItem.nisn, updateErr.message || updateErr);
                            let msg = updateErr.message || 'Kesalahan database';
                            if (msg.includes('row-level security') || msg.includes('RLS')) {
                                msg = 'Akses ditolak oleh keamanan database (RLS). Pastikan Anda terhubung sebagai Guru.';
                            } else if (msg.includes('students_nisn_key') || msg.includes('unique constraint')) {
                                msg = `NISN "${cleanItem.nisn || '-'}" (Siswa: ${cleanItem.name || 'Tidak diketahui'}) sudah digunakan oleh siswa lain di database.`;
                            }
                            throw new Error(`Gagal memperbarui data siswa ${cleanItem.name || cleanItem.nisn}: ${msg}`);
                        }
                    } else {
                        const { error: singleErr } = await supabase.from('students').insert([cleanItem]);
                        if (singleErr) {
                            console.error("Single insert failed for student:", cleanItem.name, singleErr.message || singleErr);
                            let msg = singleErr.message || 'Gagal menyimpan data';
                            if (msg.includes('row-level security') || msg.includes('RLS')) {
                                msg = 'Akses ditolak oleh keamanan database (RLS). Pastikan akun Guru Anda aktif.';
                            } else if (msg.includes('students_nisn_key') || msg.includes('unique constraint')) {
                                msg = `NISN "${cleanItem.nisn || '-'}" sudah terdaftar untuk siswa lain di database.`;
                            }
                            throw new Error(`Gagal menambahkan siswa ${cleanItem.name} (NISN: ${cleanItem.nisn || '-'}): ${msg}`);
                        }
                    }
                }
            }
        }

        if (toUpdate.length > 0) {
            const { error: errUpdate } = await supabase.from('students').upsert(toUpdate);
            if (errUpdate) {
                console.warn("Batch update hit error, executing fallback single updates:", errUpdate.message || errUpdate);
                for (const student of toUpdate) {
                    const cleanItem = await ensureTeacherId(cleanStudentRecord(student));
                    const targetId = cleanItem.id || student.id;
                    if (targetId) {
                        const { id: ignoreId, ...updatePayload } = cleanItem;
                        const { error: sUpdateErr } = await supabase.from('students').update(updatePayload).eq('id', targetId);
                        if (sUpdateErr) {
                            console.error("Fallback single update failed for ID:", targetId, sUpdateErr.message || sUpdateErr);
                            let msg = sUpdateErr.message || 'Gagal memperbarui data';
                            if (msg.includes('row-level security') || msg.includes('RLS')) {
                                msg = 'Akses ditolak oleh keamanan database (RLS). Pastikan Anda terhubung sebagai akun Guru yang sah.';
                            } else if (msg.includes('students_nisn_key') || msg.includes('unique constraint')) {
                                msg = `NISN "${cleanItem.nisn || '-'}" (Siswa: ${cleanItem.name || 'Tidak diketahui'}) sudah terdaftar pada siswa lain di database.`;
                            }
                            throw new Error(`Gagal memperbarui data siswa ${cleanItem.name || targetId}: ${msg}`);
                        }
                    }
                }
            }
        }

        return [...toInsert, ...toUpdate];
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
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id && user.id !== teacherId) {
                    query = query.or(`teacher_id.eq.${teacherId},teacher_id.eq.${user.id}`);
                } else {
                    query = query.eq('teacher_id', teacherId);
                }
            } catch (e) {
                query = query.eq('teacher_id', teacherId);
            }
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
    },

    async deleteByDateAndClass(date, className, teacherId = null) {
        let query = supabase
            .from('attendance')
            .delete()
            .eq('date', date)
            .eq('class', className);

        if (teacherId) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id && user.id !== teacherId) {
                    query = query.or(`teacher_id.eq.${teacherId},teacher_id.eq.${user.id}`);
                } else {
                    query = query.eq('teacher_id', teacherId);
                }
            } catch (e) {
                query = query.eq('teacher_id', teacherId);
            }
        }

        const { error } = await query;
        if (error) throw error;
        return true;
    }
};

export const scoreOperations = {
    async fetchAll(teacherId = null) {
        let query = supabase
            .from('scores')
            .select('*')
            .order('updated_at', { ascending: false });

        if (teacherId) {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user?.id && user.id !== teacherId) {
                    query = query.or(`teacher_id.eq.${teacherId},teacher_id.eq.${user.id}`);
                } else {
                    query = query.eq('teacher_id', teacherId);
                }
            } catch (e) {
                query = query.eq('teacher_id', teacherId);
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async fetchByClassAndSubject(className, subject, teacherId = null) {
        let scoresData = [];

        let authUid = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            authUid = user?.id;
        } catch (e) { }

        const teacherIds = Array.from(new Set([teacherId, authUid].filter(id => id && id !== 'undefined')));

        // 1. Query 'scores' table
        try {
            let query = supabase
                .from('scores')
                .select('*')
                .eq('class', className)
                .eq('subject', subject);

            if (teacherIds.length > 0) {
                const orCond = teacherIds.map(id => `teacher_id.eq.${id}`).join(',');
                query = query.or(orCond);
            }

            const { data, error } = await query;
            if (!error && data) {
                scoresData = [...data];
            }
        } catch (e) {
            console.warn("fetchByClassAndSubject scores table query error:", e);
        }

        // 2. Query 'app_data' table (type: 'scores')
        try {
            let query = supabase
                .from('app_data')
                .select('*')
                .eq('type', 'scores');

            if (teacherIds.length > 0) {
                const authCond = teacherIds.map(id => `auth_id.eq.${id}`).join(',');
                const teachCond = teacherIds.map(id => `content->>teacher_id.eq.${id}`).join(',');
                query = query.or(`${authCond},${teachCond}`);
            }

            const { data: appData } = await query;
            if (appData && appData.length > 0) {
                appData.forEach(d => {
                    const content = d.content || {};
                    if (String(content.class).trim() === String(className).trim() &&
                        String(content.subject).trim() === String(subject).trim()) {
                        scoresData.push({ ...content, __backendId: d.id });
                    }
                });
            }
        } catch (e) {
            console.warn("fetchByClassAndSubject app_data table query error:", e);
        }

        return scoresData;
    },

    async upsert(scoreRecords) {
        if (!scoreRecords || scoreRecords.length === 0) return;

        // 1. Dynamic teacher_id resolution
        let authUid = null;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            authUid = user?.id;
        } catch (e) {
            console.warn("Auth user fetch warning in scoreOperations.upsert:", e);
        }

        // 2. Probe existing scores table schema keys if data exists
        let knownSchemaKeys = null;
        try {
            const { data: probeRows } = await supabase.from('scores').select('*').limit(1);
            if (probeRows && probeRows.length > 0) {
                knownSchemaKeys = new Set(Object.keys(probeRows[0]));
            }
        } catch (e) {
            console.warn("Scores table schema probe warning:", e);
        }

        // Helper to generate score object
        const getScoreMap = (raw) => {
            const map = {};
            const keys = [
                'f1', 'f2', 'f3', 'f4', 'f5', 'f6', 'f7', 'f8', 'f9', 'f10',
                's1', 's2', 's3', 's4', 's5', 's6', 's7', 's8', 's9', 's10',
                'pts', 'pas', 'avg_f', 'avg_s', 'na', 'weight_fs', 'weight_pts', 'weight_pas'
            ];
            keys.forEach(k => {
                if (raw[k] !== undefined && raw[k] !== null) {
                    const p = parseFloat(raw[k]);
                    map[k] = isNaN(p) ? 0 : p;
                }
            });
            return map;
        };

        // Format candidate payloads
        const buildCandidates = (rec) => {
            const raw = { ...rec };
            if (authUid && (!raw.teacher_id || raw.teacher_id === 'undefined')) {
                raw.teacher_id = authUid;
            }

            const base = {
                student_id: raw.student_id,
                teacher_id: raw.teacher_id,
                class: raw.class,
                subject: raw.subject,
                academic_year: raw.academic_year || "2024/2025",
                semester: raw.semester || "1"
            };
            if (raw.id) base.id = raw.id;

            const scoreMap = getScoreMap(raw);

            // If we already know the exact schema keys from probing
            if (knownSchemaKeys) {
                const clean = { ...base };
                Object.keys(raw).forEach(k => {
                    if (knownSchemaKeys.has(k)) {
                        clean[k] = raw[k];
                    }
                });
                if (knownSchemaKeys.has('scores')) clean.scores = scoreMap;
                if (knownSchemaKeys.has('data')) clean.data = scoreMap;
                if (knownSchemaKeys.has('score')) clean.score = scoreMap;
                if (knownSchemaKeys.has('nilai')) clean.nilai = scoreMap;
                if (knownSchemaKeys.has('na')) clean.na = scoreMap.na || 0;
                return [clean];
            }

            return [
                { ...base, scores: scoreMap },
                { ...base, data: scoreMap },
                { ...base, score: scoreMap },
                { ...base, nilai: scoreMap },
                { ...base, ...scoreMap }
            ];
        };

        // 3. Fetch existing score IDs for matching
        const sample = scoreRecords[0];
        const studentIds = scoreRecords.map(r => r.student_id).filter(Boolean);
        let existingScores = [];
        if (studentIds.length > 0 && sample?.subject) {
            try {
                const { data } = await supabase
                    .from('scores')
                    .select('id, student_id, subject, academic_year, semester')
                    .in('student_id', studentIds)
                    .eq('subject', sample.subject);
                existingScores = data || [];
            } catch (e) {
                console.warn("Error fetching existing scores:", e);
            }
        }

        // 4. Process all records in parallel with candidate format caching for maximum speed
        let workingCandidateIndex = null;

        const saveSingleRecord = async (rawRecord) => {
            const existing = existingScores?.find(e =>
                String(e.student_id) === String(rawRecord.student_id) &&
                String(e.subject).trim() === String(rawRecord.subject).trim()
            );

            const recToSave = existing ? { ...rawRecord, id: existing.id } : rawRecord;
            const candidates = buildCandidates(recToSave);

            const candidateOrder = workingCandidateIndex !== null ?
                [candidates[workingCandidateIndex], ...candidates.filter((_, idx) => idx !== workingCandidateIndex)] :
                candidates;

            for (const candidate of candidateOrder) {
                if (!candidate) continue;

                if (existing?.id) {
                    const { id, ...updateFields } = candidate;
                    const { data: upData, error: upErr } = await supabase
                        .from('scores')
                        .update(updateFields)
                        .eq('id', existing.id)
                        .select();
                    if (!upErr && upData && upData.length > 0) {
                        if (workingCandidateIndex === null) {
                            const originalIdx = candidates.indexOf(candidate);
                            if (originalIdx !== -1) workingCandidateIndex = originalIdx;
                        }
                        return upData[0];
                    }
                } else {
                    const { id, ...insertFields } = candidate;
                    const { data: insData, error: insErr } = await supabase
                        .from('scores')
                        .insert(insertFields)
                        .select();
                    if (!insErr && insData && insData.length > 0) {
                        if (workingCandidateIndex === null) {
                            const originalIdx = candidates.indexOf(candidate);
                            if (originalIdx !== -1) workingCandidateIndex = originalIdx;
                        }
                        return insData[0];
                    }
                }
            }

            // Ultimate Fallback: Save to universal app_data table (type: 'scores')
            try {
                const scoreMap = getScoreMap(rawRecord);
                const appDataRecord = {
                    type: 'scores',
                    auth_id: authUid,
                    content: {
                        student_id: rawRecord.student_id,
                        teacher_id: rawRecord.teacher_id || authUid,
                        class: rawRecord.class,
                        subject: rawRecord.subject,
                        academic_year: rawRecord.academic_year || "2024/2025",
                        semester: rawRecord.semester || "1",
                        ...scoreMap
                    }
                };

                const { data: existingApp } = await supabase
                    .from('app_data')
                    .select('id')
                    .eq('type', 'scores')
                    .filter('content->>student_id', 'eq', String(rawRecord.student_id))
                    .filter('content->>subject', 'eq', String(rawRecord.subject))
                    .maybeSingle();

                if (existingApp?.id) {
                    const { data: upApp, error: upAppErr } = await supabase
                        .from('app_data')
                        .update(appDataRecord)
                        .eq('id', existingApp.id)
                        .select();
                    if (!upAppErr && upApp) {
                        return appDataRecord.content;
                    }
                } else {
                    const { data: insApp, error: insAppErr } = await supabase
                        .from('app_data')
                        .insert([appDataRecord])
                        .select();
                    if (!insAppErr && insApp) {
                        return appDataRecord.content;
                    }
                }
            } catch (appErr) {
                console.error("app_data fallback score save error:", appErr);
            }

            return null;
        };

        const results = await Promise.all(scoreRecords.map(saveSingleRecord));
        return results.filter(Boolean);
    }
};
