import { appState, updateState } from '../core/state.js';
import { showToast, generateId } from '../core/utils.js';

export function setupLoginHandlers() {
    const loginForm = document.getElementById('login-form');
    const guruForm = document.getElementById('guru-form');
    const tabAdmin = document.getElementById('tab-admin');
    const tabGuru = document.getElementById('tab-guru');

    // Registration Toggle Logic
    const toggleRegBtn = document.getElementById('toggle-reg-btn');
    const guruLoginFields = document.getElementById('guru-login-fields');
    const guruRegFields = document.getElementById('guru-reg-fields');
    const guruBtnText = document.getElementById('guru-btn-text');
    const demoGuruInfo = document.getElementById('demo-guru-info');
    let isRegisterMode = false;

    if (toggleRegBtn) {
        toggleRegBtn.onclick = () => {
            isRegisterMode = !isRegisterMode;
            if (isRegisterMode) {
                guruLoginFields.classList.add('hidden');
                guruRegFields.classList.remove('hidden');
                guruBtnText.textContent = 'Daftar Sekarang';
                toggleRegBtn.textContent = 'Sudah punya akun? Masuk';
                if (demoGuruInfo) demoGuruInfo.classList.add('hidden');
            } else {
                guruLoginFields.classList.remove('hidden');
                guruRegFields.classList.add('hidden');
                guruBtnText.textContent = 'Masuk sebagai Guru';
                toggleRegBtn.textContent = 'Belum punya akun? Daftar Sekarang';
                if (demoGuruInfo) demoGuruInfo.classList.remove('hidden');
            }
        };
    }

    if (tabAdmin) {
        tabAdmin.onclick = () => {
            tabAdmin.style.background = 'rgba(255,255,255,0.9)';
            tabAdmin.style.color = '#0066FF';
            tabGuru.style.background = 'rgba(255,255,255,0.2)';
            tabGuru.style.color = '#9CA3AF';
            loginForm.classList.remove('hidden');
            guruForm.classList.add('hidden');
        };
    }

    if (tabGuru) {
        tabGuru.onclick = () => {
            tabGuru.style.background = 'rgba(255,255,255,0.9)';
            tabGuru.style.color = '#0066FF';
            tabAdmin.style.background = 'rgba(255,255,255,0.2)';
            tabAdmin.style.color = '#9CA3AF';
            guruForm.classList.remove('hidden');
            loginForm.classList.add('hidden');
        };
    }

    if (loginForm) {
        loginForm.onsubmit = async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const rememberMe = document.getElementById('admin-remember')?.checked || false;

            const config = appState.config || {};
            const adminEmail = config.admin_email || 'admin@sekolah.id';
            const adminPassword = config.admin_password || 'admin123';

            if (email === adminEmail && password === adminPassword) {
                updateState({
                    currentUser: { name: 'Administrator', email, role: 'admin' },
                    currentUserType: 'admin',
                    isLoggedIn: true,
                    rememberMe: rememberMe,
                    currentPage: 'dashboard'
                });
                window.dispatchEvent(new CustomEvent('app-state-changed'));
            } else {
                const errorEl = document.getElementById('login-error');
                errorEl.textContent = 'Email atau password salah!';
                errorEl.classList.remove('hidden');
            }
        };
    }

    if (guruForm) {
        guruForm.onsubmit = async (e) => {
            e.preventDefault();
            const errorEl = document.getElementById('guru-error');
            errorEl.classList.add('hidden');

            if (isRegisterMode) {
                const name = document.getElementById('reg-name').value;
                const email = document.getElementById('reg-email').value;
                const phone = document.getElementById('reg-phone').value;
                const password = document.getElementById('reg-password').value;

                if (!name || !email || !password) {
                    errorEl.textContent = 'Mohon lengkapi semua data!';
                    errorEl.classList.remove('hidden');
                    return;
                }

                try {
                    const newTeacher = {
                        id: generateId(),
                        name,
                        email,
                        phone,
                        password,
                        status: 'pending', // Validation required by admin
                        type: 'teacher',
                        subject: 'Guru Mata Pelajaran', // Default
                        nip: '-', // Placeholder
                        class: '-',// Placeholder
                        joinDate: new Date().toISOString()
                    };

                    if (window.dataSdk) {
                        await window.dataSdk.create(newTeacher);

                        // Show success UI with WA button
                        const config = appState.config || {};
                        const adminPhone = config.admin_whatsapp || '6285268474347'; // Fallback
                        const waMessage = encodeURIComponent(`Halo Admin, saya baru saja mendaftar ke Aplikasi Guru.\n\nNama: ${name}\nEmail: ${email}\n\nMohon bantuannya untuk mengaktifkan akun saya. Terima kasih.`);
                        const waUrl = `https://wa.me/${adminPhone}?text=${waMessage}`;

                        guruForm.innerHTML = `
                            <div class="animate-fadeIn text-center py-6">
                                <div class="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                </div>
                                <h3 class="text-xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h3>
                                <p class="text-sm text-slate-500 mb-6 px-4">
                                    Akun Anda telah berhasil dibuat dengan status <strong>Menunggu Persetujuan</strong>. Silakan konfirmasi ke admin via WhatsApp untuk aktivasi cepat.
                                </p>
                                <a href="${waUrl}" target="_blank" class="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba5a] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-green-200/50 mb-4 mx-6">
                                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.45L0 24l7.148-1.875a11.876 11.876 0 005.356 1.26h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"></path>
                                    </svg>
                                    Konfirmasi via WhatsApp
                                </a>
                                <button type="button" onclick="location.reload()" class="text-sm text-slate-400 hover:text-blue-600 transition-colors">
                                    Kembali ke halaman Masuk
                                </button>
                            </div>
                        `;
                    }
                } catch (err) {
                    console.error('Registration error:', err);
                    errorEl.textContent = 'Gagal mendaftar. Silakan coba lagi.';
                    errorEl.classList.remove('hidden');
                }
            } else {
                const email = document.getElementById('guru-email').value;
                const password = document.getElementById('guru-password').value;

                const teacher = appState.teachers.find(t => t.email === email && t.password === password);
                if (teacher) {
                    if (teacher.status !== 'active') {
                        errorEl.textContent = 'Akun Anda belum disetujui atau dinonaktifkan oleh admin.';
                        errorEl.classList.remove('hidden');
                        return;
                    }

                    const rememberMe = document.getElementById('guru-remember')?.checked || false;
                    const isProfileIncomplete = !teacher.nip || teacher.nip === '-' || !teacher.subject || teacher.subject === '-' || !teacher.class || !teacher.npsn;

                    updateState({
                        currentUser: teacher,
                        currentUserType: 'guru',
                        isLoggedIn: true,
                        rememberMe: rememberMe,
                        currentPage: 'guru-dashboard'
                    });

                    if (isProfileIncomplete) {
                        updateState({
                            showModal: true,
                            modalMode: 'edit',
                            editingItem: { ...teacher },
                            currentPage: 'guru-profile'
                        });
                        showToast('Silakan lengkapi biodata Anda terlebih dahulu', 'info');
                    } else {
                        showToast(`Selamat datang, ${teacher.name}!`, 'success');
                    }

                    window.dispatchEvent(new CustomEvent('app-state-changed'));
                } else {
                    errorEl.textContent = 'Email atau password salah!';
                    errorEl.classList.remove('hidden');
                }
            }
        };
    }
}
