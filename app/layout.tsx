import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/i18n/useLanguage';
import { AuthProvider } from '@/lib/auth/AuthContext';
import { ClientProviders } from '@/components/providers/ClientProviders';
import { Toaster } from 'sonner';
import { DevToolbar } from '@/components/ui/DevToolbar';

export const metadata: Metadata = {
  title: 'TRUE FORMULA — PHARMACEUTICAL-GRADE NUTRITION',
  description: 'High-performance pharmaceutical-grade nutrition supplements, clean-label formulations, and monthly subscriptions.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Space+Mono:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#FDFBF7] text-[#111827] antialiased selection:bg-[#2E5A44] selection:text-white min-h-screen flex flex-col">
        <ClientProviders>
          <LanguageProvider>
            <AuthProvider>
              {children}
              <DevToolbar />
              <Toaster position="bottom-right" richColors />
            </AuthProvider>
          </LanguageProvider>
        </ClientProviders>
      </body>
    </html>
  );
}
