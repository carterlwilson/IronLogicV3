'use client';

import {
  Modal,
  Text,
  Badge,
  Stack,
  Group,
  Paper,
  Grid,
  Divider,
  Button
} from '@mantine/core';
import { IconCalendar, IconMail, IconUser, IconBuilding, IconEdit } from '@tabler/icons-react';
import { User } from '../../lib/users-api';

interface ViewUserModalProps {
  opened: boolean;
  onClose: () => void;
  onEdit: () => void;
  user: User | null;
}

const getUserTypeBadge = (userType: string) => {
  const colors = {
    admin: 'red',
    gym_owner: 'blue',
    coach: 'green',
    client: 'orange'
  };
  
  const labels = {
    admin: 'Administrator',
    gym_owner: 'Gym Owner',
    coach: 'Coach',
    client: 'Client'
  };

  return (
    <Badge color={colors[userType as keyof typeof colors]} variant="light" size="lg">
      {labels[userType as keyof typeof labels]}
    </Badge>
  );
};

export function ViewUserModal({
  opened,
  onClose,
  onEdit,
  user
}: ViewUserModalProps) {
  if (!user) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="User Details"
      size="lg"
      centered
    >
      <Stack gap="lg">
        {/* Header */}
        <Group justify="space-between">
          <div>
            <Text size="xl" fw={600}>{user.name}</Text>
            <Group gap="xs" mt="xs">
              {getUserTypeBadge(user.userType)}
              <Badge 
                color={user.isActive ? 'green' : 'red'}
                variant="outline"
                size="sm"
              >
                {user.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </Group>
          </div>
          <Button
            leftSection={<IconEdit size="1rem" />}
            onClick={onEdit}
            variant="light"
          >
            Edit User
          </Button>
        </Group>

        <Divider />

        {/* Basic Information */}
        <Paper p="md" withBorder>
          <Text size="lg" fw={500} mb="md">Basic Information</Text>
          <Grid>
            <Grid.Col span={6}>
              <Group gap="xs" mb="sm">
                <IconUser size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Full Name</Text>
              </Group>
              <Text size="sm" c="dimmed">{user.name}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap="xs" mb="sm">
                <IconMail size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Email Address</Text>
              </Group>
              <Text size="sm" c="dimmed">{user.email}</Text>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Organization Information */}
        {user.gymId && (
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Organization</Text>
            <Group gap="xs" mb="sm">
              <IconBuilding size="1rem" color="var(--mantine-color-blue-6)" />
              <Text size="sm" fw={500}>Gym</Text>
            </Group>
            <Text size="sm" c="dimmed">{user.gymId.name}</Text>
            {user.gymId.location && (
              <Text size="xs" c="dimmed" mt="xs">{user.gymId.location}</Text>
            )}
          </Paper>
        )}

        {/* Account Information */}
        <Paper p="md" withBorder>
          <Text size="lg" fw={500} mb="md">Account Information</Text>
          <Grid>
            <Grid.Col span={6}>
              <Group gap="xs" mb="sm">
                <IconCalendar size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Created</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Group gap="xs" mb="sm">
                <IconCalendar size="1rem" color="var(--mantine-color-blue-6)" />
                <Text size="sm" fw={500}>Last Updated</Text>
              </Group>
              <Text size="sm" c="dimmed">
                {new Date(user.updatedAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </Grid.Col>
          </Grid>
        </Paper>

        {/* Role-specific Information */}
        {user.userType === 'client' && (
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Client Information</Text>
            <Text size="sm" c="dimmed">
              Client profile details would be displayed here, including membership type, 
              fitness goals, medical conditions, and workout history.
            </Text>
          </Paper>
        )}

        {user.userType === 'coach' && (
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Coach Information</Text>
            <Text size="sm" c="dimmed">
              Coach profile details would be displayed here, including specializations, 
              certifications, and assigned clients.
            </Text>
          </Paper>
        )}

        {user.userType === 'gym_owner' && (
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Gym Owner Information</Text>
            <Text size="sm" c="dimmed">
              Gym ownership details would be displayed here, including managed gyms, 
              subscription information, and business metrics.
            </Text>
          </Paper>
        )}

        {user.userType === 'admin' && (
          <Paper p="md" withBorder>
            <Text size="lg" fw={500} mb="md">Administrator Privileges</Text>
            <Text size="sm" c="dimmed">
              Full system access including user management, gym management, system settings, 
              and analytics across all organizations.
            </Text>
          </Paper>
        )}
      </Stack>
    </Modal>
  );
}