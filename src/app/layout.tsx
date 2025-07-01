import '@mantine/core/styles.css';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';
import '../styles/globals.css';

import { Providers } from './providers';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
// import { Notifications } from '@mantine/notifications';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Hero Media Networks - Track Smarter, Earn Faster',
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
    <html lang="en" className="w-full max-w-[100vw] overflow-x-hidden">
      <body className={`w-full max-w-[100vw] overflow-x-hidden ${inter.className}`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>

  );
}