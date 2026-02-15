"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";
import { CLASS_LIST, normalizeSubject } from "@/lib/utils";

export default function TeacherJournalModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem, modalMode, currentUser } = state;
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        class: "",
        tp: "",
        materi: "",
        refleksi: "",
        kendala: "",
        rtl: ""
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const profileClasses = useMemo(() => currentUser?.class ? currentUser.class.split(',').map(c => c.trim()) : [], [currentUser?.class]);

    useEffect(() => {
        if (modalMode === "edit" && editingItem) {
            setFormData({ ...editingItem });
        } else {
            if (profileClasses.length > 0) {
                setFormData(prev => ({ ...prev, class: profileClasses[0] }));
            }
        }
    }, [modalMode, editingItem, profileClasses]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                type: 'journal_teacher',
                teacher_name: currentUser?.name || "Guru",
                teacher_subject: normalizeSubject(currentUser?.subject || "Mata Pelajaran")
            };
            if (modalMode === 'edit' && editingItem) {
                await supabaseData.update(editingItem.__backendId, payload);
            } else {
                await supabaseData.create(payload);
            }
            await processData();
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save teacher journal error:", error);
            alert("Gagal menyimpan jurnal mengajar");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-2xl relative z-10 animate-zoomIn flex flex-col max-h-[95vh] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-10 py-8 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-2">{modalMode === 'edit' ? 'Edit Jurnal Mengajar' : 'Log Pengajaran'}</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">MANAJEMEN AKTIVITAS INSTRUKTUR</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10">
                            👨‍🏫
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-10 space-y-10">
                    <div className="grid grid-cols-2 gap-8 p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors">Tunggal Kalender</label>
                            <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-teal-400 outline-none transition-all" required />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors">Otoritas Kelas</label>
                            <select
                                value={formData.class}
                                onChange={e => setFormData({ ...formData, class: e.target.value })}
                                className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-teal-400 outline-none transition-all appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                required
                            >
                                <option value="">PILIH KELAS...</option>
                                {profileClasses.map(c => <option key={c} value={c}>KELAS {c}</option>)}
                                {profileClasses.length === 0 && CLASS_LIST.map(c => <option key={c} value={c}>KELAS {c}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-8">
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px]">🎯</span> TUJUAN PEMBELAJARAN (TP)
                            </label>
                            <textarea value={formData.tp} onChange={e => setFormData({ ...formData, tp: e.target.value })} className="w-full h-24 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 font-bold text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-200 leading-relaxed" placeholder="Deskripsikan kompetensi yang ingin dicapai..." required />
                        </div>

                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px]">📖</span> MATERI / POKOK BAHASAN
                            </label>
                            <input type="text" value={formData.materi} onChange={e => setFormData({ ...formData, materi: e.target.value })} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-teal-400 focus:bg-white outline-none transition-all placeholder:text-slate-200" placeholder="Topik materi yang diajarkan" required />
                        </div>

                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors flex items-center gap-2">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-[10px]">📝</span> REFLEKSI & PENCAPAIAN
                            </label>
                            <textarea value={formData.refleksi} onChange={e => setFormData({ ...formData, refleksi: e.target.value })} className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 font-bold text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-200 leading-relaxed" placeholder="Bagaimana hasil pembelajaran hari ini?" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="group">
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-red-400 transition-colors flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-red-50 flex items-center justify-center text-[10px]">⚠️</span> KENDALA
                                </label>
                                <textarea value={formData.kendala} onChange={e => setFormData({ ...formData, kendala: e.target.value })} className="w-full h-28 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 font-bold text-slate-600 focus:border-red-300 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-200 text-xs" placeholder="Hambatan yang ditemukan..." />
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-blue-400 transition-colors flex items-center gap-2">
                                    <span className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center text-[10px]">💡</span> RENCANA (RTL)
                                </label>
                                <textarea value={formData.rtl} onChange={e => setFormData({ ...formData, rtl: e.target.value })} className="w-full h-28 bg-slate-50 border-2 border-slate-100 rounded-[1.5rem] p-6 font-bold text-slate-600 focus:border-blue-300 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-200 text-xs" placeholder="Langkah perbaikan selanjutnya..." />
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
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
                            {isSubmitting ? "MEMPROSES..." : "ARSIPKAN JURNAL GURU"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
