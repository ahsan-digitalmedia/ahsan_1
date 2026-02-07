import { appState } from '../../core/state.js';
import { formatDate } from '../../core/utils.js';

export function renderGuruStudentsPage() {
  const { students, currentUser, selectedStudentClass, studentSearchQuery } = appState;
  const teacherId = currentUser?.__backendId || currentUser?.id;
  const managedClasses = (currentUser?.class || '').split(',').map(c => c.trim()).filter(c => c);

  const isFlexibleMatch = (itemClass, targetClasses) => {
    if (!itemClass) return false;
    return targetClasses.some(mc => {
      const ic = String(itemClass).trim();
      const target = String(mc).trim();
      if (ic === target) return true;
      return ic.startsWith(target) && !/^\d/.test(ic.substring(target.length));
    });
  };

  // 1. Initial filter by teacher or managed classes
  let filtered = students.filter(s =>
    (s.type === 'student' || !s.type) &&
    (String(s.teacher_id) === String(teacherId) || isFlexibleMatch(s.student_class, managedClasses))
  );

  // 2. Filter by specific class if selected
  if (selectedStudentClass) {
    filtered = filtered.filter(s => s.student_class === selectedStudentClass);
  }

  // 3. Filter by search query
  if (studentSearchQuery) {
    const q = studentSearchQuery.toLowerCase().trim();
    filtered = filtered.filter(s =>
      (s.student_name || '').toLowerCase().includes(q) ||
      (s.student_nisn || '').toLowerCase().includes(q) ||
      (s.student_nis || '').toLowerCase().includes(q)
    );
  }

  const classStudents = filtered;

  return `
    <div class="animate-fadeIn">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 class="text-2xl font-bold text-slate-800">Daftar Siswa</h2>
          <p class="text-slate-500">Kelola data siswa yang Anda ampu</p>
        </div>
        <div class="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <input type="file" id="import-csv-input" accept=".csv" class="hidden">
          <button id="download-template-btn" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            Template
          </button>
          <button id="import-csv-btn" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
            </svg>
            Import CSV
          </button>
          <button id="add-student-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Tambah Siswa
          </button>
        </div>
      </div>

      <!-- Filter Bar -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div class="md:col-span-2 relative">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg class="h-5 w-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <input type="text" id="student-search" value="${studentSearchQuery}" placeholder="Cari nama, NISN, atau NIS..." 
            class="input-modern block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm transition-all focus:ring-4 focus:ring-blue-100 focus:border-blue-400">
          ${studentSearchQuery ? `
            <button id="clear-student-search" class="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600">
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          ` : ''}
        </div>
        <div>
          <select id="student-filter-class" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-blue-100">
            <option value="">Semua Kelas</option>
            ${managedClasses.map(c => `
              <option value="${c}" ${selectedStudentClass === c ? 'selected' : ''}>Kelas ${c}</option>
            `).join('')}
          </select>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Nama Siswa</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">NISN</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">NIS</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kelas</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">Jenis Kelamin</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden lg:table-cell">Tanggal Lahir</th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${classStudents.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                    Belum ada data siswa
                  </td>
                </tr>
              ` : classStudents.map((student, index) => `
                <tr class="table-row morph-transition">
                  <td class="px-6 py-4">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 gradient-${['blue', 'purple', 'green', 'orange', 'pink'][index % 5]} rounded-xl flex items-center justify-center text-white font-semibold text-sm shrink-0">
                        ${student.student_name?.charAt(0).toUpperCase() || 'S'}
                      </div>
                      <p class="font-medium text-slate-800">${student.student_name}</p>
                    </div>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-600">${student.student_nisn}</td>
                  <td class="px-6 py-4 text-sm text-slate-600">${student.student_nis || '-'}</td>
                  <td class="px-6 py-4 text-sm font-medium text-slate-700">
                    <span class="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-xs">${student.student_class || '-'}</span>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">${student.student_gender === 'L' ? 'Laki-laki' : 'Perempuan'}</td>
                  <td class="px-6 py-4 text-sm text-slate-600 hidden lg:table-cell">${formatDate(student.student_dob)}</td>
                  <td class="px-6 py-4">
                    <div class="flex items-center justify-end gap-2">
                      <button class="edit-student-btn p-2 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Edit" data-id="${student.id || student.__backendId}">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                        </svg>
                      </button>
                      <button class="delete-student-btn p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete" data-id="${student.id || student.__backendId}">
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
