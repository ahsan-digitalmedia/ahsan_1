import { appState, updateState } from '../../core/state.js';
import { showToast, generateId, formatDate } from '../../core/utils.js';

export function setupGuruAttendanceHandlers() {
  const dateInput = document.getElementById('attendance-date');
  const markAllBtn = document.getElementById('mark-all-present-btn');
  if (dateInput) {
    dateInput.onchange = (e) => {
      updateState({ selectedDate: e.target.value });
      window.dispatchEvent(new CustomEvent('app-state-changed'));
    };
  }

  if (markAllBtn) {
    markAllBtn.onclick = async () => {
      if (markAllBtn.disabled) return;
      markAllBtn.disabled = true;
      const classStudents = appState.students.filter(s => (s.type === 'student' || !s.type) && s.student_class === appState.currentUser?.class);
      const date = appState.selectedDate || new Date().toISOString().split('T')[0];

      try {
        for (const s of classStudents) {
          const studentId = s.__backendId || s.id;
          const existing = appState.attendances.find(a => a.student_id === studentId && a.attendance_date === date);
          const data = {
            student_id: studentId,
            attendance_date: date,
            attendance_status: 'hadir',
            attendance_class: appState.currentUser?.class,
            type: 'attendance'
          };

          if (existing) {
            data.id = existing.id || existing.__backendId;
            data.__backendId = existing.__backendId;
            if (window.dataSdk) await window.dataSdk.update(data);
          } else {
            data.id = generateId();
            if (window.dataSdk) await window.dataSdk.create(data);
          }
        }
        showToast('Semua siswa ditandai hadir', 'success');
        window.dispatchEvent(new CustomEvent('app-state-changed'));
      } catch (err) {
        showToast('Gagal memproses absensi', 'error');
        markAllBtn.disabled = false;
      }
    };
  }

  const contentArea = document.getElementById('content-area');
  if (contentArea) {
    contentArea.addEventListener('click', async (e) => {
      // Set Attendance Button (H, S, I, A)
      const attBtn = e.target.closest('.set-attendance-btn');
      if (attBtn) {
        const studentId = attBtn.getAttribute('data-student-id');
        const status = attBtn.getAttribute('data-status');
        const date = appState.selectedDate || new Date().toISOString().split('T')[0];

        const existing = appState.attendances.find(a => a.student_id === studentId && a.attendance_date === date);
        const data = {
          student_id: studentId,
          attendance_date: date,
          attendance_status: status,
          attendance_class: appState.currentUser?.class,
          type: 'attendance'
        };

        try {
          if (existing) {
            data.id = existing.id || existing.__backendId;
            data.__backendId = existing.__backendId;
            if (window.dataSdk) await window.dataSdk.update(data);
          } else {
            data.id = generateId();
            if (window.dataSdk) await window.dataSdk.create(data);
          }
          window.dispatchEvent(new CustomEvent('app-state-changed'));
        } catch (err) {
          showToast('Gagal mencatat absensi', 'error');
        }
        return;
      }

      // Print Report Buttons
      const printBtn = e.target.closest('.print-report-btn');
      if (printBtn) {
        const type = printBtn.getAttribute('data-type');
        printAttendanceReport(type, appState.selectedDate || new Date().toISOString().split('T')[0]);
        return;
      }
    });
  }
}

