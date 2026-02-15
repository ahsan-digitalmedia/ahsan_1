"use client";

import React, { useState } from "react";
import { useApp } from "@/context/AppContext";
import { supabaseData } from "@/lib/supabase";

export default function DeleteConfirmModal() {
    const { state, updateState, processData } = useApp();
    const { deletingItem } = state;
    const [isDeleting, setIsDeleting] = useState(false);

    if (!deletingItem) return null;

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await supabaseData.delete(deletingItem.__backendId);
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
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => updateState({ showDeleteConfirm: false, deletingItem: null })}></div>
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm relative z-10 overflow-hidden animate-zoomIn p-8 text-center">
                <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl animate-pulse">
                    ⚠️
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">Konfirmasi Hapus</h3>
                <p className="text-slate-600 mb-6 text-sm">
                    Apakah Anda yakin ingin menghapus
                    <span className="font-bold text-slate-800"> "{deletingItem.name || deletingItem.title || 'Item ini'}"</span>?
                    <br />Tindakan ini tidak dapat dibatalkan.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={() => updateState({ showDeleteConfirm: false, deletingItem: null })}
                        className="flex-1 py-3 rounded-xl border border-slate-200 font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                    >
                        {isDeleting ? "Menghapus..." : "Hapus"}
                    </button>
                </div>
            </div>
        </div>
    );
}
