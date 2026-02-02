import { appState, SUBJECT_LIST, CLASS_LIST } from '../../core/state.js';

export function renderGuruModal() {
  const { modalMode, currentPage, editingItem } = appState;

  if (currentPage === 'guru-students') {
    return renderStudentModal(modalMode, editingItem);
  }

  if (currentPage === 'guru-scores') {
    return renderScoreModal(modalMode, editingItem);
  }

  if (currentPage === 'guru-modul-ajar') {
    return renderModulAjarModal(modalMode, editingItem);
  }

  if (currentPage === 'guru-journal') {
    return renderJournalModal(modalMode, editingItem);
  }

  if (currentPage === 'guru-profile') {
    return renderProfileModal(modalMode, editingItem);
  }

  return '';
}

function renderStudentModal(mode, item) {
  return `
    <div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-[95%] md:w-full max-w-lg animate-fadeIn">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">${mode === 'edit' ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h3>
          <button id="close-student-modal" class="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap</label>
            <input type="text" id="student-name" value="${item?.student_name || ''}" class="input-modern w-full px-4 py-2 border border-slate-200 rounded-xl">
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">NISN</label>
              <input type="text" id="student-nisn" value="${item?.student_nisn || ''}" class="input-modern w-full px-4 py-2 border border-slate-200 rounded-xl">
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">NIS</label>
              <input type="text" id="student-nis" value="${item?.student_nis || ''}" class="input-modern w-full px-4 py-2 border border-slate-200 rounded-xl">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Jenis Kelamin</label>
              <select id="student-gender" class="input-modern w-full px-4 py-2 border border-slate-200 rounded-xl">
                <option value="L" ${item?.student_gender === 'L' ? 'selected' : ''}>Laki-laki</option>
                <option value="P" ${item?.student_gender === 'P' ? 'selected' : ''}>Perempuan</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal Lahir</label>
              <input type="date" id="student-dob" value="${item?.student_dob || ''}" class="input-modern w-full px-4 py-2 border border-slate-200 rounded-xl">
            </div>
          </div>
        </div>
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
          <button id="cancel-student-btn" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">Batal</button>
          <button id="save-student-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium shadow-lg">Simpan Data</button>
        </div>
      </div>
    </div>
  `;
}

