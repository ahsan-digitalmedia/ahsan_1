import { appState } from '../../core/state.js';

export function renderTeachersPage() {
    const { teachers } = appState;

    return `
    <div class="animate-fadeIn">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-xl font-bold text-slate-800">Manajemen Data Guru</h2>
          <p class="text-slate-500 text-sm">Kelola data guru dan akun akses sistem</p>
        </div>
        <button id="add-teacher-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Tambah Guru Baru
        </button>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Guru</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Identitas</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kelas & Mapel</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${teachers.length === 0 ? `
                <tr>
                  <td colspan="5" class="px-6 py-12 text-center text-slate-500">
                    Belum ada data guru terdaftar
                  </td>
                </tr>
              ` : teachers.map((teacher, i) => `
                <tr class="table-row morph-transition">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 gradient-${['blue', 'purple', 'green', 'orange', 'pink'][i % 5]} rounded-xl flex items-center justify-center text-white font-bold">
                        ${teacher.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div class="text-sm font-semibold text-slate-800">${teacher.name}</div>
                        <div class="text-xs text-slate-500">${teacher.email}</div>
                      </div>
                    </div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-slate-800 font-medium">NIP: ${teacher.nip}</div>
                    <div class="text-xs text-slate-500">Telp: ${teacher.phone || '-'}</div>
                  </td>
                  <td class="px-6 py-4">
                    <div class="text-sm text-slate-800 font-medium">Kelas ${teacher.class}</div>
                    <div class="text-xs text-slate-500">${teacher.subject || '-'}</div>
                  </td>
                  <td class="px-6 py-4">
                    <span class="inline-flex px-2 py-1 text-xs font-medium rounded-lg ${teacher.status === 'active' ? 'status-active' : 'status-inactive'} text-white">
                      ${teacher.status === 'active' ? 'Aktif' : 'Non-aktif'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button class="edit-btn p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" data-id="${teacher.__backendId || teacher.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button class="delete-btn p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" data-id="${teacher.__backendId || teacher.id}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
