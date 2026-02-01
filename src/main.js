import './styles/main.css';
import { appState, updateState } from './js/core/state.js';
import { LocalDataSdk } from './js/core/sdk.js';
import { renderLoginPage } from './js/pages/login.js';
import { setupLoginHandlers } from './js/handlers/login.js';
import { renderAdminApp } from './js/pages/admin-shell.js';
import { renderGuruApp } from './js/pages/guru-shell.js';
import { setupMainAppHandlers } from './js/handlers/main.js';
import { setupPageHandlers } from './js/handlers/page-router.js';
import { SupabaseDataSdk } from './js/core/supabase-sdk.js';
import { SUPABASE_CONFIG } from './js/core/config.js';

// Global render function
export function render() {
    const app = document.getElementById('app');
    if (appState.currentPage === 'login') {
        app.innerHTML = renderLoginPage();
        setupLoginHandlers();
    } else {
        if (appState.currentUserType === 'admin') {
            app.innerHTML = renderAdminApp();
        } else if (appState.currentUserType === 'guru') {
            app.innerHTML = renderGuruApp();
        }
        setupMainAppHandlers();
        setupPageHandlers();
    }
}

// Attach to window for legacy onclick handlers if any (though we aim to move away)
window.render = render;
window.addEventListener('app-state-changed', render);

async function initApp() {
    console.log('Initializing Application with Supabase...');

    // Initialize Supabase SDK
    const supabaseSdk = new SupabaseDataSdk(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    window.dataSdk = supabaseSdk;

    const dataHandler = {
        onDataChanged(data) {
            updateState({
                teachers: data.filter(d => d.type === 'teacher'),
                assignments: data.filter(d => d.type === 'assignment'),
                students: data.filter(d => d.type === 'student'),
                attendances: data.filter(d => d.type === 'attendance'),
                scores: data.filter(d => d.type === 'score'),
                teacherAttendances: data.filter(d => d.type === 'teacher_attendance'),
                journals: data.filter(d => d.type === 'journal'),
                modulAjars: data.filter(d => d.type === 'modul_ajar')
            });

            if (appState.currentPage !== 'login' && appState.isLoggedIn) {
                render();
            }
        }
    };

    const initResult = await window.dataSdk.init(dataHandler);

    if (!initResult.isOk) {
        console.error('Core data initialization failed.');
        if (initResult.status === 401) {
            console.warn('Authentication error detected. Please refresh the page to try again with a clean session.');
            // We don't render yet if data is critical, but for now we proceed to at least show the login
        }
    } else {
        await handleMigration(supabaseSdk);
    }

    // Force sidebar to be closed at start (Universal Drawer)
    updateState({ sidebarOpen: false });

    // Handle resize - no auto logic needed anymore for universal drawer, 
    // but we can keep a listener to close it if window gets huge just in case, 
    // or simply remove the complex logic. 
    // For now, let's keep it clean: no auto-opening/closing on resize.

    render();
}

async function handleMigration(supabaseSdk) {
    const migrationFlag = localStorage.getItem('sdn1_poncowati_migrated');
    if (migrationFlag === 'true') return;

    const localDataRaw = localStorage.getItem('sdn1_poncowati_data');
    if (!localDataRaw) return;

    try {
        const localData = JSON.parse(localDataRaw);
        if (localData.length === 0) return;

        console.log(`Migrating ${localData.length} items to Supabase...`);

        // Migration logic: send each item to Supabase
        // We do this one by one to avoid large payload issues in a simple loop
        for (const item of localData) {
            await supabaseSdk.create(item);
        }

        localStorage.setItem('sdn1_poncowati_migrated', 'true');
        console.log('Migration completed successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
    }
}

document.addEventListener('DOMContentLoaded', initApp);
