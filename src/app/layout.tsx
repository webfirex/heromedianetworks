import '../styles/globals.css';
// Mantine styles are imported in globals.css during migration

import { Providers } from './providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// import { Notifications } from '@mantine/notifications';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TapNova - Track Smarter, Earn Faster',
  description: 'The most advanced affiliate tracking platform for publishers who demand precision, speed, and maximum revenue optimization.',
  icons: [
    { rel: 'icon', url: '/assests/logoR2.png', type: 'image/x-icon' }
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="w-full max-w-[100vw] overflow-x-hidden dark">
      <body className={`w-full max-w-[100vw] overflow-x-hidden ${inter.className} dark`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>

  );
}