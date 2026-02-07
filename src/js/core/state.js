export const SUBJECT_LIST = [
    'Pendidikan Agama Islam', 'Pendidikan Agama Kristen', 'Pendidikan Agama Katholik',
    'Bahasa Indonesia', 'Bahasa Inggris', 'Pendidikan Pancasila', 'Matematika',
    'IPAS', 'PJOK', 'Bahasa Lampung', 'Seni Rupa', 'Seni Musik', 'KKA'
];

export const CLASS_LIST = [
    '1A', '1B', '1C',
    '2A', '2B', '2C',
    '3A', '3B', '3C',
    '4A', '4B', '4C',
    '5A', '5B', '5C',
    '6A', '6B', '6C'
];

export const defaultConfig = {
    app_title: 'APLIKASI ADMINISTRASI GURU',
    app_version: 'v1.0.0',
    admin_whatsapp: '6285268474347',
    admin_email: 'admin@sekolah.id',
    admin_password: 'admin123',
    primary_color: '#0066FF',
    background_color: '#FFFFFF',
    text_color: '#1E293B',
    surface_color: '#F8FAFC',
    accent_color: '#00D4FF'
};

// Helper to get from any storage
function getFromStorage(key) {
    return localStorage.getItem(key) || sessionStorage.getItem(key);
}

// Application State
export const appState = {
    config: { ...defaultConfig },
    currentPage: getFromStorage('guru_current_page') || 'login',
    currentUserType: getFromStorage('guru_user_type'), // 'admin' or 'guru'
    isLoggedIn: getFromStorage('guru_logged_in') === 'true',
    currentUser: JSON.parse(getFromStorage('guru_user') || 'null'),
    rememberMe: localStorage.getItem('guru_remember_me') === 'true',
    teachers: [],
    assignments: [],
    students: [],
    attendances: [],
    scores: [],
    teacherAttendances: [],
    journals: [],
    modulAjars: [],
    sidebarOpen: false,
    showModal: false,
    modalMode: 'add',
    editingItem: null,
    showDeleteConfirm: false,
    deletingItem: null,
    selectedDate: new Date().toISOString().split('T')[0],
    notifications: [
        { id: 1, text: 'Sistem siap digunakan', time: 'baru saja', read: false },
        { id: 2, text: 'Selamat datang di aplikasi guru', time: '1 menit lalu', read: true }
    ],
    showNotifications: false,
    isLoading: false,
    filterSubject: '',
    scoreViewMode: 'input', // 'input' or 'rekap'
    selectedAttendanceClass: '',
    selectedScoreClass: '',
    selectedStudentClass: '',
    studentSearchQuery: '',
    scoreWeights: { fs: 80, pts: 10, pas: 10 },
    scoreTPCount: 4,
    scoreSumatifCount: 4,
};

// Helper to update state
export function updateState(newState) {
    Object.assign(appState, newState);

    // Determine storage type
    const storage = appState.rememberMe ? localStorage : sessionStorage;

    // Persist specific auth fields
    if ('rememberMe' in newState) {
        if (newState.rememberMe) {
            localStorage.setItem('guru_remember_me', 'true');
        } else {
            localStorage.removeItem('guru_remember_me');
        }
    }

    if ('isLoggedIn' in newState) {
        storage.setItem('guru_logged_in', newState.isLoggedIn);
        if (!newState.isLoggedIn) {
            // Clear all on logout
            localStorage.removeItem('guru_logged_in');
            localStorage.removeItem('guru_user');
            localStorage.removeItem('guru_user_type');
            localStorage.removeItem('guru_current_page');
            sessionStorage.clear();
        }
    }

    if ('currentUser' in newState) storage.setItem('guru_user', JSON.stringify(newState.currentUser));
    if ('currentUserType' in newState) storage.setItem('guru_user_type', newState.currentUserType || '');
    if ('currentPage' in newState) storage.setItem('guru_current_page', newState.currentPage);

    // Automatically trigger UI re-render on state change
    window.dispatchEvent(new CustomEvent('app-state-changed'));

    return appState;
}
