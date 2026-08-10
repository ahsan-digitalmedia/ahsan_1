"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import Link from "next/link";


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

export default function AdminDashboard() {
    const { state, updateState } = useApp();
    const { teachers, assignments } = state;
    const [tick, setTick] = React.useState(0);
    const [showAll, setShowAll] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState(1);
    const pageSize = 10;

    // Auto-refresh real-time presence status every 10 seconds
    React.useEffect(() => {
        const timer = setInterval(() => setTick(t => t + 1), 10000);
        return () => clearInterval(timer);
    }, []);

    // Filter teachers based on real-time presence threshold (< 90 seconds)
    const activeTeachersCount = teachers.filter((t) => t.status === "active").length;
    const inactiveTeachersCount = teachers.filter((t) => t.status === "inactive").length;

    const onlineTeachersList = teachers.filter((t) => checkOnlinePresence(t).isOnline);
    const onlineCount = onlineTeachersList.length;

    const totalPages = Math.ceil(teachers.length / pageSize) || 1;
    const displayedTeachers = showAll
        ? teachers
        : teachers.slice((currentPage - 1) * pageSize, currentPage * pageSize);

    const stats = [
        { label: "Total Guru", value: teachers.length, icon: "👤", gradient: "gradient-blue", tag: "Total" },
        { label: "Guru Sedang Online", value: onlineCount, icon: "🟢", gradient: "gradient-green", tag: "REALTIME" },
        { label: "Guru Aktif (Akses)", value: activeTeachersCount, icon: "✅", gradient: "gradient-teal", tag: "Aktif" },
        { label: "Guru Non-aktif", value: inactiveTeachersCount, icon: "⚠️", gradient: "gradient-orange", tag: "Off" },
    ];

    return (
        <div className="animate-fadeIn space-y-6">
            {/* Stats Grid - Compact */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((stat, i) => (
                    <div key={i} className={cn(stat.gradient, "rounded-xl p-4 text-white shadow-sm transition-all hover:scale-[1.01] relative overflow-hidden group")}>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-white/20 transition-all"></div>
                        <div className="flex items-center justify-between mb-2 relative z-10">
                            <div className="w-8 h-8 bg-white/20 backdrop-blur-md rounded-lg flex items-center justify-center text-base shadow-inner border border-white/20">
                                {stat.icon}
                            </div>
                            <span className="text-[9px] font-bold bg-black/10 px-2 py-0.5 rounded-md uppercase tracking-wider backdrop-blur-sm border border-white/10 flex items-center gap-1">
                                {stat.tag === 'REALTIME' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 animate-ping"></span>}
                                {stat.tag}
                            </span>
                        </div>
                        <h3 className="text-xl font-bold tracking-tight mb-0.5 relative z-10">{stat.value}</h3>
                        <p className="text-white/80 text-[11px] font-medium tracking-wide relative z-10">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent & Online Teachers List - Compact */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
                    <div>
                        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/40">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    <h3 className="font-bold text-slate-800 text-sm tracking-tight">Status Presensi Real-Time Guru</h3>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">Pemantauan guru yang sedang aktif membuka sistem saat ini</p>
                            </div>
                            <button
                                onClick={() => setShowAll(!showAll)}
                                className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-all border border-indigo-100"
                            >
                                {showAll ? "Tampilkan 10" : `Tampilkan Semua (${teachers.length})`}
                            </button>
                        </div>
                        <div className="p-4">
                            {teachers.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                                        <svg className="w-7 h-7 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                        </svg>
                                    </div>
                                    <p className="text-slate-500 font-medium text-xs">Belum ada data guru terdaftar</p>
                                    <button
                                        onClick={() => updateState({ showModal: true, modalType: 'teacher', modalMode: 'add' })}
                                        className="mt-3 px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-indigo-700 transition-all shadow-sm"
                                    >
                                        Tambah Guru Pertama
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {displayedTeachers.map((teacher, i) => {
                                        const { isOnline, label: presenceLabel } = checkOnlinePresence(teacher);
                                        const globalIdx = showAll ? i : (currentPage - 1) * pageSize + i;
                                        return (
                                            <div key={teacher.__backendId || teacher.id} className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-100 hover:border-indigo-100 hover:bg-slate-50/60 transition-all group">
                                                <span className="text-[11px] font-bold text-slate-300 w-5 text-center">{globalIdx + 1}</span>
                                                <div className="relative">
                                                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-xs group-hover:scale-105 transition-transform",
                                                        ['gradient-blue', 'gradient-purple', 'gradient-indigo', 'gradient-teal', 'gradient-orange'][i % 5]
                                                    )}>
                                                        {teacher.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    {isOnline && (
                                                        <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border-2 border-white"></span>
                                                        </span>
                                                    )}
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-slate-800 text-xs truncate tracking-tight">{teacher.name}</p>
                                                        {isOnline && (
                                                            <span className="bg-emerald-50 text-emerald-600 text-[8px] font-extrabold px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-1">
                                                                <span className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse"></span>
                                                                ONLINE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 font-medium truncate tracking-tight">
                                                        {teacher.subject || "Guru Kelas"} &bull; {teacher.class || "-"} &bull; {teacher.email || "No Email"}
                                                    </p>
                                                </div>

                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={cn("px-2 py-0.5 text-[8px] font-bold rounded uppercase tracking-wider flex items-center gap-1",
                                                        isOnline ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-slate-100 text-slate-500 border border-slate-200"
                                                    )}>
                                                        {isOnline && <span className="w-1 h-1 rounded-full bg-emerald-500"></span>}
                                                        {presenceLabel}
                                                    </span>
                                                    <p className="text-[8px] text-slate-400 font-medium uppercase tracking-wider">
                                                        NIP: {teacher.nip || '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pagination Footer */}
                    {teachers.length > 0 && !showAll && totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                            <span className="text-slate-500 font-medium">
                                Menampilkan <strong className="text-slate-700">{(currentPage - 1) * pageSize + 1}</strong>–<strong className="text-slate-700">{Math.min(currentPage * pageSize, teachers.length)}</strong> dari <strong className="text-slate-700">{teachers.length}</strong> Guru
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

                {/* Quick Actions */}
                <div className="space-y-4">
                    <div className="gradient-dark rounded-xl p-5 text-white shadow-sm relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="font-bold text-sm mb-1.5 flex items-center gap-2">
                                <span>📢</span> Pemberitahuan Sistem
                            </h4>
                            <p className="text-white/70 text-[11px] font-medium leading-relaxed">
                                Pastikan data guru dan konfigurasi sekolah selalu diperbarui untuk keakuratan laporan presensi real-time dan penilaian akhir semester.
                            </p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}


