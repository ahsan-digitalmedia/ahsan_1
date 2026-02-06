import { appState, defaultConfig } from '../core/state.js';
import { getGuruPageTitle, getGuruPageContent } from './guru-router.js';
import { renderGuruModal } from './guru/modals.js';

export function renderGuruApp() {
  const config = appState.config || defaultConfig;
  const sidebarOpen = appState.sidebarOpen;
  const currentUser = appState.currentUser;
  const title = getGuruPageTitle();

  return `
    <div class="h-full w-full flex bg-slate-50 relative overflow-hidden">
      <!-- Main Content -->
      <div class="flex-1 flex flex-col h-full overflow-hidden">
        <!-- Top Navbar -->
        <header class="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Home Button (Modern) -->
              <button data-page="guru-dashboard" class="sidebar-item group flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white transition-all shadow-sm hover:shadow-md hover:scale-105" title="Ke Dashboard">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                <span class="font-bold text-sm">Home</span>
              </button>
              
              <div>
                <h2 id="page-title" class="text-lg font-bold text-slate-800 leading-tight">${title}</h2>
                <div id="breadcrumb" class="hidden sm:flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                <span class="font-medium text-purple-600">${currentUser?.school_name || 'SDN 1 PONCOWATI'}</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
                <span id="breadcrumb-current">${title}</span>
              </div>
            </div>
            
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
                <button data-page="guru-profile" class="sidebar-item flex items-center gap-3 hover:bg-slate-50 p-1.5 rounded-xl transition-colors mr-2">
                  <div class="w-10 h-10 gradient-purple rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                    ${currentUser ? currentUser.name.charAt(0).toUpperCase() : 'G'}
                  </div>
                  <div class="hidden lg:block text-left">
                    <p class="text-sm font-semibold text-slate-800">${currentUser ? currentUser.name : 'Guru'}</p>
                    <p class="text-xs text-slate-500">${currentUser?.subject || 'Guru'}</p>
                  </div>
                </button>

                <!-- Header Menu Dropdown -->
                <div class="relative">
                  <button onclick="document.getElementById('header-menu-dropdown').classList.toggle('hidden')" class="p-2 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors mr-2" title="Menu Cepat">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                  </button>
                  <!-- Dropdown Content -->
                  <div id="header-menu-dropdown" class="js-dropdown hidden absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fadeIn origin-top-right">
                    <p class="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Akses Cepat</p>
                    <div class="space-y-1">
                      <button data-page="guru-profile" onclick="document.getElementById('header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-purple-50 text-slate-600 hover:text-purple-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Profil Saya</span>
                      </button>
                      <button data-page="guru-students" onclick="document.getElementById('header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3.914a3 3 0 01-2.973-2.665A9.969 9.969 0 0112 15c4.744 0 8.268 1.34 9.8 2.646"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Data Siswa</span>
                      </button>
                      <button data-page="guru-attendance" onclick="document.getElementById('header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-green-50 text-slate-600 hover:text-green-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Absensi</span>
                      </button>
                      <button data-page="guru-scores" onclick="document.getElementById('header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-orange-50 text-slate-600 hover:text-orange-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Nilai</span>
                      </button>
                      <button data-page="guru-modul-ajar" onclick="document.getElementById('header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-purple-50 text-slate-600 hover:text-purple-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Modul Ajar</span>
                      </button>
                       <button data-page="guru-journal" onclick="document.getElementById('header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-pink-50 text-slate-600 hover:text-pink-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center group-hover:bg-pink-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Jurnal</span>
                      </button>
                      
                      <div class="h-px bg-slate-100 my-1"></div>
                      
                      <button id="logout-btn" class="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-red-50 text-slate-600 hover:text-red-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Keluar</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Content Area -->
        <main id="content-area" class="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          ${getGuruPageContent()}
        </main>
      </div>
      
      <!-- Modals -->
      <div id="modal-container">
        ${appState.showModal ? renderGuruModal() : ''}
      </div>
    </div>
  `;
}
