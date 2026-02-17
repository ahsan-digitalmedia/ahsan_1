"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { supabase, supabaseData, attendanceOperations } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function ReportsPage() {
    const { state, processData } = useApp();
    const { teachers, students, attendance } = state;

    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [lastRefresh, setLastRefresh] = useState(new Date());

    const fetchData = async () => {
        setLoading(true);
        try {
            const logs = await supabaseData.fetchRecentAuditLogs(20);
            setAuditLogs(logs);
            setLastRefresh(new Date());
        } catch (error) {
            console.error("Error fetching reports data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Set up real-time subscription for audit logs
        const channel = supabase
            .channel('audit_changes')
            .on('postgres_changes', {
                event: 'INSERT', table: 'audit_logs'
            }, () => {
                fetchData();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // 1. Statistics Aggregation
    const todayStr = new Date().toISOString().split('T')[0];

    const stats = useMemo(() => {
        const todayAttendance = attendance.filter(a => a.date === todayStr);
        const uniqueTeachersToday = new Set(todayAttendance.map(a => a.teacher_id)).size;

        return {
            activeTeachers: teachers.filter(t => t.status === 'active').length,
            todaySyncs: uniqueTeachersToday,
            progressPercent: teachers.length > 0 ? Math.round((uniqueTeachersToday / teachers.length) * 100) : 0,
            totalStudents: students.length
        };
    }, [teachers, attendance, students, todayStr]);

    // 2. Format Audit Logs into Readable Sentences
    const formatLog = (log) => {
        const actionMap = {
            'INSERT': 'menambahkan',
            'UPDATE': 'memperbarui',
            'DELETE': 'menghapus'
        };

        const tableMap = {
            'app_data': 'data aplikasi',
            'students': 'data siswa',
            'attendance': 'absensi',
            'scores': 'nilai'
        };

        const action = actionMap[log.action] || log.action;
        const table = tableMap[log.table_name] || log.table_name;

        // Try to find teacher name if changed_by is a teacher auth_id
        const teacher = teachers.find(t => t.auth_id === log.changed_by);
        const actor = teacher ? teacher.name : (log.changed_by ? 'Admin' : 'Sistem');

        let detail = "";
        if (log.table_name === 'app_data' && log.new_data?.type === 'teacher') {
            detail = `guru "${log.new_data.content?.name || 'Unknown'}"`;
        } else if (log.table_name === 'students') {
            detail = `siswa "${log.new_data?.name || 'Unknown'}"`;
        }

        return {
            sentence: `${actor} ${action} ${table} ${detail}`.trim(),
            time: new Date(log.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            date: new Date(log.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            action: log.action
        };
    };

    return (
        <div className="space-y-8 animate-fadeIn">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight text-center md:text-left">Laporan Terpadu</h1>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1 text-center md:text-left">Pantau aktivitas dan statistik sekolah secara real-time.</p>
                </div>
                <div className="flex items-center justify-center gap-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
                        Terakhir Update: {lastRefresh.toLocaleTimeString('id-ID')}
                    </span>
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
                    >
                        <svg className={cn("w-5 h-5", loading && "animate-spin")} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                    </button>
                </div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-3xl shadow-modern border border-slate-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-3xl shadow-inner border border-indigo-100/50">
                        👨‍🏫
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Guru Aktif</p>
                        <p className="text-3xl font-black text-slate-800">{stats.activeTeachers}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-modern border border-slate-100 group hover:translate-y-[-4px] transition-all relative overflow-hidden">
                    <div className="flex items-center gap-6 relative z-10">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-3xl shadow-inner border border-emerald-100/50">
                            📝
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Kepatuhan Hari Ini</p>
                            <div className="flex items-end justify-between">
                                <p className="text-3xl font-black text-slate-800">{stats.todaySyncs} <span className="text-sm font-bold text-slate-400 tracking-normal">GURU</span></p>
                                <span className="text-xs font-black text-emerald-600 mb-1.5">{stats.progressPercent}%</span>
                            </div>
                        </div>
                    </div>
                    <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                            style={{ width: `${stats.progressPercent}%` }}
                        ></div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl shadow-modern border border-slate-100 flex items-center gap-6 group hover:translate-y-[-4px] transition-all">
                    <div className="w-16 h-16 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center text-3xl shadow-inner border border-purple-100/50">
                        🎓
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">Total Siswa</p>
                        <p className="text-3xl font-black text-slate-800">{stats.totalStudents}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Live Activity Feed */}
                <div className="bg-white rounded-[2.5rem] shadow-modern border border-slate-100 flex flex-col overflow-hidden h-[600px]">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center text-lg">
                                🔔
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Live Activity Feed</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Aktivitas sistem 24 jam terakhir</p>
                            </div>
                        </div>
                        {loading && <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg animate-pulse text-[10px] font-bold">UPDATING...</div>}
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar space-y-6">
                        {auditLogs.length > 0 ? (
                            auditLogs.map((log) => {
                                const formatted = formatLog(log);
                                return (
                                    <div key={log.id} className="flex gap-4 group">
                                        <div className="flex flex-col items-center">
                                            <div className={cn(
                                                "w-10 h-10 rounded-xl flex items-center justify-center text-sm shadow-sm transition-transform group-hover:scale-110",
                                                formatted.action === 'INSERT' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" :
                                                    formatted.action === 'UPDATE' ? "bg-blue-50 text-blue-600 border border-blue-100" :
                                                        "bg-rose-50 text-rose-600 border border-rose-100"
                                            )}>
                                                {formatted.action === 'INSERT' ? '➕' : formatted.action === 'UPDATE' ? '✏️' : '🗑️'}
                                            </div>
                                            <div className="w-0.5 flex-1 bg-slate-50 my-2"></div>
                                        </div>
                                        <div className="flex-1 pb-6">
                                            <div className="flex items-center justify-between mb-1">
                                                <p className="text-[13px] font-bold text-slate-700 leading-snug">{formatted.sentence}</p>
                                                <span className="text-[10px] font-black text-slate-300 uppercase shrink-0 ml-4">{formatted.time}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{formatted.date} &bull; {log.table_name}</p>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-10">
                                <div className="text-4xl mb-4 grayscale opacity-30">📭</div>
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Belum ada aktivitas tercatat</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Daily Completion List */}
                <div className="bg-white rounded-[2.5rem] shadow-modern border border-slate-100 flex flex-col overflow-hidden h-[600px]">
                    <div className="p-8 border-b border-slate-50">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-lg shadow-lg shadow-indigo-100">
                                📅
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Kepatuhan Guru Hari Ini</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="sticky top-0 bg-white z-10 border-b border-slate-50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Guru</th>
                                    <th className="px-8 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status Absensi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {teachers.filter(t => t.status === 'active').map((teacher) => {
                                    const hasFilled = attendance.some(a => a.teacher_id === teacher.auth_id && a.date === todayStr);
                                    return (
                                        <tr key={teacher.__backendId} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5">
                                                <p className="text-[13px] font-bold text-slate-700">{teacher.name}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">{teacher.class || "Guru Kelas"}</p>
                                            </td>
                                            <td className="px-8 py-5 text-center">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight border",
                                                    hasFilled
                                                        ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                                                        : "bg-slate-50 text-slate-300 border-slate-100"
                                                )}>
                                                    <div className={cn("w-1.5 h-1.5 rounded-full", hasFilled ? "bg-emerald-500 animate-pulse" : "bg-slate-200")}></div>
                                                    {hasFilled ? "SUDAH ISI" : "BELUM ISI"}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {teachers.filter(t => t.status === 'active').length === 0 && (
                            <div className="text-center py-20 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                Tidak ada data guru aktif
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .custom-scrollbar::-webkit-scrollbar {
                    width: 5px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                    background: transparent;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: #e2e8f0;
                    border-radius: 10px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: #cbd5e1;
                }
            `}</style>
        </div>
    );
}
