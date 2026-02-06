import { appState, updateState } from '../../core/state.js';
import { showToast, generateId, formatDate } from '../../core/utils.js';

export function setupGuruAttendanceHandlers() {
  const contentArea = document.getElementById('content-area');
  if (!contentArea) return;

  if (contentArea._attendanceHandler) {
    contentArea.removeEventListener('click', contentArea._attendanceHandler);
  }

  const handler = async (e) => {
    // Attendance Status Buttons
    const statusBtn = e.target.closest('.set-attendance-btn');
    if (statusBtn) {
      const studentId = statusBtn.getAttribute('data-student-id');
      const status = statusBtn.getAttribute('data-status');
      const date = document.getElementById('attendance-date').value;

      try {
        const student = appState.students.find(s => String(s.__backendId || s.id) === String(studentId));
        const managedClasses = (appState.currentUser?.class || '').split(',').map(c => c.trim()).filter(c => c);
        const currentClass = appState.selectedAttendanceClass || managedClasses[0] || '';
        const existing = appState.attendances.find(a =>
          String(a.student_id) === String(studentId) && a.attendance_date === date
        );

        const attendanceData = {
          id: existing ? (existing.id || existing.__backendId) : generateId(),
          __backendId: existing?.__backendId,
          student_id: studentId,
          attendance_date: date,
          attendance_status: status,
          attendance_class: currentClass || student?.student_class,
          teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
          attendance_teacher_nip: appState.currentUser?.nip,
          type: 'attendance'
        };

        if (existing) {
          if (window.dataSdk) await window.dataSdk.update(attendanceData);
          const idx = appState.attendances.findIndex(a =>
            String(a.student_id || '').trim() === String(studentId || '').trim() &&
            String(a.attendance_date || '').trim() === String(date || '').trim()
          );
          if (idx !== -1) appState.attendances[idx] = attendanceData;
        } else {
          if (window.dataSdk) await window.dataSdk.create(attendanceData);
          appState.attendances.push(attendanceData);
        }
        window.dispatchEvent(new CustomEvent('app-state-changed'));
      } catch (err) {
        showToast('Gagal mencatat absensi', 'error');
      }
      return;
    }

    // Mark All Present Button
    const markAllBtn = e.target.closest('#mark-all-present-btn');
    if (markAllBtn) {
      const date = document.getElementById('attendance-date').value;
      const managedClasses = (appState.currentUser?.class || '').split(',').map(c => c.trim()).filter(c => c);
      const currentClass = appState.selectedAttendanceClass || managedClasses[0] || '';
      const isFlexibleMatch = (itemClass) => {
        const ic = String(itemClass || '').trim();
        const target = String(currentClass || '').trim();
        if (ic === target) return true;
        return ic.startsWith(target) && !/^\d/.test(ic.substring(target.length));
      };

      const classStudents = appState.students.filter(s =>
        (s.type === 'student' || !s.type) && isFlexibleMatch(s.student_class)
      );

      if (classStudents.length === 0) {
        showToast('Tidak ada siswa di kelas ini', 'error');
        return;
      }



      markAllBtn.disabled = true;
      const originalText = markAllBtn.innerHTML;
      markAllBtn.innerHTML = 'Memproses...';

      try {
        const attendancePromises = classStudents.map(async (student) => {
          const studentId = student.__backendId || student.id;
          const existing = appState.attendances.find(a =>
            String(a.student_id) === String(studentId) && a.attendance_date === date
          );

          const attendanceData = {
            id: existing ? (existing.id || existing.__backendId) : generateId(),
            __backendId: existing?.__backendId,
            student_id: studentId,
            attendance_date: date,
            attendance_status: 'hadir',
            attendance_class: currentClass,
            teacher_id: appState.currentUser?.__backendId || appState.currentUser?.id,
            attendance_teacher_nip: appState.currentUser?.nip,
            type: 'attendance'
          };

          if (existing) {
            if (existing.attendance_status !== 'hadir') {
              if (window.dataSdk) await window.dataSdk.update(attendanceData);
              return { type: 'update', data: attendanceData };
            }
            return { type: 'none' };
          } else {
            if (window.dataSdk) await window.dataSdk.create(attendanceData);
            return { type: 'create', data: attendanceData };
          }
        });

        const results = await Promise.all(attendancePromises);

        // Update local state in one go
        const newAttendances = [...appState.attendances];
        results.forEach(res => {
          if (res.type === 'create') {
            newAttendances.push(res.data);
          } else if (res.type === 'update') {
            const idx = newAttendances.findIndex(a =>
              String(a.student_id) === String(res.data.student_id) && a.attendance_date === res.data.attendance_date
            );
            if (idx !== -1) newAttendances[idx] = res.data;
          }
        });

        updateState({ attendances: newAttendances });
        showToast('Semua siswa berhasil dihadirkan');
      } catch (err) {
        console.error('Mass attendance error:', err);
        showToast('Gagal memproses absensi massal', 'error');
      } finally {
        markAllBtn.disabled = false;
        markAllBtn.innerHTML = originalText;
        window.dispatchEvent(new CustomEvent('app-state-changed'));
      }
      return;
    }

    // Print Report Button
    const printBtn = e.target.closest('.print-report-btn');
    if (printBtn) {
      const type = printBtn.getAttribute('data-type');
      const date = document.getElementById('attendance-date')?.value || appState.selectedDate;
      printAttendanceReport(type, date);
      return;
    }
  };

  contentArea.addEventListener('click', handler);
  contentArea._attendanceHandler = handler;

  // Date Change Handler
  const dateInput = document.getElementById('attendance-date');
  if (dateInput) {
    dateInput.onchange = (e) => {
      updateState({ selectedDate: e.target.value });
      window.dispatchEvent(new CustomEvent('app-state-changed'));
    };
  }

  // Class Selector Handler
  const classSelect = document.getElementById('attendance-class-select');
  if (classSelect) {
    classSelect.onchange = (e) => {
      updateState({ selectedAttendanceClass: e.target.value });
      window.dispatchEvent(new CustomEvent('app-state-changed'));
    };
  }
}

