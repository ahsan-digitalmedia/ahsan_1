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
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">NIP (18 digit) *</label>
                <input type="text" id="modal-nip" value="${item?.nip || ''}" placeholder="19XXXXXXXXXXXXXX" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Kelas *</label>
                <select id="modal-class" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
                  <option value="">Pilih Kelas</option>
                  ${classes.map(c => `<option value="${c}" ${item?.class === c ? 'selected' : ''}>${c}</option>`).join('')}
                </select>
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
