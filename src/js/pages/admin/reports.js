import { appState } from '../../core/state.js';

export function renderReportsPage() {
    const { teachers } = appState;
    const activeTeachers = teachers.filter(t => t.status === 'active').length;
    const inactiveTeachers = teachers.filter(t => t.status === 'inactive').length;

    const subjectCounts = teachers.reduce((acc, t) => {
        if (t.subject) {
            acc[t.subject] = (acc[t.subject] || 0) + 1;
        }
        return acc;
    }, {});

    return `
    <div class="animate-fadeIn">
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Status Distribution -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">Distribusi Status Guru</h3>
          </div>
          <div class="p-6">
            <div class="flex items-center justify-center gap-8 mb-6">
              <div class="text-center">
                <div class="w-24 h-24 rounded-full gradient-green flex items-center justify-center mb-3 mx-auto shadow-lg hover:scale-105 transition-transform">
                  <span class="text-2xl font-bold text-white">${activeTeachers}</span>
                </div>
                <p class="text-sm text-slate-600 font-medium">Guru Aktif</p>
              </div>
              <div class="text-center">
                <div class="w-24 h-24 rounded-full gradient-orange flex items-center justify-center mb-3 mx-auto shadow-lg hover:scale-105 transition-transform">
                  <span class="text-2xl font-bold text-white">${inactiveTeachers}</span>
                </div>
                <p class="text-sm text-slate-600 font-medium">Non-aktif</p>
              </div>
            </div>
            <div class="w-full bg-slate-100 rounded-full h-4 overflow-hidden shadow-inner">
              <div class="h-full gradient-green" style="width: ${teachers.length > 0 ? (activeTeachers / teachers.length * 100) : 0}%"></div>
            </div>
            <p class="text-xs text-slate-500 text-center mt-3 font-medium">${teachers.length > 0 ? Math.round(activeTeachers / teachers.length * 100) : 0}% guru berstatus aktif</p>
          </div>
        </div>

        <!-- Subject Distribution -->
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">Distribusi Mata Pelajaran</h3>
          </div>
          <div class="p-6">
            ${Object.keys(subjectCounts).length === 0 ? `
              <div class="text-center py-8">
                <div class="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                   <svg class="w-8 h-8 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                  </svg>
                </div>
                <p class="text-slate-500">Belum ada data mata pelajaran</p>
              </div>
            ` : `
              <div class="space-y-4">
                ${Object.entries(subjectCounts).map(([subject, count], i) => `
                  <div class="group">
                    <div class="flex items-center justify-between mb-1.5">
                      <div class="flex items-center gap-2">
                        <div class="w-2.5 h-2.5 rounded-full gradient-${['blue', 'purple', 'green', 'orange', 'pink', 'cyan'][i % 6]}"></div>
                        <span class="text-sm font-medium text-slate-700">${subject}</span>
                      </div>
                      <span class="text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md group-hover:bg-slate-200 transition-colors">${count} Guru</span>
                    </div>
                    <div class="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div class="h-full gradient-${['blue', 'purple', 'green', 'orange', 'pink', 'cyan'][i % 6]}" style="width: ${(count / teachers.length * 100)}%"></div>
                    </div>
                  </div>
                `).join('')}
              </div>
            `}
          </div>
        </div>

        <!-- Summary Card -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800">Ringkasan Data Administratif</h3>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div class="p-6 bg-blue-50/50 rounded-2xl border border-blue-100/50 hover:shadow-md transition-shadow">
                <p class="text-3xl font-bold text-blue-600 mb-1">${teachers.length}</p>
                <p class="text-xs font-bold text-blue-600/60 uppercase tracking-wider">Total Guru</p>
              </div>
              <div class="p-6 bg-green-50/50 rounded-2xl border border-green-100/50 hover:shadow-md transition-shadow">
                <p class="text-3xl font-bold text-green-600 mb-1">${activeTeachers}</p>
                <p class="text-xs font-bold text-green-600/60 uppercase tracking-wider">Guru Aktif</p>
              </div>
              <div class="p-6 bg-orange-50/50 rounded-2xl border border-orange-100/50 hover:shadow-md transition-shadow">
                <p class="text-3xl font-bold text-orange-600 mb-1">${inactiveTeachers}</p>
                <p class="text-xs font-bold text-orange-600/60 uppercase tracking-wider">Non-aktif</p>
              </div>
              <div class="p-6 bg-purple-50/50 rounded-2xl border border-purple-100/50 hover:shadow-md transition-shadow">
                <p class="text-3xl font-bold text-purple-600 mb-1">${Object.keys(subjectCounts).length}</p>
                <p class="text-xs font-bold text-purple-600/60 uppercase tracking-wider">Mata Pelajaran</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
