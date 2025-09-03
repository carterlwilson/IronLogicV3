'use client';

import { useEffect } from 'react';
import { useAuth } from '../lib/auth-context';
import { useNavigate } from 'react-router-dom';
import { RoleBasedRedirect } from '../components/auth/RoleBasedRedirect';

export function HomePage() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not logged in, redirect to login
      navigate('/auth/login');
    }
  }, [user, isLoading, navigate]);

  // If not logged in, the useEffect will handle redirect
  if (!user) {
    return null;
  }

  // Use role-based redirect component for logged-in users
  return <RoleBasedRedirect />;
}