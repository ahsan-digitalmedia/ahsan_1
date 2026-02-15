"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import TeacherModal from "./modals/TeacherModal";
import DeleteConfirmModal from "../modals/DeleteConfirmModal";

export default function AdminModalManager() {
    const { state } = useApp();
    const { showModal, modalType, showDeleteConfirm } = state;

    return (
        <>
            {showModal && (
                <>
                    {modalType === "teacher" && <TeacherModal />}
                    {modalType === "reports" && <ReportsModalStub />}
                </>
            )}

            {showDeleteConfirm && <DeleteConfirmModal />}
        </>
    );
}

function ReportsModalStub() {
    const { updateState } = useApp();
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => updateState({ showModal: false })}></div>
            <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.2)] w-full max-w-sm relative z-10 overflow-hidden animate-zoomIn p-10 text-center border border-slate-100">
                <div className="w-20 h-20 gradient-blue text-white rounded-[2rem] flex items-center justify-center mx-auto mb-6 text-3xl shadow-lg relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                    <span className="relative z-10">📊</span>
                </div>
                <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Laporan Terpadu</h3>
                <p className="text-slate-400 mb-8 text-[13px] font-bold leading-relaxed px-4">Fitur cetak laporan terpadu sedang dalam tahap pengembangan intensif.</p>
                <button
                    onClick={() => updateState({ showModal: false })}
                    className="w-full btn-primary py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-[0_12px_24px_-8px_rgba(99,102,241,0.4)]"
                >
                    Tutup
                </button>
            </div>
        </div>
    );
}
