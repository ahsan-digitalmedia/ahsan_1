"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";
import { cn, SUBJECT_LIST, normalizeSubject, splitSubjects, joinSubjects } from "@/lib/utils";

export default function TeacherModal() {
    const { state, updateState } = useApp();
    const { editingItem, modalMode } = state;

    const [formData, setFormData] = useState({
        name: "",
        school_name: "",
        npsn: "",
        nip: "",
        email: "",
        phone: "",
        subject: "",
        password: "",
        status: "active",
        class: "" // Added class field to state
    });

    const [classRows, setClassRows] = useState([{ level: "1", suffix: "" }]);
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (modalMode === "edit" && editingItem) {
            const initialSubject = editingItem.subject ? normalizeSubject(editingItem.subject) : "";
            setFormData({
                name: editingItem.name || "",
                school_name: editingItem.school_name || "",
                npsn: editingItem.npsn || "",
                nip: editingItem.nip || "",
                email: editingItem.email || "",
                phone: editingItem.phone || "",
                subject: initialSubject.includes(',') ? joinSubjects(splitSubjects(initialSubject)) : initialSubject,
                password: editingItem.password || "",
                status: editingItem.status || "active",
                class: editingItem.class || ""
            });

            // Parse existing classes
            const managedClasses = (editingItem.class || "").split(",").map(c => c.trim()).filter(c => c);
            if (managedClasses.length > 0) {
                setClassRows(managedClasses.map(c => {
                    const level = (c.match(/^\d+/) || ["1"])[0];
                    const suffix = c.replace(/^\d+/, "");
                    return { level, suffix };
                }));
            }
        }
    }, [modalMode, editingItem]);

    const handleSubjectChange = (subj) => {
        if (!subj) return;
        const normalized = normalizeSubject(subj);
        const currentSubjects = splitSubjects(formData.subject);
        if (!currentSubjects.includes(normalized)) {
            const updated = joinSubjects([...currentSubjects, normalized]);
            setFormData({ ...formData, subject: updated });
        }
    };

    const addClassRow = () => setClassRows([...classRows, { level: "1", suffix: "" }]);
    const removeClassRow = (index) => setClassRows(classRows.filter((_, i) => i !== index));
    const updateClassRow = (index, field, value) => {
        const newRows = [...classRows];
        newRows[index][field] = value;
        setClassRows(newRows);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const classString = classRows
                .map(row => `${row.level}${row.suffix.toUpperCase()}`)
                .filter(c => c)
                .join(", ");

            const payload = {
                ...formData,
                class: classString,
                type: "teacher",
            };

            if (modalMode === "edit" && editingItem) {
                await supabaseData.update(editingItem.__backendId, payload);
            } else {
                await supabaseData.create(payload);
            }
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Error saving teacher:", error);
            alert("Gagal menyimpan data guru");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => updateState({ showModal: false, editingItem: null })}></div>
            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-lg relative z-10 overflow-hidden animate-zoomIn flex flex-col max-h-[92vh] border border-slate-100">

                {/* Header */}
                <div className="gradient-blue p-8 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                    <h3 className="text-xl font-black tracking-tight relative z-10">{modalMode === "edit" ? "Edit Profil Guru" : "Tambah Guru Baru"}</h3>
                    <p className="text-blue-100 text-[10px] font-bold uppercase tracking-widest mt-1 opacity-80 relative z-10">Lengkapi informasi profil dan akses sistem</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-7 overflow-y-auto custom-scrollbar flex-1">
                    <div className="space-y-5">
                        <FormGroup label="Nama Lengkap *" required>
                            <input type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required className="input-modern" placeholder="Cth: Dr. Ahmad Subarjo, M.Pd" />
                        </FormGroup>

                        <div className="grid grid-cols-2 gap-5">
                            <FormGroup label="Nama Sekolah *" required>
                                <input type="text" value={formData.school_name} onChange={e => setFormData({ ...formData, school_name: e.target.value })} required className="input-modern" placeholder="Cth: SDN 1 Poncowati" />
                            </FormGroup>
                            <FormGroup label="NPSN Sekolah *" required>
                                <input type="text" value={formData.npsn} onChange={e => setFormData({ ...formData, npsn: e.target.value })} required className="input-modern" placeholder="Cth: 108XXXXX" />
                            </FormGroup>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <FormGroup label="NIP (18 Digit) *" required>
                                <input type="text" value={formData.nip} onChange={e => setFormData({ ...formData, nip: e.target.value })} required className="input-modern" placeholder="19XXXXXXXXXXXXXX" />
                            </FormGroup>
                            <FormGroup label="Status Akun *" required>
                                <select value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })} required className="input-modern cursor-pointer">
                                    <option value="active">AKTIF</option>
                                    <option value="inactive">NON-AKTIF</option>
                                    <option value="pending">MENUNGGU AKTIVASI</option>
                                </select>
                            </FormGroup>
                        </div>

                        {/* Class Management Section */}
                        <div className="p-5 bg-slate-50/50 rounded-[1.5rem] border border-slate-100 space-y-5">
                            <div className="flex items-center justify-between">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kelas yang Diampu *</label>
                                <button type="button" onClick={addClassRow} className="text-[10px] font-black text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm transition-all hover:shadow-md active:scale-95">
                                    + TAMBAH KELAS
                                </button>
                            </div>
                            <div className="space-y-4">
                                {classRows.map((row, idx) => (
                                    <div key={idx} className="flex gap-2.5 animate-fadeIn">
                                        <select
                                            value={row.level}
                                            onChange={e => updateClassRow(idx, "level", e.target.value)}
                                            className="flex-1 px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black bg-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all cursor-pointer"
                                        >
                                            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => <option key={n} value={n}>KELAS {n}</option>)}
                                        </select>
                                        <input
                                            type="text"
                                            value={row.suffix}
                                            onChange={e => updateClassRow(idx, "suffix", e.target.value)}
                                            placeholder="Rombel (Cth: A)"
                                            className="flex-[2] px-4 py-2.5 border border-slate-200 rounded-xl text-xs font-black uppercase bg-white outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 transition-all placeholder:font-bold placeholder:text-slate-300"
                                        />
                                        {classRows.length > 1 && (
                                            <button type="button" onClick={() => removeClassRow(idx)} className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                            <FormGroup label="Email *" required>
                                <input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required className="input-modern" placeholder="guru@sekolah.id" />
                            </FormGroup>
                            <FormGroup label="Telepon">
                                <input type="text" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} className="input-modern" placeholder="08XXXXXXXXXX" />
                            </FormGroup>
                        </div>

                        <FormGroup label="Mata Pelajaran Ampuan *" required>
                            <div className="space-y-4">
                                <select
                                    onChange={e => handleSubjectChange(e.target.value)}
                                    className="input-modern cursor-pointer"
                                    value=""
                                >
                                    <option value="">+ Tambah Mata Pelajaran...</option>
                                    {SUBJECT_LIST.map(s => (
                                        <option key={s} value={s}>{s}</option>
                                    ))}
                                </select>

                                {formData.subject && splitSubjects(formData.subject).length > 0 && (
                                    <div className="flex flex-wrap gap-2.5 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[60px]">
                                        {splitSubjects(formData.subject).map(s => {
                                            const clean = s.trim();
                                            return (
                                                <div key={clean} className="pl-4 pr-2.5 py-1.5 bg-white border border-indigo-100 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-3 shadow-sm group">
                                                    {clean}
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const updated = joinSubjects(
                                                                splitSubjects(formData.subject)
                                                                    .filter(item => item !== clean)
                                                            );
                                                            setFormData({ ...formData, subject: updated });
                                                        }}
                                                        className="w-5 h-5 rounded-lg bg-indigo-50 flex items-center justify-center hover:bg-red-50 hover:text-red-500 transition-all font-black"
                                                    >✕</button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </FormGroup>

                        <div className="grid grid-cols-1 gap-4">
                            <FormGroup label="Password Akun *" required>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                        required
                                        className="input-modern pr-14 font-mono tracking-widest"
                                        placeholder="Min. 6 karakter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            {showPassword ? (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            ) : (
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a10.05 10.05 0 014.125-5.125m5.438-1.576A10.05 10.05 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21m-2.102-2.102L3 3" />
                                            )}
                                        </svg>
                                    </button>
                                </div>
                            </FormGroup>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-4 border-t border-slate-100 mt-auto">
                        <button
                            type="button"
                            onClick={() => updateState({ showModal: false, editingItem: null })}
                            className="flex-1 px-6 py-3.5 rounded-2xl border border-slate-200 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:bg-slate-50 transition-all"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-[2] btn-primary px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest disabled:opacity-50"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center justify-center gap-2">
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Menyimpan...
                                </div>
                            ) : (modalMode === 'edit' ? "Simpan Perubahan" : "Tambah Guru")}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function FormGroup({ label, children, required }) {
    return (
        <div className="space-y-1.5">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
            {children}
        </div>
    );
}
