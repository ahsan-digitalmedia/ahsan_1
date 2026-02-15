"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";

export default function JournalModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem, modalMode } = state;
    const [formData, setFormData] = useState({
        modul_topic: "",
        modul_activity_core: "",
        modul_class: "4B", // Default
        modul_jp: "2",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (modalMode === "edit" && editingItem) {
            setFormData({ ...editingItem });
        }
    }, [modalMode, editingItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = { ...formData, type: 'journal' };
            if (modalMode === 'edit' && editingItem) {
                await supabaseData.update(editingItem.__backendId, payload);
            } else {
                await supabaseData.create(payload);
            }
            await processData();
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save journal error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-lg relative z-10 animate-zoomIn flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-10 py-8 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h3 className="text-2xl font-black tracking-tight leading-none mb-2">{modalMode === 'edit' ? 'Edit Jurnal' : 'Entri Jurnal'}</h3>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">REKAM JEJAK PEMBELAJARAN</p>
                        </div>
                        <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl shadow-inner border border-white/10">
                            ✍️
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-8">
                    <div className="group">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors">Topik / Materi Pembahasan</label>
                        <input type="text" value={formData.modul_topic || ""} onChange={e => setFormData({ ...formData, modul_topic: e.target.value })} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-teal-400 focus:bg-white outline-none transition-all placeholder:text-slate-200" required placeholder="Cth: Aljabar Linear" />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors">Target Kelas</label>
                            <input type="text" value={formData.modul_class || ""} onChange={e => setFormData({ ...formData, modul_class: e.target.value })} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-teal-400 focus:bg-white outline-none transition-all placeholder:text-slate-200" placeholder="Cth: 4B" />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors">Durasi (JP)</label>
                            <input type="number" value={formData.modul_jp || ""} onChange={e => setFormData({ ...formData, modul_jp: e.target.value })} className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-teal-400 focus:bg-white outline-none transition-all placeholder:text-slate-200" placeholder="2 JP" />
                        </div>
                    </div>

                    <div className="group">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors">Narasi Detail Kegiatan</label>
                        <textarea
                            value={formData.modul_activity_core || ""}
                            onChange={e => setFormData({ ...formData, modul_activity_core: e.target.value })}
                            className="w-full h-40 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 font-bold text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-200 leading-relaxed"
                            placeholder="Tuliskan ringkasan aktivitas pembelajaran hari ini secara mendetail..."
                        ></textarea>
                    </div>

                    <div className="pt-4 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => updateState({ showModal: false })}
                            className="flex-1 px-8 py-4 rounded-[1.25rem] border border-slate-200 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
                        >
                            BATALKAN
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] px-8 py-4 rounded-[1.25rem] bg-teal-600 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-teal-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "MEMPROSES..." : "ARSIPKAN JURNAL"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
