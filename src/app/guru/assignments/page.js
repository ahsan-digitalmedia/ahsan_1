"use client";

import React, { useState, useMemo } from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function AssignmentsPage() {
    const { state } = useApp();
    const { assignments } = state;

    const [filterType, setFilterType] = useState("all");

    const filteredAssignments = useMemo(() => {
        if (filterType === "all") return assignments;
        return assignments.filter(a => a.status === filterType);
    }, [assignments, filterType]);

    const handleViewDetails = (id) => {
        alert('Detail tugas ID: ' + id + ' (Fitur ini dalam pengembangan)');
    };

    return (
        <div className="animate-fadeIn">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 tracking-tight">Tugas & Evaluasi</h1>
                    <p className="text-slate-500 text-sm font-medium">Kelola penugasan dan penilaian hasil belajar siswa.</p>
                </div>
                <div className="flex gap-2 p-1 bg-white rounded-2xl border border-slate-200 shadow-sm">
                    <FilterBtn active={filterType === "all"} onClick={() => setFilterType("all")} label="Semua" count={assignments.length} />
                    <FilterBtn active={filterType === "pending"} onClick={() => setFilterType("pending")} label="Belum Dinilai" count={assignments.filter(a => a.status === 'pending').length} />
                    <FilterBtn active={filterType === "graded"} onClick={() => setFilterType("graded")} label="Sudah Dinilai" count={assignments.filter(a => a.status === 'graded').length} />
                </div>
            </div>

            {filteredAssignments.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 shadow-sm mt-8">
                    <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto mb-4 text-4xl">
                        📝
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1">Belum Ada Tugas</h3>
                    <p className="text-slate-500 text-sm max-w-sm mx-auto">Tugas yang Anda berikan kepada siswa akan muncul di sini untuk dikelola.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredAssignments.map((assignment, i) => (
                        <div key={assignment.id} className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
                            <div className={cn("absolute top-0 right-0 w-24 h-24  opacity-5 -mr-8 -mt-8 rounded-full",
                                ['bg-blue-600', 'bg-purple-600', 'bg-emerald-600'][i % 3]
                            )}></div>

                            <div className="flex items-center gap-3 mb-4">
                                <span className={cn("px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight",
                                    assignment.status === 'graded' ? "bg-emerald-100 text-emerald-600" : "bg-amber-100 text-amber-600"
                                )}>
                                    {assignment.status === 'graded' ? 'Sudah Dinilai' : 'Pending'}
                                </span>
                                <span className="text-[10px] font-bold text-slate-400">{assignment.due_date}</span>
                            </div>

                            <h4 className="font-bold text-slate-800 mb-2 truncate group-hover:text-blue-600 transition-colors uppercase tracking-tight">{assignment.title}</h4>
                            <p className="text-xs text-slate-500 line-clamp-2 mb-6 font-medium leading-relaxed">{assignment.description}</p>

                            <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                                <div className="flex -space-x-2">
                                    {[1, 2, 3].map(n => (
                                        <div key={n} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-bold">S{n}</div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => handleViewDetails(assignment.id)}
                                    className="text-xs font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest flex items-center gap-1 group/btn"
                                >
                                    Detail
                                    <svg className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function FilterBtn({ active, onClick, label, count }) {
    return (
        <button
            onClick={onClick}
            className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
                active ? "bg-slate-900 text-white shadow-md shadow-slate-200" : "text-slate-500 hover:bg-slate-50"
            )}
        >
            {label}
            <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md", active ? "bg-white/20" : "bg-slate-100")}>{count}</span>
        </button>
    );
}
