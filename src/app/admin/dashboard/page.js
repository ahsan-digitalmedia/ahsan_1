"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import Link from "next/link";


export default function AdminDashboard() {
    const { state, updateState } = useApp();

    const { teachers, assignments } = state;

    const activeTeachers = teachers.filter((t) => t.status === "active").length;
    const inactiveTeachers = teachers.filter((t) => t.status === "inactive").length;

    const stats = [
        { label: "Total Guru", value: teachers.length, icon: "👤", gradient: "gradient-blue", tag: "Total" },
        { label: "Guru Aktif", value: activeTeachers, icon: "✅", gradient: "gradient-green", tag: "Aktif" },
        { label: "Guru Non-aktif", value: inactiveTeachers, icon: "⚠️", gradient: "gradient-orange", tag: "Off" },
        { label: "Total Tugas", value: assignments.length, icon: "📝", gradient: "gradient-purple", tag: "Tugas" },
    ];

    return (
        <div className="animate-fadeIn">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, i) => (
                    <div key={i} className={cn(stat.gradient, "rounded-2xl p-7 text-white shadow-modern transition-all hover:scale-[1.02] relative overflow-hidden group")}>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all"></div>
                        <div className="flex items-center justify-between mb-6 relative z-10">
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center text-2xl shadow-inner border border-white/20">
                                {stat.icon}
                            </div>
                            <span className="text-[10px] font-bold bg-black/10 px-2.5 py-1.5 rounded-lg uppercase tracking-wider backdrop-blur-sm border border-white/10">{stat.tag}</span>
                        </div>
                        <h3 className="text-3xl font-bold tracking-tight mb-1 relative z-10">{stat.value}</h3>
                        <p className="text-white/70 text-xs font-semibold uppercase tracking-wider relative z-10">{stat.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Teachers */}
                <div className="lg:col-span-2 bg-white rounded-2xl shadow-modern border border-slate-100 overflow-hidden">
                    <div className="p-7 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
                        <div>
                            <h3 className="font-bold text-slate-800 tracking-tight">Guru Terdaftar Terbaru</h3>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Summary data guru terakhir</p>
                        </div>
                        <Link href="/admin/teachers" className="text-[10px] font-bold uppercase tracking-widest text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-4 py-2 rounded-xl transition-all">Lihat Semua</Link>
                    </div>
                    <div className="p-6">
                        {teachers.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                    </svg>
                                </div>
                                <p className="text-slate-500 font-medium">Belum ada data guru terdaftar</p>
                                <button
                                    onClick={() => updateState({ showModal: true, modalType: 'teacher', modalMode: 'add' })}
                                    className="mt-4 px-8 py-3.5 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md"
                                >
                                    Tambah Guru Pertama
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {teachers.slice(0, 5).map((teacher, i) => (
                                    <div key={teacher.__backendId || teacher.id} className="flex items-center gap-4 p-4 rounded-xl border border-transparent hover:border-indigo-100/50 hover:bg-slate-50 transition-all group">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform",
                                            ['gradient-blue', 'gradient-purple', 'gradient-indigo', 'gradient-teal', 'gradient-orange'][i % 5]
                                        )}>
                                            {teacher.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-bold text-slate-800 truncate tracking-tight">{teacher.name}</p>
                                            <p className="text-[11px] text-slate-400 font-semibold truncate uppercase tracking-tight">{teacher.subject || "Guru Kelas"} • {teacher.class || "-"}</p>
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5">
                                            <span className={cn("px-2.5 py-1 text-[9px] font-bold rounded-lg uppercase tracking-widest",
                                                teacher.status === 'active' ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-rose-50 text-rose-600 border border-rose-100"
                                            )}>
                                                {teacher.status === 'active' ? 'Aktif' : 'Off'}
                                            </span>
                                            <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest">ID: {teacher.nip?.substring(0, 8)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="space-y-6">


                    <div className="gradient-dark rounded-2xl p-7 text-white shadow-modern relative overflow-hidden">
                        <div className="relative z-10">
                            <h4 className="font-bold mb-2">Pemberitahuan Sistem</h4>
                            <p className="text-white/60 text-xs font-medium leading-relaxed">Pastikan data guru dan konfigurasi sekolah selalu diperbarui untuk keakuratan laporan akhir semester.</p>
                        </div>
                        <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}


