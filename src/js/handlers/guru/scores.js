import { appState, updateState, SUBJECT_LIST } from '../../core/state.js';
import { showToast, generateId, closeModal } from '../../core/utils.js';
import { parseCSV, downloadCSV } from '../../core/csv-util.js';

export function setupGuruScoresHandlers() {
    // Check if Swal is available, otherwise define a stub to prevent errors
    if (typeof Swal === 'undefined') {
        console.error('SweetAlert2 is not loaded!');
        window.Swal = {
            fire: (opts) => { console.warn('Swal.fire fallback:', opts); return Promise.resolve({ isConfirmed: true }); },
            mixin: () => ({ fire: (opts) => console.warn('Toast fallback:', opts) })
        };
    }

    const Toast = Swal.mixin({
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
    });

    const viewInputBtn = document.getElementById('view-input-btn');
    const viewRekapBtn = document.getElementById('view-rekap-btn');

    if (viewInputBtn) {
        viewInputBtn.onclick = () => {
            updateState({ scoreViewMode: 'input' });
        };
    }
    if (viewRekapBtn) {
        viewRekapBtn.onclick = () => {
            updateState({ scoreViewMode: 'rekap' });
        };
    }

    const filterSubjectSelect = document.getElementById('score-filter-subject');
    if (filterSubjectSelect) {
        filterSubjectSelect.onchange = (e) => {
            updateState({ filterSubject: e.target.value });
        };
    }

    const classSelect = document.getElementById('score-class-select');
    if (classSelect) {
        classSelect.onchange = (e) => {
            updateState({ selectedScoreClass: e.target.value });
        };
    }

    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    if (contentArea._scoresHandler) {
        contentArea.removeEventListener('click', contentArea._scoresHandler);
    }

    // Real-time calculation on input
    contentArea.oninput = (e) => {
        if (!e.target.classList.contains('score-inline-input')) return;

        const row = e.target.closest('.inline-score-row');
        if (!row) return;

        row.classList.add('is-dirty');
        row.style.backgroundColor = '#fffef2';

        const inputs = Array.from(row.querySelectorAll('.score-inline-input'));
        const getVal = (field) => {
            const inp = inputs.find(i => i.dataset.field === field);
            return inp && inp.value !== '' ? parseFloat(inp.value) : null;
        };

        const tpCount = appState.scoreTPCount || 4;
        const sumCount = appState.scoreSumatifCount || 4;

        const fScores = [];
        for (let i = 1; i <= tpCount; i++) {
            const val = getVal(`score_f${i}`);
            if (val !== null) fScores.push(val);
        }
        const avgF = fScores.length > 0 ? fScores.reduce((a, b) => a + b, 0) / fScores.length : 0;
        row.querySelector('[data-avg="f"]').textContent = avgF.toFixed(0);

        const sScores = [];
        for (let i = 1; i <= sumCount; i++) {
            const val = getVal(`score_s${i}`);
            if (val !== null) sScores.push(val);
        }
        const avgS = sScores.length > 0 ? sScores.reduce((a, b) => a + b, 0) / sScores.length : 0;
        row.querySelector('[data-avg="s"]').textContent = avgS.toFixed(0);

        const { scoreWeights } = appState;
        const pts = getVal('score_pts') || 0;
        const pas = getVal('score_pas') || 0;
        const avgFS = (avgF + avgS) / 2;

        const na = ((avgFS * scoreWeights.fs) + (pts * scoreWeights.pts) + (pas * scoreWeights.pas)) / 100;
        const naBadge = row.querySelector('[data-avg="na"]');
        naBadge.textContent = Math.round(na);
        naBadge.className = `px-2 py-1 rounded-lg text-white font-black text-[13px] shadow-sm ring-2 ring-blue-100 inline-na-badge ${na >= 75 ? 'bg-blue-600' : 'bg-rose-500'}`;
    };

    const handler = async (e) => {
        // Edit Button
        const editBtn = e.target.closest('.edit-score-btn');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const score = appState.scores.find(s => (s.__backendId || s.id) == id);
            if (score) {
                updateState({ showModal: true, modalMode: 'edit', editingItem: { ...score } });
            }
            return;
        }

        // Delete Button
        const deleteBtn = e.target.closest('.delete-score-btn');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const score = appState.scores.find(s => (s.__backendId || s.id) == id);

            Swal.fire({
                title: 'Hapus Nilai?',
                text: "Data nilai siswa ini akan dihapus permanen dari sistem.",
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#ef4444',
                cancelButtonColor: '#64748b',
                confirmButtonText: 'Ya, Hapus!',
                cancelButtonText: 'Batal'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        if (window.dataSdk) await window.dataSdk.delete(score);
                        showToast('Nilai berhasil dihapus', 'success');
                    } catch (err) {
                        showToast('Gagal menghapus nilai', 'error');
                    }
                }
            });
            return;
        }

        // Add button
        const addBtn = e.target.closest('#add-score-btn');
        if (addBtn) {
            updateState({ showModal: true, modalMode: 'add', editingItem: null });
            return;
        }

        // TP Config Button
        const tpConfigBtn = e.target.closest('#tp-config-btn');
        if (tpConfigBtn) {
            Swal.fire({
                title: 'Atur Jumlah Tujuan Pembelajaran',
                html: `
                    <div class="text-left space-y-4 p-2">
                        <p class="text-[11px] text-slate-500 italic mb-4">Ubah jumlah kolom Formatif dan Sumatif sesuai dengan jumlah TP pada mata pelajaran ini.</p>
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Jumlah Formatif (F)</label>
                                <input type="number" id="config-tp-count" value="${appState.scoreTPCount || 4}" min="1" max="10" class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-indigo-300 outline-none font-bold">
                            </div>
                            <div>
                                <label class="block text-xs font-bold text-slate-500 uppercase mb-1">Jumlah Sumatif (S)</label>
                                <input type="number" id="config-sum-count" value="${appState.scoreSumatifCount || 4}" min="1" max="10" class="w-full p-3 border rounded-xl focus:ring-2 focus:ring-emerald-300 outline-none font-bold">
                            </div>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Terapkan',
                confirmButtonColor: '#4f46e5'
            }).then((result) => {
                if (result.isConfirmed) {
                    const tp = parseInt(document.getElementById('config-tp-count').value) || 4;
                    const sum = parseInt(document.getElementById('config-sum-count').value) || 4;
                    updateState({ scoreTPCount: tp, scoreSumatifCount: sum });
                    Toast.fire({ icon: 'success', title: 'Jumlah kolom diperbarui' });
                }
            });
            return;
        }

        // Import CSV Button

        // Weight Settings Button
        const weightBtn = e.target.closest('#weight-settings-btn');
        if (weightBtn) {
            const { scoreWeights } = appState;
            Swal.fire({
                title: 'Atur Bobot Nilai Akhir (NA)',
                html: `
                    <div class="text-left space-y-4 p-2">
                        <p class="text-xs text-slate-500 mb-4 font-medium italic">Tentukan persentase kontribusi masing-masing kategori terhadap Nilai Akhir. Total harus 100%.</p>
                        <div class="space-y-3">
                            <div class="flex items-center justify-between">
                                <label class="text-sm font-bold text-indigo-600">Persentase Formatif+Sumatif (F+S)</label>
                                <div class="flex items-center gap-2">
                                    <input type="number" id="weight-fs" value="${scoreWeights.fs}" class="w-16 p-2 border rounded-lg text-center font-bold focus:ring-2 focus:ring-indigo-300 outline-none">
                                    <span class="font-bold text-slate-400">%</span>
                                </div>
                            </div>
                            <div class="flex items-center justify-between">
                                <label class="text-sm font-bold text-amber-600">Persentase Tengah Semester (PTS)</label>
                                <div class="flex items-center gap-2">
                                    <input type="number" id="weight-pts" value="${scoreWeights.pts}" class="w-16 p-2 border rounded-lg text-center font-bold focus:ring-2 focus:ring-amber-300 outline-none">
                                    <span class="font-bold text-slate-400">%</span>
                                </div>
                            </div>
                            <div class="flex items-center justify-between">
                                <label class="text-sm font-bold text-rose-600">Persentase Akhir Semester (PAS)</label>
                                <div class="flex items-center gap-2">
                                    <input type="number" id="weight-pas" value="${scoreWeights.pas}" class="w-16 p-2 border rounded-lg text-center font-bold focus:ring-2 focus:ring-rose-300 outline-none">
                                    <span class="font-bold text-slate-400">%</span>
                                </div>
                            </div>
                        </div>
                        <div id="weight-total-container" class="mt-4 p-3 bg-slate-50 rounded-xl flex justify-between items-center">
                            <span class="text-sm font-bold text-slate-600">Total Persentase:</span>
                            <span id="weight-total" class="text-lg font-black ${scoreWeights.fs + scoreWeights.pts + scoreWeights.pas === 100 ? 'text-emerald-500' : 'text-red-500'}">
                                ${scoreWeights.fs + scoreWeights.pts + scoreWeights.pas}%
                            </span>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Terapkan',
                cancelButtonText: 'Batal',
                confirmButtonColor: '#4f46e5',
                didOpen: () => {
                    const inputs = ['weight-fs', 'weight-pts', 'weight-pas'];
                    const updateTotal = () => {
                        const fs = parseInt(document.getElementById('weight-fs').value) || 0;
                        const pts = parseInt(document.getElementById('weight-pts').value) || 0;
                        const pas = parseInt(document.getElementById('weight-pas').value) || 0;
                        const total = fs + pts + pas;
                        const totalEl = document.getElementById('weight-total');
                        totalEl.textContent = total + '%';
                        totalEl.className = `text-lg font-black ${total === 100 ? 'text-emerald-500' : 'text-red-500'}`;
                    };
                    inputs.forEach(id => document.getElementById(id).addEventListener('input', updateTotal));
                },
                preConfirm: () => {
                    const fs = parseInt(document.getElementById('weight-fs').value) || 0;
                    const pts = parseInt(document.getElementById('weight-pts').value) || 0;
                    const pas = parseInt(document.getElementById('weight-pas').value) || 0;
                    if (fs + pts + pas !== 100) {
                        Swal.showValidationMessage('Total persentase harus tepat 100%!');
                        return false;
                    }
                    return { fs, pts, pas };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    appState._weightsSetManually = true;
                    updateState({ scoreWeights: result.value });
                    // Re-render to update the table calculations instantly
                    Toast.fire({ icon: 'success', title: 'Bobot NA diperbarui' });
                }
            });
            return;
        }

        // Save All Changes Button
        const saveAllBtn = e.target.closest('#save-all-scores-btn');
        if (saveAllBtn) {
            const dirtyRows = Array.from(document.querySelectorAll('.inline-score-row.is-dirty'));
            if (dirtyRows.length === 0) {
                Swal.fire({ icon: 'info', title: 'Info', text: 'Tidak ada perubahan untuk disimpan.' });
                return;
            }

            Swal.fire({
                title: 'Simpan Perubahan?',
                text: `Anda akan menyimpan perubahan untuk ${dirtyRows.length} siswa.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Ya, Simpan',
                confirmButtonColor: '#4f46e5'
            }).then(async (result) => {
                if (result.isConfirmed) {
                    try {
                        Swal.fire({ title: 'Menyimpan...', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

                        const updates = dirtyRows.map(row => {
                            const isNew = row.dataset.isNew === 'true';
                            const scoreId = row.dataset.scoreId;
                            const inputs = Array.from(row.querySelectorAll('.score-inline-input'));
                            const data = {};
                            inputs.forEach(inp => {
                                const val = inp.value === '' ? 0 : parseFloat(inp.value);
                                data[inp.dataset.field] = val;
                            });

                            const tpCount = appState.scoreTPCount || 4;
                            const sumCount = appState.scoreSumatifCount || 4;

                            const fVals = [];
                            for (let i = 1; i <= tpCount; i++) {
                                const v = data[`score_f${i}`];
                                if (v > 0) fVals.push(v);
                            }
                            const sVals = [];
                            for (let i = 1; i <= sumCount; i++) {
                                const v = data[`score_s${i}`];
                                if (v > 0) sVals.push(v);
                            }

                            const calcAvgF = fVals.length > 0 ? fVals.reduce((a, b) => a + b, 0) / fVals.length : 0;
                            const calcAvgS = sVals.length > 0 ? sVals.reduce((a, b) => a + b, 0) / sVals.length : 0;
                            const { scoreWeights } = appState;
                            const avgFS = (calcAvgF + calcAvgS) / 2;
                            const na = ((avgFS * scoreWeights.fs) + (data.score_pts * scoreWeights.pts) + (data.score_pas * scoreWeights.pas)) / 100;

                            const finalScore = {
                                ...data,
                                score_formatif: calcAvgF,
                                score_sumatif: calcAvgS,
                                score_raport: Math.round(na),
                                score_value: Math.round(na),
                                weight_fs: scoreWeights.fs,
                                weight_pts: scoreWeights.pts,
                                weight_pas: scoreWeights.pas,
                                updated_at: new Date().toISOString()
                            };

                            if (isNew) {
                                return {
                                    type: 'score',
                                    student_id: row.dataset.studentId,
                                    score_subject: row.dataset.subject,
                                    score_teacher_class: row.dataset.class,
                                    teacher_id: row.dataset.teacherId,
                                    score_teacher_nip: appState.currentUser?.nip,
                                    ...finalScore
                                };
                            } else {
                                return { id: scoreId, ...finalScore };
                            }
                        });

                        await window.dataSdk.batchUpsert(updates);

                        Swal.fire({ icon: 'success', title: 'Berhasil!', text: 'Semua perubahan telah disimpan.', timer: 1500 });
                    } catch (err) {
                        console.error('Error batch saving scores:', err);
                        Swal.fire({ icon: 'error', title: 'Gagal!', text: 'Terjadi kesalahan saat menyimpan data.' });
                    }
                }
            });
            return;
        }

        // Row Save Button (Incremental)
        const saveRowBtn = e.target.closest('.save-row-btn');
        if (saveRowBtn) {
            const row = saveRowBtn.closest('.inline-score-row');
            if (!row) return;

            row.classList.add('is-dirty'); // Force dirty to save
            const saveAllBtnInside = document.getElementById('save-all-scores-btn');
            if (saveAllBtnInside) {
                // Just trigger batch save for this one row conceptually, 
                // but simpler to just implement per-row save here
                const scoreId = saveRowBtn.dataset.id;
                const inputs = Array.from(row.querySelectorAll('.score-inline-input'));
                const data = {};
                inputs.forEach(inp => {
                    data[inp.dataset.field] = inp.value === '' ? 0 : parseFloat(inp.value);
                });

                try {
                    saveRowBtn.innerHTML = '<span class="animate-spin text-[10px]">...</span>';

                    const tpCount = appState.scoreTPCount || 4;
                    const sumCount = appState.scoreSumatifCount || 4;

                    const fVals = [];
                    for (let i = 1; i <= tpCount; i++) {
                        const v = data[`score_f${i}`];
                        if (v > 0) fVals.push(v);
                    }
                    const sVals = [];
                    for (let i = 1; i <= sumCount; i++) {
                        const v = data[`score_s${i}`];
                        if (v > 0) sVals.push(v);
                    }

                    const avgF = fVals.length > 0 ? fVals.reduce((a, b) => a + b, 0) / fVals.length : 0;
                    const avgS = sVals.length > 0 ? sVals.reduce((a, b) => a + b, 0) / sVals.length : 0;
                    const { scoreWeights } = appState;
                    const avgFS = (avgF + avgS) / 2;
                    const na = ((avgFS * scoreWeights.fs) + (data.score_pts * scoreWeights.pts) + (data.score_pas * scoreWeights.pas)) / 100;

                    const finalScore = {
                        ...data,
                        score_formatif: avgF,
                        score_sumatif: avgS,
                        score_raport: Math.round(na),
                        score_value: Math.round(na),
                        weight_fs: scoreWeights.fs,
                        weight_pts: scoreWeights.pts,
                        weight_pas: scoreWeights.pas,
                        updated_at: new Date().toISOString()
                    };

                    const isNew = row.dataset.isNew === 'true';
                    let result;
                    if (isNew) {
                        result = await window.dataSdk.create({
                            type: 'score',
                            student_id: row.dataset.studentId,
                            score_subject: row.dataset.subject,
                            score_teacher_class: row.dataset.class,
                            teacher_id: row.dataset.teacherId,
                            score_teacher_nip: appState.currentUser?.nip,
                            ...finalScore
                        });
                    } else {
                        result = await window.dataSdk.update({
                            __backendId: scoreId,
                            type: 'score',
                            ...finalScore
                        });
                    }

                    if (result.error) throw result.error;

                    row.classList.remove('is-dirty');
                    row.style.backgroundColor = '';
                    saveRowBtn.innerHTML = '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
                    Toast.fire({ icon: 'success', title: 'Terupdate' });
                } catch (err) {
                    console.error('Error saving row:', err);
                    saveRowBtn.innerHTML = '❌';
                }
            }
            return;
        }

        // Download Template / Export Excel Button
        const exportExcelBtn = e.target.closest('#export-excel-btn');
        if (exportExcelBtn) {
            const currentClass = appState.selectedScoreClass || (appState.currentUser?.class || '').split(',')[0]?.trim() || '';
            const isFlexibleMatch = (itemClass) => {
                const ic = String(itemClass || '').trim();
                const target = String(currentClass || '').trim();
                if (ic === target) return true;
                return ic.startsWith(target) && !/^\d/.test(ic.substring(target.length));
            };
            const tpCount = appState.scoreTPCount || 4;
            const sumCount = appState.scoreSumatifCount || 4;

            const dynamicHeaders = [];
            for (let i = 1; i <= tpCount; i++) dynamicHeaders.push(`F${i}`);
            for (let i = 1; i <= sumCount; i++) dynamicHeaders.push(`S${i}`);

            const headers = ['Nama Siswa', 'Kelas', 'NISN', 'Mata Pelajaran', ...dynamicHeaders, 'PTS', 'PAS', 'W_FS', 'W_PTS', 'W_PAS', 'Avg F', 'Avg S', 'NA'];
            const classStudents = students.filter(s => (s.type === 'student' || !s.type) && isFlexibleMatch(s.student_class));
            const exportData = [];
            classStudents.forEach(s => {
                const studentId = s.__backendId || s.id;
                const studentScores = scores.filter(sc => (sc.type === 'score' || !sc.type) && String(sc.student_id) === String(studentId));
                if (studentScores.length > 0) {
                    studentScores.forEach(sc => {
                        const rowData = {
                            'Nama Siswa': s.student_name,
                            'Kelas': s.student_class,
                            'NISN': s.student_nisn,
                            'Mata Pelajaran': sc.score_subject,
                        };
                        for (let i = 1; i <= tpCount; i++) rowData[`F${i}`] = sc[`score_f${i}`] || 0;
                        for (let i = 1; i <= sumCount; i++) rowData[`S${i}`] = sc[`score_s${i}`] || 0;

                        Object.assign(rowData, {
                            'PTS': sc.score_pts || 0,
                            'PAS': sc.score_pas || 0,
                            'W_FS': sc.weight_fs || 80,
                            'W_PTS': sc.weight_pts || 10,
                            'W_PAS': sc.weight_pas || 10,
                            'Avg F': sc.score_formatif || 0,
                            'Avg S': sc.score_sumatif || 0,
                            'NA': sc.score_raport || sc.score_value
                        });
                        exportData.push(rowData);
                    });
                } else {
                    const rowData = {
                        'Nama Siswa': s.student_name,
                        'Kelas': s.student_class,
                        'NISN': s.student_nisn,
                        'Mata Pelajaran': '-',
                    };
                    for (let i = 1; i <= tpCount; i++) rowData[`F${i}`] = '-';
                    for (let i = 1; i <= sumCount; i++) rowData[`S${i}`] = '-';

                    Object.assign(rowData, {
                        'PTS': '-', 'PAS': '-', 'W_FS': 80, 'W_PTS': 10, 'W_PAS': 10, 'Avg F': '-', 'Avg S': '-', 'NA': '-'
                    });
                    exportData.push(rowData);
                }
            });
            downloadCSV(headers, exportData, `Rekap_Nilai_Kelas_${currentClass}.csv`);
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
                    const tpCount = appState.scoreTPCount || 4;
                    const sumCount = appState.scoreSumatifCount || 4;
                    const dynamicHeaders = [];
                    for (let i = 1; i <= tpCount; i++) dynamicHeaders.push(`F${i}`);
                    for (let i = 1; i <= sumCount; i++) dynamicHeaders.push(`S${i}`);

                    const expectedHeaders = ['Nama Siswa', 'Kelas', 'NISN', 'Mata Pelajaran', ...dynamicHeaders, 'PTS', 'PAS', 'W_FS', 'W_PTS', 'W_PAS'];
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
                        const student = appState.students.find(s => s.student_nisn === nisn);
                        if (!student) continue;
                        const studentId = student.__backendId || student.id;
                        const subject = row['mata pelajaran'];

                        const fVals = [];
                        for (let i = 1; i <= tpCount; i++) {
                            const val = parseFloat(row[`f${i}`]) || 0;
                            fVals.push(val);
                        }
                        const sVals = [];
                        for (let i = 1; i <= sumCount; i++) {
                            const val = parseFloat(row[`s${i}`]) || 0;
                            sVals.push(val);
                        }

                        const pts = parseFloat(row['pts']) || 0;
                        const pas = parseFloat(row['pas']) || 0;

                        const wFS = parseFloat(row['w_fs']) || 80;
                        const wPTS = parseFloat(row['w_pts']) || 10;
                        const wPAS = parseFloat(row['w_pas']) || 10;

                        // Calculate averages
                        const filledFVals = fVals.filter(v => v > 0);
                        const avgF = filledFVals.length > 0 ? filledFVals.reduce((a, b) => a + b, 0) / filledFVals.length : 0;

                        const filledSVals = sVals.filter(v => v > 0);
                        const avgS = filledSVals.length > 0 ? filledSVals.reduce((a, b) => a + b, 0) / filledSVals.length : 0;

                        const avgFS = (avgF + avgS) / 2;
                        const raportScore = Math.round(((avgFS * wFS) + (pts * wPTS) + (pas * wPAS)) / 100);
                        const existingScore = appState.scores.find(sc =>
                            (sc.type === 'score' || !sc.type) &&
                            String(sc.student_id) === String(studentId) &&
                            sc.score_subject === subject
                        );
                        const scoreData = {
                            id: existingScore ? (existingScore.id || existingScore.__backendId) : generateId(),
                            __backendId: existingScore?.__backendId,
                            student_id: studentId,
                            score_subject: subject,
                            score_pts: pts,
                            score_pas: pas,
                            weight_fs: wFS,
                            weight_pts: wPTS,
                            weight_pas: wPAS,
                            score_formatif: avgF,
                            score_sumatif: avgS,
                            score_mid: pts,
                            score_raport: raportScore,
                            score_value: raportScore,
                            score_teacher_class: student.student_class,
                            score_teacher_nip: appState.currentUser?.nip,
                            score_teacher_name: appState.currentUser?.name,
                            teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
                            type: 'score',
                            updated_at: new Date().toISOString()
                        };

                        fVals.forEach((v, i) => scoreData[`score_f${i + 1}`] = v);
                        sVals.forEach((v, i) => scoreData[`score_s${i + 1}`] = v);

                        if (existingScore) {
                            if (window.dataSdk) await window.dataSdk.update(scoreData);
                        } else {
                            if (window.dataSdk) await window.dataSdk.create(scoreData);
                        }
                        successCount++;
                    }
                    showToast(`${successCount} data nilai berhasil disimpan`, 'success');
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
        if (closeScoBtn) closeScoBtn.onclick = () => {
            updateState({ selectedModalScoreClass: null });
            closeModal();
        };
        if (cancelScoBtn) cancelScoBtn.onclick = () => {
            updateState({ selectedModalScoreClass: null });
            closeModal();
        };

        const modalClassSelect = document.getElementById('modal-score-class');
        if (modalClassSelect) {
            modalClassSelect.onchange = (e) => {
                updateState({ selectedModalScoreClass: e.target.value });
            };
        }

        const calculateRaport = () => {
            const tpCount = appState.scoreTPCount || 4;
            const sumCount = appState.scoreSumatifCount || 4;

            const fVals = [];
            for (let i = 1; i <= tpCount; i++) {
                const val = parseFloat(document.getElementById(`score-f${i}`)?.value) || 0;
                fVals.push(val);
            }
            const sVals = [];
            for (let i = 1; i <= sumCount; i++) {
                const val = parseFloat(document.getElementById(`score-s${i}`)?.value) || 0;
                sVals.push(val);
            }

            const pts = parseFloat(document.getElementById('score-pts')?.value) || 0;
            const pas = parseFloat(document.getElementById('score-pas')?.value) || 0;

            const { scoreWeights } = appState;
            const wFS = scoreWeights.fs;
            const wPTS = scoreWeights.pts;
            const wPAS = scoreWeights.pas;

            // Calculate averages
            const filledFVals = fVals.filter(v => v > 0);
            const avgF = filledFVals.length > 0 ? filledFVals.reduce((a, b) => a + b, 0) / filledFVals.length : 0;

            const filledSVals = sVals.filter(v => v > 0);
            const avgS = filledSVals.length > 0 ? filledSVals.reduce((a, b) => a + b, 0) / filledSVals.length : 0;

            const avgFS = (avgF + avgS) / 2;

            // Final NA
            const na = ((avgFS * wFS) + (pts * wPTS) + (pas * wPAS)) / 100;

            // Update Labels
            const fLabel = document.getElementById('avg-formatif-label');
            if (fLabel) fLabel.textContent = `Rerata: ${avgF.toFixed(1)}`;

            const sLabel = document.getElementById('avg-sumatif-label');
            if (sLabel) sLabel.textContent = `Rerata: ${avgS.toFixed(1)}`;

            const previewEl = document.getElementById('modal-score-na-preview');
            if (previewEl) previewEl.textContent = na.toFixed(1);

            return { na: na.toFixed(1), avgF, avgS, avgFS };
        };

        document.querySelectorAll('.score-input, .weight-input').forEach(input => {
            input.oninput = calculateRaport;
        });

        if (saveScoBtn) {
            saveScoBtn.onclick = async () => {
                if (saveScoBtn.disabled) return;
                const form = document.getElementById('score-form');
                if (!form.reportValidity()) return;
                saveScoBtn.disabled = true;

                const studentId = document.getElementById('modal-score-student').value;
                const student = appState.students.find(s => String(s.__backendId || s.id) === String(studentId));

                const calc = calculateRaport();
                const tpCount = appState.scoreTPCount || 4;
                const sumCount = appState.scoreSumatifCount || 4;

                const scoreData = {
                    student_id: studentId,
                    score_subject: document.getElementById('modal-score-subject').value,
                    score_pts: parseFloat(document.getElementById('score-pts').value) || 0,
                    score_pas: parseFloat(document.getElementById('score-pas').value) || 0,
                    weight_fs: appState.scoreWeights.fs,
                    weight_pts: appState.scoreWeights.pts,
                    weight_pas: appState.scoreWeights.pas,
                    score_formatif: calc.avgF,
                    score_sumatif: calc.avgS,
                    score_mid: parseFloat(document.getElementById('score-pts').value) || 0,
                    score_raport: Math.round(calc.na),
                    score_teacher_class: student?.student_class || appState.currentUser?.class,
                    score_teacher_nip: appState.currentUser?.nip,
                    score_teacher_name: appState.currentUser?.name,
                    teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
                    type: 'score',
                    updated_at: new Date().toISOString()
                };

                for (let i = 1; i <= tpCount; i++) scoreData[`score_f${i}`] = parseFloat(document.getElementById(`score-f${i}`)?.value) || 0;
                for (let i = 1; i <= sumCount; i++) scoreData[`score_s${i}`] = parseFloat(document.getElementById(`score-s${i}`)?.value) || 0;

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
    const { students, scores, currentUser, config, selectedScoreClass, filterSubject, scoreTPCount, scoreSumatifCount } = appState;
    const tpCount = scoreTPCount || 4;
    const sumCount = scoreSumatifCount || 4;
    const currentClass = selectedScoreClass || (currentUser?.class || '').split(',')[0]?.trim() || '';
    const currentSubject = filterSubject || '';

    const isFlexibleMatch = (itemClass) => {
        const ic = String(itemClass || '').trim();
        const target = String(currentClass || '').trim();
        if (ic === target) return true;
        return ic.startsWith(target) && !/^\d/.test(ic.substring(target.length));
    };

    const classStudents = students.filter(s => (s.type === 'student' || !s.type) && isFlexibleMatch(s.student_class));
    const schoolName = currentUser?.school_name || config.school_name || 'SDN 1 PONCOWATI';
    const teacherName = currentUser?.name || 'Guru Kelas';
    const className = currentClass || '-';

    const subjectsToPrint = currentSubject ? [currentSubject] : SUBJECT_LIST;

    let title = 'LAPORAN NILAI SISWA';
    if (type === 'formatif' || type === 'nh') title = 'DAFTAR NILAI FORMATIF (HARIAN)';
    else if (type === 'sumatif') title = 'DAFTAR NILAI SUMATIF (LINGKUP MATERI)';
    else if (type === 'mid') title = 'DAFTAR NILAI SUMATIF TENGAH SEMESTER';
    else if (type === 'pas') title = 'DAFTAR NILAI SUMATIF AKHIR SEMESTER';
    else title = 'LAPORAN REKAPITULASI NILAI AKHIR (RAPORT)';

    let contentHtml = subjectsToPrint.map(sub => {
        let tableHeader = '';
        let rowBuilder = (s, sc, idx) => '';

        if (type === 'formatif' || type === 'nh') {
            tableHeader = `
            <thead>
                <tr>
                  <th rowspan="2" style="width: 25px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">No</th>
                  <th rowspan="2" style="width: 80px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">NISN</th>
                  <th rowspan="2" style="border: 1px solid #000; padding: 2px; text-align: left; background-color: #f3f4f6; min-width: 100px;">Nama Siswa</th>
                  <th rowspan="2" style="width: 25px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">L/P</th>
                  <th colspan="${tpCount}" style="border: 1px solid #000; padding: 1px; text-align: center; background-color: #e0e7ff; font-size: 8px;">NILAI FORMATIF (F)</th>
                  <th rowspan="2" style="width: 35px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #e0e7ff; font-size: 8px; font-weight: bold;">AVG F</th>
                </tr>
                <tr>
                  ${Array.from({ length: tpCount }).map((_, i) => `<th style="border: 1px solid #000; padding: 1px; text-align: center; font-size: 7px;">F${i + 1}</th>`).join('')}
                </tr>
            </thead>`;
            rowBuilder = (s, sc, idx) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center;">${s.student_nisn || '-'}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: left; font-weight: 500;">${s.student_name}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center;">${s.student_gender || '-'}</td>
                  ${Array.from({ length: tpCount }).map((_, i) => `<td style="border: 1px solid #000; padding: 2px; text-align: center;">${sc?.[`score_f${i + 1}`] || '-'}</td>`).join('')}
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; background-color: #f8fafc; font-weight: bold;">${sc?.score_formatif ? Math.round(sc.score_formatif) : '-'}</td>
                </tr>`;
        } else if (type === 'sumatif') {
            tableHeader = `
            <thead>
                <tr>
                  <th rowspan="2" style="width: 25px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">No</th>
                  <th rowspan="2" style="width: 80px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">NISN</th>
                  <th rowspan="2" style="border: 1px solid #000; padding: 2px; text-align: left; background-color: #f3f4f6; min-width: 100px;">Nama Siswa</th>
                  <th rowspan="2" style="width: 25px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">L/P</th>
                  <th colspan="${sumCount}" style="border: 1px solid #000; padding: 1px; text-align: center; background-color: #dcfce7; font-size: 8px;">NILAI SUMATIF (S)</th>
                  <th rowspan="2" style="width: 35px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #dcfce7; font-size: 8px; font-weight: bold;">AVG S</th>
                </tr>
                <tr>
                  ${Array.from({ length: sumCount }).map((_, i) => `<th style="border: 1px solid #000; padding: 1px; text-align: center; font-size: 7px;">S${i + 1}</th>`).join('')}
                </tr>
            </thead>`;
            rowBuilder = (s, sc, idx) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center;">${s.student_nisn || '-'}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: left; font-weight: 500;">${s.student_name}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center;">${s.student_gender || '-'}</td>
                  ${Array.from({ length: sumCount }).map((_, i) => `<td style="border: 1px solid #000; padding: 2px; text-align: center;">${sc?.[`score_s${i + 1}`] || '-'}</td>`).join('')}
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; background-color: #f8fafc; font-weight: bold;">${sc?.score_sumatif ? Math.round(sc.score_sumatif) : '-'}</td>
                </tr>`;
        } else if (type === 'mid' || type === 'pas') {
            const hColor = type === 'mid' ? '#fef3c7' : '#fee2e2';
            const hLabel = type === 'mid' ? 'PTS' : 'PAS';
            tableHeader = `
            <thead>
                <tr>
                  <th style="width: 30px; border: 1px solid #000; padding: 4px; text-align: center; background-color: #f3f4f6;">No</th>
                  <th style="width: 100px; border: 1px solid #000; padding: 4px; text-align: center; background-color: #f3f4f6;">NISN</th>
                  <th style="border: 1px solid #000; padding: 4px; text-align: left; background-color: #f3f4f6;">Nama Siswa</th>
                  <th style="width: 40px; border: 1px solid #000; padding: 4px; text-align: center; background-color: #f3f4f6;">L/P</th>
                  <th style="width: 80px; border: 1px solid #000; padding: 4px; text-align: center; background-color: ${hColor};">NILAI ${hLabel}</th>
                </tr>
            </thead>`;
            rowBuilder = (s, sc, idx) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 5px; text-align: center;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.student_nisn || '-'}</td>
                  <td style="border: 1px solid #000; padding: 5px; text-align: left; font-weight: 500;">${s.student_name}</td>
                  <td style="border: 1px solid #000; padding: 5px; text-align: center;">${s.student_gender || '-'}</td>
                  <td style="border: 1px solid #000; padding: 5px; text-align: center; font-weight: bold; font-size: 11px;">${(type === 'mid' ? (sc?.score_pts || sc?.score_mid) : sc?.score_pas) || '-'}</td>
                </tr>`;
        } else {
            // ALL / RAPORT
            tableHeader = `
            <thead>
                <tr>
                  <th style="width: 25px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">No</th>
                  <th style="width: 80px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">NISN</th>
                  <th style="border: 1px solid #000; padding: 2px; text-align: left; background-color: #f3f4f6;">Nama Siswa</th>
                  <th style="width: 25px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #f3f4f6;">L/P</th>
                  <th style="width: 35px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #e0e7ff; font-size: 7px;">AVG F</th>
                  <th style="width: 35px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #dcfce7; font-size: 7px;">AVG S</th>
                  <th style="width: 35px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #fef3c7; font-size: 7px;">PTS</th>
                  <th style="width: 35px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #fee2e2; font-size: 7px;">PAS</th>
                  <th style="width: 40px; border: 1px solid #000; padding: 2px; text-align: center; background-color: #dbeafe; font-weight: bold; font-size: 9px;">NA</th>
                </tr>
            </thead>`;
            rowBuilder = (s, sc, idx) => `
                <tr>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 8px;">${idx + 1}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 8px;">${s.student_nisn || '-'}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: left; font-weight: 500; font-size: 8px;">${s.student_name}</td>
                  <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 8px;">${s.student_gender || '-'}</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; background-color: #f8fafc;">${sc?.score_formatif ? Math.round(sc.score_formatif) : '-'}</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; background-color: #f8fafc;">${sc?.score_sumatif ? Math.round(sc.score_sumatif) : '-'}</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; background-color: #fffbeb;">${sc?.score_pts || sc?.score_mid || '-'}</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; background-color: #fff1f2;">${sc?.score_pas || '-'}</td>
                  <td style="border: 1px solid #000; padding: 2px; text-align: center; background-color: #eff6ff; font-weight: bold;">${sc?.score_raport || sc?.score_value || '-'}</td>
                </tr>`;
        }

        let tableRows = classStudents.map((s, idx) => {
            const studentId = s.__backendId || s.id;
            const sc = scores.find(score => String(score.student_id) === String(studentId) && score.score_subject === sub);
            return rowBuilder(s, sc, idx);
        }).join('');

        return `
        <div class="subject-report" style="margin-bottom: 25px; page-break-after: auto;">
          <h3 style="font-size: 11px; margin-bottom: 6px; color: #1e293b; border-left: 3px solid #3b82f6; padding-left: 8px;">Mata Pelajaran: ${sub}</h3>
          <table style="width: 100%; border-collapse: collapse; margin-top: 2px; font-size: 9px; page-break-inside: auto;">
            ${tableHeader}
            <tbody>${tableRows}</tbody>
          </table>
        </div>`;
    }).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
    <html>
    <head>
      <title>Cetak Nilai - ${schoolName}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        @page { 
          size: A4 portrait; 
          margin: 15mm 10mm;
        }
        body { 
          font-family: 'Plus Jakarta Sans', sans-serif; 
          font-size: 10px; 
          color: #000; 
          margin: 0;
          padding: 0;
        }
        .container { width: 100%; }
        .header { 
          text-align: center; 
          margin-bottom: 20px; 
          border-bottom: 2px solid #000; 
          padding-bottom: 15px;
        }
        .school-name { font-size: 18px; font-weight: 800; margin: 0; text-transform: uppercase; letter-spacing: 1px; }
        .school-address { font-size: 10px; margin: 3px 0; color: #333; }
        .report-title { 
          font-size: 14px; 
          font-weight: 700; 
          margin: 12px 0 5px 0; 
          text-transform: uppercase;
          text-decoration: underline;
        }
        .meta-grid { 
          display: grid; 
          grid-template-cols: 1fr 1fr; 
          gap: 15px; 
          margin-bottom: 20px;
          font-weight: 600;
          font-size: 10px;
        }
        .meta-item { display: flex; gap: 8px; }
        .meta-label { color: #555; width: 60px; }
        
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #000; padding: 4px; }
        thead th { font-weight: 700; text-transform: uppercase; font-size: 8px; }

        .footer { 
          margin-top: 40px; 
          display: flex; 
          justify-content: space-between; 
          page-break-inside: avoid;
        }
        .sig-box { width: 220px; text-align: center; }
        .sig-space { height: 60px; }
        .sig-name { font-weight: 700; text-decoration: underline; font-size: 11px; }
        
        @media print {
          .subject-report { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body onload="window.print()">
      <div class="container">
        <div class="header">
          <h1 class="school-name">${schoolName}</h1>
          <p class="school-address">Lampung Tengah, Provinsi Lampung</p>
          <div class="report-title">${title}</div>
        </div>
        
        <div class="meta-grid">
          <div class="meta-item"><span class="meta-label">Kelas</span><span>: ${className}</span></div>
          <div class="meta-item"><span class="meta-label">Semester</span><span>: ${currentUser?.semester || '2 (Genap)'}</span></div>
          <div class="meta-item"><span class="meta-label">Guru</span><span>: ${teacherName}</span></div>
          <div class="meta-item"><span class="meta-label">Tahun</span><span>: ${currentUser?.academic_year || '2024/2025'}</span></div>
        </div>

        ${contentHtml}

        <div class="footer">
          <div class="sig-box">
            <p>Mengetahui,</p>
            <p style="margin-top: 2px;">Kepala Sekolah</p>
            <div class="sig-space"></div>
            <p class="sig-name">${currentUser?.principal_name || '( ........................................ )'}</p>
            <p style="font-size: 9px; margin-top: 4px;">NIP. ${currentUser?.principal_nip || '.....................................'}</p>
          </div>
          <div class="sig-box">
            <p>Poncowati, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p style="margin-top: 2px;">Guru Mata Pelajaran,</p>
            <div class="sig-space"></div>
            <p class="sig-name">${teacherName}</p>
            <p style="font-size: 9px; margin-top: 4px;">NIP. ${currentUser?.nip || '.....................................'}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `);
    printWindow.document.close();
}
