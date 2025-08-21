'use client';

import { Suspense } from 'react';
import { AuthLayout } from '../../../components/auth/AuthLayout';
import { Loader, Center } from '@mantine/core';
import ResetPasswordContent from './ResetPasswordContent';

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <AuthLayout title="LOADING" subtitle="Please wait...">
        <Center>
          <Loader color="blue" />
        </Center>
      </AuthLayout>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}