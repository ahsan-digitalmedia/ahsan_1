"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import ModalManager from "@/components/ModalManager";

export default function GuruLayout({ children }) {
    const { state, updateState, processData } = useApp();
    const { currentUser, sidebarOpen, showNotifications, notifications, isLoading } = state;
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [isCheckingStatus, setIsCheckingStatus] = useState(true);

    React.useEffect(() => {
        if (currentUser) {
            if (currentUser.status === 'pending') {
                router.push('/register/pending');
            } else {
                setIsCheckingStatus(false);
            }
        } else if (!isLoading) {
            setIsCheckingStatus(false);
        }
    }, [currentUser, isLoading, router]);

    const getPageTitle = () => {
        const defaultTitles = {
            "/guru/dashboard": "Dashboard Utama",
            "/guru/students": "Daftar Siswa",
            "/guru/attendance": "Absensi Siswa",
            "/guru/scores": "Rekap Nilai",
            "/guru/modul-ajar": "Modul Ajar Pembelajaran",
            "/guru/journal": "Jurnal Pembelajaran",
            "/guru/assignments": "Tugas & Evaluasi",
            "/guru/profile": "Profil Saya",
            "/guru/teacher-attendance": "Kehadiran Guru",
        };
        return defaultTitles[pathname] || "Portal Guru";
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        updateState({
            isLoggedIn: false,
            currentUser: null,
            currentUserType: null,
            currentPage: "login",
        });
        router.push("/");
    };

    const menuItems = [
        { title: "Dashboard", path: "/guru/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "purple" },
        { title: "Profil Saya", path: "/guru/profile", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z", color: "pink" },
        { title: "Data Siswa", path: "/guru/students", icon: "M12 4.354a4 4 0 110 5.292M15 21H3.914a3 3 0 01-2.973-2.665A9.969 9.969 0 0112 15c4.744 0 8.268 1.34 9.8 2.646", color: "blue" },
        { title: "Absensi", path: "/guru/attendance", icon: "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z", color: "green" },
        { title: "Nilai", path: "/guru/scores", icon: "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z", color: "orange" },
        { title: "Modul Ajar", path: "/guru/modul-ajar", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z", color: "purple" },
        { title: "Jurnal", path: "/guru/journal", icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "pink" },
    ];

    const title = getPageTitle();

    return (
        <div className="h-screen w-full flex bg-slate-50 relative overflow-hidden font-jakarta">
            <ModalManager />

            {/* Sidebar (Desktop) */}
            <aside className={cn(
                "hidden lg:flex flex-col bg-white border-r border-slate-100 z-30 relative transition-all duration-300 ease-in-out",
                isSidebarCollapsed ? "w-20" : "w-64"
            )}>
                <div className={cn("p-6 flex items-center gap-3", isSidebarCollapsed ? "justify-center px-4" : "")}>
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white text-lg shadow-sm shrink-0">
                        🎓
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="animate-fadeIn">
                            <h1 className="font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">Portal Guru</h1>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">Dashboard Akedemik</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
                    {menuItems.map((item, idx) => (
                        <Link
                            key={item.path}
                            href={item.path}
                            className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative overflow-hidden",
                                pathname === item.path
                                    ? "sidebar-item-active"
                                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                                isSidebarCollapsed ? "justify-center px-0" : ""
                            )}
                            title={isSidebarCollapsed ? item.title : ""}
                        >
                            <div className={cn(
                                "w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0",
                                pathname === item.path
                                    ? "bg-indigo-50 text-indigo-600"
                                    : "text-slate-400 group-hover:text-slate-600"
                            )}>
                                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                                </svg>
                            </div>
                            {!isSidebarCollapsed && (
                                <span className="text-[11px] font-semibold tracking-wide relative z-10 animate-fadeIn">{item.title}</span>
                            )}
                        </Link>
                    ))}
                </div>

                <div className={cn("p-4 border-t border-slate-100", isSidebarCollapsed ? "flex justify-center" : "")}>
                    <button
                        onClick={handleLogout}
                        className={cn(
                            "flex items-center gap-3 px-4 py-2.5 rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all group",
                            isSidebarCollapsed ? "w-auto justify-center px-0" : "w-full"
                        )}
                        title={isSidebarCollapsed ? "Keluar" : ""}
                    >
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-red-600 transition-all shrink-0">
                            <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                        </div>
                        {!isSidebarCollapsed && (
                            <span className="text-[11px] font-semibold tracking-wide animate-fadeIn">Logout</span>
                        )}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <div className={cn(
                "fixed inset-0 z-50 lg:hidden transition-all duration-300",
                isMobileMenuOpen ? "bg-slate-900/50 backdrop-blur-sm" : "pointer-events-none bg-transparent"
            )} onClick={() => setIsMobileMenuOpen(false)}>
                <div className={cn(
                    "absolute top-0 bottom-0 left-0 w-72 bg-white shadow-2xl transition-transform duration-300 flex flex-col",
                    isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"
                )} onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl gradient-purple flex items-center justify-center text-white font-bold text-xl">🎓</div>
                            <div>
                                <h1 className="font-bold text-lg tracking-tight text-slate-800">Menu</h1>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Navigasi Utama</p>
                            </div>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                        {menuItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all",
                                    pathname === item.path
                                        ? "bg-purple-50 text-purple-700"
                                        : "text-slate-500 hover:bg-slate-50"
                                )}
                            >
                                <span className={cn(
                                    "w-9 h-9 rounded-xl flex items-center justify-center text-lg",
                                    pathname === item.path ? "bg-white shadow-sm" : "bg-slate-100/50"
                                )}>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={item.icon}></path>
                                    </svg>
                                </span>
                                <span className="text-xs font-bold uppercase tracking-widest">{item.title}</span>
                            </Link>
                        ))}
                    </div>
                    <div className="p-4 border-t border-slate-100 bg-slate-50">
                        <button onClick={handleLogout} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest">
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all">
                {/* Header */}
                <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-20 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            className="lg:hidden w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-500 shadow-sm"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                            </svg>
                        </button>

                        {/* Desktop Sidebar Toggle */}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="hidden lg:flex w-9 h-9 rounded-lg bg-white border border-slate-200 items-center justify-center text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isSidebarCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7M19 19l-7-7 7-7"}></path>
                            </svg>
                        </button>

                        <div>
                            <h2 className="text-lg font-bold text-slate-900 leading-tight tracking-tight">{title}</h2>
                            <div className="flex items-center gap-3 text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                                <span className="text-indigo-600">{currentUser?.school_name || "Sekolah"}</span>
                                <span className="w-1 h-1 rounded-full bg-slate-300"></span>
                                <span>{currentUser?.name || "Guru"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link
                            href="/guru/profile"
                            className="flex items-center gap-3 bg-white border border-slate-100 p-1.5 pr-4 rounded-full shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="w-8 h-8 rounded-full gradient-purple flex items-center justify-center text-white font-bold text-xs shadow-inner">
                                {currentUser?.name?.charAt(0) || "G"}
                            </div>
                            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest group-hover:text-purple-600 transition-colors hidden md:block">Profil</span>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 pb-24 lg:pb-10 relative scroll-smooth bg-slate-50/50">
                    <div className="max-w-[1200px] mx-auto w-full">
                        {isCheckingStatus ? (
                            <div className="flex items-center justify-center py-20">
                                <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        ) : children}
                    </div>
                </main>
            </div>
        </div>
    );
}
