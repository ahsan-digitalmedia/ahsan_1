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
    if (!contentArea) return;

    if (contentArea._scoresHandler) {
        contentArea.removeEventListener('click', contentArea._scoresHandler);
    }

    const handler = async (e) => {
        // Edit Button
        const editBtn = e.target.closest('.edit-score-btn');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const score = appState.scores.find(s => (s.__backendId || s.id) == id);
            if (score) {
                updateState({ showModal: true, modalMode: 'edit', editingItem: { ...score } });
                window.dispatchEvent(new CustomEvent('app-state-changed'));
            }
            return;
        }

        // Delete Button
        const deleteBtn = e.target.closest('.delete-score-btn');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const score = appState.scores.find(s => (s.__backendId || s.id) == id);
            if (score && confirm('Apakah Anda yakin ingin menghapus nilai ini?')) {
                try {
                    if (window.dataSdk) await window.dataSdk.delete(score);
                    showToast('Nilai berhasil dihapus', 'success');
                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                } catch (err) {
                    showToast('Gagal menghapus nilai', 'error');
                }
            }
            return;
        }

        // Add button
        const addBtn = e.target.closest('#add-score-btn');
        if (addBtn) {
            updateState({ showModal: true, modalMode: 'add', editingItem: null });
            window.dispatchEvent(new CustomEvent('app-state-changed'));
            return;
        }

        // Import CSV Button
        const importBtn = e.target.closest('#import-score-csv-btn');
        if (importBtn) {
            const input = document.getElementById('import-score-csv-input');
            if (input) input.click();
            return;
        }

        // Download Template Button
        const downloadTemplateBtn = e.target.closest('#download-score-template-btn');
        if (downloadTemplateBtn) {
            const headers = ['Nama Siswa', 'NISN', 'Mata Pelajaran', 'Formatif', 'Sumatif', 'MID', 'PAS'];
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

        // Export Excel Button
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

        // Print Buttons
        const printBtn = e.target.closest('.print-score-btn');
        if (printBtn) {
            const type = printBtn.getAttribute('data-type').toLowerCase();
            printScoreReport(type);
            return;
        }
    };

    contentArea.addEventListener('click', handler);
    contentArea._scoresHandler = handler;

    // CSV File Change Handler
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
                    for (const row of data) {
                        const nisn = row['nisn'];
                        if (!nisn) continue;
                        const student = students.find(s => s.student_nisn === nisn);
                        if (!student) continue;
                        const studentId = student.__backendId || student.id;
                        const subject = row['mata pelajaran'];
                        const formatif = parseFloat(row['formatif']) || 0;
                        const sumatif = parseFloat(row['sumatif']) || 0;
                        const mid = parseFloat(row['mid']) || 0;
                        const pas = parseFloat(row['pas']) || 0;
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
                            teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
                            type: 'score'
                        };
                        if (existingScore) {
                            if (window.dataSdk) await window.dataSdk.update(scoreData);
                        } else {
                            if (window.dataSdk) await window.dataSdk.create(scoreData);
                        }
                        successCount++;
                    }
                    showToast(`${successCount} data nilai berhasil disimpan`, 'success');
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
        const closeScoBtn = document.getElementById('close-score-modal');
        const cancelScoBtn = document.getElementById('cancel-score-modal');
        const saveScoBtn = document.getElementById('save-score-btn');
        if (closeScoBtn) closeScoBtn.onclick = closeModal;
        if (cancelScoBtn) cancelScoBtn.onclick = closeModal;

        const previewEl = document.getElementById('modal-score-raport-preview');
        const calculateRaport = () => {
            const f = parseFloat(document.getElementById('modal-score-formatif')?.value) || 0;
            const s = parseFloat(document.getElementById('modal-score-sumatif')?.value) || 0;
            const m = parseFloat(document.getElementById('modal-score-mid')?.value) || 0;
            const p = parseFloat(document.getElementById('modal-score-pas')?.value) || 0;
            const raport = ((f * 2) + (s * 4) + (m * 2) + (p * 2)) / 10;
            if (previewEl) previewEl.textContent = raport.toFixed(1);
            return raport.toFixed(1);
        };

        document.querySelectorAll('.score-input').forEach(input => {
            input.oninput = calculateRaport;
        });

        if (saveScoBtn) {
            saveScoBtn.onclick = async () => {
                if (saveScoBtn.disabled) return;
                const form = document.getElementById('score-form');
                if (!form.reportValidity()) return;
                saveScoBtn.disabled = true;

                const scoreData = {
                    student_id: document.getElementById('modal-score-student').value,
                    score_subject: document.getElementById('modal-score-subject').value,
                    score_formatif: parseFloat(document.getElementById('modal-score-formatif').value) || 0,
                    score_sumatif: parseFloat(document.getElementById('modal-score-sumatif').value) || 0,
                    score_mid: parseFloat(document.getElementById('modal-score-mid').value) || 0,
                    score_pas: parseFloat(document.getElementById('modal-score-pas').value) || 0,
                    score_raport: calculateRaport(),
                    score_teacher_class: appState.currentUser?.class,
                    score_teacher_nip: appState.currentUser?.nip,
                    score_teacher_name: appState.currentUser?.name,
                    teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
                    type: 'score'
                };
                scoreData.score_value = scoreData.score_raport;

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
    }
}

document.querySelectorAll('.print-score-btn').forEach(btn => {
    btn.onclick = () => {
        const type = btn.getAttribute('data-type').toLowerCase();
        printScoreReport(type);
    };
});

function printScoreReport(type) {
    const { students, scores, currentUser, config } = appState;
    const classStudents = students.filter(s => (s.type === 'student' || !s.type) && s.student_class === currentUser?.class);
    const schoolName = currentUser?.school_name || config.school_name || 'SDN 1 PONCOWATI';
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
