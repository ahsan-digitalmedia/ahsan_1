import { appState, updateState } from '../../core/state.js';
import { closeModal, showToast, generateId } from '../../core/utils.js';
import { parseCSV, downloadCSV } from '../../core/csv-util.js';

export function setupGuruStudentsHandlers() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    // Remove old listener if exists to prevent duplication
    if (contentArea._studentsHandler) {
        contentArea.removeEventListener('click', contentArea._studentsHandler);
    }

    const handler = async (e) => {
        // Edit Button
        const editBtn = e.target.closest('.edit-student-btn');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const student = appState.students.find(s =>
                String(s.__backendId) === String(id) || String(s.id) === String(id)
            );

            if (student) {
                updateState({ showModal: true, modalMode: 'edit', editingItem: { ...student } });
                window.dispatchEvent(new CustomEvent('app-state-changed'));
            }
            return;
        }

        // Delete Button
        const deleteBtn = e.target.closest('.delete-student-btn');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const student = appState.students.find(s =>
                String(s.__backendId || s.id) === String(id) ||
                String(s.id) === String(id)
            );
            if (student && confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
                try {
                    if (window.dataSdk) await window.dataSdk.delete(student);
                    showToast('Siswa berhasil dihapus');
                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                } catch (err) {
                    showToast('Gagal menghapus siswa', 'error');
                }
            }
            return;
        }

        // Add Button
        const addBtn = e.target.closest('#add-student-btn');
        if (addBtn) {
            updateState({ showModal: true, modalMode: 'add', editingItem: null });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
            return;
        }

        // Import CSV Button
        const importBtn = e.target.closest('#import-csv-btn');
        if (importBtn) {
            document.getElementById('import-csv-input').click();
            return;
        }

        // Download Template Button
        const downloadTemplateBtn = e.target.closest('#download-template-btn');
        if (downloadTemplateBtn) {
            const headers = ['Nama Siswa', 'NISN', 'NIS', 'Jenis Kelamin', 'Tanggal Lahir', 'Kelas', 'Nama Rombel'];

            // Get teacher's managed classes to provide better samples
            const managedClasses = (appState.currentUser?.class || '1A').split(',').map(c => c.trim()).filter(c => c);
            const firstClass = managedClasses[0] || '1A';
            const secondClass = managedClasses[1] || managedClasses[0] || '1B';

            const getLevel = (c) => (c.match(/^\d+/) || ['1'])[0];
            const getSuffix = (c) => c.replace(/^\d+/, '') || '-';

            const sampleData = [
                { 'Nama Siswa': 'Budi Santoso', 'NISN': '1234567890', 'NIS': '1001', 'Jenis Kelamin': 'L', 'Tanggal Lahir': '2015-05-20', 'Kelas': getLevel(firstClass), 'Nama Rombel': getSuffix(firstClass) },
                { 'Nama Siswa': 'Siti Aminah', 'NISN': '1234567891', 'NIS': '1002', 'Jenis Kelamin': 'P', 'Tanggal Lahir': '2015-06-15', 'Kelas': getLevel(secondClass), 'Nama Rombel': getSuffix(secondClass) }
            ];
            downloadCSV(headers, sampleData, 'Template_Siswa.csv');
            return;
        }
    };

    contentArea.addEventListener('click', handler);
    contentArea._studentsHandler = handler;

    // CSV File Change Handler
    const csvInput = document.getElementById('import-csv-input');
    if (csvInput) {
        csvInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target.result;
                try {
                    const expectedHeaders = ['Nama Siswa', 'NISN', 'NIS', 'Jenis Kelamin', 'Tanggal Lahir', 'Kelas', 'Nama Rombel'];
                    const data = parseCSV(text, expectedHeaders);

                    if (data.length === 0) {
                        showToast('File CSV kosong atau tidak valid', 'error');
                        return;
                    }

                    showToast(`Mengimpor ${data.length} siswa...`, 'info');

                    for (const row of data) {
                        const nisn = row['nisn'];
                        if (!nisn) continue;

                        const existingStudent = appState.students.find(s => s.student_nisn === nisn);
                        const studentData = {
                            id: existingStudent ? (existingStudent.id || existingStudent.__backendId) : generateId(),
                            __backendId: existingStudent?.__backendId,
                            student_name: row['nama siswa'],
                            student_nisn: nisn,
                            student_nis: row['nis'],
                            student_gender: row['jenis kelamin']?.toUpperCase() || 'L',
                            student_dob: row['tanggal lahir'],
                            student_class: (row['kelas'] || '') + (row['nama rombel'] || ''),
                            teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
                            type: 'student'
                        };

                        if (existingStudent) {
                            if (window.dataSdk) await window.dataSdk.update(studentData);
                        } else {
                            if (window.dataSdk) await window.dataSdk.create(studentData);
                        }
                    }

                    showToast(`${data.length} siswa berhasil diimpor`, 'success');
                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                } catch (err) {
                    showToast(err.message || 'Gagal mengimpor CSV', 'error');
                }
                csvInput.value = '';
            };
            reader.readAsText(file);
        };
    }

    if (appState.showModal) {
        const closeBtn = document.getElementById('close-student-modal');
        const cancelBtn = document.getElementById('cancel-student-btn');
        const saveBtn = document.getElementById('save-student-btn');

        if (closeBtn) closeBtn.onclick = closeModal;
        if (cancelBtn) cancelBtn.onclick = closeModal;

        if (saveBtn) {
            saveBtn.onclick = async () => {
                if (saveBtn.disabled) return;

                const name = document.getElementById('student-name')?.value;
                const nisn = document.getElementById('student-nisn')?.value;
                const nis = document.getElementById('student-nis')?.value;
                const gender = document.getElementById('student-gender')?.value;
                const dob = document.getElementById('student-dob')?.value;
                const studentClass = document.getElementById('student-class')?.value;

                if (!name || !nisn || !studentClass) {
                    showToast('Nama, NISN, dan Kelas wajib diisi', 'error');
                    return;
                }

                saveBtn.disabled = true;
                saveBtn.innerHTML = 'Menyimpan...';

                const studentData = {
                    student_name: name,
                    student_nisn: nisn,
                    student_nis: nis,
                    student_gender: gender,
                    student_dob: dob,
                    student_class: studentClass,
                    teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
                    type: 'student'
                };

                try {
                    if (appState.modalMode === 'add') {
                        studentData.id = generateId();
                        if (window.dataSdk) await window.dataSdk.create(studentData);
                        showToast('Siswa berhasil ditambahkan');
                    } else {
                        const originalId = appState.editingItem.id || appState.editingItem.__backendId;
                        studentData.id = originalId;
                        studentData.__backendId = appState.editingItem.__backendId;
                        if (window.dataSdk) await window.dataSdk.update(studentData);
                        showToast('Siswa berhasil diperbarui');
                    }
                    closeModal();
                } catch (err) {
                    showToast('Gagal menyimpan data: ' + err.message, 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Simpan Data';
                }
            };
        }
    }
}
