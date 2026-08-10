"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useApp } from '@/context/AppContext';
import Link from 'next/link';

export default function ForgotPasswordPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(null);
    const [error, setError] = useState(null);
    const { state } = useApp();
    const config = state?.config;

    const adminPhone = config?.admin_contact?.replace(/[^0-9]/g, '') || "6285268474347";
    const formattedPhone = adminPhone.startsWith('0') ? '62' + adminPhone.slice(1) : adminPhone;
    const helpMessage = encodeURIComponent(`Halo Admin, email saya (${email || 'guru'}) tidak bisa menerima tautan reset password. Mohon bantuan reset kata sandi akun saya. Terima kasih.`);

    const handleResetRequest = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            const redirectUrl = typeof window !== 'undefined'
                ? `${window.location.origin}/reset-password`
                : 'http://localhost:3000/reset-password';

            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: redirectUrl,
            });

            if (resetErr) throw resetErr;

            setMessage(
                "Tautan reset kata sandi telah dikirimkan ke email Anda! Silakan periksa kotak masuk (atau folder Spam) email Anda."
            );
        } catch (err) {
            setError(err.message || "Gagal mengirimkan tautan reset kata sandi.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-modern overflow-hidden animate-fadeIn relative z-10 border border-slate-200/60">
                <div className="p-8 text-center bg-slate-900 text-white relative">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm text-2xl">
                        🔐
                    </div>
                    <h1 className="text-xl font-bold mb-1 tracking-tight">Lupa Kata Sandi</h1>
                    <p className="text-slate-400 text-xs font-medium">Masukkan email terdaftar untuk menyetel ulang kata sandi</p>
                </div>

                <div className="p-8 space-y-5">
                    {message && (
                        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-xs font-semibold border border-emerald-200 leading-relaxed flex items-start gap-3">
                            <span className="text-lg leading-none">✅</span>
                            <div>
                                {message}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-semibold border border-red-200 leading-relaxed flex items-start gap-3">
                            <span className="text-lg leading-none">⚠️</span>
                            <div>
                                {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleResetRequest} className="space-y-4">
                        <div>
                            <label className="label-modern text-xs font-bold text-slate-700 mb-1.5 block">Email Sekolah / Terdaftar</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                placeholder="nama@sekolah.id"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                            ) : message ? 'Email Terkirim' : 'Kirim Tautan Reset'}
                        </button>
                    </form>

                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-2.5 text-center text-xs font-semibold">
                        <Link href="/login" className="text-indigo-600 hover:underline">
                            &laquo; Kembali ke Halaman Login
                        </Link>
                        <a
                            href={`https://wa.me/${formattedPhone}?text=${helpMessage}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-slate-400 hover:text-slate-600 text-[11px]"
                        >
                            Tidak menerima email? Hubungi Admin (WhatsApp)
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
