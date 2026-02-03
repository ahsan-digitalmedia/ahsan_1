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

                const managedClasses = (appState.currentUser?.class || '').split(',').map(c => c.trim()).filter(c => c);

                const isFlexibleMatch = (itemClass) => {
                    if (!itemClass) return false;
                    return managedClasses.some(mc => {
                        const ic = String(itemClass).trim();
                        const target = String(mc).trim();
                        if (ic === target) return true;
                        // Match if ic starts with target and then has a non-digit (e.g. '2' matches '2A')
                        return ic.startsWith(target) && !/^\d/.test(ic.substring(target.length));
                    });
                };

                // For teachers, filter data where teacher_id matches or where it's a student in their class
                if (type === 'student') {
                    return filteredByType.filter(s => s.teacher_id === teacherId || isFlexibleMatch(s.student_class));
                }

                // For other types, show data created by this teacher OR data matching their managed classes
                return filteredByType.filter(d => {
                    const isCreator = d.teacher_id === teacherId;
                    const itemClass = d.attendance_class || d.score_teacher_class || d.journal_class || d.modul_class || d.assignment_class;
                    return isCreator || isFlexibleMatch(itemClass);
                });
            };

            const configRecord = data.find(d => d.type === 'config');
            const newConfig = configRecord ? Object.assign({}, defaultConfig, configRecord) : Object.assign({}, defaultConfig);

            updateState({
                config: newConfig,
                teachers: data.filter(d => d.type === 'teacher'), // Admin sees all, Guru sees all (for now) or we can filter
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
