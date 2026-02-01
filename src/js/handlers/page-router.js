import { appState } from '../core/state.js';
import { setupGuruDashboardHandlers } from './guru/dashboard.js';
import { setupAdminDashboardHandlers } from './admin/dashboard.js';
import { setupAdminTeachersHandlers } from './admin/teachers.js';
import { setupAdminSettingsHandlers } from './admin/settings.js';
import { setupGuruStudentsHandlers } from './guru/students.js';
import { setupGuruAttendanceHandlers } from './guru/attendance.js';
import { setupGuruScoresHandlers } from './guru/scores.js';
import { setupModulAjarHandlers } from './guru/modul-ajar.js';
import { setupGuruJournalHandlers } from './guru/journal.js';
import { setupGuruAssignmentsHandlers } from './guru/assignments.js';
import { setupGuruProfileHandlers } from './guru/profile.js';
import { setupGuruTeacherAttendanceHandlers } from './guru/teacher-attendance.js';

export function setupPageHandlers() {
    const page = appState.currentPage;
    console.log(`Setting up handlers for page: ${page}`);

    switch (page) {
        case 'guru-dashboard':
            setupGuruDashboardHandlers();
            break;
        case 'dashboard':
            setupAdminDashboardHandlers();
            break;
        case 'teachers':
            setupAdminTeachersHandlers();
            break;
        case 'settings':
            setupAdminSettingsHandlers();
            break;
        case 'guru-students':
            setupGuruStudentsHandlers();
            break;
        case 'guru-attendance':
            setupGuruAttendanceHandlers();
            break;
        case 'guru-scores':
            setupGuruScoresHandlers();
            break;
        case 'guru-modul-ajar':
            setupModulAjarHandlers();
            break;
        case 'guru-journal':
            setupGuruJournalHandlers();
            break;
        case 'guru-assignments':
            setupGuruAssignmentsHandlers();
            break;
        case 'guru-profile':
            setupGuruProfileHandlers();
            break;
        case 'guru-teacher-attendance':
            setupGuruTeacherAttendanceHandlers();
            break;
        // Add more page handlers here
    }
}
