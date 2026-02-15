"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData, studentOperations } from "@/lib/supabase";

export default function DeleteConfirmModal() {
    const { state, updateState, processData } = useApp();
    const { deletingItem } = state;
    const [isDeleting, setIsDeleting] = useState(false);

    if (!deletingItem) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            if (deletingItem.type === 'student') {
                await studentOperations.delete(deletingItem.__backendId);
            } else {
                await supabaseData.delete(deletingItem.__backendId);
            }
            // Refresh data
            await processData();
            // Close modal
            updateState({ showDeleteConfirm: false, deletingItem: null });
        } catch (error) {
            console.error("Delete failed:", error);
            alert("Gagal menghapus item.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity" onClick={() => updateState({ showDeleteConfirm: false, deletingItem: null })}></div>
            <div className="bg-white rounded-[3rem] shadow-[0_30px_100px_rgba(0,0,0,0.2)] w-full max-w-sm relative z-10 overflow-hidden animate-zoomIn p-10 text-center border border-white/20">
                <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-4xl shadow-inner relative overflow-hidden group border border-rose-100">
                    <div className="absolute inset-0 bg-rose-500/5 animate-pulse"></div>
                    <span className="relative z-10">⚠️</span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-3 tracking-tight">Konfirmasi Hapus</h3>
                <p className="text-slate-400 mb-10 text-[13px] font-bold leading-relaxed px-2">
                    Apakah Anda yakin ingin menghapus
                    <span className="text-rose-600"> "{deletingItem.name || deletingItem.title || 'Item ini'}"</span>?
                    Tindakan ini permanen.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="w-full py-5 rounded-2xl bg-rose-600 text-white text-[11px] font-black uppercase tracking-[0.25em] shadow-2xl hover:bg-rose-700 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                    >
                        {isDeleting ? "SEDANG MENGHAPUS..." : "KONFIRMASI HAPUS"}
                    </button>
                    <button
                        onClick={() => updateState({ showDeleteConfirm: false, deletingItem: null })}
                        className="w-full py-4 rounded-2xl border border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-300 hover:text-slate-500 transition-all font-black"
                    >
                        BATALKAN
                    </button>
                </div>
            </div>
        </div>
    );
}
