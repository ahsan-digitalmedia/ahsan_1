import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { AppProvider } from '@/context/AppContext';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'] });

export const metadata = {
    title: 'Aplikasi Guru Merdeka Mengajar',
    description: 'Platform Administrasi Guru & Sekolah Kurikulum Merdeka',
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
