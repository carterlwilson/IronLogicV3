'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { ResetPasswordForm } from '../../../components/auth/ResetPasswordForm';
import { Alert, Button, Stack } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

export default function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      // No token provided, redirect to forgot password
      router.push('/auth/forgot-password');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams, router]);

  if (!token) {
    return (
      <AuthLayout 
        title="INVALID LINK" 
        subtitle="Password reset link is invalid"
      >
        <Stack gap="md">
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            color="red"
            variant="light"
          >
            This password reset link is invalid or has expired.
          </Alert>
          
          <Button
            onClick={() => router.push('/auth/forgot-password')}
            fullWidth
            color="blue"
          >
            Request New Reset Link
          </Button>
        </Stack>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="RESET PASSWORD" 
      subtitle="Create your new password"
    >
      <ResetPasswordForm token={token} />
    </AuthLayout>
  );
}