import { appState, updateState } from '../../core/state.js';
import { showToast, generateId, closeModal } from '../../core/utils.js';
import { parseCSV, downloadCSV } from '../../core/csv-util.js';
import html2pdf from 'html2pdf.js';

export function setupModulAjarHandlers() {
  const { modulAjars, currentUser } = appState;

  const addModulBtn = document.getElementById('add-modul-btn');
  if (addModulBtn) {
    addModulBtn.onclick = () => {
      updateState({
        showModal: true,
        modalMode: 'add',
        currentModulStep: 1,
        editingItem: {
          modul_teacher_name: currentUser?.name || '',
          modul_teacher_nip: currentUser?.nip || '',
          modul_dimensions: []
        }
      });
      window.dispatchEvent(new CustomEvent('app-state-changed'));
    };
  }

  const contentArea = document.getElementById('content-area');
  if (contentArea) {
    contentArea.addEventListener('click', async (e) => {
      // Edit Button
      const editBtn = e.target.closest('.edit-modul-btn');
      if (editBtn) {
        const id = editBtn.getAttribute('data-id');
        const item = appState.modulAjars.find(m => (m.__backendId || m.id) == id);
        if (item) {
          updateState({
            showModal: true,
            modalMode: 'edit',
            currentModulStep: 1,
            editingItem: { ...item }
          });
          window.dispatchEvent(new CustomEvent('app-state-changed'));
        }
        return;
      }

      // Delete Button
      const deleteBtn = e.target.closest('.delete-modul-btn');
      if (deleteBtn) {
        if (confirm('Apakah Anda yakin ingin menghapus modul ini?')) {
          const id = deleteBtn.getAttribute('data-id');
          const item = appState.modulAjars.find(m => (m.__backendId || m.id) == id);
          if (item) {
            try {
              if (window.dataSdk) await window.dataSdk.delete(item);
              showToast('Modul berhasil dihapus', 'success');
              window.dispatchEvent(new CustomEvent('app-state-changed'));
            } catch (err) {
              console.error('Delete Error:', err);
              showToast('Gagal menghapus modul', 'error');
            }
          }
        }
        return;
      }

      // Download PDF Button
      const downloadBtn = e.target.closest('.download-pdf-btn');
      if (downloadBtn) {
        const id = downloadBtn.getAttribute('data-id');
        downloadModulAjarPDF(id);
        return;
      }

      // Import CSV Button
      const importBtn = e.target.closest('#import-modul-csv-btn');
      if (importBtn) {
        document.getElementById('import-modul-csv-input').click();
        return;
      }

      // Download Template Button
      const downloadTemplateBtn = e.target.closest('#download-modul-template-btn');
      if (downloadTemplateBtn) {
        const headers = [
          'Mata Pelajaran', 'Topik', 'Kelas', 'Fase', 'Alokasi Waktu',
          'Identifikasi Sasaran', 'Tujuan Pembelajaran', 'Media Pembelajaran',
          'Langkah Pendahuluan', 'Langkah Kegiatan Inti', 'Langkah Penutup',
          'Asesmen', 'Refleksi', 'Lampiran'
        ];
        const sampleData = [{
          'Mata Pelajaran': 'Matematika',
          'Topik': 'Penjumlahan Bilangan',
          'Kelas': '1A',
          'Fase': 'A',
          'Alokasi Waktu': '2 x 35 Menit',
          'Identifikasi Sasaran': 'Siswa kelas 1 yang baru mengenal angka',
          'Tujuan Pembelajaran': 'Siswa dapat menjumlahkan angka 1-10',
          'Media Pembelajaran': 'Kartu angka, papan tulis',
          'Langkah Pendahuluan': 'Salam, absensi, apersepsi penjumlahan 1-5',
          'Langkah Kegiatan Inti': '1. Menjelaskan konsep\n2. Latihan soal bersama\n3. Kerja kelompok',
          'Langkah Penutup': 'Evaluasi, PR halaman 12, doa penutup',
          'Asesmen': 'Tes tertulis mandiri',
          'Refleksi': 'Apakah siswa antusias?',
          'Lampiran': 'Lembar kerja siswa'
        }];
        downloadCSV(headers, sampleData, 'Template_Modul_Ajar.csv');
        return;
      }
    });
  }

  // CSV File Change Handler for Modul Ajar
  const csvInput = document.getElementById('import-modul-csv-input');
  if (csvInput) {
    csvInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target.result;
        try {
          const expectedHeaders = [
            'Mata Pelajaran', 'Topik', 'Kelas', 'Fase', 'Alokasi Waktu',
            'Identifikasi Sasaran', 'Tujuan Pembelajaran', 'Media Pembelajaran',
            'Langkah Pendahuluan', 'Langkah Kegiatan Inti', 'Langkah Penutup',
            'Asesmen', 'Refleksi', 'Lampiran'
          ];
          const data = parseCSV(text, expectedHeaders);

          if (data.length === 0) {
            showToast('File CSV kosong atau tidak valid', 'error');
            return;
          }

          showToast(`Mengimpor ${data.length} modul...`, 'info');

          for (const row of data) {
            const subject = row['mata pelajaran'];
            const topic = row['topik'];
            const classObj = row['kelas'];

            if (!subject || !topic || !classObj) continue;

            const existingModul = appState.modulAjars.find(m =>
              m.modul_subject === subject &&
              m.modul_topic === topic &&
              m.modul_class === classObj
            );

            const modulData = {
              id: existingModul ? (existingModul.id || existingModul.__backendId) : generateId(),
              __backendId: existingModul?.__backendId,
              modul_subject: subject,
              modul_topic: topic,
              modul_class: classObj,
              modul_fase: row['fase']?.toUpperCase() || 'A',
              modul_time_allocation: row['alokasi waktu'],
              modul_identification: row['identifikasi sasaran'],
              modul_objectives: row['tujuan pembelajaran'],
              modul_pedagogic: row['media pembelajaran'],
              modul_activity_pre: row['langkah pendahuluan'],
              modul_activity_core: row['langkah kegiatan inti'],
              modul_activity_post: row['langkah penutup'],
              modul_activities: `1. Pendahuluan: ${row['langkah pendahuluan']}\n\n2. Kegiatan Inti: ${row['langkah kegiatan inti']}\n\n3. Penutup: ${row['langkah penutup']}`,
              modul_assessment: row['asesmen'],
              modul_reflection: row['refleksi'],
              modul_attachments: row['lampiran'],
              modul_dimensions: existingModul?.modul_dimensions || [],
              modul_teacher_name: currentUser?.name || '',
              modul_teacher_nip: currentUser?.nip || '',
              type: 'modul_ajar'
            };

            if (existingModul) {
              if (window.dataSdk) await window.dataSdk.update(modulData);
            } else {
              if (window.dataSdk) await window.dataSdk.create(modulData);
            }
          }

          showToast(`${data.length} modul berhasil diimpor`, 'success');
          window.dispatchEvent(new CustomEvent('app-state-changed'));
        } catch (err) {
          showToast(err.message || 'Gagal mengimpor CSV', 'error');
          console.error('Import Modul CSV Error:', err);
        }
        csvInput.value = ''; // Reset
      };
      reader.readAsText(file);
    };
  }

  const filterSelect = document.getElementById('modul-filter-subject');
  if (filterSelect) {
    filterSelect.onchange = (e) => {
      updateState({ filterSubject: e.target.value });
      window.dispatchEvent(new CustomEvent('app-state-changed'));
    };
  }

  // Modal Navigation & Actions
  const cancelBtn = document.getElementById('cancel-modul-btn');
  const closeBtn = document.getElementById('close-modul-modal');
  const saveModulBtn = document.getElementById('save-modul-btn');

  if (cancelBtn) cancelBtn.onclick = closeModal;
  if (closeBtn) closeBtn.onclick = closeModal;

  if (saveModulBtn) {
    saveModulBtn.onclick = async () => {
      if (saveModulBtn.disabled) return;

      const subject = document.getElementById('modul-subject').value;
      const topic = document.getElementById('modul-topic').value;
      const classObj = document.getElementById('modul-class').value;
      const objectives = document.getElementById('modul-objectives').value;
      const preActs = document.getElementById('modul-pre-activities').value;
      const coreActs = document.getElementById('modul-core-activities').value;
      const postActs = document.getElementById('modul-post-activities').value;

      if (!subject || !topic || !classObj || !objectives || !preActs || !coreActs || !postActs) {
        showToast('Mohon lengkapi kolom bertanda bintang (*), termasuk semua Langkah Kegiatan', 'warning');
        return;
      }

      saveModulBtn.disabled = true;
      saveModulBtn.innerHTML = `
                <svg class="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Menyimpan...</span>
            `;

      const modulData = {
        ...appState.editingItem,
        modul_subject: subject,
        modul_topic: topic,
        modul_class: classObj,
        modul_fase: document.getElementById('modul-fase').value,
        modul_time_allocation: document.getElementById('modul-time').value,
        modul_identification: document.getElementById('modul-identification').value,
        modul_dimensions: Array.from(document.querySelectorAll('input[name="dimensions"]:checked')).map(i => i.value),
        modul_objectives: objectives,
        modul_pedagogic: document.getElementById('modul-pedagogic').value,
        modul_activity_pre: preActs,
        modul_activity_core: coreActs,
        modul_activity_post: postActs,
        modul_activities: `1. Pendahuluan: ${preActs}\n\n2. Kegiatan Inti: ${coreActs}\n\n3. Penutup: ${postActs}`,
        modul_assessment: document.getElementById('modul-assessment').value,
        modul_reflection: document.getElementById('modul-reflection').value,
        modul_attachments: document.getElementById('modul-attachments').value,
        modul_teacher_name: document.getElementById('modul-teacher-name').value,
        modul_teacher_nip: currentUser?.nip || '',
        type: 'modul_ajar'
      };

      try {
        if (appState.modalMode === 'add') {
          modulData.id = generateId();
          if (window.dataSdk) await window.dataSdk.create(modulData);
          showToast('Modul berhasil disimpan', 'success');
        } else {
          modulData.id = appState.editingItem.id || appState.editingItem.__backendId;
          modulData.__backendId = appState.editingItem.__backendId;
          if (window.dataSdk) await window.dataSdk.update(modulData);
          showToast('Modul berhasil diperbarui', 'success');
        }
        closeModal();
      } catch (err) {
        console.error('Save Modul Error:', err);
        showToast('Gagal menyimpan modul', 'error');
        saveModulBtn.disabled = false;
        saveModulBtn.innerHTML = `
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 0-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
                    <span>Simpan Modul Ajar</span>
                `;
      }
    };
  }
}

