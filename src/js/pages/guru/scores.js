import { appState, SUBJECT_LIST } from '../../core/state.js';
import { getScoreBadgeClass } from '../../core/utils.js';

export function renderGuruScoresPage() {
  const { scores, students, currentUser, filterSubject, scoreViewMode, selectedScoreClass } = appState;
  const teacherId = currentUser?.__backendId || currentUser?.id;
  const managedClasses = (currentUser?.class || '').split(',').map(c => c.trim()).filter(c => c);
  const currentClass = selectedScoreClass || managedClasses[0] || '';

  const isMatch = (itemClass) => {
    const ic = String(itemClass || '').trim();
    const target = String(currentClass || '').trim();
    if (ic === target) return true;
    return ic.startsWith(target) && !/^\d/.test(ic.substring(target.length));
  };

  const classStudents = students.filter(s => (s.type === 'student' || !s.type) && isMatch(s.student_class));

  // Filter subjects based on teacher profile
  const subjects = (currentUser?.subject && currentUser.subject !== 'Guru Kelas')
    ? [currentUser.subject]
    : SUBJECT_LIST;
  const tpCount = appState.scoreTPCount || 4;
  const sumCount = appState.scoreSumatifCount || 4;

  // Prepare scores to display
  let displayScores = [];

  if (filterSubject) {
    // Show one row per student for the selected subject
    displayScores = classStudents.map(student => {
      const studentId = student.__backendId || student.id;
      const existingScore = scores.find(s =>
        (s.type === 'score' || !s.type) &&
        String(s.student_id) === String(studentId) &&
        s.score_subject === filterSubject
      );

      const newScore = {
        id: `new-${studentId}`,
        student_id: studentId,
        score_subject: filterSubject,
        score_teacher_class: currentClass,
        teacher_id: teacherId,
        score_pts: 0, score_pas: 0,
        weight_fs: 80, weight_pts: 10, weight_pas: 10,
        is_new: true
      };

      for (let i = 1; i <= tpCount; i++) newScore[`score_f${i}`] = 0;
      for (let i = 1; i <= sumCount; i++) newScore[`score_s${i}`] = 0;

      return existingScore || newScore;
    });
  } else {
    // Show all existing scores recorded for this class 
    displayScores = scores.filter(s => {
      const isScoreType = s.type === 'score' || !s.type;
      const belongsToUser = currentUser ? (String(s.score_teacher_nip) === String(currentUser.nip) || String(s.teacher_id) === String(teacherId)) : true;
      return isScoreType && belongsToUser && isMatch(s.score_teacher_class);
    });
  }

  // Initialize or update weights from existing data if available
  const firstWithWeights = displayScores.find(s => s.weight_fs || s.weight_pts || s.weight_pas);
  if (firstWithWeights && !appState._weightsSetManually) {
    appState.scoreWeights = {
      fs: firstWithWeights.weight_fs || 80,
      pts: firstWithWeights.weight_pts || 10,
      pas: firstWithWeights.weight_pas || 10
    };
  }

  const isRekap = scoreViewMode === 'rekap';

  return `
    <div class="animate-fadeIn pb-10">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-50">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex gap-2">
            <button id="view-input-btn" class="px-5 py-2.5 rounded-xl border ${!isRekap ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600'} font-medium transition-colors">
              Input Nilai
            </button>
            <button id="view-rekap-btn" class="px-5 py-2.5 rounded-xl border ${isRekap ? 'bg-blue-50 border-blue-200 text-blue-700' : 'border-slate-200 text-slate-600'} font-medium transition-colors">
              Rekap Nilai
            </button>
          </div>

          <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <span class="text-xs font-semibold text-slate-500 uppercase">Pilih Kelas:</span>
            <select id="score-class-select" class="bg-transparent text-sm font-medium text-slate-700 outline-none border-none p-0 cursor-pointer min-w-[80px]">
              ${managedClasses.map(c => {
    const label = c.toLowerCase().startsWith('kelas') ? c : `Kelas ${c}`;
    return `<option value="${c}" ${currentClass === c ? 'selected' : ''}>${label}</option>`;
  }).join('')}
            </select>
          </div>
          
          ${!isRekap ? `
          <div class="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200">
            <span class="text-xs font-semibold text-slate-500 uppercase">Filter Mapel:</span>
            <select id="score-filter-subject" class="bg-transparent text-sm font-medium text-slate-700 outline-none border-none p-0 cursor-pointer">
              <option value="">Semua Mapel</option>
              ${subjects.map(sub => `<option value="${sub}" ${filterSubject === sub ? 'selected' : ''}>${sub}</option>`).join('')}
            </select>
          </div>
          ` : ''}
        </div>
        <div class="flex gap-2">
          <input type="file" id="import-score-csv-input" accept=".csv" class="hidden">
          <div class="relative">
            <button onclick="document.getElementById('import-scores-dropdown').classList.toggle('hidden')" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
              <span>📥</span> Import
            </button>
            <div id="import-scores-dropdown" class="js-dropdown absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden z-[100]">
              <button id="import-score-csv-btn" onclick="this.parentElement.classList.add('hidden')" class="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <span>📄</span> Import Excel (CSV)
              </button>
              <button id="export-excel-btn" onclick="this.parentElement.classList.add('hidden')" class="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2 border-t border-slate-50 mt-1">
                <span>📊</span> Export Excel / Template
              </button>
            </div>
          </div>
          <div class="relative">
            <button onclick="document.getElementById('print-scores-dropdown').classList.toggle('hidden')" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
              <span>🖨️</span> Cetak
              ${filterSubject ? `<span class="bg-blue-100 text-blue-600 text-[10px] px-1.5 py-0.5 rounded-md font-bold">${filterSubject}</span>` : ''}
            </button>
            <div id="print-scores-dropdown" class="js-dropdown absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden z-[100] animate-fadeIn">
              <div class="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">Pilih Jenis Laporan</div>
              <button onclick="this.parentElement.classList.add('hidden')" class="print-score-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2" data-type="formatif">
                <span>📊</span> Cetak Nilai Formatif
              </button>
              <button onclick="this.parentElement.classList.add('hidden')" class="print-score-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2" data-type="sumatif">
                <span>📝</span> Cetak Nilai Sumatif
              </button>
              <button onclick="this.parentElement.classList.add('hidden')" class="print-score-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2" data-type="mid">
                <span>🕒</span> Cetak Nilai PTS
              </button>
              <button onclick="this.parentElement.classList.add('hidden')" class="print-score-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2" data-type="pas">
                <span>🎓</span> Cetak Nilai PAS
              </button>
              <button onclick="this.parentElement.classList.add('hidden')" class="print-score-btn w-full text-left px-4 py-2 text-sm text-blue-600 font-bold hover:bg-blue-50 border-t border-slate-50 mt-1 flex items-center gap-2" data-type="raport">
                <span>🏆</span> Cetak Rekap Nilai Akhir
              </button>
              ${filterSubject ? '' : `<p class="px-4 py-2 text-[9px] text-amber-500 italic bg-amber-50 mx-2 rounded-lg mt-2">Tips: Gunakan filter mapel untuk mencetak per mata pelajaran.</p>`}
            </div>
          </div>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        ${isRekap ? renderGuruScoresRekapView(classStudents, scores) : `
        <div class="overflow-x-auto custom-scrollbar">
          <table class="w-full text-xs" id="scores-inline-table">
            <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th rowspan="2" class="px-4 py-4 text-left font-semibold text-slate-600 uppercase border-r border-slate-200 sticky left-0 bg-slate-50 z-10 min-w-[200px]">Data Siswa</th>
                  <th rowspan="2" class="px-2 py-4 text-center font-semibold text-slate-600 uppercase border-r border-slate-200 bg-slate-50">Mapel</th>
                  <th colspan="${tpCount}" class="px-2 py-2 text-center font-bold text-indigo-600 bg-indigo-50/50 border-b border-r border-indigo-100 uppercase tracking-tighter">Formatif (F)</th>
                  <th rowspan="2" class="px-2 py-4 text-center font-bold text-indigo-700 bg-indigo-100/50 border-r border-indigo-200">Avg F</th>
                  <th colspan="${sumCount}" class="px-2 py-2 text-center font-bold text-emerald-600 bg-emerald-50/50 border-b border-r border-emerald-100 uppercase tracking-tighter">Sumatif (S)</th>
                  <th rowspan="2" class="px-2 py-4 text-center font-bold text-emerald-700 bg-emerald-100/50 border-r border-emerald-200">Avg S</th>
                  <th rowspan="2" class="px-2 py-4 text-center font-bold text-amber-600 bg-amber-50 border-r border-amber-200">PTS</th>
                  <th rowspan="2" class="px-2 py-4 text-center font-bold text-rose-600 bg-rose-50 border-r border-rose-200">PAS</th>
                  <th rowspan="2" class="px-2 py-4 text-center font-black text-blue-700 bg-blue-50 border-r border-blue-200">NA</th>
                  <th rowspan="2" class="px-4 py-4 text-center font-semibold text-slate-600 uppercase">Aksi</th>
                </tr>
                <tr class="bg-slate-50/50">
                  ${Array.from({ length: tpCount }).map((_, i) => `
                    <th class="px-1 py-1 text-center border-r border-slate-200 text-slate-400 font-bold">F${i + 1}</th>
                  `).join('')}
                  ${Array.from({ length: sumCount }).map((_, i) => `
                    <th class="px-1 py-1 text-center border-r border-slate-200 text-slate-400 font-bold">S${i + 1}</th>
                  `).join('')}
                </tr>
            </thead>
              ${displayScores.length === 0 ? `
                <tr>
                  <td colspan="16" class="px-6 py-12 text-center">
                    <div class="flex flex-col items-center gap-2 text-slate-500">
                      <svg class="w-12 h-12 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path>
                      </svg>
                      <p class="font-medium">Belum ada data nilai ditampilkan.</p>
                      <p class="text-xs">${!filterSubject ? 'Silakan <b>Pilih Mapel</b> di atas untuk mulai menginput nilai langsung di tabel.' : 'Tidak ada siswa yang ditemukan di kelas ini.'}</p>
                    </div>
                  </td>
                </tr>
              ` : displayScores.map((score, index) => {
    const student = classStudents.find(s => (s.__backendId || s.id) === score.student_id);
    const scoreId = score.__backendId || score.id;
    return `
                  <tr class="inline-score-row hover:bg-slate-50/80 transition-all opacity-0 animate-fadeIn" style="animation-delay: ${index * 0.05}s" 
                      data-score-id="${scoreId}" 
                      data-student-id="${score.student_id}"
                      data-subject="${score.score_subject}"
                      data-class="${score.score_teacher_class}"
                      data-teacher-id="${score.teacher_id}"
                      data-is-new="${!!score.is_new}">
                    <td class="px-4 py-3 border-r border-slate-200 sticky left-0 bg-white z-10 group-hover:bg-slate-50 transition-colors">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 gradient-${['blue', 'purple', 'green', 'orange', 'pink'][index % 5]} rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                          ${student?.student_name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <div>
                          <p class="font-bold text-slate-800 truncate max-w-[150px]">${student?.student_name || 'Tidak Ditemukan'}</p>
                          <p class="text-[9px] text-slate-400">NISN: ${student?.student_nisn || '-'} | L/P: ${student?.student_gender || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-2 py-3 text-center border-r border-slate-100 font-medium text-slate-600 truncate max-w-[80px]">${score.score_subject}</td>
                    
                    ${Array.from({ length: tpCount }).map((_, i) => `
                      <td class="px-1 py-1 border-r border-slate-100 bg-indigo-50/10">
                        <input type="number" value="${score[`score_f${i + 1}`] || ''}" data-field="score_f${i + 1}" class="score-inline-input w-9 text-center bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-indigo-300 rounded" placeholder="-">
                      </td>
                    `).join('')}
                    <td class="px-2 py-3 text-center border-r border-indigo-200 text-indigo-700 font-bold bg-indigo-100/20" data-avg="f">${parseFloat(score.score_formatif || 0).toFixed(0)}</td>
                    
                    ${Array.from({ length: sumCount }).map((_, i) => `
                      <td class="px-1 py-1 border-r border-slate-100 bg-emerald-50/10">
                        <input type="number" value="${score[`score_s${i + 1}`] || ''}" data-field="score_s${i + 1}" class="score-inline-input w-9 text-center bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-emerald-300 rounded" placeholder="-">
                      </td>
                    `).join('')}
                    <td class="px-2 py-3 text-center border-r border-emerald-200 text-emerald-700 font-bold bg-emerald-100/20" data-avg="s">${parseFloat(score.score_sumatif || 0).toFixed(0)}</td>
                    
                    <td class="px-1 py-1 border-r border-amber-200 bg-amber-50/20">
                      <input type="number" value="${score.score_pts || score.score_mid || ''}" data-field="score_pts" class="score-inline-input w-10 text-center bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-amber-300 rounded font-bold text-amber-700" placeholder="-">
                    </td>
                    <td class="px-1 py-1 border-r border-rose-200 bg-rose-50/20">
                      <input type="number" value="${score.score_pas || ''}" data-field="score_pas" class="score-inline-input w-10 text-center bg-transparent outline-none focus:bg-white focus:ring-1 focus:ring-rose-300 rounded font-bold text-rose-700" placeholder="-">
                    </td>
                    <td class="px-2 py-3 text-center border-r border-blue-200">
                      <span class="px-2 py-1 rounded-lg bg-blue-600 text-white font-black text-[13px] shadow-sm ring-2 ring-blue-100 inline-na-badge" data-avg="na">${score.score_raport || score.score_value || 0}</span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-center gap-1">
                        <button class="save-row-btn p-1.5 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all opacity-0 group-hover:opacity-100" title="Simpan Baris" data-id="${scoreId}">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        </button>
                        <button class="edit-score-btn p-1.5 rounded-lg hover:bg-white hover:shadow-md text-slate-400 hover:text-blue-600 transition-all" title="Edit Detail" data-id="${scoreId}">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button class="delete-score-btn p-1.5 rounded-lg hover:bg-white hover:shadow-md text-slate-400 hover:text-red-500 transition-all" title="Hapus" data-id="${scoreId}">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                `;
  }).join('')}
            </tbody>
          </table>
        </div>
        
        ${displayScores.length > 0 ? `
        <div class="p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap gap-4 justify-between items-center">
          <div class="space-y-1">
            <p class="text-[11px] text-slate-500 italic">
              <span class="inline-block w-2 h-2 rounded-full bg-indigo-400 mr-1"></span> Tekan <b>Enter</b> atau klik di luar kotak untuk kalkulasi otomatis. Jangan lupa klik <b>Simpan</b>.
            </p>
            <p class="text-[10px] text-slate-400 font-medium">
              * Jumlah kolom F & S disesuaikan dengan jumlah Tujuan Pembelajaran (TP) per mata pelajaran.
            </p>
          </div>
          <div class="flex gap-2">
            <button id="tp-config-btn" class="px-5 py-2 rounded-xl border border-indigo-100 bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-all flex items-center gap-2 transform active:scale-95 shadow-sm">
               <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
              </svg>
              Perbarui Jumlah TP
            </button>
            <button id="weight-settings-btn" class="px-5 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 font-bold hover:bg-slate-50 transition-all flex items-center gap-2 transform active:scale-95 shadow-sm" title="Atur Persentase Bobot NA">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"></path>
              </svg>
              Atur Bobot NA
            </button>
            <button id="save-all-scores-btn" class="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all flex items-center gap-2 transform active:scale-95">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
              Simpan Semua Perubahan
            </button>
          </div>
        </div>
        ` : ''}
        
        `}
      </div>
    </div>
  `;
}

