"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";

export default function ScoreModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem, modalMode, scoreTPCount, scoreSumatifCount, scoreWeights } = state;
    const [formData, setFormData] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (modalMode === "edit" && editingItem) {
            setFormData({ ...editingItem });
        } else {
            // Initialize zeros for new entry
            const initial = {};
            for (let i = 1; i <= scoreTPCount; i++) initial[`score_f${i}`] = 0;
            for (let i = 1; i <= scoreSumatifCount; i++) initial[`score_s${i}`] = 0;
            initial.score_pts = 0;
            initial.score_pas = 0;
            setFormData(initial);
        }
    }, [modalMode, editingItem, scoreTPCount, scoreSumatifCount]);

    const calculations = useMemo(() => {
        let sumF = 0, countF = 0;
        for (let i = 1; i <= scoreTPCount; i++) {
            const val = parseFloat(formData[`score_f${i}`] || 0);
            if (val > 0) { sumF += val; countF++; }
        }
        const avgF = countF > 0 ? sumF / countF : 0;

        let sumS = 0, countS = 0;
        for (let i = 1; i <= scoreSumatifCount; i++) {
            const val = parseFloat(formData[`score_s${i}`] || 0);
            if (val > 0) { sumS += val; countS++; }
        }
        const avgS = countS > 0 ? sumS / countS : 0;

        const avgFS = (avgF + avgS) / 2;
        const pts = parseFloat(formData.score_pts || 0);
        const pas = parseFloat(formData.score_pas || 0);

        const na = ((avgFS * scoreWeights.fs) + (pts * scoreWeights.pts) + (pas * scoreWeights.pas)) / 100;

        return { avgF, avgS, na };
    }, [formData, scoreTPCount, scoreSumatifCount, scoreWeights]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                type: 'score',
                score_formatif: calculations.avgF,
                score_sumatif: calculations.avgS,
                score_raport: Math.round(calculations.na),
                score_value: Math.round(calculations.na)
            };

            if (modalMode === 'edit' && editingItem) {
                await supabaseData.update(editingItem.__backendId, payload);
            } else {
                await supabaseData.create(payload);
            }
            await processData();
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save score error:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleInput = (key, val) => {
        setFormData(prev => ({ ...prev, [key]: val }));
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-5xl relative z-10 animate-zoomIn flex flex-col max-h-[92vh] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-10 py-8 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-2">Input Hasil Belajar</h3>
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em]">{editingItem?.student_name || "PENILAIAN SISWA BARU"}</p>
                        </div>
                        <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10">
                            📊
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-10 space-y-12">
                    {/* Formatif (TP) */}
                    <section className="bg-white p-10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.05)] border border-slate-100/50">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg">1</div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Penilaian Formatif</h4>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">CAPAIAN TUJUAN PEMBELAJARAN (TP)</p>
                            </div>
                            <div className="ml-auto bg-purple-50 px-6 py-3 rounded-2xl border border-purple-100 flex items-center gap-3">
                                <span className="text-[9px] font-black text-purple-300 uppercase tracking-widest">Rata-rata</span>
                                <span className="text-2xl font-black text-purple-600 tracking-tighter leading-none">{calculations.avgF.toFixed(0)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {Array.from({ length: scoreTPCount }).map((_, i) => (
                                <div key={i} className="group">
                                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors px-2 text-center">TP-0{i + 1}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0" max="100"
                                            value={formData[`score_f${i + 1}`] || 0}
                                            onChange={e => handleInput(`score_f${i + 1}`, e.target.value)}
                                            className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center font-black text-slate-800 text-2xl focus:border-purple-400 focus:bg-white focus:ring-8 focus:ring-purple-500/5 outline-none transition-all shadow-inner"
                                        />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm opacity-0 group-focus-within:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black text-purple-400 uppercase tracking-tighter">SCORE</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Sumatif */}
                    <section className="bg-white p-10 rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.05)] border border-slate-100/50">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center text-white font-black shadow-lg">2</div>
                            <div>
                                <h4 className="text-xl font-black text-slate-900 tracking-tight">Penilaian Sumatif</h4>
                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mt-0.5">EVALUASI MATERI PEMBELAJARAN</p>
                            </div>
                            <div className="ml-auto bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                <span className="text-[9px] font-black text-emerald-300 uppercase tracking-widest">Rata-rata</span>
                                <span className="text-2xl font-black text-emerald-600 tracking-tighter leading-none">{calculations.avgS.toFixed(0)}</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                            {Array.from({ length: scoreSumatifCount }).map((_, i) => (
                                <div key={i} className="group">
                                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-emerald-500 transition-colors px-2 text-center">MAT-0{i + 1}</label>
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0" max="100"
                                            value={formData[`score_s${i + 1}`] || 0}
                                            onChange={e => handleInput(`score_s${i + 1}`, e.target.value)}
                                            className="w-full h-20 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center font-black text-slate-800 text-2xl focus:border-emerald-400 focus:bg-white focus:ring-8 focus:ring-emerald-500/5 outline-none transition-all shadow-inner"
                                        />
                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white px-2 py-0.5 rounded-full border border-slate-100 shadow-sm opacity-0 group-focus-within:opacity-100 transition-opacity">
                                            <span className="text-[8px] font-black text-emerald-400 uppercase tracking-tighter">SCORE</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Exam & NA */}
                    <section className="bg-slate-50/80 p-8 rounded-[2.5rem] border border-slate-100 shadow-inner">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-center">
                            <div className="grid grid-cols-2 gap-6 md:col-span-2">
                                <div className="group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block group-focus-within:text-indigo-500 transition-colors">PTS (Tengah Semester)</label>
                                    <input
                                        type="number"
                                        min="0" max="100"
                                        value={formData.score_pts || 0}
                                        onChange={e => handleInput('score_pts', e.target.value)}
                                        className="w-full h-20 bg-white border-2 border-slate-100 rounded-[1.5rem] text-center font-black text-slate-800 text-3xl focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block group-focus-within:text-rose-500 transition-colors">PAS (Akhir Semester)</label>
                                    <input
                                        type="number"
                                        min="0" max="100"
                                        value={formData.score_pas || 0}
                                        onChange={e => handleInput('score_pas', e.target.value)}
                                        className="w-full h-20 bg-white border-2 border-slate-100 rounded-[1.5rem] text-center font-black text-slate-800 text-3xl focus:border-rose-400 focus:ring-4 focus:ring-rose-500/5 outline-none transition-all shadow-sm"
                                    />
                                </div>
                            </div>
                            <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-slate-200 pt-8 md:pt-0 md:pl-10">
                                <p className="text-[11px] font-black text-slate-300 uppercase tracking-[0.2em] mb-2">Nilai Raport Akhir</p>
                                <div className="inline-flex items-baseline gap-1">
                                    <span className="text-7xl font-black text-slate-800 tracking-tighter">
                                        {Math.round(calculations.na)}
                                    </span>
                                    <span className="text-2xl font-black text-slate-300 tracking-tighter">/100</span>
                                </div>
                                <div className="mt-4 flex flex-wrap justify-center md:justify-end gap-2">
                                    <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-slate-400 uppercase border border-slate-100">Harian {scoreWeights.fs}%</span>
                                    <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-slate-400 uppercase border border-slate-100">PTS {scoreWeights.pts}%</span>
                                    <span className="px-3 py-1 bg-white rounded-lg text-[9px] font-black text-slate-400 uppercase border border-slate-100">PAS {scoreWeights.pas}%</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </form>

                <div className="px-10 py-10 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-6 shrink-0 relative z-20">
                    <button
                        onClick={() => updateState({ showModal: false })}
                        className="flex-1 px-10 py-5 rounded-[2rem] border border-slate-200 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                    >
                        BATALKAN & RESET
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-[2] px-14 py-5 rounded-[2rem] bg-indigo-600 text-white font-black text-[11px] uppercase tracking-[0.25em] shadow-2xl hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? "MEMPROSES DATA..." : "KONFIRMASI HASIL BELAJAR"}
                    </button>
                </div>
            </div>
        </div>
    );
}
