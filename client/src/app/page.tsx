'use client';

import { useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useRouter } from 'next/navigation';
import { RoleBasedRedirect } from '../components/auth/RoleBasedRedirect';

export default function HomePage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not logged in, redirect to login
      router.push('/auth/login');
    }
  }, [user, isLoading, router]);

  // If not logged in, the useEffect will handle redirect
  if (!user) {
    return null;
  }

  // Use role-based redirect component for logged-in users
  return <RoleBasedRedirect />;
}