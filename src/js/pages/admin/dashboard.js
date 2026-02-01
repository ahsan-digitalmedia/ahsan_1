import { appState } from '../../core/state.js';

export function renderAdminDashboard() {
    const { teachers, assignments } = appState;
    const activeTeachers = teachers.filter(t => t.status === 'active').length;
    const inactiveTeachers = teachers.filter(t => t.status === 'inactive').length;

    return `
    <div class="animate-fadeIn">
      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="morph-scale gradient-blue rounded-2xl p-6 text-white shadow-lg animate-fadeIn stagger-1" style="opacity: 0;">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
              </svg>
            </div>
            <span class="text-xs bg-white/20 px-2 py-1 rounded-lg">Total</span>
          </div>
          <h3 class="text-3xl font-bold">${teachers.length}</h3>
          <p class="text-white/80 text-sm">Total Guru</p>
        </div>
        
        <div class="morph-scale gradient-green rounded-2xl p-6 text-white shadow-lg animate-fadeIn stagger-2" style="opacity: 0;">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-xs bg-white/20 px-2 py-1 rounded-lg">Aktif</span>
          </div>
          <h3 class="text-3xl font-bold">${activeTeachers}</h3>
          <p class="text-white/80 text-sm">Guru Aktif</p>
        </div>
        
        <div class="morph-scale gradient-orange rounded-2xl p-6 text-white shadow-lg animate-fadeIn stagger-3" style="opacity: 0;">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            </div>
            <span class="text-xs bg-white/20 px-2 py-1 rounded-lg">Non-aktif</span>
          </div>
          <h3 class="text-3xl font-bold">${inactiveTeachers}</h3>
          <p class="text-white/80 text-sm">Guru Non-aktif</p>
        </div>
        
        <div class="morph-scale gradient-purple rounded-2xl p-6 text-white shadow-lg animate-fadeIn stagger-4" style="opacity: 0;">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <span class="text-xs bg-white/20 px-2 py-1 rounded-lg">Total</span>
          </div>
          <h3 class="text-3xl font-bold">${assignments.length}</h3>
          <p class="text-white/80 text-sm">Total Tugas</p>
        </div>
      </div>
      
      <!-- Bento Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Recent Teachers -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">Guru Terdaftar Terbaru</h3>
          </div>
          <div class="p-6">
            ${teachers.length === 0 ? `
              <div class="text-center py-8">
                <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                  </svg>
                </div>
                <p class="text-slate-500">Belum ada data guru</p>
                <button id="add-first-teacher-btn" class="mt-4 px-4 py-2 btn-primary text-white rounded-xl text-sm">
                  Tambah Guru Pertama
                </button>
              </div>
            ` : `
              <div class="space-y-4">
                ${teachers.slice(0, 5).map((teacher, i) => `
                  <div class="flex items-center gap-4 p-3 rounded-xl hover:bg-slate-50 transition-colors">
                    <div class="w-10 h-10 gradient-${['blue', 'purple', 'green', 'orange', 'pink'][i % 5]} rounded-xl flex items-center justify-center text-white font-semibold text-sm">
                      ${teacher.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium text-slate-800 truncate">${teacher.name}</p>
                      <p class="text-sm text-slate-500 truncate">${teacher.subject || '-'}</p>
                    </div>
                    <span class="px-2 py-1 text-xs rounded-lg ${teacher.status === 'active' ? 'status-active' : 'status-inactive'} text-white">
                      ${teacher.status === 'active' ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>
        
        <!-- Quick Actions -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">Aksi Cepat</h3>
          </div>
          <div class="p-6 space-y-3">
            <button id="quick-add-teacher-btn" 
              class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group">
              <div class="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700">Tambah Guru Baru</span>
            </button>
            
            <button id="quick-view-teachers-btn"
              class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group">
              <div class="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700">Lihat Semua Guru</span>
            </button>
            
            <button id="quick-view-reports-btn"
              class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all group">
              <div class="w-10 h-10 gradient-green rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700">Lihat Laporan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
