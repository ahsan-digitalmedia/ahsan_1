import { appState, defaultConfig } from '../core/state.js';
import { getPageTitle, getPageContent } from './admin-router.js';
import { renderAdminModal } from './admin/modals.js';

export function renderAdminApp() {
  const config = appState.config || defaultConfig;
  const sidebarOpen = appState.sidebarOpen;
  const currentUser = appState.currentUser;
  const title = getPageTitle();

  return `
    <div class="h-full w-full flex bg-slate-50 relative overflow-hidden">
      <!-- Main Content -->
      <div class="flex-1 flex flex-col h-full overflow-hidden">
        <!-- Top Navbar -->
        <header class="bg-white border-b border-slate-200 px-6 py-4 shrink-0">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <!-- Home Button (Modern) -->
              <button data-page="dashboard" class="sidebar-item group flex items-center justify-center gap-2 px-4 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm hover:shadow-md hover:scale-105" title="Ke Dashboard">
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h4a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z"></path>
                </svg>
                <span class="font-bold text-sm">Home</span>
              </button>
                
                <div>
                  <h2 id="page-title" class="text-lg font-bold text-slate-800 leading-tight">${title}</h2>
                  <div id="breadcrumb" class="hidden sm:flex items-center gap-2 text-sm text-slate-500 mt-0.5">
                    <span>Admin</span>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                    <span id="breadcrumb-current">${title}</span>
                  </div>
                </div>
              </div>
            
            <div class="flex items-center gap-4">
              <!-- Search -->
              <div class="hidden md:block relative">
                <svg class="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
                <input type="text" placeholder="Cari..." class="input-modern pl-10 pr-4 py-2 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white w-64 text-sm">
              </div>
              
              <!-- User Profile -->
              <div class="flex items-center gap-3 pl-4 border-l border-slate-200">
                <div class="w-10 h-10 gradient-blue rounded-xl flex items-center justify-center text-white font-semibold shadow-md">
                  ${currentUser ? currentUser.name.charAt(0).toUpperCase() : 'A'}
                </div>
                <div class="hidden md:block mr-2">
                  <p class="text-sm font-semibold text-slate-800">${currentUser ? currentUser.name : 'Administrator'}</p>
                  <p class="text-xs text-slate-500">Admin</p>
                </div>

                <!-- Header Menu Dropdown -->
                <div class="relative">
                  <button onclick="document.getElementById('admin-header-menu-dropdown').classList.toggle('hidden')" class="p-2 rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-800 transition-colors mr-2" title="Menu Cepat">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                       <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
                    </svg>
                  </button>
                  <!-- Dropdown Content -->
                  <div id="admin-header-menu-dropdown" class="js-dropdown hidden absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-2 z-50 animate-fadeIn origin-top-right">
                    <p class="px-3 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">Akses Cepat</p>
                    <div class="space-y-1">
                      <button data-page="teachers" onclick="document.getElementById('admin-header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Data Guru</span>
                      </button>
                      <button data-page="reports" onclick="document.getElementById('admin-header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-green-50 text-slate-600 hover:text-green-600 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-green-100 text-green-600 flex items-center justify-center group-hover:bg-green-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Laporan</span>
                      </button>
                      <button data-page="settings" onclick="document.getElementById('admin-header-menu-dropdown').classList.add('hidden')" class="sidebar-item w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-800 transition-colors text-left group">
                        <div class="w-8 h-8 rounded-lg bg-slate-200 text-slate-600 flex items-center justify-center group-hover:bg-slate-600 group-hover:text-white transition-colors">
                           <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path></svg>
                        </div>
                        <span class="text-sm font-medium">Pengaturan</span>
                      </button>
                    </div>
                  </div>
                </div>
                
                <button id="logout-btn" class="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        
        <!-- Content Area -->
        <main id="content-area" class="flex-1 overflow-y-auto p-4 lg:p-6 pb-24 lg:pb-6">
          ${getPageContent()}
        </main>
      </div>
    </div>
    ${appState.showModal ? renderAdminModal() : ''}
    `;
}
