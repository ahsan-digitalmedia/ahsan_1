"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData, studentOperations } from "@/lib/supabase";

export default function StudentModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem, modalMode } = state;

    const [formData, setFormData] = useState({
        name: "",
        nis: "",
        nisn: "",
        gender: "L",
        birth_place: "",
        birth_date: "",
        class: "1A", // Default class
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (modalMode === "edit" && editingItem) {
            setFormData({
                name: editingItem.name || "",
                nis: editingItem.nis || "",
                nisn: editingItem.nisn || "",
                gender: editingItem.gender || "L",
                birth_place: editingItem.birth_place || "",
                birth_date: editingItem.birth_date ? editingItem.birth_date.split('T')[0] : "",
                class: editingItem.class || "1A",
            });
        }
    }, [modalMode, editingItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            // Ensure teacher_id is attached from the current logged-in user
            const teacherId = state.currentUser?.__backendId;

            // If new student, valid teacherId is mandatory for isolation
            if (modalMode !== 'edit' && !teacherId) {
                alert("Error: Identitas Guru tidak ditemukan. Silakan refresh halaman.");
                setIsSubmitting(false);
                return;
            }

            const payload = {
                ...formData,
                teacher_id: teacherId // Force overwrite/ensure it's present
            };

            if (modalMode === 'edit' && editingItem) {
                // Keep existing teacher_id if we are editing (unless we want to transfer?)
                // Usually editing shouldn't change ownership implicitly, but let's be safe.
                // If editingItem has teacher_id, keep it. If not, maybe assign?
                // For simplified logic: ensure the student belongs to current user.

                await studentOperations.update(editingItem.id, payload);
            } else {
                await studentOperations.create(payload);
            }
            await processData(); // Refresh list
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save error:", error);
            alert("Gagal menyimpan data siswa");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-2xl md:rounded-[2.5rem] w-full max-w-lg relative z-10 animate-zoomIn flex flex-col max-h-[90vh] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-6 py-6 md:px-8 md:py-6 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center gap-4">
                        <div>
                            <h3 className="text-xl md:text-2xl font-black tracking-tight leading-none mb-1.5">{modalMode === 'edit' ? 'Edit Profil Siswa' : 'Registrasi Siswa'}</h3>
                            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em]">{modalMode === 'edit' ? 'PEMBARUAN DATA SISWA' : 'PENDAFTARAN SISWA BARU'}</p>
                        </div>
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 backdrop-blur-md rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl shadow-inner border border-white/10 shrink-0">
                            👤
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-6 md:px-8 md:py-8 space-y-6 custom-scrollbar">
                    <div className="space-y-5">
                        <div className="group">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-purple-500 transition-colors ml-1">Identitas Nama Lengkap</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="input-modern w-full bg-slate-50 font-bold text-slate-800"
                                placeholder="Masukkan nama lengkap siswa..."
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-5">
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-purple-500 transition-colors ml-1">Nomor Induk (NIS)</label>
                                <input
                                    type="text"
                                    value={formData.nis}
                                    onChange={e => setFormData({ ...formData, nis: e.target.value })}
                                    className="input-modern w-full bg-slate-50 font-bold text-slate-800"
                                    placeholder="NIS Lokal"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-purple-500 transition-colors ml-1">Nomor NISN</label>
                                <input
                                    type="text"
                                    value={formData.nisn}
                                    onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                                    className="input-modern w-full bg-slate-50 font-bold text-slate-800"
                                    placeholder="NISN Nasional"
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-5">
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-purple-500 transition-colors ml-1">Tempat Kelahiran</label>
                                <input
                                    type="text"
                                    value={formData.birth_place}
                                    onChange={e => setFormData({ ...formData, birth_place: e.target.value })}
                                    className="input-modern w-full bg-slate-50 font-bold text-slate-800"
                                    placeholder="Kota/Kab"
                                />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-purple-500 transition-colors ml-1">Tanggal Lahir</label>
                                <input
                                    type="date"
                                    value={formData.birth_date}
                                    onChange={e => setFormData({ ...formData, birth_date: e.target.value })}
                                    className="input-modern w-full bg-slate-50 font-bold text-slate-800"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 md:gap-5">
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-purple-500 transition-colors ml-1">Gender</label>
                                <select
                                    value={formData.gender}
                                    onChange={e => setFormData({ ...formData, gender: e.target.value })}
                                    className="input-modern pr-10 bg-slate-50 font-bold text-slate-800 appearance-none cursor-pointer w-full"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1rem' }}
                                >
                                    <option value="L">LAKI-LAKI</option>
                                    <option value="P">PEREMPUAN</option>
                                </select>
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block group-focus-within:text-purple-500 transition-colors ml-1">Lokasi Kelas</label>
                                <input
                                    type="text"
                                    value={formData.class}
                                    onChange={e => setFormData({ ...formData, class: e.target.value })}
                                    className="input-modern w-full bg-slate-50 font-bold text-slate-800"
                                    placeholder="Contoh: 1A"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 md:pt-6 flex flex-col sm:flex-row gap-3 md:gap-4">
                        <button
                            type="button"
                            onClick={() => updateState({ showModal: false })}
                            className="flex-1 px-6 py-3.5 rounded-xl border border-slate-200 font-bold text-[10px] uppercase tracking-widest text-slate-500 hover:bg-slate-50 transition-all"
                        >
                            BATALKAN
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] px-6 py-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase tracking-widest shadow-lg hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "MEMPROSES..." : "SIMPAN PERUBAHAN"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
