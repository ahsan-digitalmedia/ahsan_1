import { appState, updateState } from '../core/state.js';

export function setupLoginHandlers() {
    const loginForm = document.getElementById('login-form');
    const guruForm = document.getElementById('guru-form');
    const tabAdmin = document.getElementById('tab-admin');
    const tabGuru = document.getElementById('tab-guru');

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

            if (email === 'admin@sekolah.id' && password === 'admin123') {
                updateState({
                    currentUser: { name: 'Administrator', email, role: 'admin' },
                    currentUserType: 'admin',
                    isLoggedIn: true,
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
            const email = document.getElementById('guru-email').value;
            const password = document.getElementById('guru-password').value;

            const teacher = appState.teachers.find(t => t.email === email && t.password === password);
            if (teacher) {
                updateState({
                    currentUser: teacher,
                    currentUserType: 'guru',
                    isLoggedIn: true,
                    currentPage: 'guru-dashboard'
                });
                window.dispatchEvent(new CustomEvent('app-state-changed'));
            } else {
                const errorEl = document.getElementById('guru-error');
                errorEl.textContent = 'Email atau password salah!';
                errorEl.classList.remove('hidden');
            }
        };
    }
}
