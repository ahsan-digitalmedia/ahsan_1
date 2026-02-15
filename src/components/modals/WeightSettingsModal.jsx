"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";

export default function WeightSettingsModal() {
    const { state, updateState } = useApp();
    const [weights, setWeights] = useState({
        fs: state.scoreWeights?.fs || 80,
        pts: state.scoreWeights?.pts || 10,
        pas: state.scoreWeights?.pas || 10,
    });

    const total = parseInt(weights.fs) + parseInt(weights.pts) + parseInt(weights.pas);
    const isValid = total === 100;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!isValid) return;
        updateState({
            scoreWeights: { fs: parseInt(weights.fs), pts: parseInt(weights.pts), pas: parseInt(weights.pas) },
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
                        <h3 className="text-xl font-black tracking-tight leading-none">Bobot Penilaian</h3>
                        <p className="text-slate-400 text-[8px] font-black uppercase tracking-[0.3em] mt-2">KONFIGURASI PROSENTASE RAPORT</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="group">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-teal-500 transition-colors">Formatif & Sumatif (Harian) %</label>
                        <input type="number" min="0" max="100" value={weights.fs} onChange={e => setWeights({ ...weights, fs: e.target.value })} className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-slate-800 focus:border-teal-400 outline-none transition-all" />
                    </div>
                    <div className="group">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-indigo-500 transition-colors">PTS (Tengah Semester) %</label>
                        <input type="number" min="0" max="100" value={weights.pts} onChange={e => setWeights({ ...weights, pts: e.target.value })} className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-slate-800 focus:border-indigo-400 outline-none transition-all" />
                    </div>
                    <div className="group">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-rose-500 transition-colors">PAS (Akhir Semester) %</label>
                        <input type="number" min="0" max="100" value={weights.pas} onChange={e => setWeights({ ...weights, pas: e.target.value })} className="w-full h-12 bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 font-black text-slate-800 focus:border-rose-400 outline-none transition-all" />
                    </div>

                    <div className={`p-4 rounded-2xl text-center flex items-center justify-between border-2 transition-all ${isValid ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                        <span className="text-[10px] font-black uppercase tracking-widest">Total Akumulasi</span>
                        <span className="text-xl font-black">{total}%</span>
                    </div>

                    <div className="space-y-3 pt-2">
                        <button disabled={!isValid} type="submit" className="w-full py-4 rounded-2xl bg-slate-900 text-white font-black text-[10px] uppercase tracking-[0.2em] shadow-xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale">
                            SIMPAN BOBOT PENILAIAN
                        </button>
                        <button type="button" onClick={() => updateState({ showModal: false })} className="w-full py-3 rounded-2xl border border-slate-100 font-bold text-[10px] uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-all">
                            BATALKAN
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
