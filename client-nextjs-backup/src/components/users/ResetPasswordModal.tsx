'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Alert,
  Stack,
  PasswordInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconKey } from '@tabler/icons-react';
import { User } from '../../lib/users-api';

interface ResetPasswordModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (newPassword: string) => Promise<boolean>;
  user: User | null;
  loading?: boolean;
}

interface FormData {
  newPassword: string;
  confirmPassword: string;
}

export function ResetPasswordModal({
  opened,
  onClose,
  onConfirm,
  user,
  loading = false
}: ResetPasswordModalProps) {
  const form = useForm<FormData>({
    initialValues: {
      newPassword: '',
      confirmPassword: ''
    },
    validate: {
      newPassword: (value) => {
        if (!value) return 'New password is required';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm the password';
        if (value !== values.newPassword) return 'Passwords do not match';
        return null;
      }
    }
  });

  const handleSubmit = async (values: FormData) => {
    const success = await onConfirm(values.newPassword);
    if (success) {
      form.reset();
      onClose();
    }
  };

  if (!user) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Reset Password"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Alert 
            icon={<IconKey size="1rem" />}
            color="blue"
            variant="light"
          >
            <Text size="sm">
              You are about to reset the password for <Text component="span" fw={500}>{user.name}</Text> ({user.email})
            </Text>
          </Alert>

          <Text size="sm" c="dimmed">
            The user will need to use the new password to log in. They will be automatically 
            logged out of all active sessions.
          </Text>

          <PasswordInput
            label="New Password"
            placeholder="Enter new password"
            required
            {...form.getInputProps('newPassword')}
          />

          <PasswordInput
            label="Confirm New Password"
            placeholder="Confirm new password"
            required
            {...form.getInputProps('confirmPassword')}
          />

          <Group justify="flex-end" mt="lg">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              color="blue"
            >
              Reset Password
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}