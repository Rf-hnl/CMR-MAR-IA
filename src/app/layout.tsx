import type {Metadata} from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AppLayoutClient from '@/components/AppLayoutClient';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Mar-IA CRM', // Updated title
  description: 'Busca y gestiona leads de negocios con IA', // Updated desc
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased bg-slate-50 flex flex-col min-h-screen`}>
        <AppLayoutClient>{children}</AppLayoutClient>
      </body>
    </html>
  );
}
