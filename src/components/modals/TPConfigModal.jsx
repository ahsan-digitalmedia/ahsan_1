"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";

export default function TPConfigModal() {
    const { state, updateState } = useApp();
    const [tpCount, setTpCount] = useState(state.scoreTPCount || 4);
    const [sumatifCount, setSumatifCount] = useState(state.scoreSumatifCount || 4);

    const handleSubmit = (e) => {
        e.preventDefault();
        updateState({
            scoreTPCount: parseInt(tpCount),
            scoreSumatifCount: parseInt(sumatifCount),
            showModal: false
        });
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm relative z-10 animate-zoomIn flex flex-col shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-8 py-6 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10">
                        <h3 className="text-xl font-black tracking-tight leading-none">Konfigurasi Kolom</h3>
                        <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em] mt-2">STRUKTUR PENILAIAN SISWA</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="group">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Jumlah Tujuan Pembelajaran (TP)</label>
                        <input type="number" min="1" max="10" value={tpCount} onChange={e => setTpCount(e.target.value)} className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-slate-800 focus:border-purple-400 outline-none transition-all" />
                    </div>
                    <div className="group">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-indigo-500 transition-colors">Jumlah Sumatif Materi</label>
                        <input type="number" min="1" max="10" value={sumatifCount} onChange={e => setSumatifCount(e.target.value)} className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-slate-800 focus:border-indigo-400 outline-none transition-all" />
                    </div>
                    <button type="submit" className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all mt-2">
                        SIMPAN KONFIGURASI
                    </button>
                    <button type="button" onClick={() => updateState({ showModal: false })} className="w-full py-3 rounded-2xl border border-slate-100 font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                        BATALKAN
                    </button>
                </form>
            </div>
        </div>
    );
}
