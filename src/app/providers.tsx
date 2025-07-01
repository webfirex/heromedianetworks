'use client';

import { MantineProvider } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { SessionProvider } from 'next-auth/react';
import '@mantine/core/styles.css';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <MantineProvider>
        <Notifications position="top-right" zIndex={1000} />
        {children}
      </MantineProvider>
    </SessionProvider>
  );
}
