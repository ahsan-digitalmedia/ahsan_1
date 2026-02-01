import { appState } from '../../core/state.js';
import { formatDate, getScoreBadgeClass } from '../../core/utils.js';

export function renderGuruAssignmentsPage() {
    const { assignments, currentUser, filterAssignments = 'all' } = appState;

    let guruAssignments = assignments.filter(a => a.class === currentUser?.class);

    if (filterAssignments === 'pending') {
        guruAssignments = guruAssignments.filter(a => a.score === undefined || a.score === null);
    } else if (filterAssignments === 'graded') {
        guruAssignments = guruAssignments.filter(a => a.score !== undefined && a.score !== null);
    }

    return `
    <div class="animate-fadeIn">
      <!-- Filters -->
      <div class="mb-6 flex flex-wrap gap-3">
        <button id="filter-all" class="px-4 py-2 rounded-xl ${filterAssignments === 'all' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-slate-200 text-slate-600'} border font-medium text-sm hover:bg-blue-100 transition-colors">
          Semua (${assignments.filter(a => a.class === currentUser?.class).length})
        </button>
        <button id="filter-pending" class="px-4 py-2 rounded-xl ${filterAssignments === 'pending' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-slate-200 text-slate-600'} border font-medium text-sm hover:bg-slate-50 transition-colors">
          Belum Dinilai (${assignments.filter(a => a.class === currentUser?.class && (a.score === undefined || a.score === null)).length})
        </button>
        <button id="filter-graded" class="px-4 py-2 rounded-xl ${filterAssignments === 'graded' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'border-slate-200 text-slate-600'} border font-medium text-sm hover:bg-slate-50 transition-colors">
          Sudah Dinilai (${assignments.filter(a => a.class === currentUser?.class && a.score !== undefined && a.score !== null).length})
        </button>
      </div>

      <!-- Assignments Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        ${guruAssignments.length === 0 ? `
          <div class="lg:col-span-2 text-center py-12">
            <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
              </svg>
            </div>
            <p class="text-slate-500">Belum ada tugas untuk kelas Anda</p>
          </div>
        ` : guruAssignments.map((assignment, i) => `
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all morph-scale animate-fadeIn" style="opacity: 0; animation-delay: ${i * 0.1}s;">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex-1">
                  <h3 class="font-semibold text-slate-800 mb-2">${assignment.assignment_title}</h3>
                  <p class="text-sm text-slate-500 line-clamp-2">${assignment.assignment_description || 'Tidak ada deskripsi'}</p>
                </div>
                <div class="shrink-0 ml-4">
                  ${assignment.score !== undefined && assignment.score !== null ? `
                    <span class="score-badge ${getScoreBadgeClass(assignment.score)}">${assignment.score}</span>
                  ` : `
                    <span class="inline-flex px-3 py-1 bg-yellow-50 text-yellow-700 text-xs rounded-lg font-medium">Pending</span>
                  `}
                </div>
              </div>

              <div class="space-y-2 mb-4">
                <div class="flex items-center gap-2 text-sm text-slate-600">
                  <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                  </svg>
                  <span>Tenggat: ${formatDate(assignment.due_date)}</span>
                </div>
                ${assignment.feedback ? `
                  <div class="flex items-start gap-2 text-sm">
                    <svg class="w-4 h-4 text-blue-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <span class="text-blue-700"><strong>Umpan balik:</strong> ${assignment.feedback}</span>
                  </div>
                ` : ''}
              </div>

              <button class="view-assignment-btn w-full px-4 py-2 rounded-lg border border-slate-200 text-slate-600 font-medium text-sm hover:bg-slate-50 transition-colors" data-id="${assignment.__backendId || assignment.id}">
                Lihat Detail
              </button>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
