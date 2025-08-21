'use client';

import { Title, Text, Stack, Badge } from '@mantine/core';
import { AppLayout } from '../../components/layout/AppLayout';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../lib/auth-context';

function ProgramsContent() {
  const { user } = useAuth();

  const getRoleSpecificContent = () => {
    switch (user?.userType) {
      case 'admin':
        return {
          title: 'All Programs Management',
          description: 'Manage workout programs across all gyms and locations.',
          badge: { label: 'Admin Access', color: 'red' }
        };
      case 'gym_owner':
        return {
          title: 'Gym Programs Management',
          description: 'Manage workout programs for your gym and coaches.',
          badge: { label: 'Gym Owner Access', color: 'blue' }
        };
      case 'coach':
        return {
          title: 'My Programs',
          description: 'Create and manage your workout programs for clients.',
          badge: { label: 'Coach Access', color: 'green' }
        };
      default:
        return {
          title: 'Programs',
          description: 'Workout program management.',
          badge: { label: 'User Access', color: 'gray' }
        };
    }
  };

  const content = getRoleSpecificContent();

  return (
    <AppLayout>
      <Stack>
        <div>
          <Title order={2}>{content.title}</Title>
          <Badge {...content.badge} mb="sm">
            {content.badge.label}
          </Badge>
        </div>
        <Text c="dimmed">{content.description}</Text>
        <Text>This page shows different content based on user role: {user?.userType}</Text>
      </Stack>
    </AppLayout>
  );
}

export default function ProgramsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'gym_owner', 'coach']}>
      <ProgramsContent />
    </ProtectedRoute>
  );
}