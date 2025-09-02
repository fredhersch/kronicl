import type { Metadata } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/components/auth-provider';
import { PageLogger } from '@/components/page-logger';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Suspense } from 'react';

export const metadata: Metadata = {
  title: 'Kronicl',
  description: 'Capture and cherish your memories.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400..700;1,400..700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <Suspense fallback={null}>
            <PageLogger />
          </Suspense>
          {children}
          <BottomNavigation />
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}
