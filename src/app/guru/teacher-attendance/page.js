"use client";

import React from "react";
import { useApp } from "@/context/AppContext";

export default function TeacherAttendancePage() {
    const { state } = useApp();
    const { currentUser } = state;
    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className="animate-fadeIn flex flex-col items-center justify-center min-h-[60vh]">
            <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 text-center border border-slate-100">
                <h1 className="text-3xl font-black text-slate-800 mb-2">Presensi Guru</h1>
                <p className="text-slate-500 font-medium mb-8">{today}</p>

                <div className="w-32 h-32 rounded-full gradient-blue mx-auto mb-6 flex items-center justify-center shadow-lg shadow-blue-200 animate-pulse cursor-pointer hover:scale-105 transition-transform">
                    <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2">Halo, {currentUser?.name || "Guru"}!</h3>
                <p className="text-slate-500 text-sm mb-8 px-8">Silakan klik tombol di atas untuk melakukan presensi masuk hari ini.</p>

                <button className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 transition-colors">
                    Catat Kehadiran
                </button>
            </div>
        </div>
    );
}