function renderGuruScoresRekapView(classStudents, scores) {
  const { currentUser } = appState;
  const subjects = (currentUser?.subject && currentUser.subject !== 'Guru Kelas')
    ? [currentUser.subject]
    : SUBJECT_LIST;

  const tpCount = appState.scoreTPCount || 4;
  const sumCount = appState.scoreSumatifCount || 4;
  const colPerSubject = tpCount + sumCount + 3;

  return `
  <div class="overflow-x-auto custom-scrollbar">
    <table class="w-full text-[10px] border-collapse">
      <thead class="bg-slate-50 border-b border-slate-200">
        <tr>
          <th rowspan="2" class="px-3 py-4 text-left font-semibold text-slate-600 uppercase border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-48 shadow-sm">Nama Siswa</th>
          <th rowspan="2" class="px-3 py-4 text-center font-semibold text-slate-600 uppercase border-r border-slate-200 bg-slate-50">Kelas</th>
          ${subjects.map(sub => `<th colspan="${colPerSubject}" class="px-4 py-2 text-center font-bold text-slate-700 border-r border-slate-200 bg-slate-100/50">${sub}</th>`).join('')}
        </tr>
        <tr>
          ${subjects.map(() => `
              ${Array.from({ length: tpCount }).map((_, i) => `<th class="px-1 py-1 text-center font-medium text-slate-400 border-r border-slate-100">F${i + 1}</th>`).join('')}
              ${Array.from({ length: sumCount }).map((_, i) => `<th class="px-1 py-1 text-center font-medium text-slate-400 border-r border-slate-100">S${i + 1}</th>`).join('')}
              <th class="px-1 py-1 text-center font-bold text-amber-600 border-r border-slate-100 bg-amber-50/20">M</th>
              <th class="px-1 py-1 text-center font-bold text-rose-600 border-r border-slate-100 bg-rose-50/20">P</th>
              <th class="px-1 py-1 text-center font-black text-blue-700 border-r border-slate-200 bg-blue-50">NA</th>
            `).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${classStudents.map((student, sIdx) => {
    const studentId = student.__backendId || student.id;
    return `
              <tr class="hover:bg-slate-50 transition-colors group">
                <td class="px-3 py-3 border-r border-slate-200 sticky left-0 bg-white z-10 font-bold text-slate-800 shadow-sm transition-colors group-hover:bg-slate-50">${student.student_name}</td>
                <td class="px-3 py-3 border-r border-slate-200 text-center text-slate-500 font-medium">${student.student_class || '-'}</td>
                ${subjects.map(sub => {
      const s = scores.find(sc => sc.student_id === studentId && sc.score_subject === sub);
      return `
                    ${Array.from({ length: tpCount }).map((_, i) => `<td class="px-1 py-1 text-center border-r border-slate-100 text-slate-500">${s?.[`score_f${i + 1}`] || '-'}</td>`).join('')}
                    ${Array.from({ length: sumCount }).map((_, i) => `<td class="px-1 py-1 text-center border-r border-slate-100 text-slate-500">${s?.[`score_s${i + 1}`] || '-'}</td>`).join('')}
                    <td class="px-1 py-1 text-center border-r border-slate-100 font-bold bg-amber-50/10 text-amber-700">${s?.score_pts || s?.score_mid || '-'}</td>
                    <td class="px-1 py-1 text-center border-r border-slate-100 font-bold bg-rose-50/10 text-rose-700">${s?.score_pas || '-'}</td>
                    <td class="px-1 py-1 text-center border-r border-slate-200 font-black bg-blue-50/50 text-blue-700 text-xs">${s?.score_raport || s?.score_value || '-'}</td>
                  `;
    }).join('')}
              </tr>
            `;
  }).join('')}
      </tbody>
    </table>
  </div>
  `;
}
