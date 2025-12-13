'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { SessionProvider } from 'next-auth/react';
import '@mantine/core/styles.css';

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
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <MantineProvider>
        <Notifications position="top-right" zIndex={1000} />
        {children}
      </MantineProvider>
    </SessionProvider>
  );
}
