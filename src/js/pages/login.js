import { appState, defaultConfig } from '../core/state.js';

export function renderLoginPage() {
  const config = appState.config || defaultConfig;
  return `
    <div class="min-h-full w-full flex items-center justify-center p-4" style="background: linear-gradient(135deg, #0066FF 0%, #00D4FF 50%, #8B5CF6 100%);">
      <div class="absolute inset-0 overflow-hidden">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      <!-- Announcement Banner (Modern) -->
      ${config.announcement ? `
        <div class="fixed top-0 left-0 right-0 z-[60] animate-slideDown">
          <div class="bg-white/10 backdrop-blur-xl border-b border-white/20 px-4 py-3 shadow-2xl">
            <div class="max-w-7xl mx-auto flex items-center justify-center gap-3">
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <svg class="w-4 h-4 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z"></path>
                </svg>
              </div>
              <div class="overflow-hidden relative flex-1">
                <p class="text-white text-base font-bold tracking-wide whitespace-nowrap animate-marquee">
                  ${config.announcement}
                </p>
              </div>
              <div class="flex-shrink-0 w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            </div>
          </div>
        </div>
      ` : ''}
      
      <div class="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fadeIn relative z-10 ${config.announcement ? 'mt-12' : ''}">
        <!-- Header -->
        <div class="text-center p-6 pb-4">
          <div class="w-20 h-20 gradient-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <h1 id="login-title" class="text-xl font-bold text-slate-800 mb-1">${config.app_title}</h1>
          <p id="login-version" class="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg inline-block mt-1">${config.app_version || 'v1.0.0'}</p>
        </div>
        
        <!-- Tab Navigation -->
        <div class="px-6 pt-2 pb-6">
          <div class="flex gap-2 p-1.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
            <button id="tab-guru" class="login-tab flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all morph-transition flex items-center justify-center gap-2 active:scale-95"
              data-type="guru" style="background: rgba(255,255,255,0.9); color: #0066FF;">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              Guru
            </button>
            <button id="tab-admin" class="login-tab flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all morph-transition flex items-center justify-center gap-2 active:scale-95"
              data-type="admin" style="background: rgba(255,255,255,0.2); color: #9CA3AF;">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Admin
            </button>
          </div>
        </div>
        
        <!-- Content -->
        <div class="px-6 pb-6">
          <!-- Guru Login -->
          <form id="guru-form" class="space-y-5 login-content" data-type="guru">
            <div id="guru-login-fields" class="space-y-5">
              <div class="animate-fadeIn stagger-1" style="opacity: 1;">
                <label class="block text-sm font-medium text-slate-700 mb-2">Email Guru</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </span>
                  <input type="email" id="guru-email" placeholder="guru@sekolah.id" 
                    class="input-modern w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white/50 focus:bg-white transition-all">
                </div>
              </div>
              
              <div class="animate-fadeIn stagger-2" style="opacity: 1;">
                <label class="block text-sm font-medium text-slate-700 mb-2">Kata Sandi</label>
                <div class="relative">
                  <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                    </svg>
                  </span>
                  <input type="password" id="guru-password" placeholder="••••••••" 
                     class="input-modern w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white/50 focus:bg-white transition-all">
                </div>
              </div>

              <!-- Remember Me (Guru) -->
              <div class="flex items-center justify-between px-1">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <div class="relative w-5 h-5 flex items-center justify-center">
                    <input type="checkbox" id="guru-remember" ${appState.rememberMe ? 'checked' : ''} class="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer shadow-sm">
                    <svg class="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span class="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Ingat Saya</span>
                </label>
              </div>
            </div>

            <!-- Registration Fields (Hidden by default) -->
            <div id="guru-reg-fields" class="space-y-4 hidden">
              <div class="animate-fadeIn" style="opacity: 1;">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Nama Lengkap</label>
                <input type="text" id="reg-name" placeholder="Nama Lengkap" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white/50">
              </div>
              <div class="animate-fadeIn" style="opacity: 1;">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Email Aktif</label>
                <input type="email" id="reg-email" placeholder="email@sekolah.id" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white/50">
              </div>
              <div class="animate-fadeIn" style="opacity: 1;">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Nomor HP / WA</label>
                <input type="text" id="reg-phone" placeholder="0812XXXXXXXX" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white/50">
              </div>
              <div class="animate-fadeIn" style="opacity: 1;">
                <label class="block text-sm font-medium text-slate-700 mb-1.5">Buat Password</label>
                <input type="password" id="reg-password" placeholder="••••••••" class="input-modern w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white/50">
              </div>
            </div>
            
            <div id="guru-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"></div>
            
            <button type="submit" id="guru-submit-btn" class="btn-primary w-full py-3 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95">
              <span id="guru-btn-text">Masuk sebagai Guru</span>
              <span id="guru-btn-loading" class="hidden">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            </button>

            <div class="text-center mt-4">
              <button type="button" id="toggle-reg-btn" class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                Belum punya akun? Daftar Sekarang
              </button>
            </div>
          </form>

          <!-- Admin Login -->
          <form id="login-form" class="space-y-5 login-content hidden" data-type="admin">
            <div class="animate-fadeIn stagger-1" style="opacity: 1;"> <!-- Set opacity 1 as default in modules to avoid flicker if animation fails -->
              <label class="block text-sm font-medium text-slate-700 mb-2">Email Admin</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"></path>
                  </svg>
                </span>
                <input type="email" id="login-email" placeholder="admin@sekolah.id" 
                  class="input-modern w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white/50 focus:bg-white transition-all" required>
              </div>
            </div>
            
            <div class="animate-fadeIn stagger-2" style="opacity: 1;">
              <label class="block text-sm font-medium text-slate-700 mb-2">Kata Sandi</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
                  </svg>
                </span>
                <input type="password" id="login-password" placeholder="••••••••" 
                   class="input-modern w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white/50 focus:bg-white transition-all" required>
              </div>
            </div>

            <!-- Remember Me (Admin) -->
            <div class="flex items-center justify-between px-1">
                <label class="flex items-center gap-2 cursor-pointer group">
                  <div class="relative w-5 h-5 flex items-center justify-center">
                    <input type="checkbox" id="admin-remember" ${appState.rememberMe ? 'checked' : ''} class="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded-lg checked:bg-blue-600 checked:border-blue-600 transition-all cursor-pointer shadow-sm">
                    <svg class="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <span class="text-xs font-bold text-slate-600 group-hover:text-blue-600 transition-colors">Ingat Saya</span>
                </label>
            </div>
            
            <div id="login-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"></div>
            
            <button type="submit" class="btn-primary w-full py-3 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2">
              <span id="login-btn-text">Masuk sebagai Admin</span>
              <span id="login-btn-loading" class="hidden">
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            </button>
          </form>
        </div>
        
        <!-- Demo Info -->
        <div class="px-6 pb-6 pt-4 border-t border-white/20 backdrop-blur-md">
          <div id="demo-info" class="text-xs text-slate-600 bg-white/60 rounded-xl p-3 text-center leading-relaxed">
            <strong>Aplikasi ini dikembangan Oleh Tri Susilo, A.Md</strong>
          </div>
        </div>
      </div>
    </div>
  `;
}
