import { appState } from '../../core/state.js';

export function renderGuruDashboard() {
  const { students, attendances, scores, journals, assignments, currentUser } = appState;

  const teacherId = currentUser?.__backendId || currentUser?.id;
  const managedClasses = (currentUser?.class || '').split(',').map(c => c.trim()).filter(c => c);
  const isFlexibleMatch = (itemClass) => {
    if (!itemClass) return false;
    return managedClasses.some(mc => {
      const ic = String(itemClass).trim();
      const target = String(mc).trim();
      if (ic === target) return true;
      return ic.startsWith(target) && !/^\d/.test(ic.substring(target.length));
    });
  };

  const classStudents = students.filter(s => (s.type === 'student' || !s.type) && (String(s.teacher_id) === String(teacherId) || isFlexibleMatch(s.student_class)));
  const classAttendances = attendances.filter(a => String(a.attendance_teacher_nip) === String(currentUser?.nip) || isFlexibleMatch(a.attendance_class));
  const classScores = scores.filter(s => String(s.score_teacher_nip) === String(currentUser?.nip) || isFlexibleMatch(s.score_teacher_class));
  const classJournals = journals.filter(j => (j.type === 'journal' || !j.type) && (String(j.journal_teacher_nip) === String(currentUser?.nip) || isFlexibleMatch(j.journal_class)));

  const today = new Date().toISOString().split('T')[0];
  const todayAttendances = classAttendances.filter(a => a.attendance_date === today);
  const presentToday = todayAttendances.filter(a => a.attendance_status === 'hadir').length;
  const absentToday = todayAttendances.filter(a => a.attendance_status === 'alpa').length;
  const sickToday = todayAttendances.filter(a => a.attendance_status === 'sakit').length;
  const permitToday = todayAttendances.filter(a => a.attendance_status === 'izin').length;

  const days = {};
  classAttendances.forEach(a => {
    const date = a.attendance_date || today;
    if (!days[date]) {
      days[date] = { total: classStudents.length, present: 0 };
    }
    if (a.attendance_status === 'hadir') {
      days[date].present++;
    }
  });

  const attendanceStats = Object.entries(days).slice(-7).map(([date, data]) => ({
    date: new Date(date).toLocaleDateString('id-ID', { weekday: 'short', month: 'short', day: 'numeric' }),
    percentage: data.total > 0 ? Math.round((data.present / data.total) * 100) : 0
  }));

  return `
    <div class="animate-fadeIn">
      <div class="gradient-purple rounded-2xl p-8 text-white shadow-lg mb-8 animate-fadeIn stagger-1">
        <div class="flex items-start justify-between">
          <div>
            <h1 class="text-3xl font-bold mb-2">Selamat Datang, ${currentUser?.name}! 👋</h1>
            <p class="text-purple-100 mb-4">Mata Pelajaran: <strong>${currentUser?.subject}</strong> • Pengampu Berbagai Kelas</p>
            <div class="flex gap-4 flex-wrap">
              <div class="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                <span class="text-lg">👥</span>
                <span><strong>${classStudents.length}</strong> Siswa</span>
              </div>
              <div class="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                <span class="text-lg">📅</span>
                <span><strong>${classAttendances.length}</strong> Data Absensi</span>
              </div>
              <div class="flex items-center gap-2 bg-white/20 px-3 py-1.5 rounded-lg">
                <span class="text-lg">📝</span>
                <span><strong>${classJournals.length}</strong> Jurnal</span>
              </div>
            </div>
          </div>
          <div class="text-6xl text-white/50">📚</div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div class="morph-scale gradient-blue rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <span class="text-xs bg-white/20 px-2 py-1 rounded-lg">Total</span>
          </div>
          <h3 class="text-3xl font-bold">${classStudents.length}</h3>
          <p class="text-white/80 text-sm">Total Siswa</p>
        </div>
        
        <div class="morph-scale gradient-green rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-xs bg-white/20 px-2 py-1 rounded-lg">Hari Ini</span>
          </div>
          <h3 class="text-3xl font-bold">${presentToday}</h3>
          <p class="text-white/80 text-sm">Siswa Hadir</p>
        </div>
        
        <div class="morph-scale gradient-orange rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <span class="text-xs bg-white/20 px-2 py-1 rounded-lg">Tidak Hadir</span>
          </div>
          <h3 class="text-3xl font-bold">${absentToday}</h3>
          <p class="text-white/80 text-sm">Siswa Alpa</p>
        </div>
        
        <div class="morph-scale gradient-pink rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
            </div>
            <span class="text-xs bg-white/20 px-2 py-1 rounded-lg">Akurat</span>
          </div>
          <h3 class="text-3xl font-bold">${classStudents.length > 0 ? Math.round((presentToday / classStudents.length) * 100) : 0}%</h3>
          <p class="text-white/80 text-sm">Persentase Hadir</p>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div class="lg:col-span-2 space-y-6">
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div class="p-6 border-b border-slate-100">
              <h3 class="font-semibold text-slate-800 flex items-center gap-2">
                <span>📊</span> Tren Kehadiran Siswa (7 Hari Terakhir)
              </h3>
            </div>
            <div class="p-6">
              <div class="space-y-3">
                ${attendanceStats.length === 0 ? `
                  <p class="text-center text-slate-500 py-4">Belum ada data kehadiran</p>
                ` : attendanceStats.map(stat => `
                  <div class="flex items-center gap-4">
                    <div class="w-32 text-sm text-slate-600 font-medium">${stat.date}</div>
                    <div class="flex-1">
                      <div class="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                        <div class="h-full gradient-green" style="width: ${stat.percentage}%"></div>
                      </div>
                    </div>
                    <div class="w-12 text-right font-semibold text-slate-800">${stat.percentage}%</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div class="p-6 border-b border-slate-100">
            <h3 class="font-semibold text-slate-800 flex items-center gap-2">
              <span>⚡</span> Akses Cepat
            </h3>
          </div>
          <div id="quick-access-menu" class="p-6 space-y-3">
            <button data-navigate="guru-students" class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all group text-left">
              <div class="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3.914a3 3 0 01-2.973-2.665A9.969 9.969 0 0112 15c4.744 0 8.268 1.34 9.8 2.646"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700 text-sm">Lihat Data Siswa</span>
            </button>
            <button data-navigate="guru-attendance" class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-green-300 hover:bg-green-50 transition-all group text-left">
              <div class="w-10 h-10 gradient-green rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700 text-sm">Absensi Siswa</span>
            </button>
            <button data-navigate="guru-scores" class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-orange-300 hover:bg-orange-50 transition-all group text-left">
              <div class="w-10 h-10 gradient-orange rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700 text-sm">Input Nilai</span>
            </button>
            <button data-navigate="guru-modul-ajar" class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50 transition-all group text-left">
              <div class="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700 text-sm">Modul Ajar</span>
            </button>
            <button data-navigate="guru-journal" class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-pink-300 hover:bg-pink-50 transition-all group text-left">
              <div class="w-10 h-10 gradient-pink rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700 text-sm">Jurnal Pembelajaran</span>
            </button>
            <button data-navigate="guru-profile" class="w-full flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all group text-left">
              <div class="w-10 h-10 bg-slate-500 rounded-xl flex items-center justify-center text-white group-hover:scale-110 transition-transform shrink-0">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <span class="font-medium text-slate-700 text-sm">Profil Saya</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}