function printAttendanceReport(type, dateStr) {
  const { students, attendances, currentUser, config } = appState;
  const classStudents = students.filter(s => (s.type === 'student' || !s.type) && s.student_class === currentUser?.class);
  const schoolName = config.school_name || 'SDN 1 PONCOWATI';
  const teacherName = currentUser?.name || 'Guru Kelas';
  const className = currentUser?.class || '-';

  let title = '';
  let dateInfo = '';
  let tableHeader = '';
  let tableRows = '';
  let tableFooter = '';

  const date = new Date(dateStr);

  if (type === 'daily') {
    title = 'LAPORAN ABSENSI HARIAN SISWA';
    dateInfo = `Tanggal: ${formatDate(dateStr)} `;
    tableHeader = `
      <tr>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">No</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: left; background-color: #f3f4f6;">Nama Siswa</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">NISN</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">NIS</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">JK</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">Status</th>
      </tr>
    `;

    let totalH = 0, totalS = 0, totalI = 0, totalA = 0;

    tableRows = classStudents.map((s, idx) => {
      const att = attendances.find(a => a.student_id === (s.__backendId || s.id) && a.attendance_date === dateStr);
      const status = att ? att.attendance_status : '';
      if (status === 'hadir') totalH++;
      else if (status === 'sakit') totalS++;
      else if (status === 'izin') totalI++;
      else if (status === 'alpa') totalA++;

      return `
      <tr>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${idx + 1}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: 600;">${s.student_name}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${s.student_nisn}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${s.student_nis || '-'}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${s.student_gender || '-'}</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">${status.toUpperCase() || '-'}</td>
      </tr>
      `;
    }).join('');

    tableFooter = `
      <tr style="background-color: #f3f4f6; font-weight: bold;">
        <td colspan="5" style="border: 1px solid #000; padding: 8px; text-align: right;">JUMLAH:</td>
        <td style="border: 1px solid #000; padding: 8px; text-align: center;">
          H:${totalH} S:${totalS} I:${totalI} A:${totalA}
        </td>
      </tr>
    `;
  } else if (type === 'weekly') {
    title = 'LAPORAN ABSENSI MINGGUAN SISWA';
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const weekDates = [];
    for (let i = 0; i < 6; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      weekDates.push(next.toISOString().split('T')[0]);
    }
    dateInfo = `Minggu: ${formatDate(weekDates[0])} s/d ${formatDate(weekDates[5])}`;
    tableHeader = `
      <tr>
        <th rowspan="2" style="border: 1px solid #000; padding: 5px; text-align: center; background-color: #f3f4f6; font-size: 10px;">Nama Siswa</th>
        <th rowspan="2" style="border: 1px solid #000; padding: 5px; text-align: center; background-color: #f3f4f6; font-size: 10px;">NISN</th>
        <th rowspan="2" style="border: 1px solid #000; padding: 5px; text-align: center; background-color: #f3f4f6; font-size: 10px;">NIS</th>
        <th colspan="6" style="border: 1px solid #000; padding: 5px; text-align: center; background-color: #f3f4f6; font-size: 10px;">Harian</th>
        <th colspan="4" style="border: 1px solid #000; padding: 5px; text-align: center; background-color: #f3f4f6; font-size: 10px;">Jumlah</th>
      </tr>
      <tr>
        ${weekDates.map(dw => `<th style="border: 1px solid #000; padding: 3px; text-align: center; background-color: #f3f4f6; font-size: 9px;">${new Date(dw).toLocaleDateString('id-ID', { weekday: 'short' })}<br>${new Date(dw).getDate()}</th>`).join('')}
        <th style="border: 1px solid #000; padding: 3px; text-align: center; background-color: #f3f4f6; font-size: 9px; width: 20px;">H</th>
        <th style="border: 1px solid #000; padding: 3px; text-align: center; background-color: #f3f4f6; font-size: 9px; width: 20px;">S</th>
        <th style="border: 1px solid #000; padding: 3px; text-align: center; background-color: #f3f4f6; font-size: 9px; width: 20px;">I</th>
        <th style="border: 1px solid #000; padding: 3px; text-align: center; background-color: #f3f4f6; font-size: 9px; width: 20px;">A</th>
      </tr>
    `;
    tableRows = classStudents.map((s, idx) => {
      let h = 0, s1 = 0, i = 0, a = 0;
      const cells = weekDates.map(dw => {
        const att = attendances.find(a => a.student_id === (s.__backendId || s.id) && a.attendance_date === dw);
        const status = att ? att.attendance_status : '';
        if (status === 'hadir') h++;
        else if (status === 'sakit') s1++;
        else if (status === 'izin') i++;
        else if (status === 'alpa') a++;
        return `<td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px;">${status ? status.charAt(0).toUpperCase() : '-'}</td>`;
      }).join('');

      return `
        <tr>
          <td style="border: 1px solid #000; padding: 4px; text-align: left; font-weight: 600; font-size: 10px;">${s.student_name}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 9px;">${s.student_nisn}</td>
          <td style="border: 1px solid #000; padding: 4px; text-align: center; font-size: 9px;">${s.student_nis || '-'}</td>
          ${cells}
          <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px; font-weight: bold; background-color: #fcfcfc;">${h}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px; font-weight: bold; background-color: #fcfcfc;">${s1}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px; font-weight: bold; background-color: #fcfcfc;">${i}</td>
          <td style="border: 1px solid #000; padding: 3px; text-align: center; font-size: 9px; font-weight: bold; background-color: #fcfcfc;">${a}</td>
        </tr>
      `;
    }).join('');
  } else if (type === 'monthly') {
    const monthName = date.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    title = 'LAPORAN ABSENSI BULANAN SISWA';
    dateInfo = `Bulan: ${monthName}`;
    tableHeader = `
      <tr>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">No</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: left; background-color: #f3f4f6;">Nama Siswa</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">NISN</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">NIS</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">H</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">S</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">I</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">A</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">Total</th>
        <th style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #f3f4f6;">%</th>
      </tr>
    `;

    const year = date.getFullYear();
    const month = date.getMonth();
    tableRows = classStudents.map((s, idx) => {
      const studentAtts = attendances.filter(a => a.student_id === (s.__backendId || s.id) && new Date(a.attendance_date).getMonth() === month && new Date(a.attendance_date).getFullYear() === year);
      const h = studentAtts.filter(a => a.attendance_status === 'hadir').length;
      const s1 = studentAtts.filter(a => a.attendance_status === 'sakit').length;
      const i = studentAtts.filter(a => a.attendance_status === 'izin').length;
      const a = studentAtts.filter(a => a.attendance_status === 'alpa').length;
      const total = h + s1 + i + a;
      const pct = total > 0 ? Math.round((h / total) * 100) : 0;
      return `
        <tr>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${idx + 1}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: left; font-weight: 600;">${s.student_name}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${s.student_nisn}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center; font-size: 11px;">${s.student_nis || '-'}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${h}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${s1}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${i}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">${a}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center; background-color: #fcfcfc;">${total}</td>
          <td style="border: 1px solid #000; padding: 8px; text-align: center; font-weight: bold;">${pct}%</td>
        </tr>
      `;
    }).join('');
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Cetak Absensi - ${schoolName}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          @page { size: portrait; margin: 15mm; }
          body { font-family: 'Inter', sans-serif; padding: 0; color: #000; font-size: 12px; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 3px double #000; padding-bottom: 10px; }
          .school-name { font-size: 20px; font-weight: bold; margin: 0; text-transform: uppercase; }
          .report-title { font-size: 14px; font-weight: bold; margin: 5px 0; text-decoration: underline; }
          .meta-grid { display: flex; justify-content: space-between; margin-bottom: 15px; }
          .meta-left p, .meta-right p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; table-layout: auto; }
          .footer { margin-top: 40px; display: flex; justify-content: space-between; }
          .sig-box { width: 220px; text-align: center; }
          .sig-space { height: 60px; }
          .sig-name { font-weight: bold; text-decoration: underline; }
          @media print { .no-print { display: none; } }
        </style>
      </head>
      <body>
        <div class="header">
          <h1 class="school-name">${schoolName}</h1>
          <div class="report-title">${title}</div>
        </div>
        <div class="meta-grid">
          <div class="meta-left">
            <p><strong>Kelas:</strong> ${className}</p>
            <p><strong>Wali Kelas:</strong> ${teacherName}</p>
          </div>
          <div class="meta-right" style="text-align: right;">
            <p><strong>${dateInfo}</strong></p>
            <p>Dicetak: ${new Date().toLocaleString('id-ID', { dateStyle: 'medium' })}</p>
          </div>
        </div>
        <table>
          <thead>${tableHeader}</thead>
          <tbody>${tableRows}</tbody>
          <tfoot>${tableFooter}</tfoot>
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
