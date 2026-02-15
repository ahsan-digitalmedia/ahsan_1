"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData, attendanceOperations } from "@/lib/supabase";
import { normalizeSubject } from "@/lib/utils";

export default function ClassJournalModal() {
    const { state, updateState, processData } = useApp();
    const { editingItem, modalMode, currentUser } = state;

    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedClass, setSelectedClass] = useState("");
    const [rows, setRows] = useState([]);
    const [catatanWali, setCatatanWali] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [availableAttendance, setAvailableAttendance] = useState([]);

    // Profile Info
    const profileClasses = useMemo(() => currentUser?.class ? currentUser.class.split(',').map(c => c.trim()) : [], [currentUser?.class]);

    // 1. Fetch available attendance dates to ensure attendance is done first
    useEffect(() => {
        async function loadAttendanceDates() {
            try {
                const data = await attendanceOperations.fetchAll(currentUser?.__backendId);
                // Get unique combinations of date and class
                const unique = Array.from(new Set(data.map(a => `${a.date}|${a.class}`)))
                    .map(u => {
                        const [date, cls] = u.split('|');
                        return { date, class: cls };
                    });
                setAvailableAttendance(unique);
                if (unique.length > 0 && !selectedClass) {
                    setSelectedDate(unique[0].date);
                    setSelectedClass(unique[0].class);
                }
            } catch (e) {
                console.error("Load attendance dates error:", e);
            }
        }
        loadAttendanceDates();
    }, [currentUser]);

    // 2. Fetch schedule and populate rows when date/class changes
    useEffect(() => {
        if (!selectedDate || !selectedClass || modalMode === 'edit') return;

        const dateObj = new Date(selectedDate);
        const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
        const day = dayNames[dateObj.getDay()];

        const schedules = (state.appData || []).filter(d =>
            d.type === 'schedule' &&
            d.day === day &&
            (d.class === selectedClass || d.is_break)
        ).sort((a, b) => parseInt(a.no) - parseInt(b.no));

        if (schedules.length > 0) {
            setRows(schedules.map(s => ({
                jam: s.no,
                mapel: normalizeSubject(s.subject),
                materi: "",
                catatan: "",
                is_break: s.is_break
            })));
        } else {
            setRows([
                { jam: "1-2", mapel: "", materi: "", catatan: "" },
                { jam: "3-4", mapel: "", materi: "", catatan: "" },
                { jam: "Istirahat", mapel: "Istirahat", materi: "-", catatan: "-", is_break: true },
                { jam: "5-6", mapel: "", materi: "", catatan: "" },
            ]);
        }
    }, [selectedDate, selectedClass, state.appData, modalMode]);

    useEffect(() => {
        if (modalMode === "edit" && editingItem) {
            setSelectedDate(editingItem.date);
            setSelectedClass(editingItem.class);
            setRows(editingItem.rows || []);
            setCatatanWali(editingItem.catatan_wali || "");
        }
    }, [modalMode, editingItem]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedClass) return alert("Pilih kelas terlebih dahulu");

        setIsSubmitting(true);
        try {
            const payload = {
                type: 'journal_class',
                date: selectedDate,
                class: selectedClass,
                rows,
                catatan_wali: catatanWali
            };
            if (modalMode === 'edit' && editingItem) {
                await supabaseData.update(editingItem.__backendId, payload);
            } else {
                await supabaseData.create(payload);
            }
            await processData();
            updateState({ showModal: false, editingItem: null });
        } catch (error) {
            console.error("Save class journal error:", error);
            alert("Gagal menyimpan jurnal kelas");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-5xl relative z-10 animate-zoomIn flex flex-col max-h-[95vh] shadow-[0_30px_100px_rgba(0,0,0,0.2)] overflow-hidden border border-white/20">
                <div className="bg-slate-900 px-10 py-8 text-white shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_50%_120%,rgba(120,119,198,0.3),rgba(255,255,255,0))]"></div>
                    <div className="relative z-10 flex justify-between items-center">
                        <div>
                            <h3 className="text-3xl font-black tracking-tight leading-none mb-2">{modalMode === 'edit' ? 'Edit Jurnal Kelas' : 'Pencatatan Jurnal'}</h3>
                            <p className="text-slate-400 text-[11px] font-black uppercase tracking-[0.3em]">{modalMode === 'edit' ? 'PEMBARUAN DOKUMENTASI HARIAN' : 'LAPORAN KEGIATAN BELAJAR MENGAJAR'}</p>
                        </div>
                        <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10">
                            📓
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-10 py-10 space-y-10">
                    {/* Header Selection */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-10 bg-slate-50 rounded-[2.5rem] border border-slate-100 shadow-inner">
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Tunggal Kalender</label>
                            <select
                                value={selectedDate}
                                onChange={e => setSelectedDate(e.target.value)}
                                className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 outline-none transition-all appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                disabled={modalMode === 'edit'}
                            >
                                {Array.from(new Set(availableAttendance.map(a => a.date))).sort().reverse().map(d => (
                                    <option key={d} value={d}>{new Date(d).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}</option>
                                ))}
                                {availableAttendance.length === 0 && <option value="">BELUM ADA DATA ABSENSI</option>}
                            </select>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-3 block group-focus-within:text-purple-500 transition-colors">Otoritas Kelas</label>
                            <select
                                value={selectedClass}
                                onChange={e => setSelectedClass(e.target.value)}
                                className="w-full h-14 bg-white border-2 border-slate-100 rounded-[1.25rem] px-6 font-black text-slate-800 focus:border-purple-400 outline-none transition-all appearance-none cursor-pointer"
                                style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8' stroke-width='3'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' d='M19.5 8.25l-7.5 7.5-7.5-7.5'%3E%3C/path%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
                                disabled={modalMode === 'edit'}
                            >
                                <option value="">PILIH KELAS...</option>
                                {availableAttendance
                                    .filter(a => a.date === selectedDate)
                                    .map(a => <option key={a.class} value={a.class}>KELAS {a.class}</option>)
                                }
                            </select>
                        </div>
                    </div>

                    {/* Table Section */}
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                <span className="w-10 h-1 bg-slate-200 rounded-full"></span>
                                Rincian Aktivitas Pembelajaran
                            </h4>
                        </div>

                        <div className="border border-slate-100 rounded-[2.5rem] overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.02)]">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-900 border-b border-white/5">
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-24 text-center">JAM</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">MATA PELAJARAN</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">MATERI POKOK</th>
                                        <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">CATATAN KEJADIAN</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {rows.map((row, idx) => (
                                        <tr key={idx} className={`group transition-colors ${row.is_break ? "bg-amber-50/40" : "hover:bg-slate-50/50"}`}>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={row.jam}
                                                    onChange={e => {
                                                        const newRows = [...rows];
                                                        newRows[idx].jam = e.target.value;
                                                        setRows(newRows);
                                                    }}
                                                    className="w-full bg-transparent border-none text-center font-black text-slate-700 outline-none focus:ring-0 p-0 text-sm"
                                                    placeholder="-"
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={row.mapel}
                                                    onChange={e => {
                                                        const newRows = [...rows];
                                                        newRows[idx].mapel = e.target.value;
                                                        setRows(newRows);
                                                    }}
                                                    placeholder="Pelajaran..."
                                                    className={`w-full bg-transparent border-none font-black outline-none focus:ring-0 p-0 text-sm ${row.is_break ? 'text-amber-600/50' : 'text-slate-800'}`}
                                                    disabled={row.is_break}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={row.materi}
                                                    onChange={e => {
                                                        const newRows = [...rows];
                                                        newRows[idx].materi = e.target.value;
                                                        setRows(newRows);
                                                    }}
                                                    placeholder="Isi materi..."
                                                    className="w-full bg-white/50 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                                    disabled={row.is_break}
                                                />
                                            </td>
                                            <td className="px-6 py-4">
                                                <input
                                                    type="text"
                                                    value={row.catatan}
                                                    onChange={e => {
                                                        const newRows = [...rows];
                                                        newRows[idx].catatan = e.target.value;
                                                        setRows(newRows);
                                                    }}
                                                    placeholder="Catatan..."
                                                    className="w-full bg-white/50 border-2 border-slate-100 rounded-xl px-4 py-2 text-xs font-bold text-slate-600 focus:border-purple-400 focus:bg-white outline-none transition-all placeholder:text-slate-200"
                                                    disabled={row.is_break}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Wali Notes */}
                    <div className="group">
                        <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-4 block group-focus-within:text-purple-500 transition-colors flex items-center gap-3">
                            <span className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-xs">💬</span> CATATAN KHUSUS WALI KELAS
                        </label>
                        <textarea
                            value={catatanWali}
                            onChange={e => setCatatanWali(e.target.value)}
                            className="w-full h-32 bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 font-bold text-slate-600 focus:border-purple-400 focus:bg-white outline-none transition-all resize-none placeholder:text-slate-300 leading-relaxed"
                            placeholder="Tuliskan evaluasi atau kejadian penting di kelas hari ini..."
                        />
                    </div>

                    <div className="pt-6 flex flex-col sm:flex-row gap-4">
                        <button
                            type="button"
                            onClick={() => updateState({ showModal: false })}
                            className="flex-1 px-8 py-4 rounded-[1.25rem] border border-slate-200 font-black text-[11px] uppercase tracking-widest text-slate-400 hover:bg-white hover:text-slate-600 transition-all"
                        >
                            BATALKAN
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting || availableAttendance.length === 0}
                            className="flex-[2] px-8 py-4 rounded-[1.25rem] bg-slate-900 text-white font-black text-[11px] uppercase tracking-[0.2em] shadow-2xl hover:bg-black hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? "MEMPROSES..." : "ARSIPKAN JURNAL KELAS"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
