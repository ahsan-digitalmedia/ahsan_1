import { appState } from '../../core/state.js';
import { formatDate } from '../../core/utils.js';

export function renderGuruJournalPage() {
    const { journals, currentUser } = appState;
    const classJournals = journals.filter(j => (j.type === 'journal' || !j.type) && j.journal_class === currentUser?.class && j.journal_teacher_nip === currentUser?.nip);

    return `
    <div class="animate-fadeIn">
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <p class="text-slate-500">Jurnal pembelajaran kelas ${currentUser?.class}</p>
        </div>
        <button id="add-journal-btn" class="btn-primary px-5 py-2.5 rounded-xl text-white font-medium flex items-center gap-2 shadow-lg">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
          </svg>
          Buat Jurnal Baru
        </button>
      </div>

      <div class="grid grid-cols-1 gap-6">
        ${classJournals.length === 0 ? `
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
        ` : classJournals.slice().reverse().map((journal, i) => `
          <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-all morph-scale animate-fadeIn" style="opacity: 0; animation-delay: ${i * 0.1}s;">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <h3 class="font-semibold text-slate-800 mb-1 flex items-center gap-2">
                    <span class="text-lg">📅</span>
                    ${formatDate(journal.journal_date)}
                  </h3>
                  <p class="text-sm text-slate-500">Kelas ${journal.journal_class}</p>
                </div>
              </div>
              <p class="text-slate-700 mb-4 font-medium leading-relaxed">${journal.journal_content}</p>
              <div class="flex gap-2">
                <button class="edit-journal-btn px-4 py-2 text-sm border border-slate-200 text-slate-600 rounded-xl hover:bg-slate-50 transition-colors" data-id="${journal.__backendId || journal.id}">
                  Edit
                </button>
                <button class="delete-journal-btn px-4 py-2 text-sm border border-red-100 text-red-500 rounded-xl hover:bg-red-50 transition-colors" data-id="${journal.__backendId || journal.id}">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
