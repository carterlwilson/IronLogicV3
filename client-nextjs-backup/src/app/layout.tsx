import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';
import { AuthProvider } from '../lib/auth-context';

export const metadata = {
  title: 'IronLogic3 - Gym Management System',
  description: 'Comprehensive gym management platform for owners, coaches, and clients',
  manifest: '/manifest.json',
  themeColor: '#1976d2',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="theme-color" content="#1976d2" />
      </head>
      <body>
        <MantineProvider>
          <ModalsProvider>
            <AuthProvider>
              <Notifications />
              {children}
            </AuthProvider>
          </ModalsProvider>
        </MantineProvider>
      </body>
    </html>
  );
}