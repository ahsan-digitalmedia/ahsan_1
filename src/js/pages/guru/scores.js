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

  let classScores = scores.filter(s => {
    const isScoreType = s.type === 'score' || !s.type;
    const belongsToUser = currentUser ? (String(s.score_teacher_nip) === String(currentUser.nip) || String(s.teacher_id) === String(teacherId)) : true;
    return isScoreType && belongsToUser && isMatch(s.score_teacher_class);
  });

  const classStudents = students.filter(s => (s.type === 'student' || !s.type) && isMatch(s.student_class));
  const subjects = SUBJECT_LIST;

  if (filterSubject) {
    classScores = classScores.filter(s => s.score_subject === filterSubject);
  }

  const isRekap = scoreViewMode === 'rekap';

  return `
    <div class="animate-fadeIn">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
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
          <div class="relative group">
            <button class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
              <span>📥</span> Import
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden group-hover:block z-50">
              <button id="import-score-csv-btn" class="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <span>📄</span> Import CSV
              </button>
              <button id="download-score-template-btn" class="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                <span>📜</span> Template CSV
              </button>
            </div>
          </div>
          <div class="relative group">
            <button class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
              <span>🖨️</span> Cetak
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden group-hover:block z-50">
              <button class="print-score-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" data-type="nh">Cetak Nilai Harian</button>
              <button class="print-score-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" data-type="mid">Cetak Nilai MID</button>
              <button class="print-score-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50" data-type="pas">Cetak Nilai PAS</button>
              <button id="export-excel-btn" class="w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 border-t border-slate-50">Download Excel (CSV)</button>
            </div>
          </div>
          <button id="add-score-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Input Nilai
          </button>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        ${isRekap ? renderGuruScoresRekapView(classStudents, scores) : `
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama Siswa</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kelas</th>
                  <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Mata Pelajaran</th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Formatif</th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">Sumatif</th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">MID</th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider">PAS</th>
                  <th class="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase tracking-wider font-bold">Raport</th>
                  <th class="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi</th>
                </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${classScores.length === 0 ? `
                <tr>
                  <td colspan="8" class="px-6 py-12 text-center text-slate-500">
                    Belum ada data nilai
                  </td>
                </tr>
              ` : classScores.map((score, index) => {
    const student = classStudents.find(s => (s.__backendId || s.id) === score.student_id);
    return `
                  <tr class="table-row morph-transition">
                    <td class="px-6 py-4">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 gradient-${['blue', 'purple', 'green', 'orange', 'pink'][index % 5]} rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0">
                          ${student?.student_name?.charAt(0).toUpperCase() || 'S'}
                        </div>
                        <p class="font-medium text-slate-800">${student?.student_name || 'Tidak Ditemukan'}</p>
                      </div>
                    </td>
                    <td class="px-6 py-4 text-sm font-medium text-slate-700">
                      <span class="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs">${student?.student_class || '-'}</span>
                    </td>
                    <td class="px-6 py-4 text-sm text-slate-600 font-medium">${score.score_subject}</td>
                    <td class="px-6 py-4 text-center text-sm text-slate-600">${score.score_formatif || 0}</td>
                    <td class="px-6 py-4 text-center text-sm text-slate-600">${score.score_sumatif || 0}</td>
                    <td class="px-6 py-4 text-center text-sm text-slate-600">${score.score_mid || 0}</td>
                    <td class="px-6 py-4 text-center text-sm text-slate-600">${score.score_pas || 0}</td>
                    <td class="px-6 py-4 text-center">
                      <span class="score-badge ${getScoreBadgeClass(score.score_raport || score.score_value)}">${score.score_raport || score.score_value}</span>
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-end gap-2">
                        <button class="edit-score-btn p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit" data-id="${score.__backendId || score.id}">
                          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                          </svg>
                        </button>
                        <button class="delete-score-btn p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Hapus" data-id="${score.__backendId || score.id}">
                           <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
        `}
      </div>
    </div>
  `;
}

function renderGuruScoresRekapView(classStudents, scores) {
  const subjects = SUBJECT_LIST;

  return `
  <div class="overflow-x-auto">
    <table class="w-full text-xs">
      <thead class="bg-slate-50 border-b border-slate-200">
        <tr>
          <th rowspan="2" class="px-3 py-4 text-left font-semibold text-slate-600 uppercase border-r border-slate-200 sticky left-0 bg-slate-50 z-10 w-48">Nama Siswa</th>
          <th rowspan="2" class="px-3 py-4 text-center font-semibold text-slate-600 uppercase border-r border-slate-200 bg-slate-50">Kelas</th>
          ${subjects.map(sub => `<th colspan="5" class="px-4 py-2 text-center font-semibold text-slate-600 border-r border-slate-200 bg-slate-100">${sub}</th>`).join('')}
        </tr>
        <tr>
          ${subjects.map(() => `
              <th class="px-1 py-1 text-center font-medium text-slate-500 border-r border-slate-100">F</th>
              <th class="px-1 py-1 text-center font-medium text-slate-500 border-r border-slate-100">S</th>
              <th class="px-1 py-1 text-center font-medium text-slate-500 border-r border-slate-100">M</th>
              <th class="px-1 py-1 text-center font-medium text-slate-500 border-r border-slate-100">P</th>
              <th class="px-1 py-1 text-center font-bold text-blue-600 border-r border-slate-200 bg-blue-50">R</th>
            `).join('')}
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        ${classStudents.map((student, sIdx) => {
    const studentId = student.__backendId || student.id;
    return `
              <tr class="hover:bg-slate-50">
                <td class="px-3 py-3 border-r border-slate-200 sticky left-0 bg-white z-10 font-medium text-slate-800">${student.student_name}</td>
                <td class="px-3 py-3 border-r border-slate-200 text-center text-slate-600 font-medium">${student.student_class || '-'}</td>
                ${subjects.map(sub => {
      const score = scores.find(s => s.student_id === studentId && s.score_subject === sub);
      return `
                    <td class="px-1 py-1 text-center border-r border-slate-100 text-slate-600">${score?.score_formatif || '-'}</td>
                    <td class="px-1 py-1 text-center border-r border-slate-100 text-slate-600">${score?.score_sumatif || '-'}</td>
                    <td class="px-1 py-1 text-center border-r border-slate-100 text-slate-600">${score?.score_mid || '-'}</td>
                    <td class="px-1 py-1 text-center border-r border-slate-100 text-slate-600">${score?.score_pas || '-'}</td>
                    <td class="px-1 py-1 text-center border-r border-slate-200 font-bold bg-blue-50/30 text-blue-700">${score?.score_raport || '-'}</td>
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
