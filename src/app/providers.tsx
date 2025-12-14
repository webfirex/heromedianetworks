'use client';

import { ThemeProvider } from 'next-themes';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';
import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

// Provide no-op localStorage during SSR to prevent NextAuth from crashing
if (typeof window === 'undefined') {
  // @ts-ignore - We're providing a no-op localStorage for SSR
  global.localStorage = {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  };
}

export function Providers({ children }: { children: React.ReactNode }) {
  // Always render SessionProvider - no-op localStorage during SSR prevents crashes
  // Temporarily keeping MantineProvider during migration - will remove once all components are migrated
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <MantineProvider>
        <Notifications position="top-right" zIndex={1000} />
          <Toaster position="top-right" />
        {children}
      </MantineProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
