import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata = {
    title: 'Aplikasi Guru Merdeka Mengajar - Administrasi Sekolah Digital',
    description: 'Platform Administrasi Guru & Sekolah Kurikulum Merdeka Terpadu. Sederhanakan Absensi, Nilai, Jurnal, dan Modul Ajar dengan bantuan AI.',
    keywords: ['aplikasi guru', 'administrasi sekolah', 'kurikulum merdeka', 'guru merdeka', 'jurnal guru digital', 'absensi siswa online', 'ai modul ajar', 'manajemen nilai'],
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    alternates: {
        canonical: 'https://aplikasi-guru.vercel.app',
    },
    openGraph: {
        title: 'Aplikasi Guru Merdeka Mengajar',
        description: 'Solusi administrasi sekolah modern: Modul Ajar AI, Absensi Real-time, dan Laporan Terpadu.',
        url: 'https://aplikasi-guru.vercel.app',
        siteName: 'Aplikasi Guru Indonesia',
        images: [
            {
                url: '/og-image.png',
                width: 1200,
                height: 630,
                alt: 'Preview Aplikasi Guru Merdeka',
            },
        ],
        locale: 'id_ID',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Aplikasi Guru Merdeka Mengajar',
        description: 'Inovasi Digital untuk Guru Indonesia.',
        images: ['/og-image.png'],
    },
};

export default function RootLayout({ children }) {
    return (
        <html lang="id">
            <body className={jakarta.className}>
                <AppProvider>
                    {children}
                </AppProvider>
            </body>
        </html>
    );
}
