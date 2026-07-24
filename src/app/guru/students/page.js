"use client";

import React, { useState, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";
import { studentOperations } from "@/lib/supabase";

export default function GuruStudentsPage() {
    const { state, updateState, processData, showToast } = useApp();
    const { students, currentUser } = state;
    const [search, setSearch] = useState("");
    const [selectedClass, setSelectedClass] = useState("Semua");
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef(null);

    // Helper to normalize class strings for comparison (e.g. "1A", "1 A", "Kelas 1A", "1-A" -> "1A")
    const normalizeClass = (cls) => {
        if (!cls) return "";
        return String(cls)
            .toUpperCase()
            .replace(/^KELAS\s*/i, '')
            .replace(/^KLS\s*/i, '')
            .replace(/[\s\-_.]/g, '')
            .trim();
    };

    // Teacher's assigned classes from profile (e.g. "1A, 2B, 4A" or "1A; 2B" or "1A/2B")
    const teacherClasses = useMemo(() => {
        const rawClass = currentUser?.class || currentUser?.content?.class;
        if (!rawClass) return [];
        return String(rawClass).split(/[,;/]+/).map(c => c.trim()).filter(Boolean);
    }, [currentUser]);

    const normalizedTeacherClasses = useMemo(() => {
        return teacherClasses.map(normalizeClass);
    }, [teacherClasses]);

    const activeNpsn = currentUser?.npsn || currentUser?.content?.npsn || state?.config?.npsn || null;

    // Extract unique classes: restrict to teacher's assigned classes if set, otherwise fallback to all school classes
    const uniqueClasses = useMemo(() => {
        if (teacherClasses.length > 0) {
            return teacherClasses;
        }
        const studentClasses = students
            .filter(s => !activeNpsn || !s.npsn || s.npsn === activeNpsn)
            .map(s => s.class)
            .filter(Boolean);
        return Array.from(new Set(studentClasses)).sort();
    }, [students, teacherClasses, activeNpsn]);

    const filtered = useMemo(() => {
        return students.filter(s => {
            // 1. School Isolation: Filter out students from different NPSN
            if (activeNpsn && s.npsn && s.npsn !== activeNpsn) {
                return false;
            }

            // 2. Class Isolation: Strictly restrict students to teacher's assigned classes
            const sNormClass = normalizeClass(s.class);

            if (normalizedTeacherClasses.length > 0) {
                if (selectedClass === "Semua") {
                    // Only show students matching teacher's assigned classes
                    if (!sNormClass || !normalizedTeacherClasses.includes(sNormClass)) {
                        return false;
                    }
                } else {
                    const selectedNorm = normalizeClass(selectedClass);
                    if (sNormClass !== selectedNorm || !normalizedTeacherClasses.includes(sNormClass)) {
                        return false;
                    }
                }
            } else {
                // Fallback if teacher has no assigned classes in profile
                if (selectedClass !== "Semua") {
                    const selectedNorm = normalizeClass(selectedClass);
                    if (sNormClass !== selectedNorm) {
                        return false;
                    }
                }
            }

            // 3. Search Filter
            const query = search.toLowerCase();
            const matchSearch = !search ||
                s.name?.toLowerCase().includes(query) ||
                s.nisn?.includes(query) ||
                s.nis?.includes(query);

            return matchSearch;
        });
    }, [students, activeNpsn, normalizedTeacherClasses, selectedClass, search]);

    const formatDate = (dateString) => {
        if (!dateString) return "-";
        return new Date(dateString).toLocaleDateString("id-ID", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });
    };

    const handleDeleteSingle = async (student) => {
        if (!student || !student.id) return;
        const confirmDelete = window.confirm(`Apakah Anda yakin ingin menghapus data siswa "${student.name}"?\n\nPerhatian: Tindakan ini permanen dan tidak dapat dibatalkan.`);
        if (confirmDelete) {
            try {
                await studentOperations.delete(student.id);
                if (showToast) {
                    showToast(`Data siswa "${student.name}" berhasil dihapus.`, "success", "🗑️", "Berhasil Dihapus!");
                } else {
                    alert(`Data siswa "${student.name}" berhasil dihapus.`);
                }
                if (processData) await processData('delete');
            } catch (err) {
                console.error("Gagal menghapus siswa:", err);
                let errMsg = err.message || 'Terjadi kesalahan saat menghapus data.';
                if (errMsg.includes('foreign key constraint') || errMsg.includes('violates foreign key constraint')) {
                    errMsg = "Data ini terhubung dengan catatan absensi atau nilai di database.";
                }
                if (showToast) {
                    showToast(errMsg, "error", "⚠️", "Gagal Menghapus");
                } else {
                    alert("Gagal menghapus siswa: " + errMsg);
                }
            }
        }
    };

    const handleDeleteClass = async () => {
        if (filtered.length === 0) {
            alert("Tidak ada siswa untuk dihapus pada tampilan ini.");
            return;
        }

        const confirmEmpty = window.confirm(`Apakah Anda yakin ingin menghapus SEMUA data siswa (${filtered.length} siswa) yang ditampilkan saat ini?\n\nPerhatian: Tindakan ini permanen dan tidak dapat dibatalkan.`);

        if (confirmEmpty) {
            try {
                const ids = filtered.map(s => s.id);
                await studentOperations.batchDelete(ids);
                alert(`${ids.length} data siswa berhasil dihapus secara massal.`);
                window.location.reload();
            } catch (err) {
                console.error("Gagal menghapus secara massal:", err);
                alert("Terjadi kesalahan saat menghapus data.");
            }
        }
    };

    const handleDownloadTemplate = () => {
        const headers = ["Nama", "NIS", "NISN", "Kelas", "L/P", "Tempat Lahir", "Tanggal Lahir"];
        const dummyRow = ["Budi Santoso", "12345", "0012345678", "10A", "L", "Jakarta", "2008-05-15"];

        const csvContent = "sep=;\n" + [headers, dummyRow].map(e => e.join(";")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Template_Data_Siswa.csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportCSV = () => {
        const headers = ["Nama", "NIS", "NISN", "Kelas", "L/P", "Tempat Lahir", "Tanggal Lahir"];
        const rows = filtered.map(s => [
            s.name,
            s.nis || "",
            s.nisn || "",
            s.class || "",
            s.gender || "",
            s.birth_place || "",
            s.birth_date || ""
        ]);

        const csvContent = "sep=;\n" + [headers, ...rows].map(e => e.join(";")).join("\n");
        const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Data_Siswa_${selectedClass}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleImportCSV = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const lines = text.split("\n").map(l => l.trim()).filter(l => l);

            // Detect separator (handle sep=; hint or auto-detect)
            let startIndex = 0;
            let separator = ",";
            if (lines[0].startsWith("sep=")) {
                separator = lines[0].split("=")[1];
                startIndex = 1;
            } else {
                // Auto-detect between comma and semicolon
                const commaCount = (lines[0].match(/,/g) || []).length;
                const semiCount = (lines[0].match(/;/g) || []).length;
                separator = semiCount > commaCount ? ";" : ",";
            }

            const headers = lines[startIndex].split(separator).map(h => h.replace(/^["']|["']$/g, '').trim().toLowerCase());

            const parseDateString = (raw) => {
                if (!raw) return null;
                const trimmed = String(raw).replace(/[\u00A0\u200B]/g, ' ').replace(/^["']|["']$/g, '').trim();
                if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "null" || trimmed.toLowerCase() === "undefined") return null;

                // Match DD/MM/YYYY or DD-MM-YYYY or DD.MM.YYYY
                const dmyMatch = trimmed.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
                if (dmyMatch) {
                    const day = dmyMatch[1].padStart(2, '0');
                    const month = dmyMatch[2].padStart(2, '0');
                    const year = dmyMatch[3];
                    return `${year}-${month}-${day}`;
                }

                // Match YYYY/MM/DD or YYYY-MM-DD or YYYY.MM.DD
                const ymdMatch = trimmed.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
                if (ymdMatch) {
                    const year = ymdMatch[1];
                    const month = ymdMatch[2].padStart(2, '0');
                    const day = ymdMatch[3].padStart(2, '0');
                    return `${year}-${month}-${day}`;
                }

                // Fallback to JS Date parse
                const parsedMs = Date.parse(trimmed);
                if (!isNaN(parsedMs)) {
                    const d = new Date(parsedMs);
                    if (!isNaN(d.getTime())) {
                        const yyyy = d.getFullYear();
                        const mm = String(d.getMonth() + 1).padStart(2, '0');
                        const dd = String(d.getDate()).padStart(2, '0');
                        return `${yyyy}-${mm}-${dd}`;
                    }
                }

                return null;
            };

            const activeTeacherId = currentUser?.auth_id || currentUser?.id || currentUser?.__backendId;

            const records = lines.slice(startIndex + 1).map(line => {
                const values = line.split(separator).map(v => v.replace(/^["']|["']$/g, '').trim());
                const obj = {};
                headers.forEach((header, i) => {
                    const rawVal = values[i] ? values[i].replace(/^["']|["']$/g, '').trim() : "";
                    const val = (rawVal === "" || rawVal === "-") ? null : rawVal;

                    if (header === "nama" || header === "nama lengkap") obj.name = val;
                    if (header === "nis") obj.nis = val;
                    if (header === "nisn") obj.nisn = val;
                    if (header === "kelas") obj.class = val;
                    if (header === "l/p" || header === "jk" || header === "jenis kelamin") obj.gender = val ? val.toUpperCase() : null;
                    if (header === "tempat lahir" || header === "tmpt lahir") obj.birth_place = val;
                    if (
                        header === "tanggal lahir" || header === "tgl lahir" ||
                        header === "tanggal_lahir" || header === "tgl_lahir" ||
                        header === "tgl.lahir" || header === "tgl. lahir" ||
                        header === "ttl" || header === "birth_date" || header === "birthdate" ||
                        header === "dob" || header === "date_of_birth"
                    ) {
                        obj.birth_date = parseDateString(val);
                    }
                });
                return {
                    ...obj,
                    teacher_id: activeTeacherId || null,
                };
            }).filter(r => r.name); // Basic validation

            if (records.length === 0) {
                if (showToast) showToast("Tidak ada data siswa yang valid ditemukan dalam file CSV.", "error", "⚠️");
                else alert("Tidak ada data siswa yang valid ditemukan dalam file CSV.");
                setIsImporting(false);
                return;
            }

            try {
                await studentOperations.batchUpsert(records);
                if (showToast) {
                    showToast(`${records.length} data siswa berhasil diimpor!`, "success", "📥", "Berhasil Impor!");
                } else {
                    alert(`${records.length} data siswa berhasil diimpor! ✅`);
                }
                // Refresh data via Context
                if (processData) await processData('import');
            } catch (err) {
                console.error("Import error:", err);
                let errMsg = err.message || 'Pastikan format CSV benar.';
                if (errMsg.includes('students_nisn_key') || errMsg.includes('unique constraint')) {
                    errMsg = 'Terdapat NISN ganda pada file atau database. Mohon periksa kembali NISN siswa.';
                } else if (errMsg.includes('row-level security') || errMsg.includes('RLS') || errMsg.includes('violates row-level security policy')) {
                    errMsg = 'Akses ditolak oleh sistem keamanan database (RLS). Pastikan Anda telah terhubung dengan akun Guru yang sah.';
                }
                if (showToast) {
                    showToast(errMsg, "error", "⚠️", "Gagal Impor");
                } else {
                    alert("Gagal mengimpor data: " + errMsg);
                }
            } finally {
                setIsImporting(false);
                e.target.value = ''; // Reset input
            }
        };
        reader.readAsText(file);
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Daftar Siswa</h1>
                    <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-wider mt-1">Manajemen Database Siswa Per Kelas</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleImportCSV}
                        accept=".csv"
                        className="hidden"
                    />

                    <button
                        onClick={handleDownloadTemplate}
                        className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                        title="Unduh Template CSV"
                    >
                        <span className="text-base group-hover:scale-110 transition-transform">📄</span>
                        TEMPLATE
                    </button>

                    <button
                        onClick={() => fileInputRef.current.click()}
                        disabled={isImporting}
                        className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span className="text-base group-hover:scale-110 transition-transform">📥</span>
                        {isImporting ? "PROSES..." : "IMPOR CSV"}
                    </button>

                    <button
                        onClick={handleExportCSV}
                        className="flex-1 md:flex-none px-6 py-3 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group"
                    >
                        <span className="text-base group-hover:scale-110 transition-transform">📤</span>
                        EKSPOR CSV
                    </button>

                    <button
                        onClick={handleDeleteClass}
                        className="flex-1 md:flex-none px-6 py-3 bg-white border border-rose-200 text-rose-600 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:border-rose-300 hover:bg-rose-50 transition-all flex items-center justify-center gap-2 group"
                        title="Hapus Semua Siswa di Daftar Ini"
                    >
                        <span className="text-base group-hover:scale-110 transition-transform">🗑️</span>
                        KOSONGKAN DATA
                    </button>

                    <button
                        onClick={() => updateState({ showModal: true, modalType: 'student', modalMode: 'add' })}
                        className="w-full md:w-auto px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        + Siswa Baru
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100/50 overflow-hidden shadow-modern">
                <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row gap-6 bg-slate-50/20">
                    <div className="flex-1 relative group">
                        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none text-slate-300 group-focus-within:text-indigo-400 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Cari siswa (Nama, NIS, NISN)..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-14 pr-6 py-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all placeholder:text-slate-300"
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <select
                            value={selectedClass}
                            onChange={e => setSelectedClass(e.target.value)}
                            className="w-full px-6 py-4 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-700 bg-slate-50/50 focus:bg-white focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none transition-all cursor-pointer appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.5rem center', backgroundSize: '0.8rem' }}
                        >
                            <option value="Semua">Semua Kelas</option>
                            {uniqueClasses.map(c => (
                                <option key={c} value={c}>Kelas {c}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/20 border-b border-slate-50">
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-12 text-center">No</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Identitas (NIS/N)</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Kelas</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Gend</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">TTL</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filtered.map((s, i) => (
                                <tr key={s.id || i} className="hover:bg-slate-50 transition-colors group/row">
                                    <td className="px-8 py-6 text-[11px] font-bold text-slate-300 text-center">{String(i + 1).padStart(2, '0')}</td>
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-md group-hover/row:scale-110 transition-transform", ['gradient-blue', 'gradient-purple', 'gradient-pink', 'gradient-green', 'gradient-orange'][i % 5])}>
                                                {s.name?.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 tracking-tight text-sm">{s.name}</p>
                                                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{s.gender === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-[12px] font-bold text-slate-700 tracking-tight">{s.nis || "-"}</div>
                                            <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase">NISN: {s.nisn || "-"}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-bold border border-slate-50">{s.class}</span>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <span className={cn("inline-flex items-center justify-center w-8 h-8 rounded-full text-[11px] font-bold", s.gender === 'L' ? 'bg-blue-50 text-blue-600' : 'bg-pink-50 text-pink-600')}>
                                            {s.gender}
                                        </span>
                                    </td>
                                    <td className="px-8 py-6">
                                        <div className="flex flex-col gap-0.5">
                                            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{s.birth_place || "-"}</div>
                                            <div className="text-[12px] font-bold text-slate-700">{formatDate(s.birth_date)}</div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right whitespace-nowrap">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => updateState({ showModal: true, modalType: 'student', modalMode: 'edit', editingItem: s })}
                                                className="w-10 h-10 rounded-xl border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all shadow-sm group/btn"
                                            >
                                                <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => handleDeleteSingle(s)}
                                                className="w-10 h-10 rounded-xl border border-slate-200 text-slate-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shadow-sm group/btn"
                                                title="Hapus Data Siswa"
                                            >
                                                <svg className="w-4 h-4 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filtered.length === 0 && <div className="p-24 text-center text-slate-300 flex flex-col items-center gap-4 animate-fadeIn">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-slate-100/50">🧐</div>
                    <div>
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Tidak Ditemukan</p>
                        <p className="text-[12px] font-medium text-slate-300 mt-1">Gunakan kata kunci pencarian lain atau pilih kelas yang berbeda.</p>
                    </div>
                </div>}
            </div>
        </div>
    );
}
