'use client';

import { Suspense } from 'react';
import { Container, Loader, Center } from '@mantine/core';
import { AppLayout } from '../../../components/layout/AppLayout';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { ProgramBuilder } from '../../../components/programs/ProgramBuilder';

function ProgramBuilderContent() {
  return (
    <AppLayout>
      <Container size="xl" fluid>
        <Suspense 
          fallback={
            <Center h={200}>
              <Loader size="lg" />
            </Center>
          }
        >
          <ProgramBuilder />
        </Suspense>
      </Container>
    </AppLayout>
  );
}

export default function ProgramBuilderPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'gym_owner', 'coach']}>
      <ProgramBuilderContent />
    </ProtectedRoute>
  );
}