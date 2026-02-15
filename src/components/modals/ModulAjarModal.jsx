"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";
import { SUBJECT_LIST, FASE_LIST, DIMENSION_LIST, CLASS_LIST, normalizeSubject, normalizeSubjectList } from "@/lib/utils";

export default function ModulAjarModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem, modalMode } = state;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const formRef = React.useRef(null);

    const [aiInput, setAiInput] = useState({
        topic: "",
        chapter: "",
        goal: "",
        approach: "Kurikulum Merdeka", // or "Deep Learning"
        grade_level: "SD", // Internal fallback
        fase: "A",
        class: "1",
        subject: ""
    });

    const [formData, setFormData] = useState({
        modul_subject: "",
        modul_fase: "A",
        modul_class: "1",
        modul_topic: "",
        modul_jp: "2",
        modul_semester: "1",
        modul_academic_year: "2024/2025",
        // Identitas
        modul_teacher_name: "",
        modul_school_name: "",
        // Komponen Inti
        modul_comp_initial: "",
        modul_tp: "",
        modul_meaningful: "",
        modul_method: "",
        modul_trigger_questions: "",
        // Kegiatan
        modul_activity_pre: "",
        modul_activity_core: "",
        modul_activity_post: "",
        // Asesmen
        modul_ass_diag: "",
        modul_ass_form: "",
        modul_ass_sum: "",
        // Lampiran
        modul_lkpd: "-",
        modul_media: "-",
        modul_glosarium: "-",
        modul_bibliography: "-",
        modul_p5: [],
        // NEW: Deep Learning Fields
        modul_cp: "",
        modul_cross_disciplinary: "",
    });

    useEffect(() => {
        if (state.currentUser && modalMode === "add") {
            const profileSubject = normalizeSubject(state.currentUser.subject?.split(',')[0]?.trim() || "");
            const profileClass = state.currentUser.class?.split(',')[0]?.trim() || "1";

            // Infer Fase (A:1-2, B:3-4, C:5-6, D:7-9)
            const classMatch = profileClass.match(/\d+/);
            const classNum = classMatch ? parseInt(classMatch[0]) : 1;

            let profileFase = "A";
            if (classNum === 1 || classNum === 2) profileFase = "A";
            else if (classNum === 3 || classNum === 4) profileFase = "B";
            else if (classNum === 5 || classNum === 6) profileFase = "C";
            else if (classNum >= 7 && classNum <= 9) profileFase = "D";

            // Infer level (SD: 1-6, SMP: 7-9)
            const profileLevel = (classNum >= 7) ? "SMP" : "SD";

            setFormData(prev => ({
                ...prev,
                modul_teacher_name: state.currentUser.name || "",
                modul_school_name: state.currentUser.school_name || "",
                modul_semester: state.currentUser.semester || "1",
                modul_academic_year: state.currentUser.academic_year || "2024/2025",
                modul_subject: profileSubject,
                modul_class: profileClass,
                modul_fase: profileFase
            }));

            // Sync AI Input with Profile
            setAiInput(prev => ({
                ...prev,
                grade_level: profileLevel,
                fase: profileFase,
                class: profileClass,
                subject: profileSubject
            }));
        }

        if (modalMode === "edit" && editingItem) {
            let p5 = [];
            try {
                p5 = typeof editingItem.modul_p5 === 'string' ? JSON.parse(editingItem.modul_p5) : (editingItem.modul_p5 || []);
            } catch (e) { p5 = []; }

            setFormData({
                ...editingItem,
                modul_p5: p5
            });
        }
    }, [modalMode, editingItem, state.currentUser]);

    const handleAiGenerate = async () => {
        if (!aiInput.topic || !aiInput.chapter || !aiInput.goal) {
            alert("Harap isi Topik, Bab, dan Tujuan untuk generate AI");
            return;
        }

        setIsGenerating(true);
        try {
            const response = await fetch('/api/ai/generate-modul', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...aiInput,
                    teacherInfo: {
                        name: formData.modul_teacher_name,
                        school_name: formData.modul_school_name,
                        subject: aiInput.subject || formData.modul_subject,
                        class: aiInput.class || formData.modul_class,
                        fase: aiInput.fase || formData.modul_fase,
                        semester: formData.modul_semester,
                        academic_year: formData.modul_academic_year,
                        grade_level: aiInput.grade_level
                    }
                })
            });

            const result = await response.json();
            if (result.error) throw new Error(result.error);

            console.log("AI Generation Result:", result); // Debugging

            // Merging AI result into formData
            // Merging AI result into formData
            setFormData(prev => ({
                ...prev,
                ...result,
                // Ensure only existing dimensions are marked as checked
                modul_p5: Array.isArray(result.modul_p5)
                    ? result.modul_p5.filter(dim => DIMENSION_LIST.includes(dim))
                    : prev.modul_p5
            }));

            // Scroll to the top of the form after generation
            if (formRef.current) {
                formRef.current.scrollIntoView({ behavior: 'smooth' });
            }
        } catch (error) {
            console.error("AI Generation Error:", error);
            alert(error.message || "Gagal generate AI. Periksa koneksi atau API Key.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleP5Change = (dim) => {
        setFormData(prev => {
            const current = Array.isArray(prev.modul_p5) ? prev.modul_p5 : [];
            if (current.includes(dim)) {
                return { ...prev, modul_p5: current.filter(d => d !== dim) };
            } else {
                if (current.length >= 4) return prev; // Max 4 based on user request
                return { ...prev, modul_p5: [...current, dim] };
            }
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const payload = {
                ...formData,
                type: "modul_ajar",
                modul_p5: JSON.stringify(formData.modul_p5 || []),
                updated_at: new Date().toISOString(),
                modul_approach: aiInput.approach
            };

            if (modalMode === 'edit' && editingItem) {
                await supabaseData.update(editingItem.__backendId, payload);
            } else {
                await supabaseData.create(payload);
            }
            await processData();
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save modul error:", error);
            alert("Gagal menyimpan modul ajar");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-slate-50 rounded-2xl w-full max-w-5xl relative z-10 animate-zoomIn flex flex-col h-[90vh] overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-slate-900 px-8 py-6 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight leading-none mb-2">{modalMode === 'edit' ? 'Edit Modul Ajar' : 'Arsitek Pembelajaran'}</h3>
                            <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-widest mt-0.5">STRATEGI PEDAGOGIK KURIKULUM MERDEKA</p>
                        </div>
                        <div className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-lg flex items-center justify-center text-xl shadow-inner border border-white/10">
                            ✨
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-12" ref={formRef}>
                    {/* SECTION 0: AI GENERATOR */}
                    {modalMode === 'add' && (
                        <div className="bg-white p-8 rounded-2xl shadow-modern border border-slate-100 max-w-4xl mx-auto space-y-8 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-teal-50 rounded-full blur-3xl opacity-50 -mr-32 -mt-32"></div>

                            <div className="text-center space-y-2 relative z-10">
                                <div className="inline-block px-3 py-1 bg-teal-50 rounded-full text-[9px] font-bold text-teal-600 uppercase tracking-wider mb-1">AI ASSISTANT READY</div>
                                <h4 className="text-2xl font-bold text-slate-900 tracking-tight">Kopilot Modul Ajar <span className="text-teal-500">Intuitif</span></h4>
                                <p className="text-slate-400 text-xs font-medium">Bantu susun strategi pengajaran Anda dengan kecerdasan buatan.</p>
                            </div>

                            <div className="space-y-6 relative z-10">
                                <FormGroup label="PILIH FILOSOFI & PENDEKATAN">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setAiInput({ ...aiInput, approach: "Kurikulum Merdeka" })}
                                            className={`p-4 rounded-xl border-2 transition-all text-left group ${aiInput.approach === "Kurikulum Merdeka" ? 'border-teal-500 bg-teal-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className={`font-bold text-[10px] uppercase tracking-wide ${aiInput.approach === "Kurikulum Merdeka" ? 'text-teal-600' : 'text-slate-400'}`}>Kurikulum Merdeka</div>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${aiInput.approach === "Kurikulum Merdeka" ? 'border-teal-500 bg-teal-500' : 'border-slate-300'}`}>
                                                    {aiInput.approach === "Kurikulum Merdeka" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium leading-relaxed">Fokus pada kompetensi inti, CP, dan TP standar nasional.</div>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setAiInput({ ...aiInput, approach: "Deep Learning" })}
                                            className={`p-4 rounded-xl border-2 transition-all text-left group ${aiInput.approach === "Deep Learning" ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-100 bg-slate-50 hover:border-slate-200'}`}
                                        >
                                            <div className="flex items-center justify-between mb-1.5">
                                                <div className={`font-bold text-[10px] uppercase tracking-wide ${aiInput.approach === "Deep Learning" ? 'text-indigo-600' : 'text-slate-400'}`}>Deep Learning</div>
                                                <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${aiInput.approach === "Deep Learning" ? 'border-indigo-500 bg-indigo-500' : 'border-slate-300'}`}>
                                                    {aiInput.approach === "Deep Learning" && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                                </div>
                                            </div>
                                            <div className="text-[11px] text-slate-500 font-medium leading-relaxed">Mindful, Meaningful, Joyful (Fokus keterlibatan mendalam).</div>
                                        </button>
                                    </div>
                                </FormGroup>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 p-6 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">MApEL</label>
                                        <select
                                            value={aiInput.subject}
                                            onChange={e => {
                                                const val = normalizeSubject(e.target.value);
                                                setAiInput({ ...aiInput, subject: val });
                                                setFormData(prev => ({ ...prev, modul_subject: val }));
                                            }}
                                            className="w-full h-10 bg-white border-2 border-slate-100 rounded-lg px-4 font-bold text-[11px] text-slate-700 focus:border-teal-400 outline-none transition-all appearance-none cursor-pointer"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.7rem' }}
                                        >
                                            <option value="">PILIH MAPEL...</option>
                                            {SUBJECT_LIST.map(s => (
                                                <option key={s} value={s}>{s.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors text-center">FASE AKTIF</label>
                                        <div className="h-10 bg-slate-200/50 rounded-lg flex items-center justify-center font-bold text-slate-500 text-[11px] border-2 border-transparent">
                                            FASE {aiInput.fase || "-"} <span className="ml-1.5 text-[8px] font-medium opacity-50">(AUTO)</span>
                                        </div>
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">KELAS</label>
                                        <select
                                            value={aiInput.class}
                                            onChange={e => {
                                                const val = e.target.value;
                                                let phase = "A";
                                                if (val) {
                                                    const classNum = parseInt(val.charAt(0));
                                                    if (classNum === 1 || classNum === 2) phase = "A";
                                                    else if (classNum === 3 || classNum === 4) phase = "B";
                                                    else if (classNum === 5 || classNum === 6) phase = "C";
                                                    else if (classNum >= 7 && classNum <= 9) phase = "D";
                                                }
                                                setAiInput({ ...aiInput, class: val, fase: phase });
                                                setFormData(prev => ({ ...prev, modul_class: val, modul_fase: phase }));
                                            }}
                                            className="w-full h-10 bg-white border-2 border-slate-100 rounded-lg px-4 font-bold text-[11px] text-slate-700 focus:border-teal-400 outline-none transition-all appearance-none cursor-pointer"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.7rem' }}
                                        >
                                            <option value="">PILIH KELAS...</option>
                                            {(() => {
                                                const profileClasses = state.currentUser?.class ? state.currentUser.class.split(',').map(c => c.trim()).filter(c => c) : [];
                                                if (profileClasses.length === 0) return CLASS_LIST.map(c => <option key={c} value={c}>KELAS {c}</option>);
                                                return profileClasses.map(c => <option key={c} value={c}>KELAS {c}</option>);
                                            })()}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5 relative z-10">
                                <div className="group">
                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">TOPIK MATERI UTAMA</label>
                                    <input
                                        type="text"
                                        value={aiInput.topic}
                                        onChange={e => setAiInput({ ...aiInput, topic: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-700 text-[11px] focus:border-teal-400 focus:bg-white outline-none transition-all"
                                        placeholder="Cth: Ekosistem Laut"
                                    />
                                </div>
                                <div className="group">
                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">BAB / UNIT</label>
                                    <input
                                        type="text"
                                        value={aiInput.chapter}
                                        onChange={e => setAiInput({ ...aiInput, chapter: e.target.value })}
                                        className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-700 text-[11px] focus:border-teal-400 focus:bg-white outline-none transition-all"
                                        placeholder="Cth: Bab 3: Aku dan Lingkungan"
                                    />
                                </div>
                            </div>

                            <div className="group relative z-10">
                                <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors uppercase tracking-widest">TARGET TUJUAN PEMBELAJARAN</label>
                                <textarea
                                    value={aiInput.goal}
                                    onChange={e => setAiInput({ ...aiInput, goal: e.target.value })}
                                    className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed"
                                    placeholder="Cth: Siswa dapat mengidentifikasi rantai makanan..."
                                />
                            </div>

                            <button
                                type="button"
                                onClick={handleAiGenerate}
                                disabled={isGenerating}
                                className="w-full py-3.5 rounded-lg bg-slate-900 text-white font-bold text-[11px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-lg relative z-10"
                            >
                                {isGenerating ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        MENYELARASKAN DATA AI...
                                    </>
                                ) : (
                                    <>
                                        <span>✨</span> GENERATE MODUL OTOMATIS
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* FORM CONTENT */}
                    <form onSubmit={handleSubmit} className="space-y-12">
                        {/* SECTION 1: IDENTITAS */}
                        <div className="bg-white p-8 rounded-2xl shadow-modern border border-slate-100">
                            <div className="flex items-center gap-4 mb-8">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-md">1</div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">Informasi Umum</h4>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">IDENTITAS & BASIS PENGAJARAN</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-6 p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors uppercase tracking-widest">Identitas Instruktur</label>
                                        <input type="text" value={formData.modul_teacher_name} onChange={e => setFormData({ ...formData, modul_teacher_name: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 font-bold text-[11px] text-slate-700 focus:border-teal-400 outline-none transition-all" placeholder="Nama Guru" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Institusi Pendidikan</label>
                                        <input type="text" value={formData.modul_school_name} onChange={e => setFormData({ ...formData, modul_school_name: e.target.value })} className="w-full h-10 bg-white border border-slate-200 rounded-lg px-4 font-bold text-[11px] text-slate-700 focus:border-teal-400 outline-none transition-all" placeholder="Nama Sekolah" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Disiplin Ilmu (Mapel)</label>
                                        <select
                                            value={formData.modul_subject}
                                            onChange={e => {
                                                const val = normalizeSubject(e.target.value);
                                                setFormData({ ...formData, modul_subject: val });
                                                setAiInput(prev => ({ ...prev, subject: val }));
                                            }}
                                            className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-700 text-[11px] focus:border-teal-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer"
                                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.8rem' }}
                                            required
                                        >
                                            <option value="">PILIH MAPEL...</option>
                                            {SUBJECT_LIST.map(s => (
                                                <option key={s} value={s}>{s.toUpperCase()}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Level: Fase & Kelas</label>
                                        <div className="grid grid-cols-2 gap-3">
                                            <select
                                                value={formData.modul_fase}
                                                onChange={e => setFormData({ ...formData, modul_fase: e.target.value })}
                                                className="h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-700 text-[11px] focus:border-teal-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer text-center"
                                                required
                                            >
                                                {FASE_LIST.map(f => <option key={f} value={f}>FASE {f}</option>)}
                                            </select>
                                            <select
                                                value={formData.modul_class}
                                                onChange={e => {
                                                    const val = e.target.value;
                                                    let phase = "";
                                                    if (val) {
                                                        const classNum = parseInt(val.charAt(0));
                                                        if (classNum === 1 || classNum === 2) phase = "A";
                                                        else if (classNum === 3 || classNum === 4) phase = "B";
                                                        else if (classNum === 5 || classNum === 6) phase = "C";
                                                        else if (classNum >= 7 && classNum <= 9) phase = "D";
                                                    }
                                                    setFormData({ ...formData, modul_class: val, modul_fase: phase });
                                                    setAiInput(prev => ({ ...prev, class: val, fase: phase }));
                                                }}
                                                className="h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-700 text-[11px] focus:border-teal-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer text-center"
                                                required
                                            >
                                                <option value="">KELAS...</option>
                                                {(() => {
                                                    const teacherClasses = state.currentUser?.class ? state.currentUser.class.split(',').map(c => c.trim()).filter(c => c) : [];
                                                    if (teacherClasses.length === 0) return CLASS_LIST.map(c => <option key={c} value={c}>KELAS {c}</option>);
                                                    return teacherClasses.map(c => <option key={c} value={c}>KELAS {c}</option>);
                                                })()}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                                    <div className="md:col-span-2 group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Judul Topik Pembelajaran</label>
                                        <input type="text" value={formData.modul_topic} onChange={e => setFormData({ ...formData, modul_topic: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-700 text-[11px] focus:border-teal-400 focus:bg-white outline-none transition-all" placeholder="Cth: Penjumlahan Bilangan" required />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Alokasi (JP)</label>
                                        <input type="number" value={formData.modul_jp} onChange={e => setFormData({ ...formData, modul_jp: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-700 text-[11px] focus:border-teal-400 focus:bg-white outline-none transition-all" placeholder="2" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Semester Aktif</label>
                                        <select value={formData.modul_semester} onChange={e => setFormData({ ...formData, modul_semester: e.target.value })} className="w-full h-11 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-slate-700 text-[11px] focus:border-teal-400 focus:bg-white outline-none transition-all appearance-none cursor-pointer" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '0.8rem' }}>
                                            <option value="1">GANJIL</option>
                                            <option value="2">GENAP</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 2: KOMPONEN INTI */}
                        <div className="bg-white p-8 rounded-2xl shadow-modern border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>

                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-md">2</div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">Komponen Inti</h4>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">STRATEGI & CAPAIAN PEMBELAJARAN</p>
                                </div>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors flex items-center gap-2">
                                            <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[8px]">🎯</span> Kompetensi Awal
                                        </label>
                                        <textarea value={formData.modul_comp_initial} onChange={e => setFormData({ ...formData, modul_comp_initial: e.target.value })} className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" placeholder="Kemampuan prasyarat yang harus dimiliki siswa..." />
                                    </div>

                                    {aiInput.approach === "Deep Learning" && (
                                        <div className="group">
                                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors flex items-center gap-2">
                                                <span className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center text-[8px]">💎</span> Capaian Pembelajaran (CP)
                                            </label>
                                            <textarea value={formData.modul_cp} onChange={e => setFormData({ ...formData, modul_cp: e.target.value })} className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                        </div>
                                    )}

                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors flex items-center gap-2">
                                            <span className="w-5 h-5 rounded bg-slate-100 flex items-center justify-center text-[8px]">📍</span> Tujuan Pembelajaran (TP)
                                        </label>
                                        <textarea value={formData.modul_tp} onChange={e => setFormData({ ...formData, modul_tp: e.target.value })} className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                    </div>

                                    {aiInput.approach === "Deep Learning" && (
                                        <div className="group">
                                            <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors flex items-center gap-2">
                                                <span className="w-5 h-5 rounded bg-indigo-50 flex items-center justify-center text-[8px]">🌐</span> Lintas Disiplin Ilmu
                                            </label>
                                            <textarea value={formData.modul_cross_disciplinary} onChange={e => setFormData({ ...formData, modul_cross_disciplinary: e.target.value })} className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                        </div>
                                    )}
                                </div>

                                <div className="group p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-4 block group-focus-within:text-teal-500 transition-colors text-center">Dimensi Profil Lulusan <span className="opacity-50">— Maks 4 Pilihan</span></label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                        {DIMENSION_LIST.map(dim => (
                                            <label key={dim} className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${formData.modul_p5?.includes(dim) ? 'bg-white border-teal-500 shadow-sm' : 'bg-transparent border-transparent hover:bg-white/50 hover:border-slate-200'}`}>
                                                <div className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${formData.modul_p5?.includes(dim) ? 'bg-teal-500 border-teal-500' : 'bg-white border-slate-200'}`}>
                                                    {formData.modul_p5?.includes(dim) && <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>}
                                                </div>
                                                <input type="checkbox" checked={formData.modul_p5?.includes(dim)} onChange={() => handleP5Change(dim)} className="hidden" />
                                                <span className={`text-[9px] font-bold uppercase tracking-wider ${formData.modul_p5?.includes(dim) ? 'text-slate-900' : 'text-slate-400'}`}>{dim}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors uppercase tracking-widest">Model Pembelajaran</label>
                                        <textarea value={formData.modul_method} onChange={e => setFormData({ ...formData, modul_method: e.target.value })} className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors uppercase tracking-widest">Pertanyaan Pemantik</label>
                                        <textarea value={formData.modul_trigger_questions} onChange={e => setFormData({ ...formData, modul_trigger_questions: e.target.value })} className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors uppercase tracking-widest">Pemahaman Bermakna</label>
                                        <textarea value={formData.modul_meaningful} onChange={e => setFormData({ ...formData, modul_meaningful: e.target.value })} className="w-full h-20 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION 3: KEGIATAN */}
                        <div className="bg-white p-8 rounded-2xl shadow-modern border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-teal-50 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>

                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-md">3</div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">Rencana Kegiatan</h4>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">ALUR & PROSES PEMBELAJARAN</p>
                                </div>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="group">
                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-teal-50 flex items-center justify-center text-[9px]">🏁</span> I.1. PENDAHULUAN (ORIENTASI)
                                    </label>
                                    <textarea value={formData.modul_activity_pre} onChange={e => setFormData({ ...formData, modul_activity_pre: e.target.value })} className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                </div>
                                <div className="group">
                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-teal-50 flex items-center justify-center text-[9px]">⚙️</span> I.2. KEGIATAN INTI (EXPLORASI)
                                    </label>
                                    <textarea value={formData.modul_activity_core} onChange={e => setFormData({ ...formData, modul_activity_core: e.target.value })} className="w-full h-48 bg-slate-50 border border-slate-200 rounded-xl p-6 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                </div>
                                <div className="group">
                                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors uppercase tracking-widest flex items-center gap-2">
                                        <span className="w-5 h-5 rounded bg-teal-50 flex items-center justify-center text-[9px]">🛑</span> I.3. PENUTUP (REFLEKSI)
                                    </label>
                                    <textarea value={formData.modul_activity_post} onChange={e => setFormData({ ...formData, modul_activity_post: e.target.value })} className="w-full h-24 bg-slate-50 border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                </div>
                            </div>
                        </div>

                        {/* SECTION 4: ASESMEN & LAMPIRAN */}
                        <div className="bg-white p-8 rounded-2xl shadow-modern border border-slate-100 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-50 rounded-full blur-3xl opacity-30 -mr-20 -mt-20"></div>

                            <div className="flex items-center gap-4 mb-8 relative z-10">
                                <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-md">4</div>
                                <div>
                                    <h4 className="text-lg font-bold text-slate-900 tracking-tight">Asesmen & Lampiran</h4>
                                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-wider mt-0.5">EVALUASI & SUMBER REFERENSI</p>
                                </div>
                            </div>

                            <div className="space-y-8 relative z-10">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 bg-slate-50/50 rounded-xl border border-slate-100">
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Diagnostik</label>
                                        <textarea value={formData.modul_ass_diag} onChange={e => setFormData({ ...formData, modul_ass_diag: e.target.value })} className="w-full h-20 bg-white border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Formatif</label>
                                        <textarea value={formData.modul_ass_form} onChange={e => setFormData({ ...formData, modul_ass_form: e.target.value })} className="w-full h-20 bg-white border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2 block group-focus-within:text-teal-500 transition-colors">Sumatif</label>
                                        <textarea value={formData.modul_ass_sum} onChange={e => setFormData({ ...formData, modul_ass_sum: e.target.value })} className="w-full h-20 bg-white border border-slate-200 rounded-lg p-4 font-medium text-slate-600 focus:border-teal-400 focus:bg-white outline-none transition-all resize-none text-xs leading-relaxed" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block group-focus-within:text-teal-500 transition-colors px-1">Lembar Kerja (LKPD)</label>
                                        <input type="text" value={formData.modul_lkpd} onChange={e => setFormData({ ...formData, modul_lkpd: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-[11px] text-slate-700 focus:border-teal-400 focus:bg-white outline-none transition-all" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block group-focus-within:text-teal-500 transition-colors px-1">Media Pembelajaran</label>
                                        <input type="text" value={formData.modul_media} onChange={e => setFormData({ ...formData, modul_media: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-[11px] text-slate-700 focus:border-teal-400 focus:bg-white outline-none transition-all" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block group-focus-within:text-teal-500 transition-colors px-1">Glosarium</label>
                                        <input type="text" value={formData.modul_glosarium} onChange={e => setFormData({ ...formData, modul_glosarium: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-[11px] text-slate-700 focus:border-teal-400 focus:bg-white outline-none transition-all" />
                                    </div>
                                    <div className="group">
                                        <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-1 block group-focus-within:text-teal-500 transition-colors px-1">Daftar Pustaka</label>
                                        <input type="text" value={formData.modul_bibliography} onChange={e => setFormData({ ...formData, modul_bibliography: e.target.value })} className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-4 font-bold text-[11px] text-slate-700 focus:border-teal-400 focus:bg-white outline-none transition-all" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Actions */}
                <div className="p-8 bg-white border-t border-slate-100 flex flex-col sm:flex-row gap-4 shrink-0 relative z-20">
                    <button
                        onClick={() => updateState({ showModal: false })}
                        className="flex-1 px-6 py-3 rounded-lg border border-slate-200 font-bold text-[11px] uppercase tracking-widest text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                    >
                        BATALKAN & TUTUP
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="flex-[2] px-8 py-3 rounded-lg bg-teal-600 text-white font-bold text-[11px] uppercase tracking-widest shadow-lg hover:bg-teal-700 transition-all disabled:opacity-50"
                    >
                        {isSubmitting ? "ARSIP SEDANG DIPROSES..." : (modalMode === 'add' ? "PUBLIKASIKAN MODUL" : "PERBARUI ARSIP MODUL")}
                    </button>
                </div>
            </div>
        </div >
    );
}

function FormGroup({ label, children }) {
    return (
        <div className="space-y-1.5">
            <label className="label-modern">
                {label}
            </label>
            {children}
        </div>
    );
}
