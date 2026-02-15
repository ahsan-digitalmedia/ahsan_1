"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, supabaseData } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { useApp } from '@/context/AppContext';
import Image from 'next/image';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const { state } = useApp();
    const config = state.config;
    const adminPhone = config?.admin_contact?.replace(/[^0-9]/g, '') || "6285268474347";
    const formattedPhone = adminPhone.startsWith('0') ? '62' + adminPhone.slice(1) : adminPhone;
    const helpMessage = encodeURIComponent(`Halo Admin, saya ingin bertanya mengenai pendaftaran akun di Aplikasi ${config?.app_name || 'Portal Guru'}. Mohon bantuannya, terima kasih.`);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.user) {
                // Simple role check
                if (email === 'admin@sekolah.id') {
                    router.push('/admin/dashboard');
                } else {
                    router.push('/guru/dashboard');
                }
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6 relative overflow-hidden">
            {/* Running Text */}
            {config?.running_text && (
                <div className="absolute top-0 left-0 w-full bg-indigo-50/80 text-indigo-700 text-[11px] font-semibold py-2 overflow-hidden z-50 border-b border-indigo-100/50 backdrop-blur-md shadow-sm">
                    <div className="relative h-full w-full">
                        <div className="absolute top-0 bottom-0 animate-marquee-simple whitespace-nowrap">
                            <span className="inline-flex items-center h-full px-4 text-nowrap">✨ {config.running_text}</span>
                        </div>
                    </div>
                </div>
            )}

            <div className="w-full max-w-sm bg-white rounded-2xl shadow-modern overflow-hidden animate-fadeIn relative z-10 border border-slate-200/60">
                <div className="p-10 text-center bg-slate-900 text-white relative">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(circle,white_0%,transparent_70%)]"></div>
                    </div>
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                        </svg>
                    </div>
                    <h1 className="text-xl font-bold mb-2 tracking-tight">{config?.app_name || "Aplikasi Guru"}</h1>
                    <p className="text-slate-400 text-[10px] font-semibold uppercase tracking-wider">{config?.app_version || "Merdeka Mengajar V2.0"}</p>
                </div>

                <div className="p-10">
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs font-medium flex items-center gap-2 border border-red-100">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="label-modern">Email Sekolah</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="input-modern"
                                placeholder="nama@sekolah.id"
                            />
                        </div>

                        <div>
                            <label className="label-modern">Kata Sandi</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="input-modern"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between text-[11px]">
                            <label className="flex items-center gap-2 text-slate-500 cursor-pointer">
                                <input type="checkbox" className="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 transition-all" />
                                Ingat saya
                            </label>
                            <a href={`https://wa.me/${formattedPhone}?text=${helpMessage}`} target="_blank" className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors">
                                Butuh Bantuan?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                            ) : 'Masuk Dashboard'}
                        </button>

                        <div className="text-center mt-6">
                            <p className="text-[11px] text-slate-500 font-medium">
                                Belum punya akun?{' '}
                                <a href="/register" className="text-indigo-600 font-bold hover:underline underline-offset-4 ml-1">
                                    DAFTAR GURU BARU
                                </a>
                            </p>
                        </div>
                    </form>

                    <div className="mt-10 pt-6 border-t border-slate-100 text-center text-slate-400">
                        <p className="text-[10px]">&copy; 2026 Digital Administrasi Guru</p>
                        <p className="text-[10px] mt-1 opacity-70">Aplikasi ini di Kembangkan Oleh Tri Susilo, A.Md</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
