import { appState } from '../../core/state.js';
import { formatDate } from '../../core/utils.js';

export function renderGuruJournalPage() {
  const { journals, currentUser } = appState;
  const classJournals = journals.filter(j => (j.type === 'journal' || !j.type) && j.journal_class === currentUser?.class && j.journal_teacher_nip === currentUser?.nip);

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Helper to get Indonesian Month Name
  const getIndoMonth = (monthIndex) => {
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    return monthNames[monthIndex];
  };

  // Grouping journals by Month and Year
  const groupedJournals = classJournals.reduce((acc, journal) => {
    const date = new Date(journal.journal_date);
    const key = `${getIndoMonth(date.getMonth())} ${date.getFullYear()}`;
    if (!acc[key]) acc[key] = [];
    acc[key].push(journal);
    return acc;
  }, {});

  // Sort months in descending order (latest first)
  const sortedMonths = Object.keys(groupedJournals).sort((a, b) => {
    const [monthA, yearA] = a.split(' ');
    const [monthB, yearB] = b.split(' ');
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    if (yearA !== yearB) return yearB - yearA;
    return monthNames.indexOf(monthB) - monthNames.indexOf(monthA);
  });

  return `
    <div class="animate-fadeIn">
      <div class="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div class="flex flex-col md:flex-row gap-4 items-end">
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-2">Pilih Tanggal</label>
            <input type="date" id="journal-date-filter" value="${today}" class="input-modern px-4 py-2.5 border border-slate-200 rounded-xl">
          </div>
          <p class="text-sm text-slate-500 mb-2.5 hidden md:block">Jurnal pembelajaran kelas ${currentUser?.class}</p>
        </div>
        <div class="flex items-center gap-2">
          <button id="print-journal-btn" class="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 flex items-center gap-2 transition-all">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path>
            </svg>
            Cetak Jurnal Bulanan
          </button>
          <button id="add-journal-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg transition-all active:scale-95">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            Buat Jurnal Baru
          </button>
        </div>
      </div>

      <div class="space-y-8">
        ${sortedMonths.length === 0 ? `
          <div class="text-center py-12 bg-white rounded-2xl shadow-sm border border-slate-200">
            <div class="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <svg class="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
            </div>
            <p class="text-slate-500 mb-4">Belum ada jurnal</p>
            <button id="add-journal-first-btn" class="inline-flex px-4 py-2 btn-primary text-white rounded-xl">
              Buat Jurnal Pertama
            </button>
          </div>
        ` : sortedMonths.map(month => {
    const journalsInMonth = groupedJournals[month].sort((a, b) => new Date(b.journal_date) - new Date(a.journal_date));
    return `
            <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fadeIn">
              <div class="bg-slate-50 px-6 py-4 border-b border-slate-200 flex items-center justify-between">
                <h3 class="font-bold text-slate-800 flex items-center gap-2">
                  <span class="text-xl">📅</span> ${month}
                </h3>
                <span class="px-3 py-1 bg-white rounded-lg border border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  ${journalsInMonth.length} Jurnal
                </span>
              </div>
              <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                  <thead>
                    <tr class="text-xs font-bold text-slate-500 uppercase tracking-wider bg-white">
                      <th class="px-6 py-4 border-b border-slate-100 w-16 text-center">No</th>
                      <th class="px-6 py-4 border-b border-slate-100 w-48">Hari & Tanggal</th>
                      <th class="px-6 py-4 border-b border-slate-100">Isi Jurnal</th>
                      <th class="px-6 py-4 border-b border-slate-100 w-32 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50">
                    ${journalsInMonth.map((journal, idx) => `
                      <tr class="hover:bg-slate-50/50 transition-colors">
                        <td class="px-6 py-4 text-center text-slate-500 font-medium">${idx + 1}</td>
                        <td class="px-6 py-4">
                          <div class="font-semibold text-slate-800">${formatDate(journal.journal_date)}</div>
                          <div class="text-[10px] text-slate-400 uppercase mt-0.5">Kelas ${journal.journal_class}</div>
                        </td>
                        <td class="px-6 py-4">
                          <p class="text-slate-700 leading-relaxed line-clamp-2 hover:line-clamp-none transition-all cursor-default">
                            ${journal.journal_content}
                          </p>
                        </td>
                        <td class="px-6 py-4">
                          <div class="flex items-center justify-center gap-2">
                            <button class="edit-journal-btn p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Edit" data-id="${journal.__backendId || journal.id}">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                            </button>
                            <button class="delete-journal-btn p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Hapus" data-id="${journal.__backendId || journal.id}">
                              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                            </button>
                          </div>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          `;
  }).join('')}
      </div>
    </div>
  `;
}
