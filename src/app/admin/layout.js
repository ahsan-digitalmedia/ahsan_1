"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

import AdminModalManager from "@/components/admin/AdminModalManager";

export default function AdminLayout({ children }) {
    const { state, updateState } = useApp();
    const { currentUser } = state;
    const pathname = usePathname();
    const router = useRouter();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    const getPageTitle = () => {
        const titles = {
            "/admin/dashboard": "Dashboard Utama",
            "/admin/teachers": "Manajemen Guru",
            "/admin/settings": "Konfigurasi Aplikasi",
            "/admin/reports": "Laporan Terpadu",
        };
        return titles[pathname] || "Panel Admin";
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        updateState({
            isLoggedIn: false,
            currentUser: null,
            currentUserType: null,
        });
        router.push("/");
    };

    const navItems = [
        { title: "Dashboard", path: "/admin/dashboard", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6", color: "blue" },
        { title: "Manajemen Guru", path: "/admin/teachers", icon: "M12 4.354a4 4 0 110 5.292M15 21H3.914a3 3 0 01-2.973-2.665A9.969 9.969 0 0112 15c4.744 0 8.268 1.34 9.8 2.646", color: "indigo" },
        { title: "Konfigurasi Aplikasi", path: "/admin/settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z", color: "slate" },
        { title: "Laporan Terpadu", path: "/admin/reports", icon: "M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z", color: "emerald" },
    ];

    const title = getPageTitle();

    return (
        <div className="h-screen w-full flex bg-slate-50 relative overflow-hidden text-slate-700 font-jakarta">
            <AdminModalManager />

            {/* Sidebar (Desktop) */}
            <aside className={cn(
                "hidden lg:flex flex-col bg-white border-r border-slate-200 z-30 relative transition-all duration-300 ease-in-out",
                isSidebarCollapsed ? "w-20" : "w-64"
            )}>
                <div className={cn("p-6 flex items-center gap-3", isSidebarCollapsed ? "justify-center px-4" : "")}>
                    <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-sm shrink-0">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        </svg>
                    </div>
                    {!isSidebarCollapsed && (
                        <div className="animate-fadeIn">
                            <h1 className="font-bold text-base tracking-tight text-slate-900 whitespace-nowrap">Admin Panel</h1>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider whitespace-nowrap">Control Center</p>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1 custom-scrollbar">
                    {navItems.map((item) => (
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
                                    ? "bg-indigo-50 text-indigo-600 shadow-sm"
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
                    {!isSidebarCollapsed && (
                        <div className="px-4 py-3 mb-2 border border-slate-100 bg-slate-50/50 rounded-lg animate-fadeIn text-center">
                            <p className="text-[10px] font-bold text-slate-900 leading-tight">System Admin</p>
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Active Session</p>
                        </div>
                    )}
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
                            <div className="w-10 h-10 rounded-xl gradient-blue flex items-center justify-center text-white shadow-md">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                </svg>
                            </div>
                            <div>
                                <h1 className="font-bold text-lg tracking-tight text-slate-800">Admin</h1>
                                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Menu Utama</p>
                            </div>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-400">✕</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 space-y-1">
                        {navItems.map((item) => (
                            <Link
                                key={item.path}
                                href={item.path}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                    "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all",
                                    pathname === item.path
                                        ? "bg-indigo-50 text-indigo-700"
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
                        <button onClick={handleLogout} className="w-full py-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all">
                            Log Out
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex flex-col h-full overflow-hidden relative transition-all">
                <header className="bg-white border-b border-slate-200 px-8 py-5 shrink-0 z-20 sticky top-0 flex items-center justify-between">
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
                            <p className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-1">Admin Central Control Panel</p>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 lg:p-10 pb-24 lg:pb-10 bg-slate-50/50">
                    <div className="max-w-[1200px] mx-auto w-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
