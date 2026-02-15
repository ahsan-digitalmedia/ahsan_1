"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function AdminSettingsPage() {
    const { state, updateState } = useApp();
    const { config } = state;

    const [schoolData, setSchoolData] = useState({
        app_name: config?.app_name || "Guru Merdeka",
        app_version: config?.app_version || "Merdeka Mengajar V2.0",
        running_text: config?.running_text || "",
        admin_contact: config?.admin_contact || "6285268474347",
        academic_year: config?.academic_year || "2024/2025",
        semester: config?.semester || "Ganjil",
    });

    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (config) {
            setSchoolData({
                app_name: config.app_name || "Guru Merdeka",
                app_version: config.app_version || "Merdeka Mengajar V2.0",
                running_text: config.running_text || "",
                admin_contact: config.admin_contact || "6285268474347",
                academic_year: config.academic_year || "2024/2025",
                semester: config.semester || "Ganjil",
            });
        }
    }, [config]);

    const handleSaveConfig = async (e) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await supabaseData.updateConfig(schoolData);
            updateState({ config: { ...config, ...schoolData } });
            alert("Konfigurasi aplikasi berhasil disimpan");
        } catch (err) {
            console.error("Error saving config:", err);
            alert("Gagal menyimpan konfigurasi");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="animate-fadeIn max-w-4xl mx-auto pb-12">
            <div className="mb-10 animate-slideIn">
                <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Konfigurasi Aplikasi</h1>
                <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Atur identitas aplikasi, semester, dan variabel global sistem.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {/* App Identity */}
                    <section className="bg-white rounded-2xl shadow-modern border border-slate-100 overflow-hidden group transition-all">
                        <div className="p-7 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                            <div className="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-105 transition-transform">🚀</div>
                            <div>
                                <h3 className="font-bold text-slate-800 tracking-tight">Identitas Utama</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Penamaan & Branding</p>
                            </div>
                        </div>
                        <div className="p-7 space-y-6">
                            <FormGroup label="Nama Aplikasi">
                                <input type="text" value={schoolData.app_name} onChange={e => setSchoolData({ ...schoolData, app_name: e.target.value })} className="input-modern" placeholder="Cth: Guru Merdeka" />
                                <p className="text-[10px] text-slate-300 font-semibold mt-2 ml-1">Nama ini akan muncul di halaman login dan header sistem.</p>
                            </FormGroup>
                            <FormGroup label="Versi Aplikasi">
                                <input type="text" value={schoolData.app_version} onChange={e => setSchoolData({ ...schoolData, app_version: e.target.value })} className="input-modern" placeholder="Cth: Merdeka Mengajar V2.0" />
                                <p className="text-[10px] text-slate-300 font-semibold mt-2 ml-1">Versi aplikasi yang tampil di bawah nama aplikasi pada halaman login.</p>
                            </FormGroup>
                            <FormGroup label="Running Text (Login)">
                                <textarea
                                    value={schoolData.running_text}
                                    onChange={e => setSchoolData({ ...schoolData, running_text: e.target.value })}
                                    className="input-modern min-h-[100px] py-4 resize-none leading-relaxed"
                                    placeholder="Cth: Selamat datang bapak/ibu guru di portal SDN 1 Poncowati..."
                                />
                                <p className="text-[10px] text-slate-300 font-semibold mt-2 ml-1">Pesan teks berjalan yang tampil di paling atas halaman login.</p>
                            </FormGroup>
                            <FormGroup label="Kontak Bantuan">
                                <input type="text" value={schoolData.admin_contact} onChange={e => setSchoolData({ ...schoolData, admin_contact: e.target.value })} className="input-modern" placeholder="Cth: 08123456789 (WhatsApp)" />
                            </FormGroup>
                        </div>
                    </section>
                </div>

                {/* Academic Settings & Tools */}
                <div className="space-y-8">
                    <section className="bg-white rounded-2xl shadow-modern border border-slate-100 overflow-hidden group transition-all">
                        <div className="p-7 border-b border-slate-50 flex items-center gap-4 bg-slate-50/30">
                            <div className="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center text-white text-lg shadow-sm group-hover:scale-105 transition-transform">📅</div>
                            <div>
                                <h3 className="font-bold text-slate-800 tracking-tight">Siklus Akademik</h3>
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Tahun & Semester</p>
                            </div>
                        </div>
                        <div className="p-7 space-y-6">
                            <FormGroup label="Tahun Pelajaran Default">
                                <select value={schoolData.academic_year} onChange={e => setSchoolData({ ...schoolData, academic_year: e.target.value })} className="input-modern cursor-pointer">
                                    <option value="2023/2024">TAHUN 2023/2024</option>
                                    <option value="2024/2025">TAHUN 2024/2025</option>
                                    <option value="2025/2026">TAHUN 2025/2026</option>
                                </select>
                            </FormGroup>
                            <FormGroup label="Semester Default">
                                <select value={schoolData.semester} onChange={e => setSchoolData({ ...schoolData, semester: e.target.value })} className="input-modern cursor-pointer">
                                    <option value="Ganjil">SEMESTER GANJIL</option>
                                    <option value="Genap">SEMESTER GENAP</option>
                                </select>
                            </FormGroup>
                        </div>
                    </section>

                    <button
                        onClick={handleSaveConfig}
                        disabled={isSaving}
                        className="w-full bg-indigo-600 text-white py-4 rounded-xl text-[13px] font-bold uppercase tracking-widest shadow-md hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {isSaving ? "Menyimpan Konfigurasi..." : "💾 Simpan Perubahan"}
                    </button>

                </div>
            </div>

        </div>
    );
}

function FormGroup({ label, children }) {
    return (
        <div className="space-y-2.5">
            <label className="label-modern">
                {label}
            </label>
            {children}
        </div>
    );
}
