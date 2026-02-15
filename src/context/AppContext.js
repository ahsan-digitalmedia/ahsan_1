"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase, supabaseData, studentOperations, attendanceOperations, scoreOperations } from "@/lib/supabase";

const AppContext = createContext();

export function AppProvider({ children }) {
    const [state, setState] = useState({
        isLoading: true,
        currentUser: null,
        currentUserType: null,
        sidebarOpen: true,
        currentPage: "dashboard",
        showModal: false,
        modalType: null,
        modalMode: "add",
        editingItem: null,
        teachers: [],
        students: [],
        attendance: [],
        scores: [],
        modulAjar: [],
        assignments: [],
        journal: [],
        schedule: [],
        journal_class: [],
        journal_teacher: [],
        appData: [],
        config: {},
        notifications: [],
        showNotifications: false,
        showDeleteConfirm: false,
        deletingItem: null,
        scoreTPCount: 4,
        scoreSumatifCount: 4,
        scoreWeights: { fs: 80, pts: 10, pas: 10 },
    });

    const updateState = (updates) => {
        setState((prev) => ({ ...prev, ...updates }));
    };

    const processData = useCallback(async () => {
        try {
            // 1. Fetch Global Config First (Available to everyone)
            const { data: configRecord, error: configError } = await supabase
                .from('app_data')
                .select('*')
                .eq('type', 'config')
                .maybeSingle();

            let globalConfig = {};
            if (configRecord && !configError) {
                globalConfig = {
                    ...configRecord.content,
                    __backendId: configRecord.id,
                    type: configRecord.type,
                    created_at: configRecord.created_at,
                    auth_id: configRecord.auth_id
                };
            }

            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                const isSuperAdmin = user.email === 'admin@sekolah.id';

                // Fetch basic app data - let RLS handle the privacy filtering
                let records = await supabaseData.fetchAll('app_data');

                // If teacher and no teacher record found (might be created by admin or auth_id not synced)
                // We should ensure we can always find OUR OWN teacher record
                if (!isSuperAdmin && !records.some(r => r.type === 'teacher' && r.email === user.email)) {
                    const { data: ownProfile, error: ownProfileError } = await supabase
                        .from('app_data')
                        .select('*')
                        .eq('type', 'teacher')
                        .filter('content->>email', 'eq', user.email);

                    if (ownProfile && ownProfile.length > 0) {
                        const profile = ownProfile[0];
                        // If auth_id is missing, sync it now to claim this record
                        if (!profile.auth_id) {
                            await supabase
                                .from('app_data')
                                .update({ auth_id: user.id })
                                .eq('id', profile.id);
                        }

                        const formattedProfile = ownProfile.map(d => ({
                            ...d.content,
                            __backendId: d.id,
                            type: d.type,
                            created_at: d.created_at,
                            auth_id: d.auth_id
                        }));
                        records = [...records, ...formattedProfile];
                    }
                }

                // Merge global config into records if not already there
                if (globalConfig.__backendId && !records.some(r => r.__backendId === globalConfig.__backendId)) {
                    records.push(globalConfig);
                }

                const dataMap = {
                    student: [],
                    teacher: [],
                    attendance: [],
                    score: [],
                    modul_ajar: [],
                    assignment: [],
                    journal: [],
                    schedule: [],
                    journal_class: [],
                    journal_teacher: [],
                    config: {}
                };

                const filteredAppData = [];

                const teachersInData = records.filter(r => r.type === 'teacher');
                const teacherRecord = teachersInData.find(t =>
                    String(t.email).toLowerCase() === String(user.email).toLowerCase()
                ) || {
                    name: "Guru",
                    email: user.email,
                    role: "teacher"
                };

                const currentTeacherId = teacherRecord.__backendId;

                records.forEach(record => {
                    if (dataMap[record.type]) {
                        // For teacher accounts, only show their own journal/modul etc.
                        const isGlobal = record.type === 'config';
                        const isOwner = isSuperAdmin || isGlobal ||
                            record.auth_id === user.id ||
                            record.teacher_id === currentTeacherId ||
                            record.content?.teacher_id === currentTeacherId;

                        if (isOwner) {
                            filteredAppData.push(record);
                            if (Array.isArray(dataMap[record.type])) {
                                dataMap[record.type].push(record);
                            } else {
                                dataMap[record.type] = record;
                            }
                        }
                    }
                });

                // Fetch Students, Attendance, and Scores explicitly from their tables
                let studentsData = [];
                let attendanceData = [];
                let scoresData = [];
                try {
                    const targetId = isSuperAdmin ? null : currentTeacherId;

                    if (targetId || isSuperAdmin) {
                        [studentsData, attendanceData, scoresData] = await Promise.all([
                            studentOperations.fetchAll(targetId),
                            attendanceOperations.fetchAll(targetId),
                            scoreOperations.fetchAll(targetId)
                        ]);
                    }

                    // SOFT PROBE (Check if RLS is likely blocking)
                    if (!isSuperAdmin && currentTeacherId && studentsData.length === 0) {
                        const { count, error } = await supabase.from('students').select('*', { count: 'exact', head: true });
                        if (!error && count > 0) {
                            // There IS data in the table, but we got 0. RLS is working.
                            console.log("AppContext: RLS is active. User has 0 students linked to their ID.");
                        }
                    }
                } catch (err) {
                    console.error("AppContext: Fetching related data failed:", err);
                }

                updateState({
                    currentUser: isSuperAdmin ? { ...teacherRecord, role: 'admin', name: "Administrator" } : teacherRecord,
                    currentUserType: isSuperAdmin ? 'admin' : 'teacher',
                    teachers: dataMap.teacher,
                    students: studentsData,
                    attendance: attendanceData,
                    scores: scoresData,
                    modulAjar: dataMap.modul_ajar,
                    assignments: dataMap.assignment,
                    journal: dataMap.journal,
                    schedule: dataMap.schedule,
                    journal_class: dataMap.journal_class,
                    journal_teacher: dataMap.journal_teacher,
                    appData: filteredAppData,
                    config: dataMap.config || {},
                    isLoading: false,
                    isLoggedIn: true
                });

            } else {
                updateState({
                    currentUser: null,
                    isLoggedIn: false,
                    isLoading: false,
                    config: globalConfig // Still update config even if logged out
                });
            }
        } catch (error) {
            console.error("Critical data processing error:", error);
            const { data: { user } } = await supabase.auth.getUser();
            updateState({
                currentUser: user ? { name: "Guru", email: user.email, role: "teacher" } : null,
                isLoggedIn: !!user,
                isLoading: false
            });
        }
    }, []);

    useEffect(() => {
        // Initial fetch
        processData();

        // Setup auth listener
        const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN') {
                processData();
            } else if (event === 'SIGNED_OUT') {
                updateState({
                    currentUser: null,
                    isLoggedIn: false,
                    teachers: [],
                    students: [],
                    scores: []
                });
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [processData]);

    // Real-time subscription could go here
    useEffect(() => {
        const channel = supabase
            .channel('schema-db-changes')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'app_data',
                },
                (payload) => {
                    // Simple approach: re-fetch on any change
                    // Optimization: Apply payload directly to state
                    processData();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        }
    }, [processData]);


    return (
        <AppContext.Provider value={{ state, updateState, processData }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    return useContext(AppContext);
}
