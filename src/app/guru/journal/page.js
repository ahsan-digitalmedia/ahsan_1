"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";

export default function JournalPage() {
    const { state, updateState } = useApp();
    const { appData, currentUser } = state;
    const [activeTab, setActiveTab] = useState("jadwal"); // jadwal | kelas | mengajar

    // Data filtering
    const schedules = useMemo(() => (appData || []).filter(d => d.type === 'schedule').sort((a, b) => {
        const days = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const dayDiff = days.indexOf(a.day) - days.indexOf(b.day);
        if (dayDiff !== 0) return dayDiff;
        return parseInt(a.no) - parseInt(b.no);
    }), [appData]);

    const classJournals = useMemo(() => (appData || []).filter(d => d.type === 'journal_class').sort((a, b) => new Date(b.date) - new Date(a.date)), [appData]);
    const teacherJournals = useMemo(() => (appData || []).filter(d => d.type === 'journal_teacher').sort((a, b) => new Date(b.date) - new Date(a.date)), [appData]);

    const handlePrintMonthly = (type) => {
        const journals = type === 'kelas' ? classJournals : teacherJournals;
        if (journals.length === 0) return alert("Belum ada data untuk dicetak");

        const printWindow = window.open('', '_blank');
        const monthYear = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        let tableContent = "";
        if (type === 'kelas') {
            tableContent = journals.map(j => `
                <div style="margin-bottom: 30px; border: 1px solid #000; padding: 15px; page-break-inside: avoid;">
                    <div style="display: flex; justify-content: space-between; font-weight: bold; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 10px;">
                        <span>Hari/Tgl: ${new Date(j.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span>Kelas: ${j.class}</span>
                    </div>
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="background: #f8fafc;">
                                <th style="border: 1px solid #000; padding: 6px; text-align: center; font-size: 10px;">JAM KE</th>
                                <th style="border: 1px solid #000; padding: 6px; font-size: 10px;">MATA PELAJARAN</th>
                                <th style="border: 1px solid #000; padding: 6px; font-size: 10px;">MATERI POKOK</th>
                                <th style="border: 1px solid #000; padding: 6px; font-size: 10px;">KEJADIAN / CATATAN</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${j.rows.map(r => `
                                <tr>
                                    <td style="border: 1px solid #000; padding: 6px; text-align: center;">${r.jam}</td>
                                    <td style="border: 1px solid #000; padding: 6px;">${r.mapel || '-'}</td>
                                    <td style="border: 1px solid #000; padding: 6px;">${r.materi || '-'}</td>
                                    <td style="border: 1px solid #000; padding: 6px;">${r.catatan || '-'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div style="margin-top: 15px; font-size: 11px;">
                        <strong>Catatan Wali Kelas:</strong><br>
                        ${j.catatan_wali || '-'}
                    </div>
                </div>
            `).join('');
        } else {
            tableContent = `
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="background: #f8fafc;">
                            <th style="border: 1px solid #000; padding: 8px;">NO</th>
                            <th style="border: 1px solid #000; padding: 8px;">HARI/TGL</th>
                            <th style="border: 1px solid #000; padding: 8px;">KELAS</th>
                            <th style="border: 1px solid #000; padding: 8px;">TUJUAN PEMBELAJARAN</th>
                            <th style="border: 1px solid #000; padding: 8px;">MATERI</th>
                            <th style="border: 1px solid #000; padding: 8px;">PENCAPAIAN/REFLEKSI</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${journals.map((j, idx) => `
                            <tr>
                                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${idx + 1}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${new Date(j.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</td>
                                <td style="border: 1px solid #000; padding: 8px; text-align: center;">${j.class}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${j.tp}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${j.materi}</td>
                                <td style="border: 1px solid #000; padding: 8px;">${j.refleksi || '-'}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Jurnal ${type === 'kelas' ? 'Kelas' : 'Mengajar'} - ${monthYear}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                        body { font-family: 'Inter', sans-serif; padding: 40px; font-size: 12px; }
                        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 3px double #000; }
                        h1 { font-size: 18px; margin: 0; text-transform: uppercase; }
                        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-weight: bold; }
                        .footer { margin-top: 50px; display: flex; justify-content: flex-end; break-inside: avoid; page-break-inside: avoid; }
                        .sig-box { text-align: center; width: 250px; }
                        .sig-space { height: 80px; }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <h1>JURNAL ${type === 'kelas' ? 'KELAS' : 'MENGAJAR GURU'}</h1>
                        <p>${currentUser?.school_name || '-'}</p>
                        <p>PERIODE: ${monthYear}</p>
                    </div>
                    <div class="meta">
                        <div>
                            <p>Nama Guru: ${currentUser?.name || '-'}</p>
                            <p>Mapel: ${currentUser?.subject || '-'}</p>
                        </div>
                    </div>
                    ${tableContent}
                    <div class="footer">
                        <div class="sig-box">
                            <p>${currentUser?.kecamatan ? `${currentUser.kecamatan}, ` : ''}${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p>Guru Pembimbing,</p>
                            <div class="sig-space"></div>
                            <p><strong>${currentUser?.name?.toUpperCase() || '-'}</strong></p>
                            <p>NIP. ${currentUser?.nip || '-'}</p>
                        </div>
                    </div>
                    <script>window.onload = () => window.print();</script>
                </body>
            </html>
        `);
        printWindow.document.close();
    }

    return (
        <div className="animate-fadeIn pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Jurnal & Jadwal</h1>
                    <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-wider mt-1">Rekap Administrasi & Kegiatan Harian</p>
                </div>
                {activeTab === "jadwal" && (
                    <button onClick={() => updateState({ showModal: true, modalType: 'schedule', modalMode: 'add' })} className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2">
                        <span className="text-lg">＋</span> TAMBAH JADWAL
                    </button>
                )}
                {activeTab === "kelas" && (
                    <button onClick={() => updateState({ showModal: true, modalType: 'journal_class', modalMode: 'add' })} className="px-8 py-3.5 bg-emerald-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-emerald-700 active:scale-95 transition-all flex items-center gap-2">
                        <span className="text-lg">📝</span> ISI JURNAL KELAS
                    </button>
                )}
                {activeTab === "mengajar" && (
                    <button onClick={() => updateState({ showModal: true, modalType: 'journal_teacher', modalMode: 'add' })} className="px-8 py-3.5 bg-teal-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-teal-700 active:scale-95 transition-all flex items-center gap-2">
                        <span className="text-lg">📜</span> ISI JURNAL MENGAJAR
                    </button>
                )}
            </div>

            {/* Tab Navigation */}
            <div className="flex bg-slate-100/50 p-1.5 rounded-2xl border border-slate-200 shadow-sm mb-10 max-w-2xl">
                {[
                    { id: 'jadwal', label: 'Jadwal', icon: '📅', color: 'bg-indigo-600' },
                    { id: 'kelas', label: 'Jurnal Kelas', icon: '🏫', color: 'bg-emerald-600' },
                    { id: 'mengajar', label: 'Jurnal Mengajar', icon: '📓', color: 'bg-teal-600' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 flex items-center justify-center gap-3 py-3 rounded-xl font-bold text-[11px] uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? `${tab.color} text-white shadow-md`
                            : `text-slate-500 hover:text-slate-700 hover:bg-white/50`
                            }`}
                    >
                        <span className="text-lg leading-none">{tab.icon}</span>
                        <span className="hidden md:inline">{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Logic */}
            <div className="space-y-8">
                {activeTab === "jadwal" && (
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-modern overflow-hidden animate-slideUp">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="px-10 py-5">No</th>
                                        <th className="px-10 py-5">Hari</th>
                                        <th className="px-10 py-5">Jam Mengajar</th>
                                        <th className="px-10 py-5">Mata Pelajaran</th>
                                        <th className="px-10 py-5 text-center">Kelas</th>
                                        <th className="px-10 py-5 text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {schedules.map((s, idx) => (
                                        <tr key={s.__backendId} className={`hover:bg-slate-50/50 transition-colors group ${s.is_break ? 'bg-amber-50/10' : ''}`}>
                                            <td className="px-10 py-6 font-bold text-slate-300 text-sm">{idx + 1}</td>
                                            <td className="px-10 py-6 font-bold text-slate-700 text-sm">{s.day}</td>
                                            <td className="px-10 py-6">
                                                <span className="inline-flex items-center px-4 py-1.5 bg-white border border-slate-100 text-indigo-600 rounded-lg font-bold text-[11px] shadow-sm">
                                                    {s.time_start} - {s.time_end}
                                                </span>
                                            </td>
                                            <td className="px-10 py-6">
                                                {s.is_break ? (
                                                    <span className="text-amber-600 flex items-center gap-2 font-bold text-xs uppercase tracking-wider">
                                                        <span className="text-lg">☕</span> ISTIRAHAT
                                                    </span>
                                                ) : (
                                                    <span className="font-bold text-slate-800 text-sm tracking-tight">{s.subject}</span>
                                                )}
                                            </td>
                                            <td className="px-10 py-6 text-center">
                                                {!s.is_break && (
                                                    <span className="inline-flex items-center px-4 py-1.5 bg-slate-50 text-slate-500 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-slate-100">
                                                        KLS {s.class}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-10 py-6">
                                                <div className="flex gap-2 justify-end opacity-20 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => updateState({ showModal: true, modalType: 'schedule', modalMode: 'edit', editingItem: s })} className="w-9 h-9 flex items-center justify-center bg-white text-indigo-500 border border-slate-100 rounded-lg hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                                        <span className="text-base">✏️</span>
                                                    </button>
                                                    <button onClick={() => updateState({ showDeleteConfirm: true, deletingItem: s })} className="w-9 h-9 flex items-center justify-center bg-white text-rose-400 border border-slate-100 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                                        <span className="text-base">🗑️</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {schedules.length === 0 && (
                            <div className="p-24 text-center">
                                <span className="text-5xl block mb-4 grayscale opacity-50">📅</span>
                                <h3 className="text-slate-400 font-bold text-sm uppercase tracking-widest">Belum Ada Jadwal Mengajar</h3>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "kelas" && (
                    <div className="space-y-6 animate-slideUp">
                        <div className="flex justify-between items-center px-4">
                            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Daftar Jurnal Kelas</h3>
                            <button onClick={() => handlePrintMonthly('kelas')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                                <span>📊</span> CETAK BULANAN
                            </button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {classJournals.map((j) => (
                                <div key={j.__backendId} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-modern flex items-center justify-between gap-4 hover:shadow-premium transition-all group border-l-4 border-l-emerald-500">
                                    <div className="flex gap-5 items-center">
                                        <div className="w-14 h-14 bg-emerald-50 rounded-xl flex flex-col items-center justify-center text-emerald-600 font-bold border border-emerald-100 shadow-sm group-hover:scale-105 transition-transform">
                                            <span className="text-xl leading-none">{new Date(j.date).getDate()}</span>
                                            <span className="text-[9px] uppercase tracking-tight">{new Date(j.date).toLocaleString('id-ID', { month: 'short' })}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-lg leading-tight uppercase tracking-tight">Kelas {j.class}</h4>
                                            <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider mt-1">{j.rows.length} Sesi Terdata</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => updateState({ showModal: true, modalType: 'journal_class', modalMode: 'edit', editingItem: j })} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-xl font-bold text-xs hover:bg-emerald-600 hover:text-white transition-all shadow-sm">
                                            <span className="text-lg">✏️</span>
                                        </button>
                                        <button onClick={() => updateState({ showDeleteConfirm: true, deletingItem: j })} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-rose-300 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                            <span className="text-lg">🗑️</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {classJournals.length === 0 && (
                            <div className="p-32 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 shadow-inner">
                                <span className="text-5xl block mb-4 grayscale opacity-50">🏫</span>
                                <h3 className="text-slate-300 font-bold text-[13px] uppercase tracking-widest">Belum Ada Jurnal Kelas Terdaftar</h3>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === "mengajar" && (
                    <div className="space-y-6 animate-slideUp">
                        <div className="flex justify-between items-center px-4">
                            <h3 className="font-bold text-slate-800 text-lg tracking-tight">Daftar Jurnal Mengajar</h3>
                            <button onClick={() => handlePrintMonthly('mengajar')} className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2">
                                <span>📊</span> CETAK BULANAN
                            </button>
                        </div>
                        {teacherJournals.map((j) => (
                            <div key={j.__backendId} className="bg-white p-8 rounded-2xl border border-slate-100 shadow-modern hover:shadow-premium transition-all grid grid-cols-1 lg:grid-cols-4 gap-8 relative group overflow-hidden border-t-4 border-t-teal-500">
                                <div className="lg:col-span-1 border-r border-slate-50 pr-6">
                                    <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-3">Hari & Tanggal</p>
                                    <h5 className="font-bold text-slate-800 text-lg leading-snug tracking-tight mb-4">
                                        {new Date(j.date).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}
                                    </h5>
                                    <span className="inline-flex items-center px-4 py-1.5 bg-teal-50 text-teal-600 text-[10px] font-bold rounded-lg border border-teal-100 uppercase tracking-widest">
                                        KLS {j.class}
                                    </span>
                                </div>
                                <div className="lg:col-span-2">
                                    <div className="mb-6">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-2">Materi Pembelajaran</p>
                                        <p className="font-bold text-slate-700 text-lg tracking-tight mb-2 leading-tight">{j.materi}</p>
                                        <p className="text-[12px] text-slate-400 font-medium leading-relaxed">{j.tp}</p>
                                    </div>
                                    <div className="bg-slate-50/80 p-5 rounded-xl border border-slate-100 shadow-inner">
                                        <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span> HASIL REFLEKSI
                                        </p>
                                        <p className="text-[13px] text-slate-600 italic font-semibold leading-relaxed">"{j.refleksi || 'Belum ada catatan refleksi yang terdata.'}"</p>
                                    </div>
                                </div>
                                <div className="lg:col-span-1 flex flex-col justify-between items-end">
                                    <div className="flex gap-2">
                                        <button onClick={() => updateState({ showModal: true, modalType: 'journal_teacher', modalMode: 'edit', editingItem: j })} className="w-10 h-10 flex items-center justify-center bg-white text-teal-500 border border-slate-100 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm">
                                            <span className="text-lg">✏️</span>
                                        </button>
                                        <button onClick={() => updateState({ showDeleteConfirm: true, deletingItem: j })} className="w-10 h-10 flex items-center justify-center bg-white text-rose-300 border border-slate-100 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                            <span className="text-lg">🗑️</span>
                                        </button>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest mb-1.5">Rencana Lanjut</p>
                                        <span className={`inline-flex items-center px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest border ${j.rtl ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                            {j.rtl ? '✓ TERENCANA' : '✕ BELUM ADA'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {teacherJournals.length === 0 && (
                            <div className="p-32 text-center bg-white rounded-2xl border-2 border-dashed border-slate-100 shadow-inner">
                                <span className="text-5xl block mb-4 grayscale opacity-50">📓</span>
                                <h3 className="text-slate-300 font-bold text-[13px] uppercase tracking-widest">Belum Ada Jurnal Mengajar</h3>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

