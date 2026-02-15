import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

export const SUBJECT_LIST = [
    "Guru Kelas",
    "Pendidikan Agama Islam",
    "Pendidikan Agama Kristen",
    "Pendidikan Agama Katholik",
    "Pendidikan Agama Hindu",
    "Pendidikan Agama Budha",
    "Pendidikan Agama Khonghucu",
    "Pendidikan Pancasila",
    "Bahasa Indonesia",
    "Matematika",
    "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
    "Seni Musik",
    "Seni Rupa",
    "Seni Teater",
    "Seni Tari",
    "Bahasa Inggris",
    "Bahasa Lampung",
    "Muatan Lokal"
];

const SUBJECT_RENAME_MAP = {
    "PJOK": "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
    "IPAS": "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
    "Pendidikan Jasmani, Olahraga, dan Kesehatan": "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)",
    "Ilmu Pengetahuan Alam dan Sosial": "Ilmu Pengetahuan Alam dan Sosial (IPAS)",
    "Seni Budaya": "Muatan Lokal" // Or however user maps it, but let's stick to the obvious ones
};

export function normalizeSubject(s) {
    if (!s) return s;
    const trimmed = s.trim();
    return SUBJECT_RENAME_MAP[trimmed] || trimmed;
}

export function splitSubjects(subjectStr) {
    if (!subjectStr) return [];
    // First, try splitting by known multi-name subject to protect it
    const protectedName = "Pendidikan Jasmani, Olahraga, dan Kesehatan (PJOK)";
    const tempPlaceholder = "___PJOK_PLACEHOLDER___";

    let processed = subjectStr.replace(new RegExp(protectedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), tempPlaceholder);

    // Also protect the version without (PJOK) if it exists
    const protectedNameAlt = "Pendidikan Jasmani, Olahraga, dan Kesehatan";
    processed = processed.replace(new RegExp(protectedNameAlt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), tempPlaceholder);

    // Split by comma or semicolon or pipe
    const parts = processed.split(/[|,;]/).map(s => s.trim()).filter(s => s);

    return parts.map(p => {
        if (p === tempPlaceholder) return protectedName;
        return normalizeSubject(p);
    });
}

export function joinSubjects(subjects) {
    if (!Array.isArray(subjects)) return "";
    return subjects.filter(s => s).join(' | '); // Use pipe as separator for robustness
}

export function normalizeSubjectList(subjectStr) {
    return splitSubjects(subjectStr);
}

export const DIMENSION_LIST = [
    "Keimanan & Ketakwaan",
    "Kewargaan",
    "Penalaran Kritis",
    "Kreativitas",
    "Kolaborasi",
    "Kemandirian",
    "Kesehatan",
    "Komunikasi"
];

export const FASE_LIST = ["A", "B", "C", "D"];

export const CLASS_LIST = [
    "1", "2", "3", "4", "5", "6", "7", "8", "9"
];
