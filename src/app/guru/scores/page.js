"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { scoreOperations } from "@/lib/supabase";
import { cn, splitSubjects, SUBJECT_LIST } from "@/lib/utils";

export default function ScoresPage() {
    const { state, updateState } = useApp();
    const { students, currentUser } = state;

    const uniqueClasses = useMemo(() => {
        const classes = students.map(s => s.class).filter(c => c);
        return [...new Set(classes)].sort();
    }, [students]);

    // Selection States
    const [selectedClass, setSelectedClass] = useState("");
    const [selectedSubject, setSelectedSubject] = useState("");

    // Config States
    const [tpCount, setTpCount] = useState(4);
    const [sumCount, setSumCount] = useState(4);
    const [weights, setWeights] = useState({ fs: 80, pts: 10, pas: 10 });

    // Data States
    const [scores, setScores] = useState({}); // { studentId: { f1: 80, ... } }
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // UI States
    const [showPrintMenu, setShowPrintMenu] = useState(false);
    const [showManageMenu, setShowManageMenu] = useState(false);
    const [showWeightModal, setShowWeightModal] = useState(false);
    const [showTpModal, setShowTpModal] = useState(false);
    const printMenuRef = useRef(null);
    const manageMenuRef = useRef(null);


    // Close menus when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (printMenuRef.current && !printMenuRef.current.contains(event.target)) {
                setShowPrintMenu(false);
            }
            if (manageMenuRef.current && !manageMenuRef.current.contains(event.target)) {
                setShowManageMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // FETCH DATA
    useEffect(() => {
        async function fetchScores() {
            if (!selectedClass || !selectedSubject) {
                setScores({});
                return;
            }

            setIsLoading(true);
            try {
                const data = await scoreOperations.fetchByClassAndSubject(selectedClass, selectedSubject, currentUser?.__backendId);
                const map = {};
                if (data) {
                    data.forEach(record => {
                        map[record.student_id] = record;
                    });
                }
                setScores(map);

                // If there's data, sync config from the first record if possible
                if (data && data.length > 0) {
                    const first = data[0];
                    if (first.weight_fs) {
                        setWeights({
                            fs: first.weight_fs,
                            pts: first.weight_pts,
                            pas: first.weight_pas
                        });
                    }
                }
            } catch (error) {
                console.error("Error fetching scores:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchScores();
    }, [selectedClass, selectedSubject]);


    const filteredStudents = useMemo(() => {
        if (!selectedClass) return [];
        return students.filter(s => s.class === selectedClass);
    }, [students, selectedClass]);

    const calculateNA = (studentId, currentScores = scores) => {
        const s = currentScores[studentId] || {};

        // Avg Formatif
        let fTotal = 0, fNum = 0;
        for (let i = 1; i <= tpCount; i++) {
            const v = parseFloat(s[`f${i}`]) || 0;
            if (v > 0) { fTotal += v; fNum++; }
        }
        const avgF = fNum > 0 ? fTotal / fNum : 0;

        // Avg Sumatif
        let sTotal = 0, sNum = 0;
        for (let i = 1; i <= sumCount; i++) {
            const v = parseFloat(s[`s${i}`]) || 0;
            if (v > 0) { sTotal += v; sNum++; }
        }
        const avgS = sNum > 0 ? sTotal / sNum : 0;

        const avgFS = (avgF + avgS) / 2;
        const pts = parseFloat(s.pts) || 0;
        const pas = parseFloat(s.pas) || 0;

        const naValue = ((avgFS * weights.fs) + (pts * weights.pts) + (pas * weights.pas)) / 100;
        return { na: Math.round(naValue), avgF, avgS };
    };

    const handleScoreChange = (studentId, field, value) => {
        const numVal = value === "" ? 0 : parseFloat(value);
        setScores(prev => ({
            ...prev,
            [studentId]: {
                ...(prev[studentId] || {}),
                [field]: numVal
            }
        }));
    };

    const handleSave = async () => {
        if (!selectedClass || !selectedSubject) {
            alert("Pilih kelas dan mata pelajaran!");
            return;
        }
        setIsSaving(true);
        try {
            const recordsToSave = filteredStudents.map(s => {
                const data = scores[s.id] || {};
                const calc = calculateNA(s.id);
                return {
                    student_id: s.id,
                    teacher_id: currentUser?.__backendId,
                    class: selectedClass,
                    subject: selectedSubject,
                    academic_year: currentUser?.academic_year || "2024/2025",
                    semester: currentUser?.semester || "1",
                    ...data,
                    avg_f: calc.avgF,
                    avg_s: calc.avgS,
                    na: calc.na,
                    weight_fs: weights.fs,
                    weight_pts: weights.pts,
                    weight_pas: weights.pas
                };
            });

            await scoreOperations.upsert(recordsToSave);
            alert("Data nilai berhasil disimpan! ✅");
        } catch (error) {
            console.error("Error saving scores:", error);
            alert("Gagal menyimpan data.");
        } finally {
            setIsSaving(false);
        }
    };

    // PRINT REPORT
    const handlePrint = (type) => {
        setShowPrintMenu(false);
        if (!selectedClass || !selectedSubject) return;

        const schoolName = currentUser?.school_name || "SDN 1 PONCOWATI";
        const teacherName = currentUser?.name || "Guru Kelas";
        const semesterLabel = currentUser?.semester === '2' ? 'Genap' : 'Ganjil';
        const today = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

        let reportTitle = "LAPORAN REKAPITULASI NILAI";
        if (type === 'formatif') reportTitle = "DAFTAR NILAI FORMATIF (HARIAN)";
        else if (type === 'sumatif') reportTitle = "DAFTAR NILAI SUMATIF (LINGKUP MATERI)";
        else if (type === 'pts') reportTitle = "DAFTAR NILAI SUMATIF TENGAH SEMESTER (PTS)";
        else if (type === 'pas') reportTitle = "DAFTAR NILAI SUMATIF AKHIR SEMESTER (PAS)";

        // TABLE GENERATION (Dinamis sesuai tpCount/sumCount)
        let headers = '';
        let rows = '';

        if (type === 'formatif') {
            headers = `
                <tr>
                    <th rowspan="2">No</th>
                    <th rowspan="2">Nama Siswa</th>
                    <th colspan="${tpCount}">Tujuan Pembelajaran (Formatif)</th>
                    <th rowspan="2">Rerata</th>
                </tr>
                <tr>
                    ${Array.from({ length: tpCount }).map((_, i) => `<th>F${i + 1}</th>`).join('')}
                </tr>
            `;
            rows = filteredStudents.map((s, idx) => {
                const data = scores[s.id] || {};
                const calc = calculateNA(s.id);
                return `
                    <tr>
                        <td align="center">${idx + 1}</td>
                        <td style="text-align: left;">${s.name}</td>
                        ${Array.from({ length: tpCount }).map((_, i) => `<td align="center">${data[`f${i + 1}`] || '-'}</td>`).join('')}
                        <td align="center" style="font-weight: bold;">${calc.avgF.toFixed(0)}</td>
                    </tr>
                `;
            }).join('');
        } else if (type === 'sumatif') {
            headers = `
                <tr>
                    <th rowspan="2">No</th>
                    <th rowspan="2">Nama Siswa</th>
                    <th colspan="${sumCount}">Lingkup Materi (Sumatif)</th>
                    <th rowspan="2">Rerata</th>
                </tr>
                <tr>
                    ${Array.from({ length: sumCount }).map((_, i) => `<th>S${i + 1}</th>`).join('')}
                </tr>
            `;
            rows = filteredStudents.map((s, idx) => {
                const data = scores[s.id] || {};
                const calc = calculateNA(s.id);
                return `
                    <tr>
                        <td align="center">${idx + 1}</td>
                        <td style="text-align: left;">${s.name}</td>
                        ${Array.from({ length: sumCount }).map((_, i) => `<td align="center">${data[`s${i + 1}`] || '-'}</td>`).join('')}
                        <td align="center" style="font-weight: bold;">${calc.avgS.toFixed(0)}</td>
                    </tr>
                `;
            }).join('');
        } else if (type === 'pts' || type === 'pas') {
            headers = `
                <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>NISN</th>
                    <th>Kelas</th>
                    <th>Nilai ${type.toUpperCase()}</th>
                </tr>
            `;
            rows = filteredStudents.map((s, idx) => {
                const data = scores[s.id] || {};
                const val = type === 'pts' ? (data.pts || '-') : (data.pas || '-');
                return `
                    <tr>
                        <td align="center">${idx + 1}</td>
                        <td style="text-align: left;">${s.name}</td>
                        <td align="center">${s.nisn || '-'}</td>
                        <td align="center">${s.class}</td>
                        <td align="center" style="font-weight: bold;">${val}</td>
                    </tr>
                `;
            }).join('');
        } else {
            headers = `
                <tr>
                    <th>No</th>
                    <th>Nama Siswa</th>
                    <th>NISN</th>
                    <th>Kelas</th>
                    <th>Avg F</th>
                    <th>Avg S</th>
                    <th>PTS</th>
                    <th>PAS</th>
                    <th>NA</th>
                </tr>
            `;
            rows = filteredStudents.map((s, idx) => {
                const data = scores[s.id] || {};
                const calc = calculateNA(s.id);
                return `
                    <tr>
                        <td align="center">${idx + 1}</td>
                        <td style="text-align: left;">${s.name}</td>
                        <td align="center">${s.nisn || '-'}</td>
                        <td align="center">${s.class}</td>
                        <td align="center">${calc.avgF.toFixed(0)}</td>
                        <td align="center">${calc.avgS.toFixed(0)}</td>
                        <td align="center">${data.pts || '-'}</td>
                        <td align="center">${data.pas || '-'}</td>
                        <td align="center" style="font-weight: bold; background: #f8fafc;">${calc.na}</td>
                    </tr>
                `;
            }).join('');
        }

        const printWin = window.open('', '_blank');
        printWin.document.write(`
            <html>
                <head>
                    <title>Rekap Nilai - ${selectedSubject}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap');
                        body { font-family: 'Inter', sans-serif; font-size: 11px; padding: 20px; color: #1e293b; }
                        .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px; }
                        .report-title { font-size: 15px; font-weight: bold; text-decoration: underline; margin-bottom: 5px; color: #000; }
                        .school-name { font-size: 20px; font-weight: bold; margin: 0; color: #000; }
                        .meta { display: flex; justify-content: space-between; margin-bottom: 20px; font-size: 12px; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                        th, td { border: 1px solid #000; padding: 8px 5px; }
                        th { background: #f1f5f9; font-weight: bold; text-transform: uppercase; font-size: 10px; }
                        .footer { margin-top: 40px; display: flex; justify-content: space-between; text-align: center; break-inside: avoid; page-break-inside: avoid; }
                        .sig-box { width: 45%; }
                        .sig-space { height: 70px; }
                        .sig-name { font-weight: bold; text-decoration: underline; font-size: 12px; }
                        @media print {
                            body { padding: 0; }
                            button { display: none; }
                        }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="report-title">${reportTitle}</div>
                        <h1 class="school-name">${schoolName}</h1>
                        <p style="margin: 5px 0;">${currentUser?.school_address || "-"}</p>
                    </div>
                    <div class="meta">
                        <div>
                            <p><strong>Mata Pelajaran:</strong> ${selectedSubject}</p>
                            <p><strong>Kelas:</strong> ${selectedClass}</p>
                        </div>
                        <div style="text-align: right;">
                             <p><strong>Semester:</strong> ${semesterLabel}</p>
                             <p><strong>Th Pelajaran:</strong> ${currentUser?.academic_year || "-"}</p>
                        </div>
                    </div>
                    <table>
                        <thead>${headers}</thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <div class="footer">
                        <div class="sig-box">
                            <p>Mengetahui,</p>
                            <p>Kepala Sekolah</p>
                            <div class="sig-space"></div>
                            <p class="sig-name">${currentUser?.principal_name || "........................."}</p>
                            <p>NIP. ${currentUser?.principal_nip || "........................."}</p>
                        </div>
                        <div class="sig-box">
                            <p>${currentUser?.kecamatan ? `${currentUser.kecamatan}, ` : ''}${today}</p>
                            <p>Guru Kelas/Mapel</p>
                            <div class="sig-space"></div>
                            <p class="sig-name">${teacherName}</p>
                            <p>NIP. ${currentUser?.nip || "-"}</p>
                        </div>
                    </div>
                    <script>
                        window.onload = () => {
                            setTimeout(() => {
                                window.print();
                                // window.close(); // Optional: close window after print
                            }, 500);
                        };
                    </script>
                </body>
            </html>
        `);
        printWin.document.close();
    };

    return (
        <div className="animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Rekap Nilai Siswa</h1>
                    <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mt-1">Pengelolaan Capaian Akademik</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className={`px-6 py-4 rounded-xl border font-bold text-[13px] outline-none shadow-sm cursor-pointer transition-all appearance-none pr-12 min-w-[160px] ${!selectedClass ? 'border-indigo-200 bg-indigo-50/50 text-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200 text-slate-700 bg-white'}`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234F46E5' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                    >
                        <option value="">-- Pilih Kelas --</option>
                        {(() => {
                            const teacherClasses = currentUser?.class ? currentUser.class.split(',').map(c => c.trim()).filter(c => c) : [];
                            if (teacherClasses.length === 0) {
                                return uniqueClasses.map(c => (
                                    <option key={c} value={c}>Kelas {c}</option>
                                ));
                            }
                            return teacherClasses.map(c => (
                                <option key={c} value={c}>Kelas {c}</option>
                            ));
                        })()}
                    </select>

                    <select
                        value={selectedSubject}
                        onChange={e => setSelectedSubject(e.target.value)}
                        className="px-6 py-4 rounded-xl border border-slate-200 font-bold text-[13px] text-slate-700 outline-none shadow-sm cursor-pointer appearance-none pr-12"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                    >
                        <option value="">-- Pilih Mapel --</option>
                        {(() => {
                            const teacherSubjects = splitSubjects(currentUser?.subject);
                            const isClassTeacher = teacherSubjects.includes("Guru Kelas") || teacherSubjects.length === 0;

                            let subjectsToDisplay = isClassTeacher ? SUBJECT_LIST : teacherSubjects;

                            // Compatibility mapping for display
                            const normalizedSubjects = subjectsToDisplay.map(s => {
                                if (s === "PJOK") return "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)";
                                if (s === "IPAS") return "Ilmu Pengetahuan Alam dan Sosial (IPAS)";
                                return s;
                            });

                            return [...new Set(normalizedSubjects)].map(s => (
                                <option key={s} value={s}>{s}</option>
                            ));
                        })()}
                    </select>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedClass}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-70 whitespace-nowrap disabled:cursor-not-allowed"
                    >
                        {isSaving ? "PROSES..." : "SIMPAN NILAI"}
                    </button>

                    <div className="relative w-full md:w-auto" ref={manageMenuRef}>
                        <button
                            onClick={() => setShowManageMenu(!showManageMenu)}
                            className="w-full md:w-auto px-6 py-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="text-base group-hover:scale-110 transition-transform">🛠️</span> KELOLA
                        </button>
                        {showManageMenu && (
                            <div className="absolute left-0 md:left-auto md:right-0 top-full mt-3 w-56 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-white/40 p-3 z-50 animate-zoomIn origin-top-left md:origin-top-right">
                                <button onClick={() => { setShowTpModal(true); setShowManageMenu(false); }} className="w-full text-left px-5 py-3.5 rounded-2xl hover:bg-indigo-50 text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-sm group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">📏</span>
                                    Atur Jml TP
                                </button>
                                <button onClick={() => { setShowWeightModal(true); setShowManageMenu(false); }} className="w-full text-left px-5 py-3.5 rounded-2xl hover:bg-indigo-50 text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">⚖️</span>
                                    Atur Bobot NA
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="relative w-full md:w-auto" ref={printMenuRef}>
                        <button
                            onClick={() => setShowPrintMenu(!showPrintMenu)}
                            className="w-full md:w-auto px-6 py-4 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                        >
                            <span className="text-base group-hover:scale-110 transition-transform">🖨️</span> CETAK
                        </button>
                        {showPrintMenu && (
                            <div className="absolute left-0 md:left-auto md:right-0 top-full mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-[2rem] shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] border border-white/40 p-3 z-50 animate-zoomIn origin-top-left md:origin-top-right">
                                <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4 py-3 opacity-60">Pilih Laporan</div>
                                <button onClick={() => { handlePrint('formatif'); setShowPrintMenu(false); }} className="w-full text-left px-5 py-3.5 rounded-2xl hover:bg-indigo-50 text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-sm group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">📄</span>
                                    Cetak Formatif
                                </button>
                                <button onClick={() => { handlePrint('sumatif'); setShowPrintMenu(false); }} className="w-full text-left px-5 py-3.5 rounded-2xl hover:bg-indigo-50 text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-500 flex items-center justify-center text-sm group-hover/item:bg-emerald-500 group-hover/item:text-white transition-colors">📑</span>
                                    Cetak Sumatif
                                </button>
                                <button onClick={() => { handlePrint('pts'); setShowPrintMenu(false); }} className="w-full text-left px-5 py-3.5 rounded-2xl hover:bg-indigo-50 text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center text-sm group-hover/item:bg-amber-500 group-hover/item:text-white transition-colors">📝</span>
                                    Nilai PTS
                                </button>
                                <button onClick={() => { handlePrint('pas'); setShowPrintMenu(false); }} className="w-full text-left px-5 py-3.5 rounded-2xl hover:bg-indigo-50 text-slate-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-500 flex items-center justify-center text-sm group-hover/item:bg-rose-500 group-hover/item:text-white transition-colors">📝</span>
                                    Nilai PAS
                                </button>
                                <div className="border-t border-slate-100 my-2 mx-4"></div>
                                <button onClick={() => { handlePrint('rekap'); setShowPrintMenu(false); }} className="w-full text-left px-5 py-3.5 rounded-2xl hover:bg-indigo-100/50 text-indigo-700 font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-500 flex items-center justify-center text-sm group-hover/item:bg-indigo-600 group-hover/item:text-white transition-colors">📊</span>
                                    Rekap Nilai Akhir
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className={cn("bg-white rounded-2xl border border-slate-100/50 shadow-modern overflow-hidden flex flex-col min-h-[400px] relative", !selectedClass ? 'justify-center items-center' : '')}>
                {!selectedClass ? (
                    <div className="p-12 text-center text-slate-300 flex flex-col items-center gap-6 animate-fadeIn">
                        <div className="w-24 h-24 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-indigo-100/50 animate-float">
                            👆
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Pilih Kelas Terlebih Dahulu</h3>
                            <p className="text-slate-400 text-[11px] font-semibold uppercase tracking-wider mt-2 max-w-xs mx-auto">Silakan pilih kelas untuk mulai mengelola nilai siswa.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn">
                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="mt-4 text-[11px] font-black text-slate-400 uppercase tracking-widest">Memuat Data...</p>
                            </div>
                        )}
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse min-w-[1200px]">
                                <thead>
                                    <tr className="bg-slate-50/20 border-b border-slate-50">
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 w-12 text-center tracking-widest">No</th>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 tracking-widest">Nama Lengkap Siswa</th>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center w-24 tracking-widest">NISN</th>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase text-slate-400 text-center w-16 tracking-widest">Kls</th>

                                        {/* Formatif Headers */}
                                        <th colSpan={tpCount} className="px-6 py-3 text-center text-[10px] font-bold uppercase text-blue-500 border-x border-slate-50 bg-blue-50/10 tracking-[0.2em]">
                                            Formatif (Tujuan Pembelajaran)
                                        </th>

                                        {/* Sumatif Headers */}
                                        <th colSpan={sumCount} className="px-6 py-3 text-center text-[10px] font-bold uppercase text-emerald-500 border-r border-slate-50 bg-emerald-50/10 tracking-[0.2em]">
                                            Sumatif (Materi)
                                        </th>

                                        {/* PTS PAS Headers */}
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase text-amber-500 text-center w-20 tracking-widest bg-amber-50/10">PTS</th>
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase text-rose-500 text-center w-20 tracking-widest bg-rose-50/10">PAS</th>

                                        {/* Final Headers */}
                                        <th className="px-6 py-5 text-[10px] font-bold uppercase text-indigo-600 text-center w-24 bg-indigo-50/30 tracking-[0.2em]">NA</th>
                                    </tr>
                                    <tr className="bg-slate-50/30 text-[9px] font-bold text-slate-400 text-center tracking-widest border-b border-slate-50">
                                        <th colSpan={4}></th>

                                        {/* Sub-headers Formatif */}
                                        {Array.from({ length: tpCount }).map((_, i) => (
                                            <th key={`fh-${i}`} className="w-14 border-x border-slate-50/50 py-2">F{i + 1}</th>
                                        ))}

                                        {/* Sub-headers Sumatif */}
                                        {Array.from({ length: sumCount }).map((_, i) => (
                                            <th key={`sh-${i}`} className="w-14 border-r border-slate-50/50 py-2">S{i + 1}</th>
                                        ))}

                                        <th className="bg-amber-50/5 py-2"></th>
                                        <th className="bg-rose-50/5 py-2"></th>
                                        <th className="bg-indigo-50/20 py-2"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.map((s, idx) => {
                                        const data = scores[s.id] || {};
                                        const calc = calculateNA(s.id);
                                        return (
                                            <tr key={s.id} className="hover:bg-slate-50/50 transition-colors group/row text-xs">
                                                <td className="px-6 py-4 text-[11px] font-bold text-slate-300 text-center">{String(idx + 1).padStart(2, '0')}</td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-white text-[10px] font-bold shadow-sm group-hover/row:scale-110 transition-transform", ['gradient-blue', 'gradient-purple', 'gradient-pink', 'gradient-green', 'gradient-orange'][idx % 5])}>
                                                            {s.name?.charAt(0)}
                                                        </div>
                                                        <span className="font-bold text-slate-800 tracking-tight text-[13px]">{s.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 tracking-widest">{s.nisn || '-'}</td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center w-10 h-6 rounded-md bg-slate-100 text-slate-500 text-[10px] font-bold border border-slate-100/50">{s.class}</span>
                                                </td>

                                                {/* Formatif Inputs */}
                                                {Array.from({ length: tpCount }).map((_, i) => (
                                                    <td key={`fi-${idx}-${i}`} className="p-1.5 border-x border-slate-50/30">
                                                        <input
                                                            type="number"
                                                            value={data[`f${i + 1}`] || ""}
                                                            onChange={e => handleScoreChange(s.id, `f${i + 1}`, e.target.value)}
                                                            className="w-full h-10 text-center text-xs font-bold bg-slate-50/50 outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 rounded-lg border border-transparent transition-all placeholder:text-slate-200"
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                ))}

                                                {/* Sumatif Inputs */}
                                                {Array.from({ length: sumCount }).map((_, i) => (
                                                    <td key={`si-${idx}-${i}`} className="p-1.5 border-r border-slate-50/30">
                                                        <input
                                                            type="number"
                                                            value={data[`s${i + 1}`] || ""}
                                                            onChange={e => handleScoreChange(s.id, `s${i + 1}`, e.target.value)}
                                                            className="w-full h-10 text-center text-xs font-bold bg-slate-50/50 outline-none focus:bg-white focus:ring-4 focus:ring-emerald-50 focus:border-emerald-300 rounded-lg border border-transparent transition-all placeholder:text-slate-200"
                                                            placeholder="-"
                                                        />
                                                    </td>
                                                ))}

                                                {/* PTS PAS Inputs */}
                                                <td className="p-1.5 border-r border-slate-50/30 bg-amber-50/5">
                                                    <input
                                                        type="number"
                                                        value={data.pts || ""}
                                                        onChange={e => handleScoreChange(s.id, 'pts', e.target.value)}
                                                        className="w-full h-10 text-center text-xs font-bold bg-slate-50/50 outline-none focus:bg-white focus:ring-4 focus:ring-amber-50 focus:border-amber-300 rounded-lg border border-transparent transition-all placeholder:text-slate-200"
                                                        placeholder="-"
                                                    />
                                                </td>
                                                <td className="p-1.5 border-r border-slate-50/30 bg-rose-50/5">
                                                    <input
                                                        type="number"
                                                        value={data.pas || ""}
                                                        onChange={e => handleScoreChange(s.id, 'pas', e.target.value)}
                                                        className="w-full h-10 text-center text-xs font-bold bg-slate-50/50 outline-none focus:bg-white focus:ring-4 focus:ring-rose-50 focus:border-rose-300 rounded-lg border border-transparent transition-all placeholder:text-slate-200"
                                                        placeholder="-"
                                                    />
                                                </td>

                                                {/* Final NA Display */}
                                                <td className="p-1.5 bg-indigo-50/30">
                                                    <div className={cn(
                                                        "w-full h-10 flex items-center justify-center font-bold text-sm rounded-lg transition-all shadow-inner",
                                                        calc.na >= 75 ? 'text-indigo-600 bg-indigo-50/50' : 'text-rose-600 bg-rose-50/50'
                                                    )}>
                                                        {calc.na}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* MODAL CONFIG TP */}
            {showTpModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-premium animate-zoomIn border border-white/20">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Atur Kolom Nilai</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Input Deskriptif</p>
                            </div>
                            <button onClick={() => setShowTpModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Jumlah Formatif (TP)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={tpCount}
                                        onChange={e => setTpCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-50 focus:border-blue-400 outline-none font-bold text-slate-700 transition-all text-center text-lg"
                                    />
                                    <div className="absolute left-6 inset-y-0 flex items-center text-blue-400 font-bold">F</div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Jumlah Sumatif (Materi)</label>
                                <div className="relative group">
                                    <input
                                        type="number"
                                        value={sumCount}
                                        onChange={e => setSumCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-emerald-50 focus:border-emerald-400 outline-none font-bold text-slate-700 transition-all text-center text-lg"
                                    />
                                    <div className="absolute left-6 inset-y-0 flex items-center text-emerald-400 font-bold">S</div>
                                </div>
                            </div>
                            <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100/50 flex gap-4">
                                <span className="text-2xl">💡</span>
                                <p className="text-[11px] font-bold text-amber-700 leading-relaxed">Maksimal 10 kolom diperbolehkan untuk menjaga performa tampilan dashboard.</p>
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex gap-4">
                            <button onClick={() => setShowTpModal(false)} className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all">
                                TERAPKAN PERUBAHAN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL BOBOT NA */}
            {showWeightModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-6 animate-fadeIn">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-premium animate-zoomIn border border-white/20">
                        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 tracking-tight">Atur Bobot NA</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Konfigurasi Nilai Akhir</p>
                            </div>
                            <button onClick={() => setShowWeightModal(false)} className="w-10 h-10 rounded-full bg-white border border-slate-100 flex items-center justify-center text-slate-400 hover:text-rose-500 transition-colors shadow-sm">✕</button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="bg-indigo-50 border border-indigo-100/50 p-5 rounded-2xl text-[11px] text-indigo-700 font-bold uppercase tracking-widest text-center flex flex-col gap-2">
                                <span>Distribusi Persentase Nilai Akhir</span>
                                <span className="text-[9px] opacity-60 font-semibold">Pastikan total penjumlahan mencapai tepat 100%</span>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group-focus-within:border-indigo-200 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">F+S (Rerata)</span>
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase">Formatif & Sumatif</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={weights.fs}
                                            onChange={e => setWeights({ ...weights, fs: parseInt(e.target.value) || 0 })}
                                            className="w-16 h-10 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all"
                                        />
                                        <span className="font-bold text-slate-300">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group-focus-within:border-indigo-200 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Nilai PTS</span>
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase">Tengah Semester</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={weights.pts}
                                            onChange={e => setWeights({ ...weights, pts: parseInt(e.target.value) || 0 })}
                                            className="w-16 h-10 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all"
                                        />
                                        <span className="font-bold text-slate-300">%</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group-focus-within:border-indigo-200 transition-all">
                                    <div className="flex flex-col">
                                        <span className="text-[11px] font-bold text-slate-800 uppercase tracking-widest">Nilai PAS</span>
                                        <span className="text-[9px] font-semibold text-slate-400 uppercase">Akhir Semester</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="number"
                                            value={weights.pas}
                                            onChange={e => setWeights({ ...weights, pas: parseInt(e.target.value) || 0 })}
                                            className="w-16 h-10 bg-white border border-slate-200 rounded-lg text-center font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 transition-all"
                                        />
                                        <span className="font-bold text-slate-300">%</span>
                                    </div>
                                </div>
                            </div>

                            <div className={cn(
                                "p-6 rounded-2xl flex justify-between items-center transition-all shadow-inner",
                                weights.fs + weights.pts + weights.pas === 100 ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-600 border border-rose-100'
                            )}>
                                <span className="text-[11px] font-bold uppercase tracking-widest">Total Check:</span>
                                <span className="text-2xl font-bold">{weights.fs + weights.pts + weights.pas}%</span>
                            </div>
                        </div>
                        <div className="p-8 border-t border-slate-50 bg-slate-50/30">
                            <button
                                onClick={() => setShowWeightModal(false)}
                                disabled={weights.fs + weights.pts + weights.pas !== 100}
                                className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                            >
                                KONFIRMASI BOBOT NILAI
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
