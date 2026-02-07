import './styles/main.css';
import { appState, updateState, defaultConfig } from './js/core/state.js';
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
            const isGuru = appState.currentUserType === 'guru' && appState.isLoggedIn;
            const teacherId = appState.currentUser?.__backendId || appState.currentUser?.id;

            const filterFn = (items, type) => {
                const filteredByType = items.filter(d => d.type === type);
                if (!isGuru) return filteredByType;

                // For teachers, strictly filter by teacher_id.
                // Each teacher only sees data they created/uploaded.
                return filteredByType.filter(d => d.teacher_id === teacherId);
            };

            const configRecord = data.find(d => d.type === 'config');
            const newConfig = configRecord ? Object.assign({}, defaultConfig, configRecord) : Object.assign({}, defaultConfig);

            const teachersData = data.filter(d => d.type === 'teacher');
            const filteredTeachers = isGuru ? teachersData.filter(d => d.id === teacherId || d.__backendId === teacherId) : teachersData;

            // Sync currentUser if logged in as guru to ensure we have latest fields (like created_at/joinDate)
            let updatedCurrentUser = appState.currentUser;
            if (isGuru) {
                const liveTeacherRecord = teachersData.find(d => d.id === teacherId || d.__backendId === teacherId);
                if (liveTeacherRecord) {
                    updatedCurrentUser = liveTeacherRecord;
                }
            }

            updateState({
                config: newConfig,
                teachers: filteredTeachers,
                currentUser: updatedCurrentUser,
                assignments: filterFn(data, 'assignment'),
                students: filterFn(data, 'student'),
                attendances: filterFn(data, 'attendance'),
                scores: filterFn(data, 'score'),
                teacherAttendances: filterFn(data, 'teacher_attendance'),
                journals: filterFn(data, 'journal'),
                modulAjars: filterFn(data, 'modul_ajar')
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
        }
    } else {
        await handleMigration(supabaseSdk);

        // RESTORE SESSION: Check for official Supabase session on load
        try {
            const session = await window.dataSdk.getSession();
            if (session?.user) {
                console.log('Restoring existing session for:', session.user.email);

                // Find matching teacher/admin profile
                const email = session.user.email;
                const isAdmin = email === (appState.config?.admin_email || 'admin@sekolah.id');
                const teacher = appState.teachers.find(t => t.email === email);

                if (isAdmin || teacher) {
                    updateState({
                        isLoggedIn: true,
                        currentUser: isAdmin ? { name: 'Administrator', email, role: 'admin' } : { ...teacher },
                        currentUserType: isAdmin ? 'admin' : 'guru',
                        currentPage: isAdmin ? 'dashboard' : 'guru-dashboard'
                    });
                }
            }
        } catch (sessionErr) {
            console.error('Failed to restore session:', sessionErr);
        }
    }

    // Force sidebar to be closed at start (Universal Drawer)
    updateState({ sidebarOpen: false });

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

// Global click listener to close dropdowns when clicking outside
window.addEventListener('click', (e) => {
    const dropdowns = document.querySelectorAll('.js-dropdown');
    dropdowns.forEach(el => {
        if (!el.classList.contains('hidden')) {
            const toggleBtn = el.previousElementSibling;
            if (!el.contains(e.target) && (!toggleBtn || !toggleBtn.contains(e.target))) {
                el.classList.add('hidden');
            }
        }
    });
});
