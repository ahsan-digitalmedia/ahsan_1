import { appState, updateState } from '../../core/state.js';
import { showToast, generateId, closeModal } from '../../core/utils.js';

export function setupGuruJournalHandlers() {
    const contentArea = document.getElementById('content-area');
    if (!contentArea) return;

    if (contentArea._journalHandler) {
        contentArea.removeEventListener('click', contentArea._journalHandler);
    }

    const handler = async (e) => {
        // Edit Button
        const editBtn = e.target.closest('.edit-journal-btn');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            const item = appState.journals.find(j => (j.__backendId || j.id) == id);
            if (item) {
                updateState({ showModal: true, modalMode: 'edit', editingItem: { ...item } });
            }
            return;
        }

        // Delete Button
        const deleteBtn = e.target.closest('.delete-journal-btn');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            const item = appState.journals.find(j => (j.__backendId || j.id) == id);
            if (item && confirm('Apakah Anda yakin ingin menghapus jurnal ini?')) {
                try {
                    if (window.dataSdk) await window.dataSdk.delete(item);
                    showToast('Jurnal berhasil dihapus', 'success');
                } catch (err) {
                    showToast('Gagal menghapus jurnal', 'error');
                }
            }
            return;
        }

        // Add button
        const addBtn = e.target.closest('#add-journal-btn') || e.target.closest('#add-journal-first-btn');
        if (addBtn) {
            updateState({ showModal: true, modalMode: 'add', editingItem: null });
            return;
        }

        // Print button
        const printBtn = e.target.closest('#print-journal-btn');
        if (printBtn) {
            const date = document.getElementById('journal-date-filter')?.value || localToday;
            printJournalReport('monthly', date);
            return;
        }
    };

    const classFilterSelect = document.getElementById('journal-class-filter');
    if (classFilterSelect) {
        classFilterSelect.onchange = (e) => {
            updateState({ filterJournalClass: e.target.value });
        };
    }

    contentArea.addEventListener('click', handler);
    contentArea._journalHandler = handler;

    if (appState.showModal) {
        const closeJouBtn = document.getElementById('close-journal-modal');
        const cancelJouBtn = document.getElementById('cancel-journal-modal');
        const saveJouBtn = document.getElementById('save-journal-btn');

        if (closeJouBtn) closeJouBtn.onclick = closeModal;
        if (cancelJouBtn) cancelJouBtn.onclick = closeModal;

        if (saveJouBtn) {
            saveJouBtn.onclick = async () => {
                if (saveJouBtn.disabled) return;
                const form = document.getElementById('journal-form');
                if (!form.reportValidity()) return;
                saveJouBtn.disabled = true;

                const journalData = {
                    journal_date: document.getElementById('jou-date').value,
                    journal_content: document.getElementById('jou-content').value,
                    journal_class: document.getElementById('jou-class').value,
                    journal_teacher_nip: appState.currentUser?.nip,
                    teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
                    type: 'journal'
                };

                try {
                    if (appState.modalMode === 'add') {
                        journalData.id = generateId();
                        if (window.dataSdk) await window.dataSdk.create(journalData);
                        showToast('Jurnal berhasil disimpan', 'success');
                    } else {
                        journalData.id = appState.editingItem.id || appState.editingItem.__backendId;
                        journalData.__backendId = appState.editingItem.__backendId;
                        if (window.dataSdk) await window.dataSdk.update(journalData);
                        showToast('Jurnal berhasil diperbarui', 'success');
                    }
                    closeModal();
                } catch (err) {
                    showToast('Gagal menyimpan jurnal', 'error');
                    saveJouBtn.disabled = false;
                }
            };
        }
    }
}

