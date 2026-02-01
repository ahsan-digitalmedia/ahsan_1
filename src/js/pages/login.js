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
      
      <div class="glass w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-fadeIn relative z-10">
        <!-- Header -->
        <div class="text-center p-6 pb-4">
          <div class="w-20 h-20 gradient-blue rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
            </svg>
          </div>
          <h1 id="login-title" class="text-xl font-bold text-slate-800 mb-1">${config.app_title}</h1>
          <p id="login-school" class="text-sm text-slate-500">${config.school_name}</p>
        </div>
        
        <!-- Tab Navigation -->
        <div class="px-6 pt-2 pb-6">
          <div class="flex gap-2 p-1.5 bg-white/20 rounded-2xl backdrop-blur-md border border-white/30">
            <button id="tab-admin" class="login-tab flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all morph-transition flex items-center justify-center gap-2 active:scale-95"
              data-type="admin" style="background: rgba(255,255,255,0.9); color: #0066FF;">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
              </svg>
              Admin
            </button>
            <button id="tab-guru" class="login-tab flex-1 px-4 py-2.5 rounded-xl font-medium text-sm transition-all morph-transition flex items-center justify-center gap-2 active:scale-95"
              data-type="guru" style="background: rgba(255,255,255,0.2); color: #9CA3AF;">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
              </svg>
              Guru
            </button>
          </div>
        </div>
        
        <!-- Content -->
        <div class="px-6 pb-6">
          <!-- Admin Login -->
          <form id="login-form" class="space-y-5 login-content" data-type="admin">
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
          
          <!-- Guru Login -->
          <form id="guru-form" class="space-y-5 login-content hidden" data-type="guru">
            <div class="animate-fadeIn stagger-1" style="opacity: 1;">
              <label class="block text-sm font-medium text-slate-700 mb-2">Email Guru</label>
              <div class="relative">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                </span>
                <input type="email" id="guru-email" placeholder="guru@sekolah.id" 
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
                <input type="password" id="guru-password" placeholder="••••••••" 
                   class="input-modern w-full pl-12 pr-4 py-3 border border-slate-200 rounded-xl bg-white/50 focus:bg-white transition-all" required>
              </div>
            </div>
            
            <div id="guru-error" class="hidden p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm text-center"></div>
            
            <button type="submit" class="btn-primary w-full py-3 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2">
              <span id="guru-btn-text">Masuk sebagai Guru</span>
              <span id="guru-btn-loading" class="hidden">
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
            <strong>Aplikasi ini dikembangan Oleh Tri Susilo, A.Md</strong><br>
            Admin: admin@sekolah.id / admin123<br>
            Guru: guru@sekolah.id / guru123
          </div>
        </div>
      </div>
    </div>
  `;
}