async function downloadModulAjarPDF(id) {
  const { modulAjars, config } = appState;
  const modul = modulAjars.find(m => (m.type === 'modul_ajar' || !m.type) && (m.__backendId || m.id) == id);
  if (!modul) return;

  showToast('Menyiapkan PDF...', 'info');

  const element = document.createElement('div');
  element.style.padding = '40px';
  element.style.background = 'white';
  element.style.width = '800px';

  element.innerHTML = `
    <div style="font-family: 'Times New Roman', Times, serif; color: #000; line-height: 1.5;">
      <div style="text-align: center; border-bottom: 3px double #000; margin-bottom: 20px; padding-bottom: 10px;">
        <h2 style="margin: 0; font-size: 18px; font-weight: bold; text-transform: uppercase;">MODUL AJAR KURIKULUM MERDEKA</h2>
        <h3 style="margin: 5px 0 0 0; font-size: 16px; font-weight: bold;">${config.school_name}</h3>
        <p style="margin: 5px 0 0 0; font-size: 12px;">Tahun Pelajaran ${new Date().getFullYear()}/${new Date().getFullYear() + 1}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">A. Identitas Modul</h3>
        <table style="width: 100%; font-size: 12px; border-collapse: collapse;">
          <tr><td style="width: 150px; padding: 3px 0;">Nama Penyusun</td><td>: ${modul.modul_teacher_name}</td></tr>
          <tr><td style="padding: 3px 0;">NIP</td><td>: ${modul.modul_teacher_nip}</td></tr>
          <tr><td style="padding: 3px 0;">Mata Pelajaran</td><td>: ${modul.modul_subject}</td></tr>
          <tr><td style="padding: 3px 0;">Kelas / Fase</td><td>: ${modul.modul_class} / ${modul.modul_fase}</td></tr>
          <tr><td style="padding: 3px 0;">Topik / Bab</td><td>: ${modul.modul_topic}</td></tr>
          <tr><td style="padding: 3px 0;">Alokasi Waktu</td><td>: ${modul.modul_time_allocation || '-'}</td></tr>
        </table>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">B. Kompetensi Awal & Profil Lulusan</h3>
        <div style="margin-bottom: 10px;">
          <p style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">Identifikasi Sasaran / Kompetensi Awal:</p>
          <div style="font-size: 12px; text-align: justify;">${modul.modul_identification || '-'}</div>
        </div>
        <div>
          <p style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">Profil Lulusan:</p>
          <ul style="font-size: 12px; margin: 0; padding-left: 20px;">
            ${(modul.modul_dimensions || []).map(dim => `<li>${dim}</li>`).join('')}
          </ul>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">C. Komponen Inti</h3>
        <div style="margin-bottom: 10px;">
          <p style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">Tujuan Pembelajaran:</p>
          <div style="font-size: 12px; text-align: justify; white-space: pre-line;">${modul.modul_objectives || '-'}</div>
        </div>
        <div style="margin-bottom: 10px;">
          <p style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">Media Pembelajaran:</p>
          <div style="font-size: 12px; text-align: justify;">${modul.modul_pedagogic || '-'}</div>
        </div>
        <div>
          <p style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">Langkah-langkah Pembelajaran:</p>
          <div style="font-size: 11px; text-align: justify; margin-bottom: 8px;">
            <p style="font-weight: bold; margin-bottom: 2px;">1. Kegiatan Pendahuluan</p>
            <div style="white-space: pre-line; margin-left: 10px;">${modul.modul_activity_pre || '-'}</div>
          </div>
          <div style="font-size: 11px; text-align: justify; margin-bottom: 8px;">
            <p style="font-weight: bold; margin-bottom: 2px;">2. Kegiatan Inti</p>
            <div style="white-space: pre-line; margin-left: 10px;">${modul.modul_activity_core || '-'}</div>
          </div>
          <div style="font-size: 11px; text-align: justify;">
            <p style="font-weight: bold; margin-bottom: 2px;">3. Kegiatan Penutup</p>
            <div style="white-space: pre-line; margin-left: 10px;">${modul.modul_activity_post || '-'}</div>
          </div>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; border-bottom: 1px solid #000; padding-bottom: 5px;">D. Asesmen & Lampiran</h3>
        <div style="margin-bottom: 10px;">
          <p style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">Asesmen:</p>
          <div style="font-size: 12px; text-align: justify;">${modul.modul_assessment || '-'}</div>
        </div>
        <div style="margin-bottom: 10px;">
          <p style="font-weight: bold; font-size: 12px; margin-bottom: 3px;">Refleksi:</p>
          <div style="font-size: 12px; text-align: justify;">${modul.modul_reflection || '-'}</div>
        </div>
      </div>

      <div style="margin-top: 50px; display: flex; justify-content: space-between; page-break-inside: avoid;">
        <div style="text-align: center; width: 40%;">
          <p style="font-size: 12px; margin-bottom: 60px;">Mengetahui,<br>Kepala Sekolah</p>
          <p style="font-weight: bold; text-decoration: underline; font-size: 12px;">( ............................................ )</p>
          <p style="font-size: 12px;">NIP. ............................................</p>
        </div>
        <div style="text-align: center; width: 40%;">
          <p style="font-size: 12px; margin-bottom: 60px;">Lampung, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}<br>Guru Mata Pelajaran</p>
          <p style="font-weight: bold; text-decoration: underline; font-size: 12px;">${modul.modul_teacher_name}</p>
          <p style="font-size: 12px;">NIP. ${modul.modul_teacher_nip}</p>
        </div>
      </div>
    </div>
  `;

  const options = {
    margin: 10,
    filename: `Modul_Ajar_${modul.modul_topic.replace(/\s+/g, '_')}.pdf`,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  };

  try {
    await html2pdf().set(options).from(element).save();
    showToast('PDF berhasil diunduh', 'success');
  } catch (err) {
    console.error('Gagal generate PDF:', err);
    showToast('Gagal mengunduh PDF', 'error');
  }
}
