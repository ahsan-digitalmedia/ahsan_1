"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { supabase, supabaseData } from "@/lib/supabase";
import { SUBJECT_LIST, CLASS_LIST, normalizeSubject, splitSubjects, joinSubjects } from "@/lib/utils";

export default function TeacherModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem, modalMode } = state;

    const [formData, setFormData] = useState({
        name: "",
        nip: "",
        email: "",
        password: "",
        role: "teacher",
        status: "active",
        subject: "",
        class: "",
        school_name: "SDN 1 PONCOWATI"
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedSubjects, setSelectedSubjects] = useState([]);
    const [selectedClasses, setSelectedClasses] = useState([]);

    useEffect(() => {
        if (modalMode === "edit" && editingItem) {
            setFormData({
                ...editingItem,
                password: "" // Don't show password in edit
            });
            setSelectedSubjects(editingItem.subject ? splitSubjects(editingItem.subject) : []);
            setSelectedClasses(editingItem.class ? editingItem.class.split(',').map(c => c.trim()) : []);
        }
    }, [modalMode, editingItem]);

    const handleSubjectChange = (subj) => {
        if (!subj) return;
        const normalized = normalizeSubject(subj);
        setSelectedSubjects(prev =>
            prev.includes(normalized) ? prev : [...prev, normalized]
        );
    };


    const handleClassToggle = (cls) => {
        setSelectedClasses(prev =>
            prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls]
        );
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const payload = {
                ...formData,
                type: 'teacher',
                subject: joinSubjects(selectedSubjects),
                class: selectedClasses.join(', ')
            };

            // Remove password if empty in edit mode
            if (modalMode === 'edit' && !payload.password) {
                delete payload.password;
            }

            if (modalMode === 'edit') {
                await supabaseData.update(editingItem.__backendId, payload);

                // If password provided, update auth password (requires being the user or admin API)
                // For now, we update the profile. Auth password change might need separate handling.
                if (payload.password) {
                    alert("Catatan: Password di profil diperbarui, namun password login akun harus diperbarui secara mandiri atau via Admin Console Supabase.");
                }
            } else {
                // For new teacher, we create the record in app_data first.
                // In a full system, you'd use supabase.auth.admin to create the user account.
                // Here we assume registrations are open or handled separately.
                await supabaseData.create(payload);
            }

            await processData();
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save teacher error:", error);
            alert("Gagal menyimpan data guru: " + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-3xl relative z-10 animate-zoomIn flex flex-col max-h-[92vh] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-10 py-8 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-2">{modalMode === 'edit' ? 'Edit Profil Guru' : 'Registrasi Pendidik'}</h3>
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em]">{modalMode === 'edit' ? 'PEMBARUAN AKSES SISTEM' : 'PENDAFTARAN AKUN BARU'}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10">
                            🎓
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Nama Lengkap & Gelar</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                placeholder="Masukkan nama..."
                                required
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Nomor NIP / NUPTK</label>
                            <input
                                type="text"
                                value={formData.nip}
                                onChange={e => setFormData({ ...formData, nip: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                placeholder="19XXXXXXXXXXXX"
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Alamat Email Resmi</label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                placeholder="guru@sekolah.id"
                                required
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">{modalMode === 'edit' ? "Ganti Sandi (Kosongkan jika tidak)" : "Sandi Akses Awal"}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                placeholder="••••••••"
                                required={modalMode === 'add'}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Otoritas Akses</label>
                            <select
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                            >
                                <option value="teacher">GURU PENGAJAR</option>
                                <option value="admin">ADMINISTRATOR</option>
                            </select>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Status Akun</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                            >
                                <option value="active">AKTIF & VALID</option>
                                <option value="inactive">NON-AKTIF</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-1">Spesialisasi Mata Pelajaran</label>
                        <div className="space-y-4">
                            <select
                                onChange={e => handleSubjectChange(e.target.value)}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                value=""
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                            >
                                <option value="">+ Tambahkan Mata Pelajaran</option>
                                {SUBJECT_LIST.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>

                            {selectedSubjects.length > 0 && (
                                <div className="flex flex-wrap gap-2 p-6 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100 min-h-[80px]">
                                    {selectedSubjects.map(s => (
                                        <div key={s} className="pl-4 pr-2 py-2 bg-purple-600 text-white rounded-[1rem] text-[10px] font-black flex items-center gap-3 shadow-md uppercase tracking-wider group hover:bg-purple-700 transition-colors">
                                            {s}
                                            <button
                                                type="button"
                                                onClick={() => setSelectedSubjects(selectedSubjects.filter(item => item !== s))}
                                                className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center hover:bg-white/40 transition-all"
                                            >✕</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest block ml-1">Distribusi Kelas Ampuan</label>
                        <div className="flex flex-wrap gap-2 p-6 bg-slate-50/50 rounded-[2rem] border-2 border-dashed border-slate-100">
                            {CLASS_LIST.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => handleClassToggle(c)}
                                    className={`w-12 h-12 rounded-[1.25rem] font-black text-xs transition-all flex items-center justify-center border-2 ${selectedClasses.includes(c)
                                        ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-110"
                                        : "bg-white text-slate-400 border-slate-100 hover:border-purple-200 hover:text-purple-500"
                                        }`}
                                >
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="pt-8 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => updateState({ showModal: false })}
                            className="flex-1 px-8 py-4 rounded-[1.25rem] border border-slate-200 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
                        >
                            BATALKAN
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="flex-[2] px-8 py-4 rounded-[1.25rem] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "MEMPROSES..." : (modalMode === 'edit' ? "SIMPAN PERUBAHAN PROFIL" : "DAFTARKAN PENDIDIK BARU")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function FormGroup({ label, children }) {
    return (
        <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">{label}</label>
            {children}
        </div>
    );
}
