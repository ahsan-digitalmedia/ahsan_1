"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        // Listen for Auth hash / recovery token automatically parsed by Supabase
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY') {
                console.log('Password recovery mode active');
            }
        });

        return () => authListener?.subscription?.unsubscribe();
    }, []);

    const handlePasswordUpdate = async (e) => {
        e.preventDefault();
        setError(null);

        if (password.length < 6) {
            setError("Kata sandi minimal 6 karakter.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Konfirmasi kata sandi tidak cocok.");
            return;
        }

        setLoading(true);

        try {
            const { error: updateErr } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateErr) throw updateErr;

            setSuccess(true);
            setTimeout(() => {
                router.replace('/login');
            }, 3000);
        } catch (err) {
            setError(err.message || "Gagal memperbarui kata sandi. Pastikan Anda membuka tautan resmi dari email.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-modern overflow-hidden animate-fadeIn relative z-10 border border-slate-200/60">
                <div className="p-8 text-center bg-slate-900 text-white relative">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4 backdrop-blur-sm text-2xl">
                        🔑
                    </div>
                    <h1 className="text-xl font-bold mb-1 tracking-tight">Setel Kata Sandi Baru</h1>
                    <p className="text-slate-400 text-xs font-medium">Masukkan kata sandi baru untuk akun Anda</p>
                </div>

                <div className="p-8 space-y-5">
                    {success ? (
                        <div className="bg-emerald-50 text-emerald-700 p-5 rounded-xl text-center space-y-3 border border-emerald-200">
                            <span className="text-3xl">🎉</span>
                            <h3 className="font-bold text-sm">Kata Sandi Berhasil Diperbarui!</h3>
                            <p className="text-xs text-emerald-600 font-medium">
                                Mengalihkan Anda ke halaman login dalam 3 detik...
                            </p>
                            <Link href="/login" className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-emerald-700 transition-all">
                                Login Sekarang
                            </Link>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordUpdate} className="space-y-4">
                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-semibold border border-red-200 leading-relaxed flex items-center gap-2">
                                    <span className="text-base shrink-0">⚠️</span>
                                    <div>{error}</div>
                                </div>
                            )}

                            <div>
                                <label className="label-modern text-xs font-bold text-slate-700 mb-1.5 block">Kata Sandi Baru</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400 pr-12"
                                        placeholder="Minimal 6 karakter"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="label-modern text-xs font-bold text-slate-700 mb-1.5 block">Konfirmasi Kata Sandi Baru</label>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    minLength={6}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all placeholder:text-slate-400"
                                    placeholder="Ulangi kata sandi baru"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-slate-900 text-white py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed mt-2"
                            >
                                {loading ? (
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                                ) : 'Simpan Kata Sandi Baru'}
                            </button>
                        </form>
                    )}

                    {!success && (
                        <div className="pt-4 border-t border-slate-100 text-center text-xs font-semibold">
                            <Link href="/login" className="text-slate-400 hover:text-slate-600">
                                Batal & Kembali ke Login
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
