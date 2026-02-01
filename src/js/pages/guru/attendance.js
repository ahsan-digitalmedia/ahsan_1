import { appState } from '../../core/state.js';
import { formatDate } from '../../core/utils.js';

export function renderGuruAttendancePage() {
    const { attendances, students, currentUser, selectedDate } = appState;
    const classAttendances = attendances.filter(a => a.attendance_class === currentUser?.class);
    const classStudents = students.filter(s => (s.type === 'student' || !s.type) && s.student_class === currentUser?.class);
    const today = new Date().toISOString().split('T')[0];
    const viewDate = selectedDate || today;

    return `
    <div class="animate-fadeIn">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Pilih Tanggal</label>
            <input type="date" id="attendance-date" value="${viewDate}" class="input-modern px-4 py-2.5 border border-slate-200 rounded-xl">
          </div>
          <button id="mark-all-present-btn" class="px-5 py-2.5 rounded-xl border border-green-200 bg-green-50 text-green-700 font-medium hover:bg-green-100 flex items-center gap-2 transition-colors h-fit">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Hadirkan Semua Siswa
          </button>
        </div>
        <div class="flex flex-col md:flex-row gap-2">
          <div class="relative group">
            <button class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2 transition-all">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
              </svg>
              Cetak Laporan
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
              </svg>
            </button>
            <div class="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-2 hidden group-hover:block z-50">
              <button class="print-report-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2" data-type="daily">
                <span>📅</span> Cetak Harian
              </button>
              <button class="print-report-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2" data-type="weekly">
                <span>📅</span> Cetak Mingguan
              </button>
              <button class="print-report-btn w-full text-left px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 flex items-center gap-2" data-type="monthly">
                <span>📅</span> Cetak Bulanan
              </button>
            </div>
          </div>
        </div>
        <div class="text-right">
          <span class="text-sm text-slate-500">Menampilkan data untuk: </span>
          <span class="font-semibold text-slate-800">${formatDate(viewDate)}</span>
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
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider hidden md:table-cell">JK</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Keterangan</th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-slate-600 uppercase tracking-wider">Aksi Presensi</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${classStudents.length === 0 ? `
                <tr>
                  <td colspan="6" class="px-6 py-12 text-center text-slate-500">
                    Belum ada data siswa
                  </td>
                </tr>
              ` : classStudents.map((student, index) => {
        const studentAttendance = classAttendances.find(a => a.student_id === (student.__backendId || student.id) && a.attendance_date === viewDate);
        const statusColor = {
            'hadir': 'text-green-600 bg-green-50',
            'alpa': 'text-red-600 bg-red-50',
            'sakit': 'text-yellow-600 bg-yellow-50',
            'izin': 'text-blue-600 bg-blue-50'
        };
        const statusLabel = {
            'hadir': 'Hadir',
            'alpa': 'Alpa',
            'sakit': 'Sakit',
            'izin': 'Izin'
        };
        const currentStatus = studentAttendance?.attendance_status || '';

        return `
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
                    <td class="px-6 py-4 text-sm text-slate-600 hidden md:table-cell">${student.student_gender || '-'}</td>
                    <td class="px-6 py-4">
                      ${currentStatus ? `
                        <span class="inline-flex px-3 py-1 text-xs font-bold rounded-lg ${statusColor[currentStatus] || 'text-slate-600 bg-slate-50'} uppercase">
                          ${statusLabel[currentStatus]}
                        </span>
                      ` : `
                        <span class="inline-flex px-3 py-1 text-xs font-bold rounded-lg text-slate-400 bg-slate-50 uppercase">
                          Belum Absen
                        </span>
                      `}
                    </td>
                    <td class="px-6 py-4">
                      <div class="flex items-center justify-end gap-1">
                        <button class="set-attendance-btn w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentStatus === 'hadir' ? 'bg-green-600 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-green-50 hover:text-green-600'}" 
                          data-student-id="${student.__backendId || student.id}" data-status="hadir" title="Hadir">H</button>
                        <button class="set-attendance-btn w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentStatus === 'sakit' ? 'bg-yellow-500 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-yellow-50 hover:text-yellow-600'}" 
                          data-student-id="${student.__backendId || student.id}" data-status="sakit" title="Sakit">S</button>
                        <button class="set-attendance-btn w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentStatus === 'izin' ? 'bg-blue-500 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-blue-50 hover:text-blue-600'}" 
                          data-student-id="${student.__backendId || student.id}" data-status="izin" title="Izin">I</button>
                        <button class="set-attendance-btn w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold transition-all ${currentStatus === 'alpa' ? 'bg-red-500 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600'}" 
                          data-student-id="${student.__backendId || student.id}" data-status="alpa" title="Alpa">A</button>
                      </div>
                    </td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
