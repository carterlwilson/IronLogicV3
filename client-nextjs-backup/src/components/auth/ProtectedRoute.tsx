'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../lib/auth-context';
import { Center, Loader, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: string[];
  redirectTo?: string;
  fallback?: ReactNode;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles = [], 
  redirectTo = '/auth/login',
  fallback 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push(redirectTo);
    }
  }, [user, isLoading, router, redirectTo]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <Center h="100vh">
        <Loader color="blue" size="lg" />
      </Center>
    );
  }

  // Redirect if not authenticated
  if (!user) {
    return null;
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.userType)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <Center h="100vh" p="md">
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          color="red"
          title="Access Denied"
          variant="filled"
          maw={400}
        >
          You don't have permission to access this page. Your role ({user.userType}) is not authorized for this content.
        </Alert>
      </Center>
    );
  }

  return <>{children}</>;
}

// Convenience components for specific roles
export function AdminOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function GymOwnerOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'gym_owner']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function CoachOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin', 'gym_owner', 'coach']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}

export function ClientOnly({ children, fallback }: { children: ReactNode; fallback?: ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['client']} fallback={fallback}>
      {children}
    </ProtectedRoute>
  );
}