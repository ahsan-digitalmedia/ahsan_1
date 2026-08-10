"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseData } from "@/lib/supabase";
import { cn } from "@/lib/utils";

function checkOnlinePresence(teacher) {
    if (!teacher || teacher.status !== 'active' || !teacher.last_seen_at) {
        return { isOnline: false, label: 'Offline' };
    }

    const diffSeconds = Math.max(0, Math.floor((Date.now() - new Date(teacher.last_seen_at).getTime()) / 1000));

    if (diffSeconds <= 90) {
        return { isOnline: true, label: 'Sedang Aktif' };
    } else if (diffSeconds < 3600) {
        const mins = Math.floor(diffSeconds / 60);
        return { isOnline: false, label: `Aktif ${mins}m lalu` };
    } else if (diffSeconds < 86400) {
        const hours = Math.floor(diffSeconds / 3600);
        return { isOnline: false, label: `Aktif ${hours}j lalu` };
    } else {
        return { isOnline: false, label: 'Offline' };
    }
}

export default function TeachersPage() {
    const { state, updateState, processData } = useApp();
    const { teachers } = state;
    const [tick, setTick] = React.useState(0);

    // Auto-tick every 10s to update presence timestamps
    React.useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 10000);
        return () => clearInterval(timer);
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [showAll, setShowAll] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const filteredTeachers = useMemo(() => {
        return teachers.filter((t) => {
            const matchesSearch =
                t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.nip?.includes(searchQuery) ||
                t.email?.toLowerCase().includes(searchQuery.toLowerCase());

            const isTeacherOnline = checkOnlinePresence(t).isOnline;
            const matchesStatus = filterStatus === "all" ||
                (filterStatus === "online" ? isTeacherOnline : t.status === filterStatus);

            return matchesSearch && matchesStatus;
        });
    }, [teachers, searchQuery, filterStatus, tick]);

    // Reset to page 1 on search or filter change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, filterStatus]);

    const totalPages = Math.ceil(filteredTeachers.length / pageSize) || 1;
    const displayedTeachers = showAll
        ? filteredTeachers
        : filteredTeachers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const stats = {
        total: teachers.length,
        active: teachers.filter(t => t.status === 'active').length,
        inactive: teachers.filter(t => t.status === 'inactive').length,
        pending: teachers.filter(t => t.status === 'pending').length
    };

    const handleToggleStatus = async (teacher) => {
        const isActive = teacher.status === 'active';
        const newStatus = isActive ? 'inactive' : 'active';
        const actionName = isActive ? 'non-aktifkan' : 'aktifkan';

        if (!confirm(`Apakah Anda yakin ingin ${actionName} akses guru "${teacher.name}"?`)) return;

        try {
            await supabaseData.update(teacher.__backendId, {
                ...teacher,
                status: newStatus
            });
            // State update is handled by subscription/context refresh
        } catch (error) {
            console.error(`Error changing status to ${newStatus}:`, error);
            alert(`Gagal ${actionName} guru.`);
        }
    };

    const handleSyncAuth = async (teacher) => {
        const cleanEmail = String(teacher.email || "").trim().toLowerCase();
        if (!cleanEmail || !teacher.password) {
            alert("Email atau password guru tidak ditemukan. Pastikan data profil lengkap.");
            return;
        }

        if (!confirm(`Apakah Anda ingin mengaktifkan akses Login untuk "${teacher.name}"?\nEmail: ${cleanEmail}`)) return;

        try {
            updateState({ loading: true });

            // 0. Use a temporary client to avoid kicking out the Admin session
            const tempSupabase = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            // 1. Sign Up the teacher to Supabase Auth using the temp client
            const { data, error: authError } = await tempSupabase.auth.signUp({
                email: cleanEmail,
                password: teacher.password,
            });

            if (authError) {
                // If user already exists, we can't get their ID directly as Admin
                // but we can tell the admin to ask them to login (which will auto-sync)
                if (authError.message?.includes("already registered")) {
                    alert(`Email ${cleanEmail} sudah memiliki akun di sistem.\n\nSaran: Minta Guru ini untuk mencoba LOGIN. Sistem akan otomatis menghubungkan akunnya saat login pertama kali.`);
                    return;
                }
                throw authError;
            }

            if (data.user) {
                // 2. Update the profile with the new auth_id (Both in JSON and Top-level column)
                const { error: dbError } = await supabase
                    .from('app_data')
                    .update({
                        content: { ...teacher, auth_id: data.user.id, email: cleanEmail },
                        auth_id: data.user.id,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', teacher.__backendId);

                if (dbError) throw dbError;

                await processData('sync_success'); // Force refresh context state

                alert(`Berhasil membuat akun autentikasi untuk ${teacher.name}. Status akan segera diperbarui.`);
            }
        } catch (error) {
            console.error("Error syncing auth:", error);
            alert(`Gagal mensinkronisasi akun: ${error.message}`);
        } finally {
            updateState({ loading: false });
        }
    };

    return (
        <div className="animate-fadeIn">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                <div className="animate-slideIn">
                    <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Manajemen Guru</h1>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Kelola data tenaga pendidik dan akses sistem.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => processData('manual_refresh')}
                        className="bg-white text-slate-600 px-5 py-3.5 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all flex items-center gap-2"
                        title="Segarkan Data"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                        Refresh
                    </button>
                    <button
                        onClick={() => updateState({ showModal: true, modalType: 'teacher', modalMode: 'add', editingItem: null })}
                        className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Tambah Guru Baru
                    </button>
                </div>
            </div>

            {/* Stats Mini Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
                <StatCard label="Total Guru" value={stats.total} color="indigo" gradient="gradient-blue" />
                <StatCard label="Perlu Aktivasi" value={stats.pending} color="orange" gradient="gradient-orange" />
                <StatCard label="Aktif" value={stats.active} color="emerald" gradient="gradient-teal" />
                <StatCard label="Non-aktif" value={stats.inactive} color="rose" gradient="gradient-rose" />
            </div>

            {/* Filters Area */}
            <div className="bg-white p-5 rounded-2xl shadow-modern border border-slate-100 mb-8 flex flex-col md:flex-row gap-5 items-center">
                <div className="relative flex-1 w-full group">
                    <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-indigo-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <input
                        type="text"
                        placeholder="Cari nama, NIP, atau email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-6 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-semibold text-slate-600 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 outline-none transition-all placeholder:text-slate-300"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto shrink-0 font-bold">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full md:w-48 px-5 py-3 bg-slate-50 border border-slate-100 rounded-xl text-[13px] font-bold uppercase text-slate-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 outline-none appearance-none tracking-widest cursor-pointer hover:border-indigo-100 transition-all"
                    >
                        <option value="all">⚡ Filter Status</option>
                        <option value="online">🟢 SEDANG ONLINE</option>
                        <option value="pending">⏳ Perlu Aktivasi</option>
                        <option value="active">✅ AKTIF</option>
                        <option value="inactive">🔴 NON-AKTIF</option>
                    </select>
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="px-4 py-3 bg-indigo-50 text-indigo-600 rounded-xl text-[12px] font-bold uppercase tracking-wider hover:bg-indigo-100 transition-all border border-indigo-100 shrink-0"
                    >
                        {showAll ? "Tampilkan 10" : `Tampilkan Semua (${filteredTeachers.length})`}
                    </button>
                </div>
            </div>

            {/* Teachers Table/List */}
            <div className="bg-white rounded-2xl shadow-modern border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-4 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-12">No.</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Informasi Guru</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Kontak & NIP</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden md:table-cell">Kelas & Mapel</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Auth</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Status</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {displayedTeachers.map((teacher, i) => {
                                const { isOnline, label: presenceLabel } = checkOnlinePresence(teacher);
                                const globalIndex = showAll ? i + 1 : (currentPage - 1) * pageSize + i + 1;
                                return (
                                    <tr key={teacher.__backendId || teacher.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-4 py-4 text-xs font-bold text-slate-400 text-center">
                                            {globalIndex}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div className="relative">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-sm",
                                                        ['gradient-blue', 'gradient-indigo', 'gradient-purple', 'gradient-pink', 'gradient-orange'][i % 5]
                                                    )}>
                                                        {teacher.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {isOnline && (
                                                        <span className="absolute -top-1 -right-1 flex h-3 w-3">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500 border-2 border-white"></span>
                                                        </span>
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-800">{teacher.name}</p>
                                                        {isOnline && (
                                                            <span className="text-[9px] font-extrabold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100">
                                                                ONLINE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[11px] text-slate-500 font-medium">{teacher.school_name || "SDN 1 PONCOWATI"}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <p className="text-xs font-bold text-slate-700">{teacher.nip}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{teacher.email}</p>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <p className="text-xs font-bold text-slate-700">{teacher.class || "Guru Kelas"}</p>
                                            <p className="text-[11px] text-slate-400 font-medium">{teacher.subject || "Umum"}</p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn("px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-wider",
                                                teacher.auth_id ? "bg-indigo-50 text-indigo-600 border border-indigo-100" : "bg-amber-50 text-amber-600 border border-amber-100"
                                            )}>
                                                {teacher.auth_id ? 'Terhubung' : 'Lokal'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={cn("px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-widest flex items-center justify-center gap-1 mx-auto w-fit",
                                                isOnline ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                                            )}>
                                                {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
                                                {presenceLabel}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleToggleStatus(teacher)}
                                                    className={cn(
                                                        "p-2 rounded-lg transition-all shadow-sm active:scale-95",
                                                        teacher.status === 'active'
                                                            ? "text-rose-500 hover:bg-rose-50"
                                                            : "text-emerald-500 hover:bg-emerald-50"
                                                    )}
                                                    title={teacher.status === 'active' ? "Non-aktifkan Akun" : "Aktifkan Akun"}
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        {teacher.status === 'active' ? (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"></path>
                                                        ) : (
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path>
                                                        )}
                                                    </svg>
                                                </button>
                                                {!teacher.auth_id && (
                                                    <button
                                                        onClick={() => handleSyncAuth(teacher)}
                                                        className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-all shadow-sm active:scale-95"
                                                        title="Hubungkan ke Autentikasi"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"></path>
                                                        </svg>
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => updateState({ showModal: true, modalType: 'teacher', modalMode: 'edit', editingItem: teacher })}
                                                    className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Guru"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => updateState({ showDeleteConfirm: true, deletingItem: { ...teacher, deleteType: 'teacher' } })}
                                                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Hapus Guru"
                                                >
                                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                    </svg>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                    {filteredTeachers.length === 0 && (
                        <div className="text-center py-20">
                            <p className="text-slate-400 font-medium">Tidak ada data guru yang sesuai pencarian.</p>
                        </div>
                    )}
                </div>

                {/* Pagination Footer */}
                {filteredTeachers.length > 0 && !showAll && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                        <span className="text-slate-500 font-medium">
                            Menampilkan <strong className="text-slate-700">{(currentPage - 1) * pageSize + 1}</strong>–<strong className="text-slate-700">{Math.min(currentPage * pageSize, filteredTeachers.length)}</strong> dari <strong className="text-slate-700">{filteredTeachers.length}</strong> Guru
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all"
                            >
                                &laquo; Sebelum
                            </button>
                            <span className="font-bold text-slate-600 px-2">
                                {currentPage} / {totalPages}
                            </span>
                            <button
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-all"
                            >
                                Selanjutnya &raquo;
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function StatCard({ label, value, color, gradient }) {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-modern border border-slate-100 flex items-center gap-5 group hover:scale-[1.02] transition-all">
            <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl shadow-sm relative overflow-hidden", gradient)}>
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                {color === 'indigo' && '👤'}
                {color === 'emerald' && '✅'}
                {color === 'rose' && '⚠️'}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">{label}</p>
                <p className="text-2xl font-bold text-slate-800">{value}</p>
            </div>
        </div>
    );
}
