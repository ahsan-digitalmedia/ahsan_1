"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";
import { SUBJECT_LIST, CLASS_LIST, normalizeSubject, normalizeSubjectList } from "@/lib/utils";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function ScheduleModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem, modalMode, currentUser } = state;
    const [formData, setFormData] = useState({
        day: "Senin",
        no: "1",
        time_start: "07:00",
        time_end: "08:00",
        subject: "",
        class: "",
        is_break: false
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Filter subjects and classes based on user profile
    const profileSubjects = useMemo(() => currentUser?.subject ? normalizeSubjectList(currentUser.subject) : [], [currentUser?.subject]);
    const isClassTeacher = profileSubjects.includes("Guru Kelas") || profileSubjects.length === 0;
    const subjectsToDisplay = isClassTeacher ? SUBJECT_LIST : profileSubjects;

    const profileClasses = useMemo(() => currentUser?.class ? currentUser.class.split(',').map(c => c.trim()) : [], [currentUser?.class]);

    useEffect(() => {
        if (modalMode === "edit" && editingItem) {
            setFormData({ ...editingItem });
        } else {
            // Set default class if available
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
                type: 'schedule',
                subject: normalizeSubject(formData.subject),
                class: formData.class,
                // If break, clear content that doesn't make sense
                ...(formData.is_break ? { subject: "Istirahat", class: "" } : {})
            };
            if (modalMode === 'edit' && editingItem) {
                await supabaseData.update(editingItem.__backendId, payload);
            } else {
                await supabaseData.create(payload);
            }
            await processData();
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save schedule error:", error);
            alert("Gagal menyimpan jadwal");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-xl relative z-10 animate-zoomIn flex flex-col max-h-[92vh] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-10 py-8 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-2">{modalMode === 'edit' ? 'Edit Jadwal' : 'Agenda Mengajar'}</h3>
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em]">{modalMode === 'edit' ? 'PEMBARUAN SLOT WAKTU' : 'PENYUSUNAN JADWAL BARU'}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10">
                            📅
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-10 py-10 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Hari Pelaksanaan</label>
                            <select
                                value={formData.day}
                                onChange={e => setFormData({ ...formData, day: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                            >
                                {DAYS.map(d => <option key={d} value={d}>{d.toUpperCase()}</option>)}
                            </select>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Urutan Jam Ke</label>
                            <input
                                type="number"
                                value={formData.no}
                                onChange={e => setFormData({ ...formData, no: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 text-center focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                placeholder="1"
                                required
                            />
                        </div>
                    </div>

                    <div className="bg-slate-50/50 p-6 rounded-[2rem] border-2 border-dashed border-slate-100 transition-all hover:bg-white hover:border-purple-100 group">
                        <label className="flex items-center gap-4 cursor-pointer">
                            <div className="relative flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.is_break}
                                    onChange={e => setFormData({ ...formData, is_break: e.target.checked })}
                                    className="sr-only"
                                />
                                <div className={`w-12 h-6 rounded-full transition-colors ${formData.is_break ? 'bg-purple-600' : 'bg-slate-200'}`}></div>
                                <div className={`absolute left-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${formData.is_break ? 'translate-x-6' : ''}`}></div>
                            </div>
                            <div>
                                <span className={`text-[11px] font-black uppercase tracking-widest transition-colors ${formData.is_break ? 'text-purple-600' : 'text-slate-400'}`}>Set sebagai waktu istirahat</span>
                                <p className="text-[10px] text-slate-300 font-bold mt-0.5">Otomatis menonaktifkan pemilihan mata pelajaran.</p>
                            </div>
                        </label>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Waktu Mulai (:WIB)</label>
                            <input
                                type="time"
                                value={formData.time_start}
                                onChange={e => setFormData({ ...formData, time_start: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all"
                                required
                            />
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Waktu Selesai (:WIB)</label>
                            <input
                                type="time"
                                value={formData.time_end}
                                onChange={e => setFormData({ ...formData, time_end: e.target.value })}
                                className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all"
                                required
                            />
                        </div>
                    </div>

                    {!formData.is_break && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="group">
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Mata Pelajaran</label>
                                <select
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                                    className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                    required
                                >
                                    <option value="">PILIH MATA PELAJARAN...</option>
                                    {subjectsToDisplay.map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                                </select>
                            </div>
                            <div className="group">
                                <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Kelas Tujuan</label>
                                <select
                                    value={formData.class}
                                    onChange={e => setFormData({ ...formData, class: e.target.value })}
                                    className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                    required
                                >
                                    <option value="">PILIH KELAS...</option>
                                    {profileClasses.map(c => <option key={c} value={c}>KELAS {c}</option>)}
                                    {profileClasses.length === 0 && CLASS_LIST.map(c => <option key={c} value={c}>KELAS {c}</option>)}
                                </select>
                            </div>
                        </div>
                    )}

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
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
                            className="flex-[2] px-8 py-4 rounded-[1.25rem] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "MEMPROSES..." : "SIMPAN KONFIGURASI JADWAL"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
