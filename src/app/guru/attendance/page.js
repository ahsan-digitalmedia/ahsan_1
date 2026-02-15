"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData, attendanceOperations } from "@/lib/supabase";
import { cn } from "@/lib/utils";

export default function AttendancePage() {
    const { state, updateState } = useApp();
    const { students, currentUser } = state;

    // State
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState("");
    const [attendanceData, setAttendanceData] = useState({});
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // FETCH ATTENDANCE DATA (Daily for UI)
    useEffect(() => {
        async function fetchAttendance() {
            if (!selectedClass || !selectedDate) {
                setAttendanceData({});
                return;
            }

            setIsLoading(true);
            try {
                const data = await attendanceOperations.fetchByDateAndClass(selectedDate, selectedClass, currentUser?.__backendId);
                const map = {};
                if (data) {
                    data.forEach(record => {
                        map[record.student_id] = record.status;
                    });
                }
                setAttendanceData(map);
            } catch (error) {
                console.error("Error fetching attendance:", error);
            } finally {
                setIsLoading(false);
            }
        }

        fetchAttendance();
    }, [selectedClass, selectedDate]);

    // PRINT LOGIC (LEGACY STYLE)
    const handlePrint = async (type) => { // type: 'Harian' | 'Mingguan' | 'Bulanan'
        setShowMenu(false);
        if (!selectedClass) {
            alert("Pilih kelas terlebih dahulu");
            return;
        }

        // 1. Prepare Date Range
        let startDate, endDate;
        const current = new Date(selectedDate);

        if (type === 'Harian') {
            startDate = selectedDate;
            endDate = selectedDate;
        } else if (type === 'Mingguan') {
            const day = current.getDay(); // 0 (Sun) - 6 (Sat)
            // Asumsi Senin start (1), Minggu end (0/7)
            // Adjust to make Monday the start
            const diff = current.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(current);
            monday.setDate(diff);

            const sunday = new Date(monday);
            sunday.setDate(monday.getDate() + 6);

            startDate = monday.toISOString().split('T')[0];
            endDate = sunday.toISOString().split('T')[0];
        } else if (type === 'Bulanan') {
            const y = current.getFullYear();
            const m = current.getMonth();
            startDate = new Date(y, m, 1).toISOString().split('T')[0];
            endDate = new Date(y, m + 1, 0).toISOString().split('T')[0];
        }

        // 2. Fetch Data
        let printData = [];
        try {
            printData = await attendanceOperations.fetchByRange(selectedClass, startDate, endDate, currentUser?.__backendId);
        } catch (e) {
            alert("Gagal mengambil data untuk cetak");
            console.error(e);
            return;
        }

        // 3. Generate HTML
        const schoolName = currentUser?.schoolName || "SDN 1 PONCOWATI"; // Fallback to legacy default
        const teacherName = currentUser?.name || "Guru Kelas";
        const className = selectedClass;
        const currentYear = new Date().getFullYear();
        // Assuming semester/year Logic similar to legacy
        const semester = currentUser?.semester || "Ganjil";
        const academicYear = currentUser?.academicYear || `${currentYear}/${currentYear + 1}`;

        let title = '';
        let dateInfo = '';
        let tableHeader = '';
        let tableRows = '';
        let tableFooter = '';

        // Helper to format date ID
        const fmtDate = (d) => new Date(d).toLocaleDateString('id-ID', {
            day: 'numeric', month: 'long', year: 'numeric'
        });

        // Filter valid students
        const classStudents = filteredStudents;

        if (type === 'Harian') {
            title = 'LAPORAN ABSENSI HARIAN SISWA';
            dateInfo = `Tanggal: ${fmtDate(selectedDate)}`;
            tableHeader = `
                <tr>
                    <th>No</th>
                    <th style="text-align: left;">Nama Siswa</th>
                    <th>NISN</th>
                    <th>NIS</th>
                    <th>JK</th>
                    <th>Status</th>
                </tr>
            `;

            let totalH = 0, totalS = 0, totalI = 0, totalA = 0;
            tableRows = classStudents.map((s, idx) => {
                const att = printData.find(a => a.student_id === s.id && a.date === selectedDate);
                const status = att ? att.status : '';
                if (status === 'H') totalH++;
                if (status === 'S') totalS++;
                if (status === 'I') totalI++;
                if (status === 'A') totalA++;

                // Map code to full text
                const statusMap = { 'H': 'HADIR', 'S': 'SAKIT', 'I': 'IZIN', 'A': 'ALPA' };

                return `
                    <tr>
                        <td align="center">${idx + 1}</td>
                        <td style="text-align: left;">${s.name}</td>
                        <td align="center">${s.nisn || '-'}</td>
                        <td align="center">${s.nis || '-'}</td>
                        <td align="center">${s.gender || '-'}</td>
                        <td align="center">${statusMap[status] || '-'}</td>
                    </tr>
                 `;
            }).join('');

            tableFooter = `
                <tr style="background-color: #f3f4f6; font-weight: bold;">
                    <td colspan="5" align="right" style="padding-right: 10px;">JUMLAH:</td>
                    <td align="center">H:${totalH} S:${totalS} I:${totalI} A:${totalA}</td>
                </tr>
             `;

        } else if (type === 'Mingguan') {
            title = 'LAPORAN ABSENSI MINGGUAN SISWA';
            dateInfo = `Periode: ${fmtDate(startDate)} s/d ${fmtDate(endDate)}`;

            // Generate dates for header
            const dates = [];
            let d = new Date(startDate);
            while (d <= new Date(endDate)) {
                if (d.getDay() !== 0) { // Skip Sunday usually? Legacy didn't skip but 6 days loop.
                    // Actually let's include Mon-Sat usually
                    dates.push(new Date(d));
                }
                d.setDate(d.getDate() + 1);
            }
            // Force Mon-Sat if loop logic fails
            // Just use the 'dates' array

            const dateHeaders = dates.map(dt => {
                const dayName = dt.toLocaleDateString('id-ID', { weekday: 'short' });
                const dateNum = dt.getDate();
                return `<th style="font-size: 9px;">${dayName}<br>${dateNum}</th>`;
            }).join('');

            tableHeader = `
                <tr>
                    <th rowspan="2">Nama Siswa</th>
                    <th rowspan="2">NISN</th>
                    <th rowspan="2">NIS</th>
                    <th colspan="${dates.length}">Harian</th>
                    <th colspan="4">Jumlah</th>
                </tr>
                <tr>
                    ${dateHeaders}
                    <th width="20">H</th> <th width="20">S</th> <th width="20">I</th> <th width="20">A</th>
                </tr>
             `;

            tableRows = classStudents.map((s) => {
                let h = 0, sk = 0, i = 0, a = 0;
                const cells = dates.map(dt => {
                    const dateKey = dt.toISOString().split('T')[0];
                    const att = printData.find(x => x.student_id === s.id && x.date === dateKey);
                    const st = att ? att.status : '';
                    if (st === 'H') h++;
                    if (st === 'S') sk++;
                    if (st === 'I') i++;
                    if (st === 'A') a++;
                    return `<td align="center" style="font-size: 9px;">${st || '-'}</td>`;
                }).join('');

                return `
                    <tr>
                        <td style="text-align: left; font-size: 10px;">${s.name}</td>
                        <td align="center" style="font-size: 9px;">${s.nisn || '-'}</td>
                        <td align="center" style="font-size: 9px;">${s.nis || '-'}</td>
                        ${cells}
                        <td align="center" style="font-size: 9px; font-weight: bold; background: #fcfcfc;">${h}</td>
                        <td align="center" style="font-size: 9px; font-weight: bold; background: #fcfcfc;">${sk}</td>
                        <td align="center" style="font-size: 9px; font-weight: bold; background: #fcfcfc;">${i}</td>
                        <td align="center" style="font-size: 9px; font-weight: bold; background: #fcfcfc;">${a}</td>
                    </tr>
                 `;
            }).join('');
        } else if (type === 'Bulanan') {
            title = 'LAPORAN ABSENSI BULANAN SISWA';
            dateInfo = `Bulan: ${new Date(selectedDate).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}`;

            tableHeader = `
                <tr>
                    <th>No</th>
                    <th style="text-align: left;">Nama Siswa</th>
                    <th>NISN</th>
                    <th>NIS</th>
                    <th>H</th>
                    <th>S</th>
                    <th>I</th>
                    <th>A</th>
                    <th>Total</th>
                    <th>%</th>
                </tr>
            `;

            tableRows = classStudents.map((s, idx) => {
                // Filter this student's records in the range
                const records = printData.filter(x => x.student_id === s.id); // printData is already filtered by range
                const h = records.filter(x => x.status === 'H').length;
                const sk = records.filter(x => x.status === 'S').length;
                const i = records.filter(x => x.status === 'I').length;
                const a = records.filter(x => x.status === 'A').length;
                const total = h + sk + i + a;
                const pct = total > 0 ? Math.round((h / total) * 100) : 0;

                return `
                    <tr>
                        <td align="center">${idx + 1}</td>
                        <td style="text-align: left;">${s.name}</td>
                        <td align="center">${s.nisn || '-'}</td>
                        <td align="center">${s.nis || '-'}</td>
                        <td align="center">${h}</td>
                        <td align="center">${sk}</td>
                        <td align="center">${i}</td>
                        <td align="center">${a}</td>
                        <td align="center" style="background: #fcfcfc;">${total}</td>
                        <td align="center" style="font-weight: bold;">${pct}%</td>
                    </tr>
                `;
            }).join('');
        }


        // 4. Open Window and Write
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            alert("Pop-up blocked! Please allow pop-ups for this site.");
            return;
        }

        printWindow.document.write(`
            <html>
                <head>
                    <title>Cetak Absensi - ${schoolName}</title>
                    <style>
                        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                        @page { size: portrait; margin: 15mm; }
                        body { font-family: 'Inter', sans-serif; padding: 0; color: #000; font-size: 12px; }
                        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #000; padding-bottom: 10px; }
                        .school-name { font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase; }
                        .report-title { font-size: 14px; font-weight: bold; margin: 5px 0; text-decoration: underline; }
                        .meta-grid { display: flex; justify-content: space-between; margin-bottom: 15px; font-size: 13px; }
                        .meta-left p, .meta-right p { margin: 2px 0; }
                        table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: auto; }
                        th, td { border: 1px solid #000; padding: 5px; font-size: 11px; }
                        th { background-color: #f3f4f6; }
                        .footer { margin-top: 40px; display: flex; justify-content: space-between; break-inside: avoid; page-break-inside: avoid; }
                        .sig-box { width: 45%; text-align: center; }
                        .sig-space { height: 60px; }
                        .sig-name { font-weight: bold; text-decoration: underline; }
                        @media print { .no-print { display: none; } }
                    </style>
                </head>
                <body>
                    <div class="header">
                        <div class="report-title">${title}</div>
                        <h1 class="school-name">${currentUser?.school_name || schoolName}</h1>
                        <p style="margin: 2px 0;">${currentUser?.school_address || "Alamat Sekolah Belum Diisi"}</p>
                    </div>
                    
                    <div class="meta-grid">
                        <div class="meta-left">
                            <p><strong>Kelas:</strong> ${className}</p>
                            <p><strong>Semester:</strong> ${semester}</p>
                            <p><strong>Tahun Pelajaran:</strong> ${currentUser?.academic_year || academicYear}</p>
                        </div>
                        <div class="meta-right" style="text-align: right;">
                             <p><strong>Guru:</strong> ${teacherName}</p>
                             <p><strong>Status:</strong> ${currentUser?.subject === 'Guru Kelas' ? 'Guru Kelas' : `Guru ${currentUser?.subject || 'Mapel'}`}</p>
                             <p><strong>${dateInfo}</strong></p>
                        </div>
                    </div>

                    <table>
                        <thead>${tableHeader}</thead>
                        <tbody>${tableRows}</tbody>
                        ${tableFooter ? `<tfoot>${tableFooter}</tfoot>` : ''}
                    </table>

                     <div class="footer">
                        <div class="sig-box">
                            <p>Mengetahui,</p>
                            <p>Kepala Sekolah</p>
                            <div class="sig-space"></div>
                            <p class="sig-name">${currentUser?.principal_name || '........................................'}</p>
                            <p>NIP. ${currentUser?.principal_nip || '........................................'}</p>
                        </div>
                        <div class="sig-box">
                            <p>${currentUser?.kecamatan ? `${currentUser.kecamatan}, ` : ''}${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                            <p>${currentUser?.subject === 'Guru Kelas' ? 'Guru Kelas' : `Guru ${currentUser?.subject || 'Mapel'}`},</p>
                            <div class="sig-space"></div>
                            <p class="sig-name">${teacherName}</p>
                            <p>NIP. ${currentUser?.nip || '-'}</p>
                        </div>
                    </div>

                    <script>
                        window.onload = () => { window.print(); };
                    </script>
                </body>
            </html>
        `);
        printWindow.document.close();
    };

    // Extract unique classes
    const uniqueClasses = useMemo(() => {
        const classes = students.map(s => s.class).filter(c => c);
        return [...new Set(classes)].sort();
    }, [students]);

    // Filter students
    const filteredStudents = useMemo(() => {
        if (!selectedClass) return [];
        return students.filter(s => s.class === selectedClass);
    }, [students, selectedClass]);

    // Counts for Summary
    const counts = useMemo(() => {
        const c = { H: 0, S: 0, I: 0, A: 0 };
        filteredStudents.forEach(s => {
            const status = attendanceData[s.id];
            if (status && c[status] !== undefined) c[status]++;
        });
        return c;
    }, [filteredStudents, attendanceData]);

    const handleStatusClick = (studentId, status) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const markAllPresent = () => {
        const updated = { ...attendanceData };
        filteredStudents.forEach(s => updated[s.id] = 'H');
        setAttendanceData(updated);
    };

    const handleSave = async () => {
        if (!selectedClass) {
            alert("Silakan pilih kelas terlebih dahulu!");
            return;
        }
        setIsSaving(true);
        try {
            const recordsToSave = filteredStudents
                .filter(s => attendanceData[s.id])
                .map(s => ({
                    student_id: s.id,
                    class: selectedClass,
                    date: selectedDate,
                    status: attendanceData[s.id],
                    teacher_id: currentUser?.__backendId
                }));

            if (recordsToSave.length > 0) {
                await attendanceOperations.upsert(recordsToSave);
                alert("Data absensi berhasil disimpan! ✅");
            } else {
                alert("Tidak ada data untuk disimpan.");
            }
        } catch (error) {
            console.error("Error saving attendance:", error);
            alert("Gagal menyimpan data absensi. Coba lagi.");
        } finally {
            setIsSaving(false);
        }
    };

    // Styling helpers
    const getStatusColor = (status) => {
        switch (status) {
            case 'H': return 'bg-emerald-500 text-white border-emerald-600';
            case 'S': return 'bg-blue-500 text-white border-blue-600';
            case 'I': return 'bg-yellow-500 text-white border-yellow-600';
            case 'A': return 'bg-red-500 text-white border-red-600';
            default: return 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'H': return 'Hadir';
            case 'S': return 'Sakit';
            case 'I': return 'Izin';
            case 'A': return 'Alpha';
            default: return '-';
        }
    };

    return (
        <div className="animate-fadeIn pb-10">
            {/* Screen Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Absensi Siswa</h1>
                    <p className="text-slate-400 text-[12px] font-semibold uppercase tracking-wider mt-1">Rekapitulasi Kehadiran Harian</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto relative">
                    <select
                        value={selectedClass}
                        onChange={e => setSelectedClass(e.target.value)}
                        className={`px-6 py-3.5 rounded-xl border font-bold text-[13px] outline-none shadow-sm cursor-pointer transition-all appearance-none pr-12 min-w-[180px] ${!selectedClass ? 'border-indigo-200 bg-indigo-50/50 text-indigo-600 ring-4 ring-indigo-50' : 'border-slate-200 text-slate-700 bg-white'}`}
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%234F46E5' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '0.9rem' }}
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

                    <input
                        type="date"
                        value={selectedDate}
                        onChange={e => setSelectedDate(e.target.value)}
                        className="px-6 py-3.5 rounded-xl border border-slate-200 font-bold text-[13px] text-slate-700 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-400 outline-none shadow-sm transition-all"
                    />

                    <button
                        onClick={markAllPresent}
                        disabled={!selectedClass}
                        className="px-6 py-3.5 bg-emerald-50 text-emerald-600 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed border border-emerald-100/50 group"
                    >
                        <span className="text-base group-hover:scale-110 transition-transform">✅</span> Hadir Semua
                    </button>

                    <button
                        onClick={handleSave}
                        disabled={isSaving || !selectedClass}
                        className="px-8 py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-md hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-70 whitespace-nowrap disabled:cursor-not-allowed"
                    >
                        {isSaving ? "PROSES..." : "SIMPAN DATA"}
                    </button>

                    {/* Action Dropdown */}
                    <div className="relative w-full md:w-auto" ref={menuRef}>
                        <button
                            onClick={() => setShowMenu(!showMenu)}
                            disabled={!selectedClass}
                            className="w-full md:w-auto px-6 py-3.5 bg-white border border-slate-200 text-slate-500 rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-sm hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
                        >
                            <span className="text-base group-hover:scale-110 transition-transform">🖨️</span> CETAK
                        </button>
                        {showMenu && (
                            <div className="absolute left-0 md:left-auto md:right-0 top-full mt-3 w-64 bg-white/90 backdrop-blur-xl rounded-2xl shadow-premium border border-white/40 p-3 z-50 animate-zoomIn origin-top-left md:origin-top-right">
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 py-3 opacity-60">Opsi Laporan</div>
                                <button onClick={() => handlePrint("Harian")} className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-indigo-50 text-slate-700 font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center text-sm group-hover/item:bg-blue-500 group-hover/item:text-white transition-colors">📄</span>
                                    Cetak Harian
                                </button>
                                <button onClick={() => handlePrint("Mingguan")} className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-indigo-50 text-slate-700 font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-purple-50 text-purple-500 flex items-center justify-center text-sm group-hover/item:bg-purple-500 group-hover/item:text-white transition-colors">📑</span>
                                    Cetak Mingguan
                                </button>
                                <button onClick={() => handlePrint("Bulanan")} className="w-full text-left px-5 py-3.5 rounded-xl hover:bg-indigo-50 text-slate-700 font-bold text-[11px] uppercase tracking-widest flex items-center gap-3 transition-colors group/item">
                                    <span className="w-8 h-8 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center text-sm group-hover/item:bg-orange-500 group-hover/item:text-white transition-colors">📊</span>
                                    Cetak Bulanan
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Quick Stats / Legend */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {['H', 'S', 'I', 'A'].map(status => {
                    const count = filteredStudents.filter(s => attendanceData[s.id] === status).length;
                    const colors = {
                        H: 'bg-emerald-50 border-emerald-100 text-emerald-600 ring-emerald-500/10',
                        S: 'bg-indigo-50 border-indigo-100 text-indigo-600 ring-indigo-500/10',
                        I: 'bg-amber-50 border-amber-100 text-amber-600 ring-amber-500/10',
                        A: 'bg-rose-50 border-rose-100 text-rose-600 ring-rose-500/10'
                    };
                    const labels = { H: 'Hadir', S: 'Sakit', I: 'Izin', A: 'Alpa' };
                    const icons = { H: '✅', S: '🤒', I: '📩', A: '❌' };

                    return (
                        <div key={status} className={cn("p-6 rounded-2xl border shadow-modern transition-all group hover:bg-white/80", colors[status])}>
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">{labels[status]}</p>
                                    <h3 className="text-3xl font-bold tracking-tight">{count}</h3>
                                </div>
                                <div className="text-2xl group-hover:scale-125 transition-transform">{icons[status]}</div>
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Main Table */}
            <div className={cn("bg-white rounded-2xl border border-slate-100/50 shadow-modern mb-8 min-h-[400px] flex flex-col relative overflow-hidden", !selectedClass ? 'justify-center items-center' : '')}>
                {!selectedClass ? (
                    <div className="p-12 text-center text-slate-300 flex flex-col items-center gap-6 animate-fadeIn">
                        <div className="w-24 h-24 bg-indigo-50 rounded-2xl flex items-center justify-center text-4xl shadow-inner border border-indigo-100/50 animate-float">
                            👆
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 tracking-tight">Pilih Kelas Terlebih Dahulu</h3>
                            <p className="text-slate-400 text-[12px] font-medium uppercase tracking-wider mt-2 max-w-xs mx-auto">Silakan tentukan kelas untuk mengelola absensi siswa.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {isLoading && (
                            <div className="absolute inset-0 bg-white/60 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-fadeIn">
                                <div className="w-12 h-12 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin"></div>
                                <p className="mt-4 text-[11px] font-bold text-slate-400 uppercase tracking-widest">Memuat Data...</p>
                            </div>
                        )}
                        <div className="overflow-x-auto w-full">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/20 border-b border-slate-50">
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-16 text-center">No</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap Siswa</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-24">Kelas</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Input Status Kehadiran</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {filteredStudents.map((s, i) => (
                                        <tr key={s.id} className="hover:bg-slate-50 transition-colors group/row">
                                            <td className="px-8 py-6 text-[11px] font-bold text-slate-300 text-center">{String(i + 1).padStart(2, '0')}</td>
                                            <td className="px-8 py-6 font-bold text-slate-700">
                                                <div className="flex items-center gap-4">
                                                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shadow-md group-hover/row:scale-110 transition-transform", ['gradient-blue', 'gradient-purple', 'gradient-pink', 'gradient-green', 'gradient-orange'][i % 5])}>
                                                        {s.name?.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-800 tracking-tight text-[13px]">{s.name}</p>
                                                        <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{s.nisn || '-'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6 text-center">
                                                <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg bg-slate-50 text-slate-500 text-[11px] font-bold border border-slate-100/50">{s.class}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center gap-3">
                                                    {['H', 'S', 'I', 'A'].map(opt => {
                                                        const activeColors = {
                                                            H: 'gradient-green shadow-emerald-200/50',
                                                            S: 'gradient-blue shadow-indigo-200/50',
                                                            I: 'gradient-orange shadow-amber-200/50',
                                                            A: 'gradient-rose shadow-rose-200/50'
                                                        };
                                                        const isActive = attendanceData[s.id] === opt;
                                                        return (
                                                            <button
                                                                key={opt}
                                                                onClick={() => handleStatusClick(s.id, opt)}
                                                                className={cn(
                                                                    "w-11 h-11 rounded-xl text-[13px] font-bold transition-all hover:scale-110 shadow-sm flex items-center justify-center relative overflow-hidden group/btn",
                                                                    isActive ? activeColors[opt] + " text-white shadow-lg" : "bg-slate-50 text-slate-300 hover:text-slate-500 border border-slate-100"
                                                                )}
                                                                title={getStatusLabel(opt)}
                                                            >
                                                                {isActive && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
                                                                <span className="relative z-10">{opt}</span>
                                                            </button>
                                                        )
                                                    })}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {filteredStudents.length === 0 && <div className="p-24 text-center text-slate-300 flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-xl flex items-center justify-center text-2xl shadow-inner grayscale opacity-50">👥</div>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Tidak ada siswa terdaftar di kelas ini.</p>
                        </div>}
                    </>
                )}
            </div>
        </div>
    );
}
