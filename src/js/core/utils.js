import { appState } from './state.js';

// Toast Notification Function
export function showToast(message, type = 'success', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast-notification toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Generate unique ID
export function generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Validate email format
export function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

// Validate NIP (18 digits)
export function isValidNIP(nip) {
    return /^\d{18}$/.test(nip);
}

// Validate phone number (Indonesia format)
export function isValidPhone(phone) {
    return /^(62|0)[0-9]{9,12}$/.test(phone);
}

// Check if NIP or Email already exists
// Note: These now take the list as an argument or use state
export function isDuplicateNIP(teachers, nip, excludeId = null) {
    return teachers.some(t => t.nip === nip && (!excludeId || t.__backendId !== excludeId));
}

export function isDuplicateEmail(teachers, email, excludeId = null) {
    return teachers.some(t => t.email === email && (!excludeId || t.__backendId !== excludeId));
}

// Format date
export function formatDate(dateString) {
    if (!dateString) return '-';
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('id-ID', options);
}

// Get score badge class
export function getScoreBadgeClass(score) {
    if (score >= 85) return 'score-excellent';
    if (score >= 75) return 'score-good';
    if (score >= 60) return 'score-average';
    return 'score-poor';
}

// Render utils (moving them here for now, or to a dedicated ui.js later)
export function updateBreadcrumb(role, pageTitle) {
    const breadcrumbCurrent = document.getElementById('breadcrumb-current');
    if (breadcrumbCurrent) breadcrumbCurrent.textContent = pageTitle;
}

export function closeModal() {
    import('./state.js').then(m => {
        m.updateState({ showModal: false, editingItem: null, modalMode: 'add', showDeleteConfirm: false });
        // This will require a global render call which we'll setup in app.js
        window.dispatchEvent(new CustomEvent('app-state-changed'));
    });
}