function printJournalReport(type = 'all', dateStr) {
    const { journals, currentUser, config, selectedJournalClass } = appState;
    const managedClasses = (currentUser?.class || '').split(',').map(c => c.trim()).filter(c => c);
    const isFlexibleMatch = (itemClass, targetClass) => {
        if (!itemClass || !targetClass) return false;
        const ic = String(itemClass).trim();
        const target = String(targetClass).trim();
        if (ic === target) return true;
        return ic.startsWith(target) && !/^\d/.test(ic.substring(target.length));
    };

    const currentClassFilter = selectedJournalClass || '';

    const classJournals = journals.filter(j => {
        const isJournalType = j.type === 'journal' || !j.type;
        const currentClassFilter = selectedJournalClass || '';

        if (!isJournalType) return false;

        if (currentClassFilter) {
            return isFlexibleMatch(j.journal_class, currentClassFilter);
        }
        return true;
    });

    const schoolName = currentUser?.school_name || config.school_name || 'SDN 1 PONCOWATI';
    const teacherName = currentUser?.name || 'Guru Kelas';
    const className = currentClassFilter || currentUser?.class || '-';

    const now = new Date();
    const localToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const dateInput = dateStr || localToday;
    const [y, m, d_] = dateInput.split('-').map(Number);
    const date = new Date(y, m - 1, d_);

    let filteredJournals = [...classJournals];
    let titleDetail = '';
    let periodInfo = '';

    const formatToYYYYMMDD = (dateObj) => {
        const y_ = dateObj.getFullYear();
        const m_ = String(dateObj.getMonth() + 1).padStart(2, '0');
        const d_ = String(dateObj.getDate()).padStart(2, '0');
        return `${y_}-${m_}-${d_}`;
    };

    const normalizeDate = (dInput) => {
        if (!dInput) return '';
        // If it's already YYYY-MM-DD
        if (typeof dInput === 'string' && dInput.length === 10 && dInput.includes('-')) return dInput;
        // Otherwise parse it (handles ISO strings, date objects, etc.)
        try {
            const dObj = new Date(dInput);
            if (isNaN(dObj.getTime())) return '';
            return formatToYYYYMMDD(dObj);
        } catch {
            return '';
        }
    };

    if (type === 'monthly') {
        const targetMonth = date.getMonth();
        const targetYear = date.getFullYear();
        filteredJournals = classJournals.filter(j => {
            const jDateStr = normalizeDate(j.journal_date);
            if (!jDateStr) return false;
            const [jy, jm, jd] = jDateStr.split('-').map(Number);
            return (jm - 1) === targetMonth && jy === targetYear;
        });
        titleDetail = 'BULANAN';
        const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
        periodInfo = `${monthNames[targetMonth]} ${targetYear}`;
    }

    if (filteredJournals.length === 0) {
        showToast('Tidak ada data jurnal untuk periode ini', 'warning');
        return;
    }

    const tableRows = filteredJournals.sort((a, b) => new Date(a.journal_date) - new Date(b.journal_date)).map((j, idx) => `
        <tr>
            <td style="border: 1px solid #000; padding: 10px; text-align: center;">${idx + 1}</td>
            <td style="border: 1px solid #000; padding: 10px; text-align: center; white-space: nowrap;">${new Date(j.journal_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</td>
            <td style="border: 1px solid #000; padding: 10px; text-align: justify; line-height: 1.6;">${j.journal_content}</td>
        </tr>
    `).join('');

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
        <html>
        <head>
            <title>Cetak Jurnal ${titleDetail} - ${teacherName}</title>
            <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
                @page { size: portrait; margin: 20mm; }
                body { font-family: 'Inter', sans-serif; font-size: 11px; color: #000; padding: 0; margin: 0; }
                .header { text-align: center; margin-bottom: 25px; border-bottom: 3px double #000; padding-bottom: 10px; }
                .school-name { font-size: 18px; font-weight: bold; margin: 0; text-transform: uppercase; }
                .report-title { font-size: 13px; font-weight: bold; margin: 5px 0; text-transform: uppercase; }
                .period-info { font-size: 12px; margin-bottom: 15px; }
                .meta { display: flex; flex-wrap: wrap; gap: 15px; margin-bottom: 15px; border: 1px solid #eee; padding: 10px; border-radius: 8px; }
                .meta-item { flex: 1; min-width: 200px; }
                .meta p { margin: 2px 0; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: fixed; }
                th { background-color: #f8fafc !important; -webkit-print-color-adjust: exact; padding: 10px; font-weight: bold; border: 1px solid #000; }
                td { border: 1px solid #000; padding: 8px; vertical-align: top; }
                .footer { margin-top: 40px; display: flex; justify-content: space-between; page-break-inside: avoid; }
                .sig-box { width: 220px; text-align: center; }
                .sig-space { height: 60px; }
                .sig-name { font-weight: bold; text-decoration: underline; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 class="school-name">${schoolName}</h1>
                <div class="report-title">JURNAL PEMBELAJARAN GURU ${titleDetail}</div>
                ${periodInfo ? `<div class="period-info">Periode: ${periodInfo}</div>` : ''}
            </div>
            
            <div class="meta">
                <div class="meta-item">
                    <p><strong>Nama Guru:</strong> ${teacherName}</p>
                    <p><strong>NIP:</strong> ${currentUser?.nip || '-'}</p>
                    <p><strong>Semester:</strong> ${currentUser?.semester || '-'}</p>
                </div>
                <div class="meta-item">
                    <p><strong>Kelas:</strong> ${className}</p>
                    <p><strong>Mata Pelajaran:</strong> ${currentUser?.subject || '-'}</p>
                    <p><strong>Tahun Pelajaran:</strong> ${currentUser?.academic_year || '-'}</p>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style="width: 40px; text-align: center;">No</th>
                        <th style="width: 140px; text-align: center;">Hari & Tanggal</th>
                        <th style="text-align: center;">Isi Jurnal Pembelajaran</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>

            <div class="footer">
                <div class="sig-box">
                    <p>Mengetahui,</p>
                    <p>Kepala Sekolah</p>
                    <div class="sig-space"></div>
                    <p class="sig-name">${currentUser?.principal_name || '( ........................................ )'}</p>
                    <p>NIP. ${currentUser?.principal_nip || '........................................'}</p>
                </div>
                <div class="sig-box">
                    <p>${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    <p>Guru Mata Pelajaran,</p>
                    <div class="sig-space"></div>
                    <p class="sig-name">${teacherName}</p>
                    <p>NIP. ${currentUser?.nip || '-'}</p>
                </div>
            </div>
            <script>window.onload = () => { window.print(); };</script>
        </body>
        </html>
    `);
    printWindow.document.close();
}
