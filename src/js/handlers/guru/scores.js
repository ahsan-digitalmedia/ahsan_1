import { appState, updateState, SUBJECT_LIST } from '../../core/state.js';
import { showToast, generateId, closeModal } from '../../core/utils.js';
import { parseCSV, downloadCSV } from '../../core/csv-util.js';

export function setupGuruScoresHandlers() {
    const { scores, students, currentUser, scoreViewMode } = appState;

    const viewInputBtn = document.getElementById('view-input-btn');
    const viewRekapBtn = document.getElementById('view-rekap-btn');

    if (viewInputBtn) {
        viewInputBtn.onclick = () => {
            updateState({ scoreViewMode: 'input' });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }
    if (viewRekapBtn) {
        viewRekapBtn.onclick = () => {
            updateState({ scoreViewMode: 'rekap' });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }

    const filterSubjectSelect = document.getElementById('score-filter-subject');
    if (filterSubjectSelect) {
        filterSubjectSelect.onchange = (e) => {
            updateState({ filterSubject: e.target.value });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
        };
    }

    const contentArea = document.getElementById('content-area');
    if (contentArea) {
        contentArea.addEventListener('click', async (e) => {
            // Edit Button
            const editBtn = e.target.closest('.edit-score-btn');
            if (editBtn) {
                const id = editBtn.getAttribute('data-id');
                const score = appState.scores.find(s => (s.__backendId || s.id) == id);
                if (score) {
                    updateState({ showModal: true, modalMode: 'edit', editingItem: score });
                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                }
                return;
            }

            // Delete Button
            const deleteBtn = e.target.closest('.delete-score-btn');
            if (deleteBtn) {
                if (confirm('Apakah Anda yakin ingin menghapus nilai ini?')) {
                    const id = deleteBtn.getAttribute('data-id');
                    const score = appState.scores.find(s => (s.__backendId || s.id) == id);
                    if (score) {
                        try {
                            if (window.dataSdk) await window.dataSdk.delete(score);
                            showToast('Nilai berhasil dihapus', 'success');
                            window.dispatchEvent(new CustomEvent('app-state-changed'));
                        } catch (err) {
                            showToast('Gagal menghapus nilai', 'error');
                        }
                    }
                }
                return;
            }

            // Add button delegation (if inside content area)
            const addBtn = e.target.closest('#add-score-btn');
            if (addBtn) {
                updateState({ showModal: true, modalMode: 'add', editingItem: null });
                window.dispatchEvent(new CustomEvent('app-state-changed'));
                return;
            }

            // Import CSV Button
            const importBtn = e.target.closest('#import-score-csv-btn');
            if (importBtn) {
                document.getElementById('import-score-csv-input').click();
                return;
            }

            // Download Template Button
            const downloadTemplateBtn = e.target.closest('#download-score-template-btn');
            if (downloadTemplateBtn) {
                const headers = ['Nama Siswa', 'NISN', 'Mata Pelajaran', 'Formatif', 'Sumatif', 'MID', 'PAS'];

                // Get current students to populate template
                const classStudents = students.filter(s => (s.type === 'student' || !s.type) && s.student_class === currentUser?.class);
                const sampleData = classStudents.map(s => ({
                    'Nama Siswa': s.student_name,
                    'NISN': s.student_nisn,
                    'Mata Pelajaran': appState.filterSubject || 'Matematika',
                    'Formatif': '',
                    'Sumatif': '',
                    'MID': '',
                    'PAS': ''
                }));

                downloadCSV(headers, sampleData.length > 0 ? sampleData : [{ 'Nama Siswa': 'Contoh Siswa', 'NISN': '1234567890', 'Mata Pelajaran': 'Matematika', 'Formatif': 80, 'Sumatif': 85, 'MID': 80, 'PAS': 90 }], 'Template_Nilai.csv');
                return;
            }

            // Export to Excel (CSV) Button
            const exportExcelBtn = e.target.closest('#export-excel-btn');
            if (exportExcelBtn) {
                const headers = ['Nama Siswa', 'NISN', 'Mata Pelajaran', 'Formatif', 'Sumatif', 'MID', 'PAS', 'Raport'];
                const classStudents = students.filter(s => (s.type === 'student' || !s.type) && s.student_class === currentUser?.class);

                const exportData = [];
                classStudents.forEach(s => {
                    const studentId = s.__backendId || s.id;
                    const studentScores = scores.filter(sc => (sc.type === 'score' || !sc.type) && sc.student_id === studentId);

                    if (studentScores.length > 0) {
                        studentScores.forEach(sc => {
                            exportData.push({
                                'Nama Siswa': s.student_name,
                                'NISN': s.student_nisn,
                                'Mata Pelajaran': sc.score_subject,
                                'Formatif': sc.score_formatif,
                                'Sumatif': sc.score_sumatif,
                                'MID': sc.score_mid,
                                'PAS': sc.score_pas,
                                'Raport': sc.score_raport || sc.score_value
                            });
                        });
                    } else {
                        exportData.push({
                            'Nama Siswa': s.student_name,
                            'NISN': s.student_nisn,
                            'Mata Pelajaran': '-',
                            'Formatif': '-',
                            'Sumatif': '-',
                            'MID': '-',
                            'PAS': '-',
                            'Raport': '-'
                        });
                    }
                });

                downloadCSV(headers, exportData, `Rekap_Nilai_Kelas_${currentUser?.class}.csv`);
                return;
            }
        });
    }

    // CSV File Change Handler for Scores
    const csvInput = document.getElementById('import-score-csv-input');
    if (csvInput) {
        csvInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                const text = event.target.result;
                try {
                    const expectedHeaders = ['Nama Siswa', 'NISN', 'Mata Pelajaran', 'Formatif', 'Sumatif', 'MID', 'PAS'];
                    const data = parseCSV(text, expectedHeaders);

                    if (data.length === 0) {
                        showToast('File CSV kosong atau tidak valid', 'error');
                        return;
                    }

                    showToast(`Memproses ${data.length} data nilai...`, 'info');

                    let successCount = 0;
                    let skippedCount = 0;
                    let skippedDetails = [];

                    for (const row of data) {
                        const nisn = row['nisn'];
                        if (!nisn) {
                            skippedCount++;
                            continue;
                        }

                        const student = students.find(s => s.student_nisn === nisn);
                        if (!student) {
                            console.warn(`Siswa dengan NISN ${nisn} tidak ditemukan.`);
                            skippedCount++;
                            skippedDetails.push(`NISN ${nisn} tidak terdaftar`);
                            continue;
                        }

                        const studentId = student.__backendId || student.id;
                        const subject = row['mata pelajaran'];

                        const formatif = parseFloat(row['formatif']) || 0;
                        const sumatif = parseFloat(row['sumatif']) || 0;
                        const mid = parseFloat(row['mid']) || 0;
                        const pas = parseFloat(row['pas']) || 0;

                        // Calculate Raport
                        const raportScore = (((formatif * 2) + (sumatif * 4) + (mid * 2) + (pas * 2)) / 10).toFixed(1);

                        const existingScore = appState.scores.find(sc =>
                            (sc.type === 'score' || !sc.type) &&
                            sc.student_id === studentId &&
                            sc.score_subject === subject
                        );

                        const scoreData = {
                            id: existingScore ? (existingScore.id || existingScore.__backendId) : generateId(),
                            __backendId: existingScore?.__backendId,
                            student_id: studentId,
                            score_subject: subject,
                            score_formatif: formatif,
                            score_sumatif: sumatif,
                            score_mid: mid,
                            score_pas: pas,
                            score_raport: raportScore,
                            score_value: raportScore,
                            score_teacher_class: appState.currentUser?.class,
                            score_teacher_nip: appState.currentUser?.nip,
                            score_teacher_name: appState.currentUser?.name,
                            type: 'score'
                        };

                        try {
                            if (existingScore) {
                                if (window.dataSdk) await window.dataSdk.update(scoreData);
                            } else {
                                if (window.dataSdk) await window.dataSdk.create(scoreData);
                            }
                            successCount++;
                        } catch (err) {
                            console.error('Error saving score:', err);
                            skippedCount++;
                            skippedDetails.push(`Gagal simpan: ${row['nama siswa'] || nisn}`);
                        }
                    }

                    if (skippedCount > 0) {
                        let msg = `${successCount} berhasil, ${skippedCount} gagal/dilewati.`;
                        if (skippedDetails.length > 0) {
                            msg += `\nDetail: ${skippedDetails.slice(0, 3).join(', ')}`;
                            if (skippedDetails.length > 3) msg += '...';
                        }
                        alert(msg); // Use alert for more visibility on errors
                        // showToast(msg, 'warning');
                    } else {
                        showToast(`${successCount} data nilai berhasil disimpan`, 'success');
                    }

                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                } catch (err) {
                    showToast(err.message || 'Gagal mengimpor CSV', 'error');
                    console.error('Import Score CSV Error:', err);
                }
                csvInput.value = ''; // Reset
            };
            reader.readAsText(file);
        };
    }

    // Modal Handlers
    const setupModalHandlers = () => {
        const closeScoBtn = document.getElementById('close-score-modal');
        const cancelScoBtn = document.getElementById('cancel-score-modal');
        const saveScoBtn = document.getElementById('save-score-btn');

        if (closeScoBtn) closeScoBtn.onclick = closeModal;
        if (cancelScoBtn) cancelScoBtn.onclick = closeModal;

        // Live Preview
        const scoreInputs = document.querySelectorAll('.score-input');
        const previewEl = document.getElementById('modal-score-raport-preview');

        function calculateRaport() {
            const f = parseFloat(document.getElementById('modal-score-formatif').value) || 0;
            const s = parseFloat(document.getElementById('modal-score-sumatif').value) || 0;
            const m = parseFloat(document.getElementById('modal-score-mid').value) || 0;
            const p = parseFloat(document.getElementById('modal-score-pas').value) || 0;

            const raport = ((f * 2) + (s * 4) + (m * 2) + (p * 2)) / 10;
            if (previewEl) previewEl.textContent = raport.toFixed(1);
            return raport.toFixed(1);
        }

        scoreInputs.forEach(input => {
            input.oninput = calculateRaport;
        });

        if (saveScoBtn) {
            saveScoBtn.onclick = async () => {
                if (saveScoBtn.disabled) return;
                saveScoBtn.disabled = true;

                const form = document.getElementById('score-form');
                if (!form.reportValidity()) {
                    saveScoBtn.disabled = false;
                    return;
                }

                const studentId = document.getElementById('modal-score-student').value;
                const subject = document.getElementById('modal-score-subject').value;
                const formatif = parseFloat(document.getElementById('modal-score-formatif').value) || 0;
                const sumatif = parseFloat(document.getElementById('modal-score-sumatif').value) || 0;
                const mid = parseFloat(document.getElementById('modal-score-mid').value) || 0;
                const pas = parseFloat(document.getElementById('modal-score-pas').value) || 0;
                const raportScore = calculateRaport();

                const scoreData = {
                    student_id: studentId,
                    score_subject: subject,
                    score_formatif: formatif,
                    score_sumatif: sumatif,
                    score_mid: mid,
                    score_pas: pas,
                    score_raport: raportScore,
                    score_value: raportScore,
                    score_teacher_class: appState.currentUser?.class,
                    score_teacher_nip: appState.currentUser?.nip,
                    score_teacher_name: appState.currentUser?.name,
                    type: 'score'
                };

                try {
                    if (appState.modalMode === 'add') {
                        scoreData.id = generateId();
                        if (window.dataSdk) await window.dataSdk.create(scoreData);
                        showToast('Nilai berhasil disimpan', 'success');
                    } else {
                        scoreData.id = appState.editingItem.id || appState.editingItem.__backendId;
                        scoreData.__backendId = appState.editingItem.__backendId;
                        if (window.dataSdk) await window.dataSdk.update(scoreData);
                        showToast('Nilai berhasil diperbarui', 'success');
                    }
                    closeModal();
                } catch (err) {
                    showToast('Gagal menyimpan nilai', 'error');
                    saveScoBtn.disabled = false;
                }
            };
        }
    };

    if (appState.showModal) setupModalHandlers();

    document.querySelectorAll('.print-score-btn').forEach(btn => {
        btn.onclick = () => {
            const type = btn.getAttribute('data-type').toLowerCase();
            printScoreReport(type);
        };
    });
}

