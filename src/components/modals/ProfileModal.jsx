"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";
import { SUBJECT_LIST, splitSubjects, joinSubjects } from "@/lib/utils";

export default function ProfileModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem } = state;
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Legacy Subject List
    // List is now imported from utils

    useEffect(() => {
        if (editingItem) {
            setFormData({ ...editingItem });
        }
    }, [editingItem]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, type: 'teacher' };
            await supabaseData.update(editingItem.__backendId, payload);
            await processData(); // Refresh current user
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save profile error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-3xl relative z-10 animate-zoomIn flex flex-col max-h-[90vh] md:max-h-[95vh] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-6 py-6 md:px-10 md:py-8 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center gap-4">
                        <div>
                            <h3 className="text-2xl md:text-3xl font-black tracking-tight leading-none mb-2">Konfigurasi Profil</h3>
                            <p className="text-slate-400 text-[9px] md:text-[11px] font-black uppercase tracking-[0.3em]">MANAJEMEN IDENTITAS & INSTITUSI</p>
                        </div>
                        <div className="w-10 h-10 md:w-14 md:h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-xl md:text-3xl shadow-inner border border-white/10 shrink-0">
                            ⚙️
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 md:px-10 md:py-10 space-y-8 md:space-y-10 custom-scrollbar">
                    {/* Personal Info */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-base shadow-sm">👤</span> INFORMASI PERSONAL
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            <div className="col-span-1 md:col-span-2 group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Nama Lengkap & Gelar</label>
                                <input type="text" value={formData.name || ""} onChange={e => handleChange('name', e.target.value)} className="input-modern w-full" required placeholder="Cth: Dr. Ahmad Subarjo, S.Pd" />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">NIP / No. Identitas</label>
                                <input type="text" value={formData.nip || ""} onChange={e => handleChange('nip', e.target.value)} className="input-modern w-full" placeholder="19XXXXXXXXXXXX" />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">No. WhatsApp</label>
                                <input type="text" value={formData.phone || ""} onChange={e => handleChange('phone', e.target.value)} className="input-modern w-full" placeholder="08XXXXXXXXXX" />
                            </div>
                            <div className="col-span-1 md:col-span-2 opacity-50">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Alamat Email (Akun)</label>
                                <input type="email" value={formData.email || ""} disabled className="input-modern bg-slate-100 cursor-not-allowed border-slate-200 w-full" />
                            </div>
                        </div>
                    </div>

                    {/* Teaching Info */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-base shadow-sm">📚</span> SPESIALISASI PENGAJARAN
                        </h4>

                        <div className="space-y-6 bg-slate-50/50 p-5 md:p-8 rounded-[2rem] border border-slate-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Pilih Mata Pelajaran</label>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="flex-1 relative">
                                        <select
                                            id="subject-select"
                                            className="input-modern pr-10 appearance-none cursor-pointer w-full"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                        >
                                            <option value="">-- PILIH MATA PELAJARAN --</option>
                                            {SUBJECT_LIST.map(opt => <option key={opt} value={opt}>{opt.toUpperCase()}</option>)}
                                        </select>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const selectFn = document.getElementById('subject-select');
                                            const val = selectFn.value;
                                            if (val) {
                                                const currentSubjects = splitSubjects(formData.subject);
                                                if (!currentSubjects.includes(val)) {
                                                    const updated = [...currentSubjects, val].sort();
                                                    handleChange('subject', joinSubjects(updated));
                                                }
                                                selectFn.value = "";
                                            }
                                        }}
                                        className="px-6 py-3 md:py-0 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 w-full md:w-auto"
                                    >
                                        TAMBAH
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {formData.subject && splitSubjects(formData.subject).length > 0 ? (
                                    splitSubjects(formData.subject).map((s, i) => {
                                        const cleanSub = s.trim();
                                        return (
                                            <span key={i} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-3 shadow-sm uppercase tracking-wider group transition-all hover:border-indigo-200">
                                                {cleanSub}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const current = splitSubjects(formData.subject);
                                                        const updated = current.filter(sub => sub !== cleanSub);
                                                        handleChange('subject', joinSubjects(updated));
                                                    }}
                                                    className="w-5 h-5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                >×</button>
                                            </span>
                                        );
                                    })
                                ) : (
                                    <div className="text-slate-300 text-[10px] font-bold uppercase tracking-widest py-4 text-center w-full bg-white/50 rounded-xl border border-dashed border-slate-200 italic">BELUM ADA MATA PELAJARAN TERPILIH</div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6 bg-slate-50/50 p-5 md:p-8 rounded-[2rem] border border-slate-100">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block ml-1">Distribusi Kelas</label>
                                <div className="flex flex-col md:flex-row gap-3">
                                    <div className="flex gap-3 flex-1">
                                        <div className="w-1/2 md:w-1/3 relative">
                                            <select
                                                id="level-select"
                                                className="input-modern pr-10 appearance-none cursor-pointer w-full"
                                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                            >
                                                <option value="">KELAS</option>
                                                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>KELAS {n}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex-1">
                                            <input
                                                id="rombel-input"
                                                type="text"
                                                className="input-modern uppercase w-full"
                                                placeholder="ROMBEL (A, B...)"
                                                maxLength={5}
                                                onInput={(e) => e.target.value = e.target.value.toUpperCase()}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const levelFn = document.getElementById('level-select');
                                            const rombelFn = document.getElementById('rombel-input');
                                            const level = levelFn.value;
                                            const rombel = rombelFn.value.trim();
                                            if (level && rombel) {
                                                const newClass = `${level}${rombel}`;
                                                const currentClasses = formData.class ? formData.class.split(',').map(c => c.trim()).filter(c => c) : [];
                                                if (!currentClasses.includes(newClass)) {
                                                    const updatedClasses = [...currentClasses, newClass].sort();
                                                    handleChange('class', updatedClasses.join(', '));
                                                }
                                                levelFn.value = "";
                                                rombelFn.value = "";
                                            }
                                        }}
                                        className="px-6 py-3 md:py-0 bg-indigo-600 text-white rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 w-full md:w-auto"
                                    >
                                        TAMBAH
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-2">
                                {formData.class && formData.class.split(',').filter(c => c.trim()).length > 0 ? (
                                    formData.class.split(',').map((c, i) => {
                                        const cleanClass = c.trim();
                                        if (!cleanClass) return null;
                                        return (
                                            <span key={i} className="bg-white border border-slate-200 text-slate-600 px-4 py-2 rounded-xl text-[10px] font-bold flex items-center gap-3 shadow-sm uppercase tracking-wider group transition-all hover:border-blue-200">
                                                KELAS {cleanClass}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const currentClasses = formData.class.split(',').map(cl => cl.trim());
                                                        const updatedClasses = currentClasses.filter(cl => cl !== cleanClass);
                                                        handleChange('class', updatedClasses.join(', '));
                                                    }}
                                                    className="w-5 h-5 flex items-center justify-center rounded-lg bg-slate-50 text-slate-400 hover:bg-red-50 hover:text-red-500 transition-all"
                                                >×</button>
                                            </span>
                                        );
                                    })
                                ) : (
                                    <div className="text-slate-300 text-[10px] font-bold uppercase tracking-widest py-4 text-center w-full bg-white/50 rounded-xl border border-dashed border-slate-200 italic">BELUM ADA KELAS TERPILIH</div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Semester Aktif</label>
                                <select
                                    value={formData.semester || "1"}
                                    onChange={e => handleChange('semester', e.target.value)}
                                    className="input-modern pr-10 appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                >
                                    <option value="1">GANJIL (KESATU)</option>
                                    <option value="2">GENAP (KEDUA)</option>
                                </select>
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Tahun Pelajaran</label>
                                <input type="text" value={formData.academic_year || "2024/2025"} onChange={e => handleChange('academic_year', e.target.value)} className="input-modern" placeholder="2024/2025" />
                            </div>
                        </div>
                    </div>

                    {/* School Info */}
                    <div className="space-y-6">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-base shadow-sm">🏛️</span> IDENTITAS INSTITUSI
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            <div className="col-span-1 md:col-span-2 group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Nama Satuan Pendidikan</label>
                                <input type="text" value={formData.school_name || ""} onChange={e => handleChange('school_name', e.target.value)} className="input-modern w-full" placeholder="Cth: SDN 1 Poncowati" />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Nomor NPSN</label>
                                <input type="text" value={formData.npsn || ""} onChange={e => handleChange('npsn', e.target.value)} className="input-modern w-full" placeholder="12345678" />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Kecamatan / Wilayah</label>
                                <input type="text" value={formData.kecamatan || ""} onChange={e => handleChange('kecamatan', e.target.value)} className="input-modern w-full" placeholder="Cth: Poncowati" />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 block ml-1">Alamat Lengkap Sekolah</label>
                                <input type="text" value={formData.school_address || ""} onChange={e => handleChange('school_address', e.target.value)} className="input-modern w-full" placeholder="Cth: Jl. Raya No. 1..." />
                            </div>
                        </div>

                        <div className="p-5 md:p-8 bg-indigo-50/30 rounded-[2rem] border border-indigo-100/50 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                            <div className="group col-span-1 md:col-span-1">
                                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2.5 block ml-1">Kepala Sekolah</label>
                                <input type="text" value={formData.principal_name || ""} onChange={e => handleChange('principal_name', e.target.value)} className="input-modern bg-white w-full" placeholder="Nama Lengkap & Gelar" />
                            </div>
                            <div className="group col-span-1 md:col-span-1">
                                <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-2.5 block ml-1">NIP Kepala Sekolah</label>
                                <input type="text" value={formData.principal_nip || ""} onChange={e => handleChange('principal_nip', e.target.value)} className="input-modern bg-white w-full" placeholder="19XXXXXXXXXXXX" />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => updateState({ showModal: false })}
                            className="flex-1 px-8 py-4 rounded-xl border border-slate-200 font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                        >
                            BATALKAN
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-[2] px-8 py-4 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-xl hover:bg-black active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "MEMPROSES..." : "💾 PERBARUI PROFIL SAYA"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
