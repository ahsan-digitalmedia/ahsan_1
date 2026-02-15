"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import Image from 'next/image';

export default function LandingPage() {
    const { state } = useApp();
    const config = state.config;
    const [scrolled, setScrolled] = useState(false);
    const [showQRIS, setShowQRIS] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            title: "Absensi Digital",
            desc: "Pencatatan kehadiran siswa yang cepat, akurat, dan otomatis terkapis.",
            icon: "📋",
            color: "bg-teal-50"
        },
        {
            title: "Manajemen Nilai",
            desc: "Olah nilai formatif dan sumatif secara sistematis sesuai kurikulum.",
            icon: "📊",
            color: "bg-blue-50"
        },
        {
            title: "AI Modul Ajar",
            desc: "Kolaborator AI untuk menyusun modul ajar yang kreatif dan terstruktur.",
            icon: "🤖",
            color: "bg-purple-50"
        },
        {
            title: "Jurnal Guru",
            desc: "Dokumentasi kegiatan pembelajaran harian yang rapi dan profesional.",
            icon: "📝",
            color: "bg-amber-50"
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-800 selection:bg-teal-100 selection:text-teal-900">
            {/* Header / Navbar */}
            <header
                className={cn(
                    "fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b",
                    scrolled
                        ? "bg-white/80 backdrop-blur-md border-slate-100 py-3 shadow-sm"
                        : "bg-transparent border-transparent py-5"
                )}
            >
                <nav className="max-w-[1200px] mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-teal-200">
                            📖
                        </div>
                        <span className="font-black text-xl tracking-tight text-slate-800">
                            {config?.app_name || "Guru Merdeka"}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowQRIS(true)}
                            className="hidden md:flex items-center gap-2 text-slate-500 hover:text-teal-600 font-bold text-xs uppercase tracking-widest transition-colors"
                        >
                            <span className="text-lg">💎</span> Donasi
                        </button>
                        <Link
                            href="/login"
                            className="bg-teal-600 text-white px-6 py-2.5 rounded-full text-sm font-bold shadow-md hover:bg-teal-700 hover:shadow-lg transition-all active:scale-95"
                        >
                            Masuk Aplikasi
                        </Link>
                    </div>
                </nav>
            </header>

            {/* Hero Section */}
            <section className="relative pt-32 lg:pt-48 pb-20 overflow-hidden">
                <div className="absolute top-0 right-0 w-1/2 h-full bg-teal-50/30 rounded-l-[100px] -z-10 translate-x-20 hidden lg:block"></div>

                <div className="max-w-[1200px] mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                    {/* Hero Text */}
                    <div className="space-y-8 text-center lg:text-left animate-fadeIn">
                        <div>
                            <span className="inline-block bg-teal-100 text-teal-700 text-[11px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full mb-6">
                                Solusi Digital Pendidikan
                            </span>
                            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-[1.1] tracking-tight">
                                Administrasi Guru <br />
                                <span className="text-teal-600 italic">dalam Genggaman.</span>
                            </h1>
                            <p className="text-slate-500 text-lg md:text-xl font-medium mt-6 leading-relaxed max-w-xl mx-auto lg:mx-0">
                                Sederhanakan pekerjaan administrasi sekolah Anda. Fokus kembali pada hal yang paling utama: <span className="text-slate-800 font-bold">Mengajar Siswa.</span>
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                href="/login"
                                className="bg-teal-600 text-white px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-teal-200 hover:bg-teal-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-3 group"
                            >
                                Mulai Sekarang
                                <span className="bg-white/20 p-1 rounded-lg group-hover:translate-x-1 transition-transform">🚀</span>
                            </Link>
                            <a
                                href="#features"
                                className="bg-white text-slate-600 border border-slate-200 px-10 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
                            >
                                Pelajari Fitur
                            </a>
                        </div>

                    </div>

                    {/* Hero Illustration */}
                    <div className="relative animate-fadeIn delay-200">
                        <div className="absolute inset-0 bg-teal-200/20 blur-[100px] rounded-full -z-10 scale-75"></div>
                        <div className="relative z-10 p-4 bg-white/50 backdrop-blur-sm rounded-[3rem] border border-white/50 shadow-2xl overflow-hidden group">
                            <Image
                                src="/teacher_illustration.png"
                                alt="Administrasi Guru Illustration"
                                width={600}
                                height={600}
                                className="w-full h-auto drop-shadow-2xl group-hover:scale-105 transition-transform duration-700"
                                priority
                            />
                            {/* Floating Badges */}
                            <div className="absolute top-10 right-10 bg-white p-4 rounded-2xl shadow-xl border border-teal-50 animate-bounce transition-all">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div className="absolute bottom-10 left-10 bg-white p-4 rounded-2xl shadow-xl border border-teal-50 animate-pulse transition-all">
                                <span className="text-2xl">✨</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-slate-50/50 relative overflow-hidden">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="text-center max-w-2xl mx-auto mb-20 animate-slideIn">
                        <h2 className="text-[11px] font-black text-teal-600 uppercase tracking-[0.4em] mb-4">Fitur Unggulan</h2>
                        <h3 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                            Segala kebutuhan administrasi Anda dalam <span className="text-teal-600">Satu Platform.</span>
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group"
                            >
                                <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mb-8 group-hover:scale-110 transition-transform shadow-inner border border-white/50", f.color)}>
                                    {f.icon}
                                </div>
                                <h4 className="text-xl font-bold text-slate-900 mb-4 tracking-tight">{f.title}</h4>
                                <p className="text-slate-500 text-sm font-medium leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-24 p-12 bg-slate-900 rounded-[3rem] text-center text-white relative overflow-hidden">
                        <div className="absolute inset-0 opacity-10 pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,white_0%,transparent_70%)]"></div>
                        </div>
                        <div className="relative z-10 space-y-8">
                            <h4 className="text-2xl md:text-3xl font-black tracking-tight">Siap Memulai Perubahan Digital?</h4>
                            <p className="text-slate-400 font-medium max-w-xl mx-auto">
                                Daftar sekarang dan rasakan kemudahan mengelola kelas dengan teknologi AI terdepan.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block bg-yellow-400 text-slate-900 px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-yellow-400/20 hover:bg-yellow-300 transition-all active:scale-95"
                            >
                                Masuk ke Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Donation Section */}
            <section className="py-24 bg-white">
                <div className="max-w-[1200px] mx-auto px-6">
                    <div className="bg-teal-50/50 rounded-[3rem] p-12 md:p-20 flex flex-col md:flex-row items-center gap-12 border border-teal-100/50">
                        <div className="flex-1 space-y-6 text-center md:text-left">
                            <h3 className="text-[11px] font-black text-teal-600 uppercase tracking-[0.4em]">Dukung Kami</h3>
                            <h4 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight">
                                Bantu Kami Menjaga Aplikasi Ini <span className="text-teal-600">Tetap Gratis.</span>
                            </h4>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Aplikasi ini dikembangkan secara mandiri untuk membantu rekan-rekan guru di Indonesia. Setiap donasi Anda sangat berarti untuk biaya server dan pengembangan fitur-fitur baru di masa depan.
                            </p>
                            <button
                                onClick={() => setShowQRIS(true)}
                                className="inline-flex items-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-black transition-all shadow-xl active:scale-95 group"
                            >
                                <span className="text-lg group-hover:scale-125 transition-transform">💎</span> Donasi via QRIS
                            </button>
                        </div>
                        <div className="flex-1 flex justify-center">
                            <div className="w-64 h-64 bg-white p-6 rounded-[2.5rem] shadow-premium border border-teal-100 flex items-center justify-center relative group cursor-pointer" onClick={() => setShowQRIS(true)}>
                                <div className="absolute inset-0 bg-teal-500/5 scale-110 blur-xl opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <Image
                                    src="/qris_placeholder.png"
                                    alt="Donasi QRIS"
                                    width={200}
                                    height={200}
                                    className="opacity-40 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all"
                                />
                                <div className="absolute inset-0 flex items-center justify-center group-hover:scale-0 transition-transform">
                                    <span className="bg-teal-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-lg">Klik Detail</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t border-slate-100">
                <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all cursor-default">
                        <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white text-sm">
                            📖
                        </div>
                        <span className="font-black text-lg tracking-tight">
                            {config?.app_name || "Guru Merdeka"}
                        </span>
                    </div>

                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest text-center">
                        &copy; 2026 {config?.app_name || "Guru Merdeka"} &bull; Developed by Tri Susilo, A.Md
                    </p>

                    <div className="flex gap-6 text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                        <a href="#" className="hover:text-teal-600 transition-colors">Syarat & Ketentuan</a>
                        <a href="#" className="hover:text-teal-600 transition-colors">Privasi</a>
                    </div>
                </div>
            </footer>

            {/* QRIS Modal */}
            {showQRIS && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-fadeIn">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowQRIS(false)}></div>
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 relative z-10 shadow-2xl animate-zoomIn text-center border border-slate-100">
                        <button
                            onClick={() => setShowQRIS(false)}
                            className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center hover:bg-slate-100 transition-all active:scale-95"
                        >
                            ✕
                        </button>
                        <div className="w-20 h-20 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center text-3xl mx-auto mb-8 shadow-inner border border-teal-100/50">
                            💎
                        </div>
                        <h5 className="text-2xl font-black text-slate-900 mb-2">Dukung Kami</h5>
                        <p className="text-slate-500 text-[13px] font-medium leading-relaxed mb-10">
                            Scan QRIS di bawah ini untuk membantu keberlanjutan aplikasi kita. Terima kasih atas kebaikan Anda!
                        </p>

                        <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 mb-8">
                            <Image
                                src="/qris_placeholder.png"
                                alt="QRIS Donasi"
                                width={300}
                                height={300}
                                className="w-full h-auto drop-shadow-sm rounded-2xl"
                            />
                        </div>

                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Terima Kasih, Guru Hebat!</p>
                    </div>
                </div>
            )}

            <style jsx>{`
                .animate-fadeIn {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                .animate-zoomIn {
                    animation: zoomIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
                }
                .animate-slideIn {
                    animation: slideIn 0.8s ease-out forwards;
                }
                .delay-200 {
                    animation-delay: 0.2s;
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes zoomIn {
                    from { opacity: 0; transform: scale(0.9); }
                    to { opacity: 1; transform: scale(1); }
                }
                @keyframes fadeInTranslate {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes slideIn {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
}