function printScoreReport(type) {
    const { students, scores, currentUser, config } = appState;
    const classStudents = students.filter(s => (s.type === 'student' || !s.type) && s.student_class === currentUser?.class);
    const schoolName = config.school_name || 'SDN 1 PONCOWATI';
    const teacherName = currentUser?.name || 'Guru Kelas';
    const className = currentUser?.class || '-';
    const subjects = SUBJECT_LIST;

    let title = 'LAPORAN NILAI SISWA';
    if (type === 'nh' || type === 'formatif') title = 'LAPORAN NILAI FORMATIF / HARIAN';
    else if (type === 'sumatif') title = 'LAPORAN NILAI SUMATIF LINGKUP MATERI';
    else if (type === 'mid') title = 'LAPORAN NILAI SUMATIF TENGAH SEMESTER (MID)';
    else if (type === 'pas') title = 'LAPORAN NILAI SUMATIF AKHIR SEMESTER (PAS)';
    else if (type === 'raport') title = 'REKAPITULASI NILAI RAPORT';

    let tableHeader = `
    <tr>
      <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">No</th>
      <th style="border: 1px solid #000; padding: 8px; text-align: left; background-color: #f3f4f6;">Nama Siswa</th>
      ${subjects.map(sub => `<th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6; font-size: 10px;">${sub}</th>`).join('')}
    </tr>
  `;

    let tableRows = classStudents.map((s, idx) => {
        const studentId = s.__backendId || s.id;
        return `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: 600;">${s.student_name}</td>
        ${subjects.map(sub => {
            const score = scores.find(sc => sc.student_id === studentId && sc.score_subject === sub);
            let val = '-';
            if (type === 'nh' || type === 'formatif') val = score?.score_formatif || '-';
            else if (type === 'sumatif') val = score?.score_sumatif || '-';
            else if (type === 'mid') val = score?.score_mid || '-';
            else if (type === 'pas') val = score?.score_pas || '-';
            else if (type === 'raport') val = score?.score_raport || '-';
            return `<td style="border: 1px solid #000; padding: 8px; text-align: center;">${val}</td>`;
        }).join('')}
      </tr>
    `;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <html>
    <head>
      <title>Cetak Nilai - ${schoolName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        @page { size: landscape; margin: 10mm; }
        body { font-family: 'Inter', sans-serif; font-size: 10px; color: #000; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #000; padding-bottom: 10px; }
        .school-name { font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase; }
        .report-title { font-size: 14px; font-weight: bold; margin: 5px 0; text-decoration: underline; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .meta { margin-bottom: 10px; }
        .footer { margin-top: 30px; display: flex; justify-content: space-between; }
        .sig-box { width: 200px; text-align: center; }
        .sig-space { height: 50px; }
        .sig-name { font-weight: bold; text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1 class="school-name">${schoolName}</h1>
        <div class="report-title">${title}</div>
      </div>
      <div class="meta">
        <p><strong>Kelas:</strong> ${className} | <strong>Guru:</strong> ${teacherName}</p>
      </div>
      <table>
        <thead>${tableHeader}</thead>
        <tbody>${tableRows}</tbody>
      </table>
      <div class="footer">
        <div class="sig-box">
          <p>Mengetahui,</p>
          <p>Kepala Sekolah</p>
          <div class="sig-space"></div>
          <p class="sig-name">( ........................................ )</p>
        </div>
        <div class="sig-box">
          <p>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          <p>Guru Kelas,</p>
          <div class="sig-space"></div>
          <p class="sig-name">${teacherName}</p>
        </div>
      </div>
      <script>window.onload = () => { window.print(); };</script>
    </body>
    </html>
  `);
    printWindow.document.close();
}
