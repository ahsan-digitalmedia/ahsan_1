import { appState, defaultConfig } from '../../core/state.js';

export function renderSettingsPage() {
  const config = appState.config || defaultConfig;
  const { currentUser } = appState;

  return `
    <div class="animate-fadeIn max-w-2xl">
      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 class="font-semibold text-slate-800">Pengaturan Aplikasi</h3>
          <p class="text-xs text-slate-500 mt-1 font-medium">Konfigurasi identitas dan preferensi sistem sekolah</p>
        </div>
        <div class="p-6 space-y-6">
          <div class="group">
            <label class="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">Judul Aplikasi</label>
            <input type="text" id="settings-title" value="${config.app_title}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm" placeholder="Cth: Aplikasi Guru SD">
          </div>
          <div class="group">
            <label class="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">Versi Aplikasi</label>
            <input type="text" id="settings-version" value="${config.app_version || 'v1.0.0'}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm" placeholder="Cth: v1.0.0">
          </div>
          <div class="group">
            <label class="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">Nomor WhatsApp Admin</label>
            <input type="text" id="settings-whatsapp" value="${config.admin_whatsapp || ''}" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm" placeholder="Cth: 08123456789 (Tanpa + atau -)">
          </div>
          <div class="group">
            <label class="block text-sm font-semibold text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">Pengumuman / Teks Berjalan</label>
            <textarea id="settings-announcement" class="input-modern w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm h-24 resize-none" placeholder="Masukkan pengumuman yang akan muncul di halaman login...">${config.announcement || ''}</textarea>
            <p class="text-[10px] text-slate-400 mt-1.5">* Kosongkan jika tidak ingin ada pengumuman</p>
          </div>
          <button id="save-settings-btn" class="btn-primary w-full md:w-auto px-8 py-3 rounded-xl text-white font-bold shadow-lg hover:shadow-blue-200/50 transition-all active:scale-[0.98]">
            Simpan Konfigurasi
          </button>
        </div>
      </div>

      <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mt-8">
        <div class="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 class="font-semibold text-slate-800">Informasi Akun Administrator</h3>
        </div>
        <div class="p-6">
          <div class="flex items-center gap-5">
            <div class="w-20 h-20 gradient-blue rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-xl border-4 border-white">
              ${currentUser ? currentUser.name.charAt(0).toUpperCase() : 'A'}
            </div>
            <div>
              <p class="text-xl font-bold text-slate-800">${currentUser ? currentUser.name : 'Administrator'}</p>
              <p class="text-sm text-slate-500 font-medium mb-1 leading-none">${currentUser ? currentUser.email : 'admin@sekolah.id'}</p>
              <span class="inline-flex px-3 py-1 text-[10px] font-bold rounded-lg status-active text-white uppercase tracking-wider shadow-sm">Super Admin</span>
            </div>
          </div>

          <div class="mt-8 pt-6 border-t border-slate-100 space-y-5">
            <h4 class="text-sm font-bold text-slate-800 flex items-center gap-2">
                <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                Keamanan Akun
            </h4>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="group">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1">Email Baru</label>
                    <input type="email" id="settings-admin-email" value="${config.admin_email || 'admin@sekolah.id'}" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm font-medium bg-slate-50 focus:bg-white">
                </div>
                <div class="group">
                    <label class="block text-[10px] font-bold text-slate-500 uppercase ml-1 mb-1">Password Baru</label>
                    <input type="password" id="settings-admin-password" placeholder="••••••••" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-100 focus:border-blue-400 transition-all text-sm font-medium bg-slate-50 focus:bg-white">
                    <p class="text-[9px] text-slate-400 mt-1 font-medium">* Kosongkan password baru jika tidak ingin diubah</p>
                </div>
            </div>

            <div class="group p-4 bg-orange-50 rounded-2xl border border-orange-100">
                <label class="block text-[10px] font-bold text-orange-600 uppercase ml-1 mb-1">Konfirmasi Password Saat Ini *</label>
                <div class="flex gap-3">
                    <input type="password" id="settings-admin-old-password" placeholder="Masukkan password lama untuk konfirmasi" class="input-modern flex-1 px-4 py-2.5 border border-orange-200 rounded-xl focus:ring-4 focus:ring-orange-100 focus:border-orange-400 transition-all text-sm font-medium placeholder:text-orange-300">
                    <button id="update-admin-btn" class="shrink-0 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-md active:scale-95 disabled:opacity-50">
                        Perbarui Akun
                    </button>
                </div>
                <p class="text-[9px] text-orange-400 mt-2 font-medium leading-tight">
                    <svg class="w-3 h-3 inline mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    Wajib mengisi Password Lama untuk setiap perubahan email atau password.
                </p>
            </div>
          </div>

          <div class="mt-8 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 flex gap-4">
             <div class="shrink-0 w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-500 shadow-sm">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
             </div>
             <div>
                <p class="text-sm text-blue-800 font-bold mb-1">Pusat Kendali Akses</p>
                <p class="text-xs text-blue-700/80 leading-relaxed">
                  Hanya Administrator Utama yang dapat mengelola kredensial dan mendaftarkan akun guru baru. Jaga kerahasiaan password Anda demi keamanan data sekolah.
                </p>
             </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
