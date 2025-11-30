import type { Metadata } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';
import { PWARegister } from '@/components/PWARegister';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin']
});

export const metadata: Metadata = {
  title: 'Booqing - Professional Booking Platform for Indonesian Businesses',
  description: 'Create a professional booking system for your business with WhatsApp integration, home visit management, and powerful analytics. Start free today.',
  manifest: '/manifest.json',
  themeColor: '#3b82f6',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Booqing Admin',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="/fonts/boxicons/boxicons.css" rel="stylesheet" />
        <link href="/fonts/brands/boxicons-brands.css" rel="stylesheet" />
        <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
        {/* PWA Meta Tags */}
        <meta name="application-name" content="Booqing Admin" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Booqing" />
        <link rel="apple-touch-icon" href="/pwa/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/pwa/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/pwa/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/pwa/icon-192x192.png" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
      </head>
      <body className={`${geistSans.variable} antialiased`}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}
