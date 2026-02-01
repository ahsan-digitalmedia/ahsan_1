import { appState } from '../../core/state.js';
import { SUBJECT_LIST } from '../../core/state.js';

export function renderModulAjarPage() {
  const { modulAjars, currentUser, filterSubject } = appState;
  const subjects = SUBJECT_LIST;

  // Filter: Show only modules created by the current user (if logged in as guru)
  let filteredModuls = modulAjars.filter(m => {
    const isModulType = m.type === 'modul_ajar' || !m.type;
    const belongsToUser = currentUser ? (m.modul_teacher_nip === currentUser.nip) : true;
    return isModulType && belongsToUser;
  });

  if (filterSubject) {
    filteredModuls = filteredModuls.filter(m => m.modul_subject === filterSubject);
  }

  return `
    <div class="animate-fadeIn space-y-6">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-sm">
            <span class="text-xs font-semibold text-slate-500 uppercase tracking-wider">Filter Mapel</span>
            <select id="modul-filter-subject" class="bg-transparent text-sm font-medium text-slate-700 outline-none border-none p-0 cursor-pointer focus:ring-0">
              <option value="">Semua Mata Pelajaran</option>
              ${subjects.map(sub => `<option value="${sub}" ${filterSubject === sub ? 'selected' : ''}>${sub}</option>`).join('')}
            </select>
          </div>
           <div class="px-3 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-medium border border-blue-100">
            Total: <strong>${filteredModuls.length}</strong> Modul
          </div>
        </div>
        <div class="flex gap-2">
          <input type="file" id="import-modul-csv-input" accept=".csv" class="hidden">
          <button id="download-modul-template-btn" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Template
          </button>
          <button id="import-modul-csv-btn" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            Import CSV
          </button>
          <button id="add-modul-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg hover:shadow-blue-200 transition-all active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
            <span>Buat Modul Ajar</span>
          </button>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden ring-1 ring-slate-100">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50/80 backdrop-blur-sm border-b border-slate-200">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Mata Pelajaran & Topik</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Kelas & Fase</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Alokasi Waktu</th>
                <th class="px-6 py-4 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                 <th class="px-6 py-4 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 bg-white">
              ${filteredModuls.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-6 py-16 text-center text-slate-500">
                    Belum ada data modul ajar
                  </td>
                </tr>
              ` : filteredModuls.slice().reverse().map((modul, idx) => `
                <tr class="table-row group hover:bg-slate-50/80 transition-colors duration-200">
                  <td class="px-6 py-4">
                    <div class="flex items-start gap-3">
                       <div class="w-10 h-10 rounded-lg gradient-${['blue', 'purple', 'green', 'orange'][idx % 4]} flex items-center justify-center text-white font-bold text-lg shrink-0 shadow-sm">
                        ${modul.modul_subject ? modul.modul_subject.charAt(0) : 'M'}
                      </div>
                      <div>
                        <div class="font-semibold text-slate-800">${modul.modul_subject || 'Tanpa Mapel'}</div>
                        <div class="text-sm text-slate-500 mt-0.5 line-clamp-1">${modul.modul_topic || '-'}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex flex-col gap-1.5 items-start">
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        Kelas ${modul.modul_class || '-'}
                      </span>
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100">
                        Fase ${modul.modul_fase || '-'}
                      </span>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-2 text-sm text-slate-600 font-medium">
                      <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                      </svg>
                      ${modul.modul_time_allocation || '-'}
                    </div>
                  </td>
                  <td class="px-6 py-4">
                     <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                        <span class="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Aktif
                     </span>
                  </td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-end gap-2">
                      <button class="download-pdf-btn p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all shadow-sm" title="Download PDF" data-id="${modul.__backendId || modul.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                      </button>
                      <div class="h-8 w-px bg-slate-200 mx-1"></div>
                      <button class="edit-modul-btn p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-orange-600 hover:border-orange-200 hover:bg-orange-50 transition-all shadow-sm" title="Edit Modul" data-id="${modul.__backendId || modul.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button class="delete-modul-btn p-2 rounded-xl bg-white border border-slate-200 text-slate-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-all shadow-sm" title="Hapus Modul" data-id="${modul.__backendId || modul.id}">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
