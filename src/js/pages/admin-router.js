import { appState } from '../core/state.js';
import { renderAdminDashboard } from './admin/dashboard.js';
import { renderTeachersPage } from './admin/teachers.js';
import { renderReportsPage } from './admin/reports.js';
import { renderSettingsPage } from './admin/settings.js';

export function getPageTitle() {
    const titles = {
        dashboard: 'Dashboard',
        teachers: 'Manajemen Data Guru',
        reports: 'Laporan',
        settings: 'Pengaturan'
    };
    return titles[appState.currentPage] || 'Dashboard';
}

export function getPageContent() {
    switch (appState.currentPage) {
        case 'dashboard': return renderAdminDashboard();
        case 'teachers': return renderTeachersPage();
        case 'reports': return renderReportsPage();
        case 'settings': return renderSettingsPage();
        default: return '<div>Admin Dashboard (In Progress)</div>';
    }
}
