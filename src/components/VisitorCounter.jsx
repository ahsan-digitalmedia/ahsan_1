"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export default function VisitorCounter() {
    const [stats, setStats] = useState({
        totalVisitors: 0,
        todayVisitors: 0,
        onlineVisitors: 1,
        totalViews: 0
    });
    const [loading, setLoading] = useState(true);

    // Fetch real-time online presence (teachers active <90s + current active session)
    const fetchOnlineCount = useCallback(async () => {
        try {
            const { data: onlineTeachers, error } = await supabase
                .from('app_data')
                .select('*')
                .eq('type', 'teacher');

            if (!error && onlineTeachers) {
                const now = Date.now();
                const activeTeachers = onlineTeachers.filter(t => {
                    const lastSeen = t.content?.last_seen_at || t.last_seen_at;
                    if (!lastSeen) return false;
                    const diffSeconds = (now - new Date(lastSeen).getTime()) / 1000;
                    return diffSeconds <= 90;
                }).length;

                // Minimum 1 (current visitor viewing the page) + online active teachers
                const realOnlineCount = Math.max(1, activeTeachers);

                setStats(prev => ({
                    ...prev,
                    onlineVisitors: realOnlineCount
                }));
            }
        } catch (err) {
            console.warn("Error fetching online presence:", err);
        }
    }, []);

    useEffect(() => {
        let isMounted = true;

        const initVisitorStats = async () => {
            const todayKey = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
            const isNewSession = !sessionStorage.getItem('guru_app_visited');

            if (isNewSession) {
                sessionStorage.setItem('guru_app_visited', 'true');
            }

            try {
                const { data, error } = await supabase
                    .from('app_data')
                    .select('*')
                    .eq('type', 'visitor_stats')
                    .single();

                let currentData = {
                    total_visitors: 1250,
                    total_views: 3840,
                    daily_stats: { [todayKey]: 84 }
                };
                let backendId = null;

                if (!error && data) {
                    backendId = data.id;
                    if (data.content) {
                        currentData = {
                            total_visitors: data.content.total_visitors || 1250,
                            total_views: data.content.total_views || 3840,
                            daily_stats: data.content.daily_stats || { [todayKey]: 84 }
                        };
                    }
                }

                const newTotalViews = (currentData.total_views || 0) + 1;
                let newTotalVisitors = currentData.total_visitors || 0;
                const dailyStats = currentData.daily_stats || {};
                let newTodayCount = (dailyStats[todayKey] || 0);

                if (isNewSession) {
                    newTotalVisitors += 1;
                    newTodayCount += 1;
                }

                if (!dailyStats[todayKey]) {
                    newTodayCount = Math.max(1, newTodayCount || 1);
                }
                dailyStats[todayKey] = newTodayCount;

                const updatedContent = {
                    type: 'visitor_stats',
                    total_visitors: newTotalVisitors,
                    total_views: newTotalViews,
                    daily_stats: dailyStats,
                    last_updated: new Date().toISOString()
                };

                if (backendId) {
                    await supabase
                        .from('app_data')
                        .update({
                            content: updatedContent,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', backendId);
                } else {
                    await supabase
                        .from('app_data')
                        .insert([{
                            type: 'visitor_stats',
                            content: updatedContent
                        }]);
                }

                if (isMounted) {
                    setStats(prev => ({
                        ...prev,
                        totalVisitors: newTotalVisitors,
                        todayVisitors: newTodayCount,
                        totalViews: newTotalViews
                    }));
                }
            } catch (err) {
                console.warn("Visitor counter fallback:", err);
                if (isMounted && isNewSession) {
                    setStats(prev => ({
                        ...prev,
                        totalVisitors: prev.totalVisitors + 1,
                        todayVisitors: prev.todayVisitors + 1,
                        totalViews: prev.totalViews + 1
                    }));
                }
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        initVisitorStats();
        fetchOnlineCount();

        // Auto-refresh real-time online presence every 10 seconds
        const onlineInterval = setInterval(() => {
            if (isMounted) {
                fetchOnlineCount();
            }
        }, 10000);

        return () => {
            isMounted = false;
            clearInterval(onlineInterval);
        };
    }, [fetchOnlineCount]);

    const formatNum = (num) => (num || 0).toLocaleString('id-ID');

    return (
        <section className="py-6 bg-slate-900 border-t border-slate-800 text-white relative overflow-hidden">
            {/* Ambient Background Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-teal-500/10 blur-[80px] rounded-full pointer-events-none"></div>

            <div className="max-w-[1200px] mx-auto px-6 relative z-10">
                {/* Compact Header Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800/80">
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
                        <h3 className="text-sm font-extrabold uppercase tracking-widest text-slate-200">
                            Statistik Pengunjung
                        </h3>
                    </div>

                    <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/60 text-[11px] font-bold text-slate-300">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>{stats.onlineVisitors} Online</span>
                    </div>
                </div>

                {/* Compact 4 Grid Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Card 1: Hari Ini */}
                    <div className="bg-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-700/40 hover:border-teal-500/40 transition-all flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400 text-base shrink-0">
                            📅
                        </div>
                        <div className="min-w-0">
                            <div className="text-lg font-black text-white leading-none">
                                {loading ? <span className="opacity-40 animate-pulse">...</span> : formatNum(stats.todayVisitors)}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-1 truncate">
                                Hari Ini
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Total Pengunjung */}
                    <div className="bg-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-700/40 hover:border-blue-500/40 transition-all flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-base shrink-0">
                            👥
                        </div>
                        <div className="min-w-0">
                            <div className="text-lg font-black text-white leading-none">
                                {loading ? <span className="opacity-40 animate-pulse">...</span> : formatNum(stats.totalVisitors)}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-1 truncate">
                                Total Pengunjung
                            </div>
                        </div>
                    </div>

                    {/* Card 3: Total Tayangan */}
                    <div className="bg-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-700/40 hover:border-amber-500/40 transition-all flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 text-base shrink-0">
                            👁️
                        </div>
                        <div className="min-w-0">
                            <div className="text-lg font-black text-white leading-none">
                                {loading ? <span className="opacity-40 animate-pulse">...</span> : formatNum(stats.totalViews)}
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-1 truncate">
                                Total Tayangan
                            </div>
                        </div>
                    </div>

                    {/* Card 4: Aktif / Server Status */}
                    <div className="bg-slate-800/40 backdrop-blur-sm px-4 py-3 rounded-2xl border border-slate-700/40 hover:border-emerald-500/40 transition-all flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-base shrink-0">
                            ⚡
                        </div>
                        <div className="min-w-0">
                            <div className="text-lg font-black text-emerald-400 leading-none">
                                {stats.onlineVisitors} <span className="text-xs font-normal text-slate-400">Aktif</span>
                            </div>
                            <div className="text-[10px] font-semibold text-slate-400 mt-1 truncate">
                                Sedang Online
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