function renderScoreModal(mode, item) {
  const { students, currentUser } = appState;
  const classStudents = students.filter(s => (s.type === 'student' || !s.type) && s.student_class === currentUser?.class);
  const subjects = SUBJECT_LIST;

  return `
    <div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-[95%] md:w-full max-w-lg animate-fadeIn">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">${mode === 'edit' ? 'Edit Nilai Siswa' : 'Input Nilai Baru'}</h3>
          <button id="close-score-modal" class="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6">
          <form id="score-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa *</label>
              <select id="modal-score-student" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required ${mode === 'edit' ? 'disabled' : ''}>
                <option value="">Pilih Siswa</option>
                ${classStudents.map(s => `<option value="${s.__backendId || s.id}" ${item?.student_id === (s.__backendId || s.id) ? 'selected' : ''}>${s.student_name}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Mata Pelajaran *</label>
              <select id="modal-score-subject" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm" required>
                <option value="">Pilih Mapel</option>
                ${subjects.map(sub => `<option value="${sub}" ${item?.score_subject === sub ? 'selected' : ''}>${sub}</option>`).join('')}
              </select>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Nilai Formatif</label>
                <input type="number" id="modal-score-formatif" value="${item?.score_formatif || ''}" placeholder="0-100" min="0" max="100" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm score-input">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Nilai Sumatif</label>
                <input type="number" id="modal-score-sumatif" value="${item?.score_sumatif || ''}" placeholder="0-100" min="0" max="100" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm score-input">
              </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Nilai MID</label>
                <input type="number" id="modal-score-mid" value="${item?.score_mid || ''}" placeholder="0-100" min="0" max="100" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm score-input">
              </div>
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-1">Nilai PAS</label>
                <input type="number" id="modal-score-pas" value="${item?.score_pas || ''}" placeholder="0-100" min="0" max="100" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm score-input">
              </div>
            </div>
            <div class="p-4 bg-blue-50 rounded-xl border border-blue-100">
              <div class="flex justify-between items-center">
                <span class="text-sm font-semibold text-blue-700">Estimasi Nilai Raport:</span>
                <span id="modal-score-raport-preview" class="text-lg font-bold text-blue-800">${item?.score_raport || '-'}</span>
              </div>
              <p class="text-[10px] text-blue-600 mt-1 italic">* Rumus: ((F*2) + (S*4) + (M*2) + (P*2)) / 10</p>
            </div>
          </form>
        </div>
        <div class="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl bg-slate-50">
          <button id="cancel-score-modal" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">Batal</button>
          <button id="save-score-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium shadow-lg">Simpan Nilai</button>
        </div>
      </div>
    </div>
  `;
}

function renderModulAjarModal(mode, item) {
  const { currentUser } = appState;
  const dimensions = [
    'Beriman, Bertakwa kepada Tuhan YME, dan Berakhlak Mulia',
    'Berkebinekaan Global',
    'Gotong Royong',
    'Mandiri',
    'Bernalar Kritis',
    'Kreatif'
  ];
  const subjects = SUBJECT_LIST;

  return `
    <div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-[95%] md:w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-fadeIn">
        <!-- Modal Header -->
        <div class="p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white z-10">
          <div>
            <h3 class="text-xl font-bold text-slate-800">${mode === 'edit' ? 'Edit Modul Ajar' : 'Buat Modul Ajar Baru'}</h3>
            <p class="text-sm text-slate-500">Lengkapi seluruh data di bawah ini untuk disimpan</p>
          </div>
          <button id="close-modul-modal" class="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <svg class="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <!-- Modal Body (Scrollable) -->
        <div class="p-4 md:p-8 overflow-y-auto flex-1 space-y-10 custom-scrollbar">
          <form id="modul-ajar-form" class="space-y-10">
            
            <!-- Section 1: Identitas Umum -->
            <section class="space-y-4">
              <div class="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2z"></path></svg>
                </div>
                <h4 class="font-bold text-slate-800 uppercase tracking-wider text-sm">I. Identitas Umum</h4>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase ml-1">Nama Guru *</label>
                  <input type="text" id="modul-teacher-name" value="${item?.modul_teacher_name || currentUser?.name || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed font-medium" readonly>
                  <p class="text-[10px] text-slate-400 italic ml-1">* Diambil dari profil Anda</p>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase ml-1">Mata Pelajaran *</label>
                  <select id="modul-subject" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" required>
                    <option value="">Pilih Mapel</option>
                    ${subjects.map(sub => `<option value="${sub}" ${item?.modul_subject === sub ? 'selected' : ''}>${sub}</option>`).join('')}
                    <option value="Lainnya" ${item?.modul_subject === 'Lainnya' ? 'selected' : ''}>Lainnya</option>
                  </select>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase ml-1">Topik / Bab *</label>
                  <input type="text" id="modul-topic" value="${item?.modul_topic || ''}" placeholder="Cth: Penjumlahan & Pengurangan" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" required>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase ml-1">Alokasi Waktu *</label>
                  <input type="text" id="modul-time" value="${item?.modul_time_allocation || ''}" placeholder="Cth: 2 x 35 Menit" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" required>
                </div>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase ml-1">Kelas *</label>
                  <input type="text" id="modul-class" value="${item?.modul_class || ''}" placeholder="Cth: 1A, Kelas 1, atau 1/A" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" required>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase ml-1">Fase *</label>
                  <select id="modul-fase" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" required>
                    <option value="A" ${item?.modul_fase === 'A' ? 'selected' : ''}>Fase A (Kelas 1-2)</option>
                    <option value="B" ${item?.modul_fase === 'B' ? 'selected' : ''}>Fase B (Kelas 3-4)</option>
                    <option value="C" ${item?.modul_fase === 'C' ? 'selected' : ''}>Fase C (Kelas 5-6)</option>
                  </select>
                </div>
              </div>
            </section>

            <!-- Section 2: Sasaran & Dimensi -->
            <section class="space-y-5">
              <div class="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                </div>
                <h4 class="font-bold text-slate-800 uppercase tracking-wider text-sm">II. Identifikasi & Profil Lulusan</h4>
              </div>
              
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Identifikasi Sasaran / Kompetensi Awal</label>
                <textarea id="modul-identification" rows="3" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all resize-none" placeholder="Uraikan kompetensi awal yang harus dimiliki siswa...">${item?.modul_identification || ''}</textarea>
              </div>
              
              <div class="space-y-3">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Profil Lulusan (Ceklis yang sesuai)</label>
                <div class="grid grid-cols-1 gap-2">
                  ${[
      'Keimanan dan Ketakwaan terhadap Tuhan Yang Maha Esa',
      'Kewargaan',
      'Penalaran Kritis',
      'Kreativitas',
      'Kolaborasi',
      'Kemandirian',
      'Kesehatan',
      'Komunikasi'
    ].map(dim => `
                    <label class="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer transition-all">
                      <input type="checkbox" name="dimensions" value="${dim}" ${(item?.modul_dimensions || []).includes(dim) ? 'checked' : ''} class="w-5 h-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500">
                      <span class="text-sm text-slate-700 font-medium">${dim}</span>
                    </label>
                  `).join('')}
                </div>
              </div>
            </section>

            <!-- Section 3: Komponen Inti -->
            <section class="space-y-5">
              <div class="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                </div>
                <h4 class="font-bold text-slate-800 uppercase tracking-wider text-sm">III. Komponen Inti (Pembelajaran)</h4>
              </div>
              
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Tujuan Pembelajaran *</label>
                <textarea id="modul-objectives" rows="3" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" required placeholder="Tuliskan tujuan yang ingin dicapai...">${item?.modul_objectives || ''}</textarea>
              </div>
              
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Media & Sarana Pembelajaran</label>
                <textarea id="modul-pedagogic" rows="2" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" placeholder="Alat, bahan, atau media yang digunakan...">${item?.modul_pedagogic || ''}</textarea>
              </div>
              
              <div class="space-y-4">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Langkah-langkah Kegiatan Pembelajaran *</label>
                
                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-blue-500 uppercase ml-1">1. Kegiatan Pendahuluan</label>
                  <textarea id="modul-pre-activities" rows="3" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all text-sm leading-relaxed" placeholder="Cth: Salam, Doa, Apersepsi...">${item?.modul_activity_pre || ''}</textarea>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-emerald-500 uppercase ml-1">2. Kegiatan Inti</label>
                  <textarea id="modul-core-activities" rows="6" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all text-sm leading-relaxed" placeholder="Uraikan proses pembelajaran utama di sini...">${item?.modul_activity_core || ''}</textarea>
                </div>

                <div class="space-y-2">
                  <label class="text-[10px] font-bold text-orange-500 uppercase ml-1">3. Kegiatan Penutup</label>
                  <textarea id="modul-post-activities" rows="3" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all text-sm leading-relaxed" placeholder="Cth: Kesimpulan, Evaluasi, Doa penutup...">${item?.modul_activity_post || ''}</textarea>
                </div>
              </div>
            </section>

            <!-- Section 4: Penilaian & Refleksi -->
            <section class="space-y-5">
              <div class="flex items-center gap-3 pb-2 border-b border-slate-100">
                <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"></path></svg>
                </div>
                <h4 class="font-bold text-slate-800 uppercase tracking-wider text-sm">IV. Asesmen & Penutup</h4>
              </div>
              
              <div class="space-y-1.5">
                <label class="text-xs font-bold text-slate-500 uppercase ml-1">Asesmen / Penilaian</label>
                <textarea id="modul-assessment" rows="3" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" placeholder="Metode penilaian hasil belajar...">${item?.modul_assessment || ''}</textarea>
              </div>
              
              <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase ml-1">Refleksi Guru & Siswa</label>
                  <textarea id="modul-reflection" rows="3" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" placeholder="Catatan evaluasi...">${item?.modul_reflection || ''}</textarea>
                </div>
                <div class="space-y-1.5">
                  <label class="text-xs font-bold text-slate-500 uppercase ml-1">Lampiran / Sumber Belajar</label>
                  <textarea id="modul-attachments" rows="3" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white transition-all" placeholder="LKPD, Bahan bacaan, dll...">${item?.modul_attachments || ''}</textarea>
                </div>
              </div>
            </section>
          </form>
        </div>

        <!-- Modal Footer -->
        <div class="p-6 border-t border-slate-100 flex justify-end items-center shrink-0 bg-slate-50 rounded-b-2xl">
          <div class="flex gap-3">
            <button id="cancel-modul-btn" class="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-200 transition-all">Batal</button>
            <button id="save-modul-btn" class="btn-primary px-10 py-3 rounded-xl text-white font-bold shadow-lg shadow-blue-200 flex items-center gap-2 transition-all active:scale-95">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
              <span>Simpan Modul Ajar</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderJournalModal(mode, item) {
  return `
    <div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-[95%] md:w-full max-w-lg animate-fadeIn">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 class="text-lg font-semibold text-slate-800">${mode === 'edit' ? 'Edit Jurnal' : 'Buat Jurnal Baru'}</h3>
          <button id="close-journal-modal" class="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6">
          <form id="journal-form" class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Tanggal</label>
              <input type="date" id="jou-date" value="${item?.journal_date || new Date().toISOString().split('T')[0]}" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl" required>
            </div>
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-1">Isi Jurnal</label>
              <textarea id="jou-content" rows="6" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl" placeholder="Ketikkan isi jurnal pembelajaran hari ini..." required>${item?.journal_content || ''}</textarea>
            </div>
          </form>
        </div>
        <div class="p-6 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl bg-slate-50">
          <button id="cancel-journal-modal" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-white transition-colors">Batal</button>
          <button id="save-journal-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium shadow-lg">Simpan Jurnal</button>
        </div>
      </div>
    </div>
  `;
}

function renderProfileModal(mode, item) {
  const { currentUser } = appState;
  const isProfileIncomplete = !currentUser?.nip || currentUser?.nip === '-' || !currentUser?.subject || currentUser?.subject === '-' || !currentUser?.class || !currentUser?.npsn;
  const subjects = SUBJECT_LIST || [];
  const classes = CLASS_LIST || [];

  return `
    <div class="modal-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="bg-white rounded-2xl shadow-2xl w-[95%] md:w-full max-w-lg animate-fadeIn transition-all">
        <div class="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10 rounded-t-2xl">
          <div class="flex items-center gap-3">
             <div class="w-10 h-10 ${isProfileIncomplete ? 'gradient-purple' : 'bg-slate-100 text-slate-600'} rounded-xl flex items-center justify-center text-white font-bold opacity-80">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
             </div>
             <div>
                <h3 class="text-lg font-bold text-slate-800 leading-tight">${isProfileIncomplete ? 'Lengkapi Biodata Guru' : 'Edit Profil Saya'}</h3>
                <p class="text-xs text-slate-500">${isProfileIncomplete ? 'Pastikan data Anda sudah benar untuk pencetakan dokumen' : 'Perbarui informasi profil Anda secara berkala'}</p>
             </div>
          </div>
          <button id="close-profile-modal" class="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <svg class="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>
        <div class="p-6 space-y-5 max-h-[65vh] overflow-y-auto custom-scrollbar">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase ml-1">Nama Lengkap *</label>
              <input type="text" id="profile-name" value="${currentUser?.name || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all font-medium" placeholder="Masukkan Nama Lengkap">
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase ml-1">NIP (Opsional)</label>
              <input type="text" id="profile-nip" value="${currentUser?.nip || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all font-medium" placeholder="Cth: 198203...">
            </div>
          </div>
          
          <div class="space-y-1.5 focus-within:opacity-100 opacity-80 group transition-all">
            <label class="block text-xs font-bold text-slate-500 uppercase ml-1">Alamat Email (Login)</label>
            <div class="relative">
              <input type="email" id="profile-email" value="${currentUser?.email || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 text-slate-400 font-medium cursor-not-allowed" readonly>
              <div class="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>
              </div>
            </div>
            <p class="text-[10px] text-slate-400 italic ml-1">* Email tidak dapat diubah karena merupakan kunci akses akun.</p>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-500 uppercase ml-1">Nama Sekolah *</label>
            <input type="text" id="profile-school" value="${currentUser?.school_name || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all font-medium" placeholder="Cth: SDN 1 PONCOWATI">
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-500 uppercase ml-1">NPSN Sekolah *</label>
            <input type="text" id="profile-npsn" value="${currentUser?.npsn || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all font-medium" placeholder="Cth: 108XXXXX">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase ml-1">Kelas yang Diampu *</label>
              <input type="text" id="profile-class" value="${currentUser?.class || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all font-medium" placeholder="Cth: kelas 1 / 1a">
            </div>
            <div class="space-y-1.5">
              <label class="block text-xs font-bold text-slate-500 uppercase ml-1">Mata Pelajaran *</label>
              <select id="profile-subject" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all font-medium">
                <option value="">Pilih Mapel</option>
                ${subjects.map(s => `<option value="${s}" ${currentUser?.subject === s ? 'selected' : ''}>${s}</option>`).join('')}
                <option value="Guru Kelas" ${currentUser?.subject === 'Guru Kelas' ? 'selected' : ''}>Guru Kelas</option>
              </select>
            </div>
          </div>

          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-slate-500 uppercase ml-1">No. HP / WhatsApp *</label>
            <input type="text" id="profile-phone" value="${currentUser?.phone || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-400 transition-all font-medium" placeholder="Cth: 08123456789">
          </div>
        </div>
        <div class="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-2xl">
          <button id="cancel-profile-btn" class="px-6 py-3 rounded-xl text-slate-500 font-bold hover:bg-slate-200 transition-all">Nanti Saja</button>
          <button id="save-profile-btn" class="btn-primary px-10 py-3 rounded-xl text-white font-bold shadow-lg shadow-purple-100 flex items-center gap-2 active:scale-95 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
            <span>Simpan Biodata</span>
          </button>
        </div>
      </div>
    </div>
  `;
}
