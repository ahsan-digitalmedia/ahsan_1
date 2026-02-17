"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, supabaseData } from '@/lib/supabase';
import { cn } from '@/lib/utils';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        school_name: '',
        npsn: '',
        phone: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [config, setConfig] = useState(null);

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const conf = await supabaseData.fetchConfig();
                if (conf) setConfig(conf);
            } catch (e) {
                console.error("Failed to load config", e);
            }
        };
        loadConfig();
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (formData.password !== formData.confirmPassword) {
            setError("Password konfirmasi tidak cocok");
            setLoading(false);
            return;
        }

        try {
            // 0. Pre-check: Is this email already in app_data?
            // RLS is currently ON, but we can query by email as it's part of the policy logic
            const { data: existingProfile, error: profileError } = await supabase
                .from('app_data')
                .select('id')
                .eq('type', 'teacher')
                .filter('content->>email', 'eq', formData.email.toLowerCase())
                .maybeSingle();

            if (existingProfile && existingProfile.content?.auth_id) {
                setError("Email ini sudah terdaftar sebagai Guru dan memiliki akun. Silakan masuk atau hubungi Admin.");
                setLoading(false);
                return;
            }

            // 1. Sign Up
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
            });

            if (authError) throw authError;

            if (authData.user) {
                // 2. Create Teacher Profile
                const teacherProfile = {
                    type: 'teacher',
                    name: formData.name,
                    email: formData.email,
                    school_name: formData.school_name,
                    npsn: formData.npsn,
                    phone: formData.phone,
                    status: 'pending', // Requires admin activation
                    password: formData.password, // Stored as requested (Warning: Insecure)
                    auth_id: authData.user.id
                };

                // Manually insert to ensure auth_id is set correctly immediately
                const { error: dbError } = await supabase
                    .from('app_data')
                    .insert([{
                        type: 'teacher',
                        content: teacherProfile,
                        auth_id: authData.user.id
                    }]);

                if (dbError) throw dbError;

                // 3. Redirect to pending page
                router.push(`/register/pending?name=${encodeURIComponent(formData.name)}&email=${encodeURIComponent(formData.email)}`);
            }
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.message || 'Registrasi gagal. Silakan coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 left-0 w-full h-64 bg-slate-900 z-0"></div>

            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-modern overflow-hidden animate-fadeIn relative z-10 flex flex-col md:flex-row border border-slate-200/60">

                {/* Left Side (Info) */}
                <div className="md:w-5/12 gradient-blue p-8 text-white flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-full bg-white/10 backdrop-blur-[1px] opacity-20"></div>
                    <div className="relative z-10">
                        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-6">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Bergabung Sekarang</h2>
                        <p className="text-blue-100 text-sm leading-relaxed">
                            Nikmati kemudahan administrasi kelas dengan {config?.app_name || "Guru Merdeka"}.
                        </p>
                    </div>

                    <div className="relative z-10 mt-8">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                                <span>Absensi</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                                <span>Manajemen Nilai</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                                <span>Modul Ajar</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm">
                                <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs">✓</span>
                                <span>Jurnal</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side (Form) */}
                <div className="md:w-7/12 p-8 bg-white">
                    <div className="mb-6">
                        <h3 className="text-xl font-bold text-slate-800">Buat Akun Guru</h3>
                        <p className="text-slate-500 text-[11px] font-semibold uppercase tracking-wider">Isi data diri dan sekolah Anda.</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium flex items-center gap-2">
                                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                                {error}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="label-modern">Nama Lengkap</label>
                                <input type="text" name="name" value={formData.name} onChange={handleChange} required className="input-modern" placeholder="Cth: Budi Santoso, S.Pd" />
                            </div>

                            <div>
                                <label className="label-modern">Email Sekolah</label>
                                <input type="email" name="email" value={formData.email} onChange={handleChange} required className="input-modern" placeholder="email@sekolah.id" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-modern">Nama Sekolah</label>
                                    <input type="text" name="school_name" value={formData.school_name} onChange={handleChange} required className="input-modern" placeholder="SD Negeri 1" />
                                </div>
                                <div>
                                    <label className="label-modern">NPSN</label>
                                    <input type="text" name="npsn" value={formData.npsn} onChange={handleChange} required className="input-modern" placeholder="12345678" />
                                </div>
                            </div>

                            <div>
                                <label className="label-modern">Nomor WhatsApp</label>
                                <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="input-modern" placeholder="08xxxxxxxxxx" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="label-modern">Kata Sandi</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleChange} required className="input-modern" placeholder="••••••••" />
                                </div>
                                <div>
                                    <label className="label-modern">Ulangi Sandi</label>
                                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} required className="input-modern" placeholder="••••••••" />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-slate-900 text-white py-4 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-slate-800 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto"></div>
                            ) : 'Daftar Sekarang'}
                        </button>

                        <div className="text-center mt-4">
                            <p className="text-xs text-slate-500">
                                Sudah punya akun? <Link href="/" className="text-blue-600 font-bold hover:underline">Masuk disini</Link>
                            </p>
                            <div className="mt-4 pt-4 border-t border-slate-50">
                                {(() => {
                                    const adminPhone = (config?.admin_contact || "+6285268474347").replace(/[^0-9]/g, '');
                                    const formattedPhone = adminPhone.startsWith('0') ? '62' + adminPhone.slice(1) : adminPhone;
                                    const helpMessage = encodeURIComponent(`Halo Admin, saya ingin bertanya mengenai pendaftaran akun di Aplikasi ${config?.app_name || 'Portal Guru'}. Mohon bantuannya, terima kasih.`);
                                    return (
                                        <a
                                            href={`https://wa.me/${formattedPhone}?text=${helpMessage}`}
                                            target="_blank"
                                            className="text-[11px] text-indigo-600 font-bold hover:text-indigo-700 transition-colors uppercase tracking-widest flex items-center justify-center gap-2"
                                        >
                                            <span>💬</span> Butuh Bantuan Daftar?
                                        </a>
                                    );
                                })()}
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
