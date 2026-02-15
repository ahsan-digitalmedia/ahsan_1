"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabaseData } from "@/lib/supabase";
import { useApp } from "@/context/AppContext";

function PendingContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { state } = useApp();
    const [config, setConfig] = useState(null);

    // Get from URL first (for immediate availability after register)
    const urlName = searchParams.get('name');
    const urlEmail = searchParams.get('email');

    useEffect(() => {
        const loadConfig = async () => {
            const conf = await supabaseData.fetchConfig();
            if (conf) setConfig(conf);
        };
        loadConfig();
    }, []);

    // If suddenly activated (via refresh), let them into dashboard
    useEffect(() => {
        if (state.currentUser && state.currentUser.status === 'active') {
            router.push('/guru/dashboard');
        }
    }, [state.currentUser, router]);

    const rawPhone = (config?.admin_contact || "+6285268474347").replace(/[^0-9]/g, '');
    const adminPhone = rawPhone.startsWith('0') ? '62' + rawPhone.slice(1) : rawPhone;

    // Use URL params if currentUser is not yet loaded
    const displayName = urlName || state.currentUser?.name || '-';
    const displayEmail = urlEmail || state.currentUser?.email || '-';

    const message = encodeURIComponent(`Halo Admin, saya telah berhasil melakukan pendaftaran di Aplikasi ${config?.app_name || 'Portal Guru'}. Mohon bantuannya untuk melakukan aktivasi akun saya agar dapat segera digunakan. Terima kasih.\n\nDetail Akun:\nNama: ${displayName}\nEmail: ${displayEmail}`);
    const whatsappUrl = `https://wa.me/${adminPhone}?text=${message}`;

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-600 rounded-full blur-[120px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[120px]"></div>
            </div>

            <div className="w-full max-w-lg bg-white rounded-[2.5rem] shadow-premium border border-slate-200/50 p-12 text-center relative z-10 animate-zoomIn">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2rem] flex items-center justify-center text-4xl mx-auto mb-8 shadow-inner border border-indigo-100/50">
                    ⏳
                </div>

                <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-4">Menunggu Aktivasi</h1>
                <p className="text-slate-500 font-medium leading-relaxed mb-10 text-[15px]">
                    Akun Bapak/Ibu guru telah berhasil dibuat. Demi keamanan, Admin perlu melakukan verifikasi data sebelum Bapak/Ibu dapat mengakses dashboard penuh.
                </p>

                <div className="space-y-4">
                    <a
                        href={whatsappUrl}
                        target="_blank"
                        className="w-full bg-slate-900 text-white py-4 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-black transition-all shadow-xl active:scale-95 group"
                    >
                        <span className="text-lg group-hover:scale-110 transition-transform">💬</span> Hubungi Admin via WhatsApp
                    </a>

                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-white text-slate-400 py-4 rounded-2xl text-[10px] font-bold uppercase tracking-[0.2em] border border-slate-100 hover:bg-slate-50 transition-all"
                    >
                        Sudah diaktivasi? Klik Cek Status
                    </button>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-50">
                    <p className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.2em]">Estimasi Aktivasi: 5 - 10 Menit</p>
                </div>
            </div>
        </div>
    );
}

export default function PendingActivationPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50">Memuat...</div>}>
            <PendingContent />
        </Suspense>
    );
}