function printAttendanceReport(type, dateStr) {
  const { students, attendances, currentUser, config, selectedAttendanceClass } = appState;
  const managedClasses = (currentUser?.class || '').split(',').map(c => c.trim()).filter(c => c);
  const currentClass = selectedAttendanceClass || managedClasses[0] || '';
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

  let title = '';
  let dateInfo = '';
  let tableHeader = '';
  let tableRows = '';
  let tableFooter = '';

  const dateInput = dateStr || appState.selectedDate || new Date().toISOString().split('T')[0];
  const [y, m, d_] = dateInput.split('-').map(Number);
  const date = new Date(y, m - 1, d_);

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
    const monday = new Date(new Date(d).setDate(diff));
    const weekDates = [];
    for (let i = 0; i < 6; i++) {
      const next = new Date(monday);
      next.setDate(monday.getDate() + i);
      const yyyy = next.getFullYear();
      const mm = String(next.getMonth() + 1).padStart(2, '0');
      const dd = String(next.getDate()).padStart(2, '0');
      weekDates.push(`${yyyy}-${mm}-${dd}`);
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
            <p><strong>Semester:</strong> ${currentUser?.semester || '-'}</p>
            <p><strong>Tahun Pelajaran:</strong> ${currentUser?.academic_year || '-'}</p>
          </div>
          <div class="meta-right" style="text-align: right;">
            <p><strong>Guru:</strong> ${teacherName}</p>
            <p><strong>Status:</strong> ${currentUser?.subject === 'Guru Kelas' ? 'Guru Kelas' : `Guru Mapel (${currentUser?.subject || '-'})`}</p>
            <p><strong>${dateInfo}</strong></p>
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
            <p class="sig-name">${currentUser?.principal_name || '( ........................................ )'}</p>
            <p>NIP. ${currentUser?.principal_nip || '........................................'}</p>
          </div>
          <div class="sig-box">
            <p>Poncowati, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            <p>${currentUser?.subject === 'Guru Kelas' ? 'Guru Kelas,' : 'Guru Mata Pelajaran,'}</p>
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
