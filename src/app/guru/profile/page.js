"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

export default function GuruProfilePage() {
    const { state, updateState } = useApp();
    const { currentUser } = state;

    return (
        <div className="animate-fadeIn max-w-5xl mx-auto pb-10">
            {/* Header Card */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-modern border border-slate-100 mb-10 relative">
                <div className="absolute top-6 right-8 z-30 text-white/90 text-[10px] font-bold uppercase tracking-widest bg-white/10 backdrop-blur-xl px-5 py-2.5 rounded-xl border border-white/20 shadow-premium">
                    {currentUser?.academic_year ? `Tahun Ajaran ${currentUser.academic_year}` : "Tahun Ajaran Belum Diatur"} • Semester {currentUser?.semester === '2' ? 'Genap' : 'Ganjil'}
                </div>
                <div className="h-56 bg-slate-900 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                </div>

                <div className="px-10 pb-12">
                    <div className="relative -mt-20 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
                        <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
                            <div className="w-40 h-40 rounded-2xl bg-white p-2 shadow-premium shrink-0">
                                <div className="w-full h-full bg-slate-900 rounded-xl flex items-center justify-center text-6xl text-white font-bold shadow-inner border border-white/10">
                                    {currentUser?.name?.charAt(0) || "G"}
                                </div>
                            </div>
                            <div className="mb-2 text-center md:text-left">
                                <h1 className="text-3xl font-bold text-slate-800 tracking-tight leading-none mb-3">{currentUser?.name}</h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className="bg-slate-100 px-4 py-1.5 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-widest border border-slate-200/50 shadow-sm">NIP. {currentUser?.nip || "-"}</span>
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-200"></span>
                                    <span className="text-purple-600 font-bold text-[11px] uppercase tracking-wider">{currentUser?.subject || "Belum ada mapel"}</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => updateState({ showModal: true, modalType: 'profile', modalMode: 'edit', editingItem: currentUser })}
                            className="px-8 py-3.5 rounded-xl bg-purple-600 text-white font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-purple-700 active:scale-95 transition-all shrink-0 flex items-center gap-2"
                        >
                            <span className="text-lg">✏️</span> EDIT PROFIL USER
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Info Sekolah */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="bg-white rounded-2xl p-10 border border-slate-100 shadow-modern group transition-all">
                                <h3 className="text-slate-800 font-bold uppercase text-[11px] tracking-widest mb-8 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-slate-50 shadow-sm flex items-center justify-center text-base">🏫</span> IDENTITAS INSTITUSI
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-8 gap-x-12">
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">Nama Sekolah</p>
                                        <p className="font-bold text-slate-700 text-lg tracking-tight leading-tight">{currentUser?.school_name || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">NPSN</p>
                                        <p className="font-bold text-slate-700 text-lg tracking-tight">{currentUser?.npsn || "-"}</p>
                                    </div>
                                    <div className="col-span-1 md:col-span-2">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">Lokasi Sekolah</p>
                                        <p className="font-semibold text-slate-600 leading-relaxed">{currentUser?.school_address || "-"}</p>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 pt-8 border-t border-slate-100 mt-4 flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div>
                                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">Pimpinan Sekolah</p>
                                            <p className="font-bold text-slate-800 text-xl tracking-tight">{currentUser?.principal_name || "-"}</p>
                                            <p className="text-[11px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">NIP. {currentUser?.principal_nip || "-"}</p>
                                        </div>
                                        <div className="w-16 h-16 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center grayscale opacity-30">
                                            <span className="text-3xl">🏛️</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Info Mengajar & Kontak */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-modern relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-50 rounded-full -mr-12 -mt-12 group-hover:scale-110 transition-transform duration-700"></div>
                                <h3 className="text-purple-600 font-bold uppercase text-[11px] tracking-widest mb-6 flex items-center gap-3 relative z-10">
                                    <span className="w-8 h-8 rounded-xl bg-purple-50 shadow-sm flex items-center justify-center text-base">📚</span> EDUKASI
                                </h3>
                                <div className="space-y-6 relative z-10">
                                    <div>
                                        <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-2">Keahlian Utama</p>
                                        <p className="font-bold text-purple-900 text-lg tracking-tight leading-tight">{currentUser?.subject || "-"}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-purple-300 uppercase tracking-widest mb-2">Kelas Aktif</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {currentUser?.class ? (
                                                currentUser.class.split(',').map((c, i) => (
                                                    <span key={i} className="bg-purple-50 border border-purple-100 text-purple-600 px-4 py-1.5 rounded-lg text-[10px] font-bold shadow-sm uppercase tracking-widest">
                                                        {c.trim()}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-purple-200 font-bold italic">Belum ditentukan</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-modern group">
                                <h3 className="text-slate-800 font-bold uppercase text-[11px] tracking-widest mb-6 flex items-center gap-3">
                                    <span className="w-8 h-8 rounded-xl bg-slate-50 shadow-sm flex items-center justify-center text-base">📞</span> HUBUNGAN
                                </h3>
                                <div className="space-y-6">
                                    <div className="group/item">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2 group-hover/item:text-purple-400 transition-colors">Alamat Email</p>
                                        <p className="font-bold text-slate-700 text-sm truncate tracking-tight" title={currentUser?.email}>{currentUser?.email}</p>
                                    </div>
                                    <div className="group/item">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2 group-hover/item:text-purple-400 transition-colors">Nomor Seluler</p>
                                        <p className="font-bold text-slate-700 text-sm tracking-tight">{currentUser?.phone || "-"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
