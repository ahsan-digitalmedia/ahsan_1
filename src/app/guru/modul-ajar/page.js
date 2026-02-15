"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

export default function ModulAjarPage() {
    const { state, updateState } = useApp();
    const { modulAjar, currentUser } = state;
    const [selectedClass, setSelectedClass] = React.useState("");

    // Get unique classes from teacher's profile or current modules
    const availableClasses = currentUser?.class ? currentUser.class.split(',').map(c => c.trim()).filter(c => c) : [];

    const filteredModuls = selectedClass
        ? modulAjar.filter(m => m.modul_class === selectedClass)
        : modulAjar;

    const handlePrint = (modul) => {
        // Formatting P5
        let p5Content = "-";
        try {
            const p5Array = typeof modul.modul_p5 === 'string' ? JSON.parse(modul.modul_p5) : (modul.modul_p5 || []);
            p5Content = p5Array.join(', ');
        } catch (e) { }

        // Subject normalization for Title
        let displaySubject = modul.modul_subject || 'Kurikulum Merdeka';
        if (displaySubject === "PJOK") displaySubject = "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)";
        if (displaySubject === "IPAS") displaySubject = "Ilmu Pengetahuan Alam dan Sosial (IPAS)";

        const html = `
            <html>
            <head>
                <title>Modul Ajar - ${modul.modul_topic}</title>
                <style>
                    body { 
                        font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; 
                        line-height: 1.5; 
                        color: #1a1a1a; 
                        padding: 30px; 
                        font-size: 11px; 
                        max-width: 850px; 
                        margin: 0 auto; 
                    }
                    
                    /* Header / Kop */
                    .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 15px; margin-bottom: 25px; }
                    .header h1 { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0; }
                    .header p { font-size: 10px; margin: 4px 0; color: #444; }
                    
                    .doc-title { text-align: center; margin-bottom: 30px; }
                    .doc-title h2 { font-size: 11px; font-weight: 700; text-transform: uppercase; margin: 0; border: 1.5px solid #000; display: inline-block; padding: 6px 18px; border-radius: 4px; }
                    
                    .section { margin-bottom: 25px; }
                    .section-header { font-size: 12px; font-weight: 800; text-transform: uppercase; border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-bottom: 12px; color: #000; }

                    /* Info Grid */
                    .info-grid { display: flex; flex-wrap: wrap; gap: 8px 0; margin-bottom: 15px; }
                    .info-item { width: 50%; display: flex; box-sizing: border-box; padding-right: 15px; }
                    .info-label { font-weight: 700; width: 110px; color: #333; flex-shrink: 0; }
                    .info-value { color: #000; }
                    .info-full { width: 100%; }

                    .sub-title { font-weight: 700; font-size: 10.5px; color: #222; margin: 12px 0 6px 0; display: block; text-transform: uppercase; }
                    .text-content { background: #fcfcfc; border-radius: 6px; padding: 12px; border-left: 3px solid #ddd; color: #333; white-space: pre-wrap; margin-bottom: 12px; border: 1px solid #eee; }
                    
                    /* Assessment Grid */
                    .card-grid { display: flex; gap: 12px; margin-top: 8px; }
                    .card { flex: 1; border: 1px solid #eee; border-radius: 8px; padding: 12px; background: #fff; }
                    .card-label { font-weight: 700; font-size: 8.5px; text-transform: uppercase; color: #777; margin-bottom: 5px; display: block; }
                    .card-value { color: #000; font-weight: 500; }

                    /* Signatures */
                    .footer-sig { 
                        margin-top: 50px; 
                        display: flex; 
                        justify-content: space-between; 
                        width: 100%;
                        page-break-inside: avoid; 
                    }
                    .sig-box { text-align: center; width: 45%; }
                    .sig-line { margin: 55px auto 8px; width: 100%; border-top: 1px solid #000; font-weight: 700; padding-top: 4px; text-transform: uppercase; }
                    
                    @media print {
                        body { padding: 0; margin: 0 auto; }
                        .text-content { background: none; border: 1px solid #eee; }
                    }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${modul.modul_school_name || currentUser?.school_name || "NAMA SEKOLAH"}</h1>
                    <p>${currentUser?.school_address || "Alamat sekolah belum diatur"}</p>
                </div>

                <div class="doc-title">
                    <h2>Modul Ajar ${displaySubject}</h2>
                </div>

                <div class="section">
                    <div class="section-header">I. Informasi Umum</div>
                    <div class="info-grid">
                        <div class="info-item"><span class="info-label">Penyusun</span><span class="info-value">: ${modul.modul_teacher_name || '-'}</span></div>
                        <div class="info-item"><span class="info-label">Mata Pelajaran</span><span class="info-value">: ${modul.modul_subject || '-'}</span></div>
                        <div class="info-item"><span class="info-label">Fase / Kelas</span><span class="info-value">: ${modul.modul_fase} / ${modul.modul_class}</span></div>
                        <div class="info-item"><span class="info-label">Semester</span><span class="info-value">: ${modul.modul_semester === '1' ? 'Ganjil' : 'Genap'}</span></div>
                        <div class="info-item"><span class="info-label">Alokasi Waktu</span><span class="info-value">: ${modul.modul_jp} JP</span></div>
                        <div class="info-item"><span class="info-label">Tahun Ajaran</span><span class="info-value">: ${modul.modul_academic_year}</span></div>
                        <div class="info-item info-full"><span class="info-label">Topik Utama</span><span class="info-value">: ${modul.modul_topic}</span></div>
                        <div class="info-item info-full"><span class="info-label">Profil Lulusan</span><span class="info-value">: ${p5Content}</span></div>
                    </div>
                </div>

                <div class="section">
                    <div class="section-header">II. Komponen Inti</div>
                    <span class="sub-title">A. Kompetensi Awal</span>
                    <div class="text-content">${modul.modul_comp_initial || '-'}</div>
                    
                    <span class="sub-title">B. Tujuan Pembelajaran</span>
                    <div class="text-content">${modul.modul_tp || '-'}</div>

                    <span class="sub-title">C. Pemahaman Bermakna</span>
                    <div class="text-content">${modul.modul_meaningful || '-'}</div>

                    <span class="sub-title">D. Metode Pembelajaran</span>
                    <div class="text-content">${modul.modul_method || '-'}</div>

                    <span class="sub-title">E. Pertanyaan Pemantik</span>
                    <div class="text-content">${modul.modul_trigger_questions || '-'}</div>
                </div>

                <div class="section">
                    <div class="section-header">III. Kegiatan Pembelajaran</div>
                    <span class="sub-title">1. Pendahuluan</span>
                    <div class="text-content">${modul.modul_activity_pre || '-'}</div>
                    <span class="sub-title">2. Kegiatan Inti</span>
                    <div class="text-content">${modul.modul_activity_core || '-'}</div>
                    <span class="sub-title">3. Penutup</span>
                    <div class="text-content">${modul.modul_activity_post || '-'}</div>
                </div>

                <div class="section">
                    <div class="section-header">IV. Asesmen & Lampiran</div>
                    <span class="sub-title">A. Asesmen</span>
                    <div class="card-grid">
                        <div class="card"><span class="card-label">Diagnostik</span><div class="card-value">${modul.modul_ass_diag || '-'}</div></div>
                        <div class="card"><span class="card-label">Formatif</span><div class="card-value">${modul.modul_ass_form || '-'}</div></div>
                        <div class="card"><span class="card-label">Sumatif</span><div class="card-value">${modul.modul_ass_sum || '-'}</div></div>
                    </div>
                    
                    <span class="sub-title">B. Lampiran Utama</span>
                    <div class="card-grid">
                        <div class="card"><span class="card-label">LKPD</span><div class="card-value">${modul.modul_lkpd || '-'}</div></div>
                        <div class="card"><span class="card-label">Media Ajar</span><div class="card-value">${modul.modul_media || '-'}</div></div>
                        <div class="card"><span class="card-label">Glosarium</span><div class="card-value">${modul.modul_glosarium || '-'}</div></div>
                    </div>
                    <div style="margin-top:12px">
                         <span class="sub-title">Daftar Pustaka</span>
                         <div class="text-content">${modul.modul_bibliography || '-'}</div>
                    </div>
                </div>

                <div class="footer-sig" style="break-inside: avoid; page-break-inside: avoid;">
                    <div class="sig-box">
                        <p>&nbsp;</p>
                        <p>Mengetahui,</p>
                        <p>Kepala Sekolah</p>
                        <div class="sig-line">${currentUser?.principal_name || '................................'}</div>
                        <p style="font-size:9px">NIP. ${currentUser?.principal_nip || '................................'}</p>
                    </div>
                    <div class="sig-box">
                        <p>${currentUser?.kecamatan ? `${currentUser.kecamatan}, ` : ''}Tahun Ajaran ${currentUser?.academic_year || '-'}</p>
                        <p>&nbsp;</p>
                        <p>Guru Mata Pelajaran</p>
                        <div class="sig-line">${modul.modul_teacher_name || currentUser?.name || '................................'}</div>
                        <p style="font-size:9px">NIP. ${currentUser?.nip || '................................'}</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        // Optimized Print Injection
        let iframe = document.getElementById('print-iframe');
        if (!iframe) {
            iframe = document.createElement('iframe');
            iframe.id = 'print-iframe';
            iframe.style.position = 'fixed';
            iframe.style.right = '0';
            iframe.style.bottom = '0';
            iframe.style.width = '0';
            iframe.style.height = '0';
            iframe.style.border = '0';
            document.body.appendChild(iframe);
        }

        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);

        iframe.onload = () => {
            try {
                iframe.contentWindow.focus();
                iframe.contentWindow.print();
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error("Print error:", e);
                // Fallback for strict mobile browsers
                const printWin = window.open(url, '_blank');
                if (printWin) printWin.print();
            }
        };

        iframe.src = url;
    };

    return (
        <div className="animate-fadeIn pb-10">
            {/* Screen Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Modul Ajar</h1>
                    <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-wider mt-1">Perencanaan Pembelajaran Terstruktur</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <select
                        value={selectedClass}
                        onChange={(e) => setSelectedClass(e.target.value)}
                        className="px-6 py-3.5 rounded-xl border border-slate-200 font-bold text-[13px] text-slate-700 outline-none shadow-sm cursor-pointer appearance-none pr-12 min-w-[160px]"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '0.9rem' }}
                    >
                        <option value="">Semua Kelas</option>
                        {availableClasses.map(c => <option key={c} value={c}>Kelas {c}</option>)}
                    </select>

                    <button
                        onClick={() => updateState({ showModal: true, modalType: 'modul-ajar', modalMode: 'add' })}
                        className="flex-1 md:flex-none px-8 py-3.5 bg-purple-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-purple-700 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        <span className="text-lg">＋</span> BUAT MODUL NEW
                    </button>
                </div>
            </div>

            {/* Grid Area */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredModuls.map((modul, i) => (
                    <div key={modul.id || i} className="bg-white rounded-2xl p-8 border border-slate-100 shadow-modern hover:shadow-premium hover:border-purple-200 transition-all group flex flex-col h-full relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50/30 rounded-full -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>

                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <span className="px-4 py-1.5 bg-purple-50 text-purple-600 text-[10px] font-bold uppercase tracking-widest rounded-lg border border-purple-100">
                                {modul.modul_subject || "Umum"}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePrint(modul)}
                                    className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all flex items-center justify-center group/btn shadow-sm"
                                    title="Cetak Modul"
                                >
                                    <span className="text-lg group-hover/btn:scale-110 transition-transform">🖨️</span>
                                </button>
                                <button
                                    onClick={() => updateState({ showDeleteConfirm: true, deletingItem: modul })}
                                    className="w-10 h-10 bg-slate-50 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all flex items-center justify-center group/btn shadow-sm"
                                    title="Hapus Modul"
                                >
                                    <span className="text-lg group-hover/btn:scale-110 transition-transform">🗑️</span>
                                </button>
                            </div>
                        </div>

                        <div className="relative z-10 mb-6">
                            <h3 className="font-bold text-slate-800 mb-2 text-xl leading-tight group-hover:text-purple-700 transition-colors tracking-tight line-clamp-2">
                                {modul.modul_topic}
                            </h3>
                            <p className="text-[13px] text-slate-400 font-semibold leading-relaxed line-clamp-3">
                                {modul.modul_tp || modul.modul_target || "Belum ada deskripsi tujuan pembelajaran yang terdaftar."}
                            </p>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-50 flex justify-between items-center relative z-10">
                            <div className="flex flex-col gap-0.5">
                                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Fase & Kelas</span>
                                <span className="text-[11px] font-bold text-slate-500 uppercase">Fase {modul.modul_fase} • Kelas {modul.modul_class}</span>
                            </div>
                            <button
                                onClick={() => updateState({ showModal: true, modalType: 'modul-ajar', modalMode: 'edit', editingItem: modul })}
                                className="px-5 py-2 bg-purple-50 text-purple-600 font-bold text-[10px] uppercase tracking-widest rounded-lg hover:bg-purple-600 hover:text-white transition-all shadow-sm border border-purple-100/30"
                            >
                                EDIT DETAIL
                            </button>
                        </div>
                    </div>
                ))}

                {filteredModuls.length === 0 && (
                    <div className="col-span-1 md:col-span-2 lg:col-span-3 text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-100 shadow-inner">
                        <div className="w-24 h-24 bg-purple-50 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-inner border border-purple-100/50 animate-float">
                            <span className="text-4xl text-purple-300">📄</span>
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">Belum Ada Modul Ajar</h3>
                        <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-wider mt-2 max-w-sm mx-auto leading-relaxed">Mulai buat dokumen rencana pembelajaran anda untuk pengelolaan kelas yang lebih baik.</p>
                        <button
                            onClick={() => updateState({ showModal: true, modalType: 'modul-ajar', modalMode: 'add' })}
                            className="mt-8 px-8 py-3.5 bg-purple-100 text-purple-600 rounded-xl font-bold text-[11px] uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-sm border border-purple-200"
                        >
                            BUAT MODUL SEKARANG
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
