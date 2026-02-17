import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata = {
    title: 'Aplikasi Guru Merdeka Mengajar',
    description: 'Platform Administrasi Guru & Sekolah Kurikulum Merdeka',
    openGraph: {
        title: 'Aplikasi Guru Merdeka Mengajar',
        description: 'Solusi administrasi sekolah modern: Modul Ajar AI, Absensi Real-time, dan Laporan Terpadu.',
        url: 'https://aplikasi-guru.vercel.app', // Sesuaikan dengan domain Anda
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
