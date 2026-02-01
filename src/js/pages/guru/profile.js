import { appState } from '../../core/state.js';
import { formatDate } from '../../core/utils.js';

export function renderGuruProfilePage() {
  const { currentUser, assignments } = appState;
  const userAssignments = assignments.filter(a => a.class === currentUser?.class);
  const gradedAssignments = userAssignments.filter(a => a.score !== undefined && a.score !== null);

  return `
    <div class="animate-fadeIn max-w-2xl">
      <!-- Profile Card -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div class="gradient-purple h-32"></div>
        <div class="px-6 pb-6">
          <div class="flex flex-col md:flex-row md:items-end gap-4 -mt-16 mb-6">
            <div class="w-32 h-32 gradient-purple rounded-2xl flex items-center justify-center text-white text-5xl font-bold border-4 border-white shadow-lg">
              ${currentUser?.name.charAt(0).toUpperCase()}
            </div>
            <div class="flex-1">
              <div class="flex items-center justify-between mb-1">
                <h2 class="text-2xl font-bold text-slate-800">${currentUser?.name}</h2>
                <button id="edit-profile-btn" class="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </button>
              </div>
              <p class="text-slate-600 mb-3">${currentUser?.subject}</p>
              <span class="inline-flex px-3 py-1 status-active text-white text-sm font-medium rounded-lg">
                ${currentUser?.status === 'active' ? 'Guru Aktif' : 'Guru Non-aktif'}
              </span>
            </div>
          </div>

          <div class="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div class="p-4 bg-slate-50 rounded-xl">
              <p class="text-xs text-slate-600 mb-1">NIP</p>
              <p class="font-semibold text-slate-800">${currentUser?.nip}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl">
              <p class="text-xs text-slate-600 mb-1">Kelas</p>
              <p class="font-semibold text-slate-800">${currentUser?.class}</p>
            </div>
            <div class="p-4 bg-slate-50 rounded-xl">
              <p class="text-xs text-slate-600 mb-1">Status</p>
              <p class="font-semibold text-slate-800">${currentUser?.status === 'active' ? 'Aktif' : 'Non-aktif'}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Contact Information -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-6">
        <div class="p-6 border-b border-slate-100">
          <h3 class="font-semibold text-slate-800">Informasi Kontak</h3>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Email</label>
            <p class="px-4 py-3 bg-slate-50 rounded-xl text-slate-700">${currentUser?.email}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">No. Telepon</label>
            <p class="px-4 py-3 bg-slate-50 rounded-xl text-slate-700">${currentUser?.phone || '-'}</p>
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Tanggal Bergabung</label>
            <p class="px-4 py-3 bg-slate-50 rounded-xl text-slate-700">${currentUser?.joinDate ? formatDate(currentUser.joinDate) : '-'}</p>
          </div>
        </div>
      </div>

      <!-- Statistics -->
      <div class="grid grid-cols-2 gap-6 mb-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div class="text-center">
            <p class="text-3xl font-bold gradient-blue bg-clip-text text-transparent">${userAssignments.length}</p>
            <p class="text-sm text-slate-600 mt-2">Total Tugas</p>
          </div>
        </div>
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div class="text-center">
            <p class="text-3xl font-bold gradient-green bg-clip-text text-transparent">${gradedAssignments.length}</p>
            <p class="text-sm text-slate-600 mt-2">Tugas Dinilai</p>
          </div>
        </div>
      </div>

      <!-- Security -->
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 border-b border-slate-100">
          <h3 class="font-semibold text-slate-800">Keamanan</h3>
        </div>
        <div class="p-6">
          <p class="text-slate-600 text-sm mb-4">
            Ubah kata sandi Anda secara berkala untuk menjaga keamanan akun. Hubungi administrator jika Anda lupa kata sandi.
          </p>
          <button id="change-pass-btn" class="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">
            Ubah Kata Sandi
          </button>
        </div>
      </div>
    </div>
  `;
}
