'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { Center, Loader, Text, Stack } from '@mantine/core';

interface RoleBasedRedirectProps {
  children?: React.ReactNode;
}

export function RoleBasedRedirect({ children }: RoleBasedRedirectProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      // Redirect clients to mobile/PWA interface
      if (user.userType === 'client') {
        router.push('/mobile');
        return;
      }
      
      // Redirect other users to dashboard
      if (user.userType === 'admin' || user.userType === 'gym_owner' || user.userType === 'coach') {
        router.push('/dashboard');
        return;
      }
    }
  }, [user, isLoading, router]);

  // Show loading while determining redirect
  if (isLoading) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader color="blue" size="lg" />
          <Text c="dimmed">Loading your dashboard...</Text>
        </Stack>
      </Center>
    );
  }

  // Show loading while redirecting
  if (user) {
    return (
      <Center h="100vh">
        <Stack align="center" gap="md">
          <Loader color="blue" size="lg" />
          <Text c="dimmed">Redirecting...</Text>
        </Stack>
      </Center>
    );
  }

  return <>{children}</>;
}