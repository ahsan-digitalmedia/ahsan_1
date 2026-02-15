"use client";

import React, { useMemo } from "react";
import { useApp } from "@/context/AppContext";
import Link from "next/link";
import { cn, splitSubjects } from "@/lib/utils";

export default function GuruDashboard() {
    const { state, updateState } = useApp();
    const { currentUser, students, attendance, scores, journal, journal_class, journal_teacher, assignments } = state;

    // --- Profile Completion Check ---
    const isProfileIncomplete = useMemo(() => {
        if (!currentUser) return false;
        return !currentUser.nip || !currentUser.school_name || !currentUser.phone;
    }, [currentUser]);

    // --- Data Filtering Logic (Ported from Legacy) ---
    const dashboardData = useMemo(() => {
        if (!currentUser) return null;

        // Since data is already filtered correctly in AppContext and by RLS,
        // we use the state directly for accurate statistics.
        const classStudents = students;
        const classAttendances = attendance;
        const classScores = scores;
        const classJournals = [
            ...(journal || []),
            ...(journal_class || []),
            ...(journal_teacher || [])
        ];

        // Calculate Stats
        const today = new Date().toISOString().split('T')[0];
        console.log("Dashboard: Filtering for today:", today);
        console.log("Dashboard: Total attendance records received:", classAttendances.length);

        // Ensure we use the correct property names from our new schema (date, status)
        const todayAttendances = classAttendances.filter(a => {
            const aDate = a.date || a.attendance_date;
            return aDate === today;
        });

        const presentToday = todayAttendances.filter(a => {
            const st = String(a.status || a.attendance_status || "").toUpperCase();
            return st === 'H' || st === 'HADIR';
        }).length;

        const absentToday = todayAttendances.filter(a => {
            const st = String(a.status || a.attendance_status || "").toUpperCase();
            return st === 'A' || st === 'ALPA' || st === 'ALPHA';
        }).length;

        const sickToday = todayAttendances.filter(a => {
            const st = String(a.status || a.attendance_status || "").toUpperCase();
            return st === 'S' || st === 'SAKIT';
        }).length;

        const permitToday = todayAttendances.filter(a => {
            const st = String(a.status || a.attendance_status || "").toUpperCase();
            return st === 'I' || st === 'IZIN';
        }).length;

        // Create a mapping of class to its student count for easy lookup
        const studentCountByClass = {};
        classStudents.forEach(s => {
            const cls = s.class || "Tanpa Kelas";
            studentCountByClass[cls] = (studentCountByClass[cls] || 0) + 1;
        });

        // Attendance Trend (Last 7 Days)
        const days = {};
        classAttendances.forEach(a => {
            const date = a.date || a.attendance_date;
            const cls = a.class || a.student_class;
            if (!date || !cls) return;

            if (!days[date]) {
                days[date] = { attendedClasses: new Set(), present: 0 };
            }
            days[date].attendedClasses.add(cls);

            const st = String(a.status || a.attendance_status || "").toUpperCase();
            if (st === 'H' || st === 'HADIR') {
                days[date].present++;
            }
        });

        // Convert key-value days to array, sort, and slice last 7
        const sortedDays = Object.entries(days).sort((a, b) => new Date(a[0]) - new Date(b[0]));
        const attendanceStats = sortedDays.slice(-7).map(([date, data]) => {
            // Denominator is the sum of students in classes attended on that day
            let dailyTotal = 0;
            data.attendedClasses.forEach(cls => {
                dailyTotal += (studentCountByClass[cls] || 0);
            });

            return {
                date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' }),
                percentage: dailyTotal > 0 ? Math.min(100, Math.round((data.present / dailyTotal) * 100)) : 0
            };
        });

        // Calculation for Today's Stats
        const todayData = days[today];
        let todayRelevantTotal = 0;
        if (todayData) {
            todayData.attendedClasses.forEach(cls => {
                todayRelevantTotal += (studentCountByClass[cls] || 0);
            });
        }

        const accuracyPercentage = todayRelevantTotal > 0 ? Math.round((presentToday / todayRelevantTotal) * 100) : 0;

        // --- NEW: Calculate Grading Progress ---
        const teacherSubjects = splitSubjects(currentUser?.subject);
        const classes = Object.keys(studentCountByClass).sort();

        const gradingProgress = [];
        classes.forEach(cls => {
            const classStudentsList = classStudents.filter(s => (s.class || "Tanpa Kelas") === cls);
            const totalInClass = classStudentsList.length;

            teacherSubjects.forEach(subject => {
                // Filter scores for this class and subject
                const classSubjectScores = classScores.filter(sc =>
                    (sc.class === cls || sc.student_class === cls) &&
                    (sc.subject === subject)
                );

                const progress = {
                    className: cls,
                    subject: subject,
                    totalStudents: totalInClass,
                    stats: {}
                };

                // Helper to count non-zero scores for a field
                const countScores = (field) => {
                    return classSubjectScores.filter(sc => {
                        const val = parseFloat(sc[field] || 0);
                        return val > 0;
                    }).length;
                };

                // Formatif 1-4
                for (let i = 1; i <= 4; i++) {
                    progress.stats[`f${i}`] = countScores(`score_f${i}`);
                }
                // Sumatif 1-4
                for (let i = 1; i <= 4; i++) {
                    progress.stats[`s${i}`] = countScores(`score_s${i}`);
                }
                // PTS & PAS
                progress.stats.pts = countScores('score_pts');
                progress.stats.pas = countScores('score_pas');

                gradingProgress.push(progress);
            });
        });

        // --- NEW: Modul Ajar Count ---
        const modulAjarCount = state.modulAjar?.length || 0;

        const studentsByClass = studentCountByClass;

        return {
            classStudents,
            classAttendances,
            classJournals,
            presentToday,
            sickToday,
            permitToday,
            absentToday,
            attendanceStats,
            accuracyPercentage,
            studentsByClass,
            gradingProgress,
            modulAjarCount
        };

    }, [currentUser, students, attendance, scores, journal, state.modulAjar]);

    if (!currentUser || !dashboardData) {
        return <div className="p-8">Loading Dashboard...</div>;
    }

    const {
        classStudents,
        classAttendances,
        classJournals,
        presentToday,
        sickToday,
        permitToday,
        absentToday,
        attendanceStats,
        accuracyPercentage,
        studentsByClass,
        gradingProgress,
        modulAjarCount
    } = dashboardData;

    return (
        <div className="animate-fadeIn">
            {/* Profile Completion Alert */}
            {isProfileIncomplete && (
                <div className="bg-white rounded-2xl border border-amber-100 p-6 mb-10 flex items-center justify-between shadow-modern border-l-4 border-l-amber-400 animate-slideIn">
                    <div className="flex items-center gap-5">
                        <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-inner">
                            🔔
                        </div>
                        <div>
                            <h4 className="font-bold text-slate-800 text-sm tracking-tight">Profil Belum Lengkap</h4>
                            <p className="text-slate-400 text-[11px] font-medium uppercase tracking-wider mt-1">Lengkapi data NIP & Kontak untuk laporan profesional.</p>
                        </div>
                    </div>
                    <button
                        onClick={() => updateState({ showModal: true, modalType: 'profile', modalMode: 'edit', editingItem: currentUser })}
                        className="px-6 py-2.5 bg-amber-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-amber-600 transition-all shadow-sm active:scale-95 shrink-0"
                    >
                        Lengkapi Sekarang
                    </button>
                </div>
            )}

            {/* Welcome Card */}
            <div className="gradient-purple rounded-2xl p-10 text-white shadow-premium mb-10 animate-fadeIn stagger-1 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full -mr-20 -mt-20 group-hover:bg-white/20 transition-all duration-700"></div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-900/10 blur-[40px] rounded-full -ml-10 -mb-10"></div>

                <div className="flex items-center justify-between relative z-10">
                    <div className="max-w-2xl">
                        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-purple-200 mb-4 opacity-80">Portal Guru Merdeka</p>
                        <h1 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">Selamat Datang, {currentUser?.name}! 👋</h1>
                        <p className="text-purple-100/80 text-[13px] font-medium leading-relaxed mb-8">Mata Pelajaran: <span className="text-white font-bold">{currentUser?.subject || '-'}</span> • Anda mengampu berbagai kelas aktif hari ini.</p>
                        <div className="flex gap-4 flex-wrap">
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all cursor-default">
                                <span className="text-xl">👥</span>
                                <span className="text-xs font-bold uppercase tracking-widest">{classStudents.length} <span className="opacity-60 font-medium">Siswa</span></span>
                            </div>

                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all cursor-default">
                                <span className="text-xl">📂</span>
                                <span className="text-xs font-bold uppercase tracking-widest">{modulAjarCount} <span className="opacity-60 font-medium">Modul</span></span>
                            </div>
                            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-2.5 rounded-xl border border-white/10 hover:bg-white/15 transition-all cursor-default">
                                <span className="text-xl">📝</span>
                                <span className="text-xs font-bold uppercase tracking-widest">{classJournals.length} <span className="opacity-60 font-medium">Jurnal</span></span>
                            </div>
                        </div>
                    </div>
                    <div className="hidden lg:flex w-36 h-36 bg-white/10 backdrop-blur-3xl rounded-2xl items-center justify-center text-7xl shadow-inner border border-white/20 animate-float">
                        📚
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6 mb-10">
                {/* Total Siswa */}
                <div className="bg-white rounded-2xl p-6 shadow-modern border border-slate-100 group transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-blue-50/50 rounded-bl-2xl group-hover:bg-blue-100 transition-colors"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold text-slate-800 tracking-tight">{classStudents.length}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Siswa</p>
                    </div>
                    <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:scale-125 transition-transform group-hover:opacity-40">👥</div>
                </div>

                {/* Hadir Today */}
                <div className="bg-white rounded-2xl p-6 shadow-modern border border-slate-100 group transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50/50 rounded-bl-2xl group-hover:bg-emerald-100 transition-colors"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold text-emerald-600 tracking-tight">{presentToday}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Hadir</p>
                    </div>
                    <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:scale-125 transition-transform group-hover:opacity-40">✅</div>
                </div>

                {/* Sakit Today */}
                <div className="bg-white rounded-2xl p-6 shadow-modern border border-slate-100 group transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-50/50 rounded-bl-2xl group-hover:bg-indigo-100 transition-colors"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold text-indigo-600 tracking-tight">{sickToday}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Sakit</p>
                    </div>
                    <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:scale-125 transition-transform group-hover:opacity-40">🏥</div>
                </div>

                {/* Izin Today */}
                <div className="bg-white rounded-2xl p-6 shadow-modern border border-slate-100 group transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-amber-50/50 rounded-bl-2xl group-hover:bg-amber-100 transition-colors"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold text-amber-600 tracking-tight">{permitToday}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Izin</p>
                    </div>
                    <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:scale-125 transition-transform group-hover:opacity-40">📩</div>
                </div>

                {/* Alpha Today */}
                <div className="bg-white rounded-2xl p-6 shadow-modern border border-slate-100 group transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-rose-50/50 rounded-bl-2xl group-hover:bg-rose-100 transition-colors"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold text-rose-600 tracking-tight">{absentToday}</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Alpa</p>
                    </div>
                    <div className="absolute bottom-4 right-4 text-2xl opacity-20 group-hover:scale-125 transition-transform group-hover:opacity-40">❌</div>
                </div>

                {/* Percentage */}
                <div className="bg-slate-900 rounded-2xl p-6 shadow-modern group hover:bg-slate-800 transition-all relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 rounded-bl-2xl"></div>
                    <div className="relative z-10">
                        <h3 className="text-3xl font-bold text-white tracking-tight">{accuracyPercentage}%</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Efektivitas</p>
                    </div>
                    <div className="absolute bottom-4 right-4 text-2xl opacity-40 group-hover:scale-125 transition-transform">📈</div>
                </div>
            </div>

            {/* Charts & Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Attendance Trend Chart */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-2xl shadow-modern border border-slate-100 overflow-hidden group">
                        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-3">
                                    <span className="w-8 h-8 gradient-blue text-white rounded-lg flex items-center justify-center text-sm shadow-md group-hover:scale-110 transition-transform">📊</span>
                                    Statistik Kehadiran
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-11">Trend 7 Hari Terakhir</p>
                            </div>
                        </div>
                        <div className="p-8">
                            <div className="space-y-5">
                                {attendanceStats.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-10 text-slate-300">
                                        <div className="text-4xl mb-2">📉</div>
                                        <p className="text-xs font-bold uppercase tracking-widest">Belum ada data</p>
                                    </div>
                                ) : (
                                    attendanceStats.map((stat, idx) => (
                                        <div key={idx} className="flex items-center gap-5 group/row">
                                            <div className="w-36 text-[10px] font-bold uppercase tracking-widest text-slate-400 group-hover/row:text-slate-600 transition-colors">{stat.date}</div>
                                            <div className="flex-1">
                                                <div className="w-full bg-slate-50 rounded-full h-3 overflow-hidden border border-slate-100/50 p-0.5 shadow-inner">
                                                    <div className="h-full gradient-green rounded-full shadow-lg shadow-emerald-200/50 transition-all duration-1000" style={{ width: `${stat.percentage}%` }}></div>
                                                </div>
                                            </div>
                                            <div className="w-14 text-right font-bold text-slate-800 tracking-tight">{stat.percentage}%</div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* NEW: Progres Pengambilan Nilai (Responsive Table + Card View) */}
                    <div className="bg-white rounded-2xl shadow-modern border border-slate-100 overflow-hidden mt-8 animate-fadeIn stagger-2 group">
                        <div className="p-6 lg:p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                            <div>
                                <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-3">
                                    <span className="w-8 h-8 gradient-purple text-white rounded-lg flex items-center justify-center text-sm shadow-md group-hover:scale-110 transition-transform">📝</span>
                                    Progres Penilaian
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-11">Capaian Akademik</p>
                            </div>
                            <span className="bg-purple-50 text-purple-600 px-3 py-1 lg:px-4 lg:py-1.5 rounded-full text-[9px] lg:text-[10px] font-bold uppercase tracking-widest shadow-sm border border-purple-100">
                                {gradingProgress.length} Kelas
                            </span>
                        </div>

                        {/* Desktop View (Table) - Hidden on Mobile */}
                        <div className="hidden lg:block overflow-x-auto">
                            <table className="w-full text-left border-collapse min-w-[800px]">
                                <thead>
                                    <tr className="bg-slate-50/30 border-b border-slate-100">
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mata Pelajaran & Kelas</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">TP (Formatif)</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">STS/SAS (Sumatif)</th>
                                        <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Final</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {gradingProgress.map((progress, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50 transition-colors group/row">
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-100 flex flex-col items-center justify-center shadow-sm group-hover/row:scale-110 group-hover/row:border-purple-200 transition-all">
                                                        <span className="text-[10px] font-bold text-slate-300 uppercase leading-none mb-1">KLS</span>
                                                        <span className="text-sm font-bold text-slate-700 leading-none">{progress.className}</span>
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 tracking-tight mb-1">{progress.subject}</p>
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-purple-400 shadow-[0_0_8px_rgba(167,139,250,0.6)]"></div>
                                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{progress.totalStudents} Siswa Terdaftar</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center gap-2">
                                                    {[1, 2, 3, 4].map(num => (
                                                        <ProgressBadge key={num} label={`F${num}`} current={progress.stats[`f${num}`]} total={progress.totalStudents} color="blue" />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center gap-2">
                                                    {[1, 2, 3, 4].map(num => (
                                                        <ProgressBadge key={num} label={`S${num}`} current={progress.stats[`s${num}`]} total={progress.totalStudents} color="emerald" />
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex justify-center gap-2">
                                                    <ProgressBadge label="PTS" current={progress.stats.pts} total={progress.totalStudents} color="amber" />
                                                    <ProgressBadge label="PAS" current={progress.stats.pas} total={progress.totalStudents} color="purple" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile View (Card List) - Visible on Mobile */}
                        <div className="lg:hidden p-4 space-y-4">
                            {gradingProgress.map((progress, idx) => (
                                <div key={idx} className="bg-slate-50/50 rounded-2xl p-5 border border-slate-100">
                                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-slate-200/50">
                                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex flex-col items-center justify-center shadow-sm">
                                            <span className="text-[10px] font-bold text-slate-300 uppercase leading-none mb-1">KLS</span>
                                            <span className="text-sm font-bold text-slate-700 leading-none">{progress.className}</span>
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 tracking-tight mb-1">{progress.subject}</p>
                                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">{progress.totalStudents} Siswa</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Formatif (F1-F4)</p>
                                            <div className="flex gap-2 justify-start overflow-x-auto pb-1 no-scrollbar">
                                                {[1, 2, 3, 4].map(num => (
                                                    <ProgressBadge key={num} label={`F${num}`} current={progress.stats[`f${num}`]} total={progress.totalStudents} color="blue" />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Sumatif (S1-S4)</p>
                                            <div className="flex gap-2 justify-start overflow-x-auto pb-1 no-scrollbar">
                                                {[1, 2, 3, 4].map(num => (
                                                    <ProgressBadge key={num} label={`S${num}`} current={progress.stats[`s${num}`]} total={progress.totalStudents} color="emerald" />
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2">Ujian Akhir</p>
                                            <div className="flex gap-2 justify-start">
                                                <ProgressBadge label="PTS" current={progress.stats.pts} total={progress.totalStudents} color="amber" />
                                                <ProgressBadge label="PAS" current={progress.stats.pas} total={progress.totalStudents} color="purple" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="p-6 bg-slate-50/30 border-t border-slate-50 flex flex-wrap gap-4 lg:gap-6 text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em] justify-center text-center">
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-slate-200 shadow-inner"></div> Belum Ada Nilai</span>
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.5)]"></div> Sedang Proses</span>
                            <span className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> Selesai</span>
                        </div>
                    </div>
                </div>

                {/* Quick Access Actions */}
                <div className="bg-white rounded-2xl shadow-modern border border-slate-100 overflow-hidden group h-fit self-start sticky top-6">
                    <div className="p-8 border-b border-slate-50 bg-slate-50/30">
                        <h3 className="font-bold text-slate-800 tracking-tight flex items-center gap-3">
                            <span className="w-8 h-8 gradient-dark text-white rounded-lg flex items-center justify-center text-sm shadow-md group-hover:scale-110 transition-transform">⚡</span>
                            Navigasi Cepat
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1 ml-11">Akses Langsung</p>
                    </div>
                    <div className="p-8 space-y-4">
                        <QuickActionLink href="/guru/students" icon="👥" color="blue" label="Daftar Siswa" desc="Kelola data & identitas siswa" />
                        <QuickActionLink href="/guru/attendance" icon="✅" color="green" label="Absensi Siswa" desc="Catat kehadiran harian siswa" />
                        <QuickActionLink href="/guru/scores" icon="📊" color="orange" label="Input Nilai" desc="Rekap nilai formatif & sumatif" />
                        <QuickActionLink href="/guru/modul-ajar" icon="📂" color="purple" label="Modul Ajar" desc="Generator modul ajar berbasis AI" />
                        <QuickActionLink href="/guru/journal" icon="📝" color="pink" label="Jurnal Guru" desc="Catat aktivitas mengajar harian" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickActionLink({ href, icon, color, label, desc }) {
    const gradients = {
        blue: "gradient-blue",
        green: "gradient-green",
        orange: "gradient-orange",
        purple: "gradient-purple",
        pink: "gradient-pink",
    };

    return (
        <Link href={href} className="w-full flex items-center gap-4 p-4 rounded-xl border border-slate-50 bg-white hover:border-indigo-100 hover:bg-slate-50/50 hover:shadow-md transition-all group">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md group-hover:scale-110 transition-transform shrink-0", gradients[color])}>
                <span className="text-lg">{icon}</span>
            </div>
            <div>
                <p className="text-[11px] font-bold text-slate-800 uppercase tracking-tight">{label}</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">{desc}</p>
            </div>
        </Link>
    );
}

function ProgressBadge({ label, current, total, color }) {
    const isComplete = current >= total && total > 0;
    const isStarted = current > 0;

    let bgColor = "bg-slate-100 text-slate-400 border-slate-200";
    if (isComplete) {
        if (color === 'blue') bgColor = "bg-blue-500 text-white border-blue-600 shadow-sm shadow-blue-100";
        if (color === 'emerald') bgColor = "bg-emerald-500 text-white border-emerald-600 shadow-sm shadow-emerald-100";
        if (color === 'amber') bgColor = "bg-amber-500 text-white border-amber-600 shadow-sm shadow-amber-100";
        if (color === 'purple') bgColor = "bg-purple-500 text-white border-purple-600 shadow-sm shadow-purple-100";
    } else if (isStarted) {
        if (color === 'blue') bgColor = "bg-blue-50 border-blue-200 text-blue-600 animate-pulse-subtle";
        if (color === 'emerald') bgColor = "bg-emerald-50 border-emerald-200 text-emerald-600 animate-pulse-subtle";
        if (color === 'amber') bgColor = "bg-amber-50 border-amber-200 text-amber-600 animate-pulse-subtle";
        if (color === 'purple') bgColor = "bg-purple-50 border-purple-200 text-purple-600 animate-pulse-subtle";
    }

    return (
        <div className={`w-8 h-8 rounded-lg border flex flex-col items-center justify-center transition-all ${bgColor} relative group/badge shadow-sm`}>
            <span className="text-[9px] font-bold">{label}</span>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 hidden group-hover/badge:block z-20 animate-slideIn">
                <div className="bg-slate-900 text-white text-[10px] font-bold py-1.5 px-3 rounded-xl shadow-2xl border border-slate-700 whitespace-nowrap">
                    {label}: {current}/{total} Siswa
                </div>
                <div className="w-2.5 h-2.5 bg-slate-900 rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1 border-r border-b border-slate-700"></div>
            </div>
        </div>
    );
}
