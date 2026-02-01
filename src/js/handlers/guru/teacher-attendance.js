import { appState } from '../../core/state.js';
import { showToast, generateId } from '../../core/utils.js';

export function setupGuruTeacherAttendanceHandlers() {
    const { teacherAttendances, currentUser } = appState;
    const recordBtn = document.getElementById('record-teacher-attendance-btn');

    if (recordBtn) {
        recordBtn.onclick = async () => {
            if (recordBtn.disabled) return;
            recordBtn.disabled = true;

            const today = new Date().toISOString().split('T')[0];
            const existing = teacherAttendances.find(a => a.teacher_nip === currentUser?.nip && a.teacher_attendance_date === today);

            if (existing) {
                showToast('Anda sudah mencatatkan kehadiran hari ini', 'info');
                recordBtn.disabled = false;
                return;
            }

            const attendanceData = {
                id: generateId(),
                teacher_nip: currentUser?.nip,
                teacher_name: currentUser?.name,
                teacher_attendance_date: today,
                teacher_attendance_status: 'hadir',
                teacher_attendance_class: currentUser?.class,
                type: 'teacher_attendance'
            };

            try {
                if (window.dataSdk) {
                    await window.dataSdk.create(attendanceData);
                    showToast('Kehadiran berhasil dicatat', 'success');
                }
            } catch (err) {
                showToast('Gagal mencatat kehadiran', 'error');
                recordBtn.disabled = false;
            }
        };
    }
}
