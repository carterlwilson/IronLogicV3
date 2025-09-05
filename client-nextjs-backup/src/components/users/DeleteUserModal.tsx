'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Alert,
  Stack
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { User } from '../../lib/users-api';

interface DeleteUserModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  user: User | null;
  loading?: boolean;
}

export function DeleteUserModal({
  opened,
  onClose,
  onConfirm,
  user,
  loading = false
}: DeleteUserModalProps) {
  if (!user) return null;

  const isAdmin = user.userType === 'admin';
  const hasGym = user.gymId;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete User"
      size="md"
      centered
    >
      <Stack gap="md">
        <Alert 
          icon={<IconAlertTriangle size="1rem" />}
          color="red"
          variant="light"
        >
          <Text size="sm" fw={500}>This action cannot be undone!</Text>
        </Alert>

        <div>
          <Text size="sm">
            Are you sure you want to delete the following user?
          </Text>
          <Text size="sm" mt="xs" p="sm" bg="gray.0" style={{ borderRadius: 4 }}>
            <Text component="span" fw={500}>Name:</Text> {user.name}<br />
            <Text component="span" fw={500}>Email:</Text> {user.email}<br />
            <Text component="span" fw={500}>Type:</Text> {user.userType.replace('_', ' ').toUpperCase()}<br />
            {hasGym && (
              <>
                <Text component="span" fw={500}>Gym:</Text> {user.gymId?.name}
              </>
            )}
          </Text>
        </div>

        {isAdmin && (
          <Alert color="orange" variant="light">
            <Text size="sm">
              <Text component="span" fw={500}>Warning:</Text> You are about to delete an administrator account. 
              This user will lose all administrative privileges immediately.
            </Text>
          </Alert>
        )}

        {user.userType === 'client' && (
          <Alert color="blue" variant="light">
            <Text size="sm">
              This will also deactivate the client's profile, including their membership 
              information, workout history, and benchmark records.
            </Text>
          </Alert>
        )}

        {user.userType === 'gym_owner' && (
          <Alert color="orange" variant="light">
            <Text size="sm">
              <Text component="span" fw={500}>Important:</Text> Deleting a gym owner may affect 
              gym operations. Ensure all gym responsibilities have been transferred to another user.
            </Text>
          </Alert>
        )}

        <Group justify="flex-end" mt="lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={onConfirm}
            loading={loading}
          >
            Delete User
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}