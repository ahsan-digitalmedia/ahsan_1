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

// Application State
export const appState = {
    config: { ...defaultConfig },
    currentPage: localStorage.getItem('guru_current_page') || 'login',
    currentUserType: localStorage.getItem('guru_user_type'), // 'admin' or 'guru'
    isLoggedIn: localStorage.getItem('guru_logged_in') === 'true',
    currentUser: JSON.parse(localStorage.getItem('guru_user') || 'null'),
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
};

// Helper to update state
export function updateState(newState) {
    Object.assign(appState, newState);

    // Persist specific auth fields
    if ('isLoggedIn' in newState) localStorage.setItem('guru_logged_in', newState.isLoggedIn);
    if ('currentUser' in newState) localStorage.setItem('guru_user', JSON.stringify(newState.currentUser));
    if ('currentUserType' in newState) localStorage.setItem('guru_user_type', newState.currentUserType || '');
    if ('currentPage' in newState) localStorage.setItem('guru_current_page', newState.currentPage);

    return appState;
}
