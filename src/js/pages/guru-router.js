import { appState } from '../core/state.js';
import { renderGuruDashboard } from './guru/dashboard.js';
import { renderGuruStudentsPage } from './guru/students.js';
import { renderGuruAttendancePage } from './guru/attendance.js';
import { renderGuruScoresPage } from './guru/scores.js';
import { renderModulAjarPage } from './guru/modul-ajar.js';
import { renderGuruJournalPage } from './guru/journal.js';
import { renderGuruAssignmentsPage } from './guru/assignments.js';
import { renderGuruProfilePage } from './guru/profile.js';
import { renderGuruTeacherAttendancePage } from './guru/teacher-attendance.js';

export function getGuruPageTitle() {
    const titles = {
        'guru-dashboard': 'Dashboard Utama',
        'guru-students': 'Daftar Siswa',
        'guru-attendance': 'Absensi Siswa',
        'guru-scores': 'Rekap Nilai',
        'guru-modul-ajar': 'Modul Ajar Pembelajaran',
        'guru-journal': 'Jurnal Pembelajaran',
        'guru-assignments': 'Tugas & Evaluasi',
        'guru-profile': 'Profil Saya',
        'guru-teacher-attendance': 'Kehadiran Guru'
    };
    return titles[appState.currentPage] || 'Portal Guru';
}

export function getGuruPageContent() {
    switch (appState.currentPage) {
        case 'guru-dashboard': return renderGuruDashboard();
        case 'guru-students': return renderGuruStudentsPage();
        case 'guru-attendance': return renderGuruAttendancePage();
        case 'guru-scores': return renderGuruScoresPage();
        case 'guru-modul-ajar': return renderModulAjarPage();
        case 'guru-journal': return renderGuruJournalPage();
        case 'guru-assignments': return renderGuruAssignmentsPage();
        case 'guru-profile': return renderGuruProfilePage();
        case 'guru-teacher-attendance': return renderGuruTeacherAttendancePage();
        default: return renderGuruDashboard();
    }
}
