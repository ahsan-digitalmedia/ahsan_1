import { appState, updateState } from '../../core/state.js';
import { closeModal, showToast, generateId } from '../../core/utils.js';
import { parseCSV, downloadCSV } from '../../core/csv-util.js';

export function setupGuruStudentsHandlers() {
    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.addEventListener('click', async (e) => {
            // Edit Button
            // Edit Button
            const editBtn = e.target.closest('.edit-student-btn');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                console.log('Edit clicked for ID:', id);

                // Robust find logic: check string equality for both id and __backendId
                const student = appState.students.find(s =>
                    String(s.__backendId) === String(id) || String(s.id) === String(id)
                );

                if (student) {
                    console.log('Found student:', student);
                    updateState({ showModal: true, modalMode: 'edit', editingItem: student });
                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                } else {
                    console.error('Student not found for ID:', id);
                    console.log('Available students:', appState.students);
                    alert('Gagal membuka edit: Data siswa tidak ditemukan di memori.');
                }
                return;
            }

            // Delete Button
            const deleteBtn = e.target.closest('.delete-student-btn');
            if (deleteBtn) {
                if (confirm('Apakah Anda yakin ingin menghapus siswa ini?')) {
                    const id = deleteBtn.getAttribute('data-id');
                    const student = appState.students.find(s => (s.__backendId || s.id) == id);
                    if (student) {
                        try {
                            if (window.dataSdk) await window.dataSdk.delete(student);
                            showToast('Siswa berhasil dihapus');
                            window.dispatchEvent(new CustomEvent('app-state-changed'));
                        } catch (err) {
                            showToast('Gagal menghapus siswa', 'error');
                        }
                    }
                }
                return;
            }

            // Add Button delegation
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
                const headers = ['Nama Siswa', 'NISN', 'NIS', 'Jenis Kelamin', 'Tanggal Lahir'];
                const sampleData = [
                    { 'Nama Siswa': 'Budi Santoso', 'NISN': '1234567890', 'NIS': '1001', 'Jenis Kelamin': 'L', 'Tanggal Lahir': '2015-05-20' },
                    { 'Nama Siswa': 'Siti Aminah', 'NISN': '1234567891', 'NIS': '1002', 'Jenis Kelamin': 'P', 'Tanggal Lahir': '2015-06-15' }
                ];
                downloadCSV(headers, sampleData, 'Template_Siswa.csv');
                return;
            }
        });
    }

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
                    const expectedHeaders = ['Nama Siswa', 'NISN', 'NIS', 'Jenis Kelamin', 'Tanggal Lahir'];
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
                            student_class: appState.currentUser?.class,
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
                    console.error('Import CSV Error:', err);
                }
                csvInput.value = ''; // Reset input
            };
            reader.readAsText(file);
        };
    }

    // Modal Handlers
    const setupModalHandlers = () => {
        const closeBtn = document.getElementById('close-student-modal');
        const cancelBtn = document.getElementById('cancel-student-btn');
        const saveBtn = document.getElementById('save-student-btn');

        if (closeBtn) closeBtn.onclick = closeModal;
        if (cancelBtn) cancelBtn.onclick = closeModal;

        if (saveBtn) {
            saveBtn.onclick = async () => {
                if (saveBtn.disabled) return;

                const nameInput = document.getElementById('student-name');
                const nisnInput = document.getElementById('student-nisn');
                const nisInput = document.getElementById('student-nis');
                const genderInput = document.getElementById('student-gender');
                const dobInput = document.getElementById('student-dob');

                if (!nameInput || !nisnInput) {
                    console.error('Form elements not found');
                    return;
                }

                const name = nameInput.value;
                const nisn = nisnInput.value;
                const nis = nisInput.value;
                const gender = genderInput.value;
                const dob = dobInput.value;

                if (!name || !nisn) {
                    showToast('Nama dan NISN wajib diisi', 'error');
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
                    student_class: appState.currentUser?.class,
                    type: 'student'
                };

                try {
                    console.log('Saving student data:', appState.modalMode, studentData);

                    if (appState.modalMode === 'add') {
                        studentData.id = generateId();
                        if (window.dataSdk) await window.dataSdk.create(studentData);
                        showToast('Siswa berhasil ditambahkan');
                    } else {
                        // EDIT MODE
                        if (!appState.editingItem) {
                            throw new Error('Data siswa yang diedit tidak ditemukan di state');
                        }

                        // Ensure we keep the original IDs
                        const originalId = appState.editingItem.id || appState.editingItem.__backendId;
                        studentData.id = originalId;
                        studentData.__backendId = appState.editingItem.__backendId;

                        if (window.dataSdk) await window.dataSdk.update(studentData);
                        showToast('Siswa berhasil diperbarui');
                    }
                    closeModal();
                } catch (err) {
                    console.error('Gagal menyimpan data siswa:', err);
                    showToast('Gagal menyimpan data: ' + err.message, 'error');
                    saveBtn.disabled = false;
                    saveBtn.innerHTML = 'Simpan Data';
                }
            };
        }
    };

    if (appState.showModal) setupModalHandlers();
}
