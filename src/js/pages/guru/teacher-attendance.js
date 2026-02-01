import { appState } from '../../core/state.js';
import { formatDate } from '../../core/utils.js';

export function renderGuruTeacherAttendancePage() {
    const { teacherAttendances, currentUser } = appState;
    const myAttendances = teacherAttendances.filter(a => a.teacher_nip === currentUser?.nip);
    const today = new Date().toISOString().split('T')[0];

    return `
    <div class="animate-fadeIn">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p class="text-slate-500">Riwayat kehadiran Anda</p>
        </div>
        <button id="record-teacher-attendance-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Catat Kehadiran
        </button>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">📅</span> Status Hari Ini
          </h3>
          ${myAttendances.filter(a => a.teacher_attendance_date === today).length > 0 ? `
            <div class="text-center">
              <span class="inline-flex px-4 py-2 status-active text-white rounded-lg font-medium">
                Hadir
              </span>
            </div>
          ` : `
            <div class="text-center">
              <span class="inline-flex px-4 py-2 bg-slate-100 text-slate-600 rounded-lg font-medium">
                Belum Dicatat
              </span>
            </div>
          `}
        </div>
        
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">📊</span> Total Kehadiran
          </h3>
          <div class="text-3xl font-bold gradient-blue bg-clip-text text-transparent">${myAttendances.length}</div>
          <p class="text-sm text-slate-500 mt-1">Hari masuk</p>
        </div>
        
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 class="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <span class="text-2xl">📈</span> Persentase
          </h3>
          <div class="text-3xl font-bold gradient-green bg-clip-text text-transparent">${myAttendances.length > 0 ? Math.round((myAttendances.length / 20) * 100) : 0}%</div>
          <p class="text-sm text-slate-500 mt-1">Kehadiran (dari 20 hari kerja)</p>
        </div>
      </div>
      
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 border-b border-slate-100">
          <h3 class="font-semibold text-slate-800">Riwayat Kehadiran</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 border-b border-slate-200">
              <tr>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Tanggal</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Kelas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              ${myAttendances.length === 0 ? `
                <tr>
                  <td colspan="3" class="px-6 py-12 text-center text-slate-500">
                    Belum ada data kehadiran
                  </td>
                </tr>
              ` : myAttendances.slice().reverse().map(att => `
                <tr class="table-row morph-transition">
                  <td class="px-6 py-4 text-sm font-medium text-slate-800">${formatDate(att.teacher_attendance_date)}</td>
                  <td class="px-6 py-4">
                    <span class="inline-flex px-3 py-1 status-active text-white text-sm font-medium rounded-lg">
                      ${att.teacher_attendance_status === 'hadir' ? 'Hadir' : 'Tidak Hadir'}
                    </span>
                  </td>
                  <td class="px-6 py-4 text-sm text-slate-600">${att.teacher_attendance_class || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}
