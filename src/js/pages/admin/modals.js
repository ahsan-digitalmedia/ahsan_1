import { appState, SUBJECT_LIST, CLASS_LIST } from '../../core/state.js';

export function renderAdminModal() {
  const { modalMode, currentPage, editingItem } = appState;

  if (currentPage === 'teachers') {
    return renderTeacherModal(modalMode, editingItem);
  }

  return '';
}

function renderTeacherModal(mode, item) {
  const subjects = SUBJECT_LIST;
  const classes = CLASS_LIST;

  return `
    <div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-[95%] md:w-full max-w-lg max-h-[90%] overflow-hidden animate-fadeIn">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">${mode === 'edit' ? 'Edit Data Guru' : 'Tambah Guru Baru'}</h3>
          <button id="close-modal" class="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6 overflow-y-auto max-h-[60vh]">
          <form id="teacher-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap *</label>
              <input type="text" id="modal-name" value="${item?.name || ''}" placeholder="Nama lengkap" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Nama Sekolah *</label>
              <input type="text" id="modal-school" value="${item?.school_name || ''}" placeholder="Cth: SDN 01 Poncowati" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">NPSN Sekolah *</label>
              <input type="text" id="modal-npsn" value="${item?.npsn || ''}" placeholder="Cth: 108XXXXX" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">NIP (18 digit) *</label>
                <input type="text" id="modal-nip" value="${item?.nip || ''}" placeholder="19XXXXXXXXXXXXXX" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
              </div>
            </div>
            <div class="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <div class="flex items-center justify-between">
                <label class="block text-sm font-bold text-slate-700 uppercase tracking-wide">Kelas yang Diampu *</label>
                <button id="add-modal-class-btn" type="button" class="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                  Tambah Kelas
                </button>
              </div>
              <div id="modal-classes-container" class="space-y-3">
                ${(() => {
      const managedClasses = (item?.class || '').split(',').map(c => c.trim()).filter(c => c);
      const rows = managedClasses.length > 0 ? managedClasses : [''];
      return rows.map((c, idx) => {
        const level = (c.match(/^\d+/) || ['1'])[0];
        const suffix = c.replace(/^\d+/, '');
        return `
                      <div class="modal-class-row flex items-center gap-3 animate-fadeIn">
                        <div class="flex-1 grid grid-cols-2 gap-2">
                           <select class="modal-class-level input-modern w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium">
                             ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => `<option value="${num}" ${level == num ? 'selected' : ''}>Kelas ${num}</option>`).join('')}
                           </select>
                           <input type="text" class="modal-class-suffix input-modern w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-medium" value="${suffix}" placeholder="Rombel (A, B, dll)">
                        </div>
                        ${rows.length > 1 ? `
                          <button type="button" class="remove-modal-class-btn p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all">
                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                          </button>
                        ` : ''}
                      </div>
                    `;
      }).join('');
    })()}
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Email *</label>
                <input type="email" id="modal-email" value="${item?.email || ''}" placeholder="email@sekolah.id" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">No. Telepon</label>
                <input type="text" id="modal-phone" value="${item?.phone || ''}" placeholder="08XXXXXXXXXX" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm">
              </div>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran Ampuan *</label>
              <select id="modal-subject" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
                <option value="">Pilih Mata Pelajaran</option>
                ${subjects.map(s => `<option value="${s}" ${item?.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
                <option value="Guru Kelas" ${item?.subject === 'Guru Kelas' ? 'selected' : ''}>Guru Kelas</option>
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Password *</label>
                <input type="password" id="modal-password" value="${item?.password || ''}" placeholder="Minimal 6 karakter" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
                <div class="mt-2 flex items-center gap-2">
                  <input type="checkbox" id="show-password" class="w-4 h-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500">
                  <label for="show-password" class="text-xs text-slate-500 cursor-pointer select-none">Tampilkan Password</label>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Status Kepegawaian *</label>
                <select id="modal-status" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
                  <option value="active" ${item?.status === 'active' ? 'selected' : ''}>Aktif</option>
                  <option value="inactive" ${item?.status === 'inactive' ? 'selected' : ''}>Non-aktif</option>
                </select>
              </div>
            </div>
          </form>
        </div>
        <div class="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
          <button id="cancel-modal" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">Batal</button>
          <button id="save-teacher" class="btn-primary px-6 py-2.5 rounded-xl text-white font-medium shadow-lg">${mode === 'edit' ? 'Simpan Perubahan' : 'Tambah Guru'}</button>
        </div>
      </div>
    </div>
  `;
}
