"use client";

import React from "react";
import { useApp } from "@/context/AppContext";
import { cn } from "@/lib/utils";

export default function ToastNotification() {
    const { state, updateState } = useApp();
    const { toast } = state;

    if (!toast || !toast.show) return null;

    const typeStyles = {
        success: {
            bg: "bg-emerald-900/90 border-emerald-500/30 text-white",
            badgeBg: "bg-emerald-500/20 text-emerald-300 border-emerald-400/30",
            glow: "shadow-[0_20px_50px_rgba(16,185,129,0.3)]",
            defaultIcon: "✅",
        },
        error: {
            bg: "bg-rose-900/90 border-rose-500/30 text-white",
            badgeBg: "bg-rose-500/20 text-rose-300 border-rose-400/30",
            glow: "shadow-[0_20px_50px_rgba(244,63,94,0.3)]",
            defaultIcon: "⚠️",
        },
        info: {
            bg: "bg-indigo-900/90 border-indigo-500/30 text-white",
            badgeBg: "bg-indigo-500/20 text-indigo-300 border-indigo-400/30",
            glow: "shadow-[0_20px_50px_rgba(99,102,241,0.3)]",
            defaultIcon: "ℹ️",
        },
        logout: {
            bg: "bg-slate-900/95 border-purple-500/30 text-white",
            badgeBg: "bg-purple-500/20 text-purple-300 border-purple-400/30",
            glow: "shadow-[0_25px_60px_rgba(168,85,247,0.35)]",
            defaultIcon: "👋",
        }
    };

    const currentStyle = typeStyles[toast.type] || typeStyles.success;
    const icon = toast.icon || currentStyle.defaultIcon;

    return (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 z-[200] pointer-events-auto max-w-md w-[90%] sm:w-auto">
            <style jsx global>{`
                @keyframes bounceInDown {
                    0% {
                        opacity: 0;
                        transform: translate3d(0, -100px, 0) scale(0.6);
                    }
                    60% {
                        opacity: 1;
                        transform: translate3d(0, 15px, 0) scale(1.05);
                    }
                    80% {
                        transform: translate3d(0, -5px, 0) scale(0.98);
                    }
                    100% {
                        transform: translate3d(0, 0, 0) scale(1);
                    }
                }
                .animate-bounce-in {
                    animation: bounceInDown 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>

            <div className={cn(
                "animate-bounce-in flex items-center gap-4 px-6 py-4 rounded-2xl backdrop-blur-xl border transition-all duration-300",
                currentStyle.bg,
                currentStyle.glow
            )}>
                <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 border shadow-inner animate-bounce",
                    currentStyle.badgeBg
                )}>
                    {icon}
                </div>

                <div className="flex-1 min-w-[200px]">
                    <h4 className="font-extrabold text-sm tracking-tight capitalize">
                        {toast.title || (toast.type === 'error' ? 'Gagal' : 'Berhasil!')}
                    </h4>
                    <p className="text-xs text-slate-200/90 font-medium mt-0.5 leading-snug">
                        {toast.message}
                    </p>
                </div>

                <button
                    onClick={() => updateState({ toast: { ...toast, show: false } })}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white flex items-center justify-center text-xs transition-colors shrink-0"
                >
                    ✕
                </button>
            </div>
        </div>
    );
}
