'use client';

import { useState } from 'react';
import {
  PasswordInput,
  Button,
  Stack,
  Alert,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const router = useRouter();

  const form = useForm<ResetPasswordFormData>({
    initialValues: {
      password: '',
      confirmPassword: '',
    },
    validate: {
      password: (value) => {
        if (!value) return 'Password is required';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password';
        if (value !== values.password) return 'Passwords do not match';
        return null;
      },
    },
  });

  const handleSubmit = async (values: ResetPasswordFormData) => {
    setLoading(true);
    setError(null);

    try {
      await resetPassword(token, values.password);
      setSuccess(true);
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Stack gap="md">
        <Alert
          icon={<IconCheck size="1rem" />}
          color="green"
          variant="light"
        >
          Password reset successfully! Redirecting to login...
        </Alert>
        
        <Text size="sm" c="dimmed" ta="center">
          Your password has been updated. You can now log in with your new password.
        </Text>
      </Stack>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Text size="sm" c="dimmed" ta="center">
          Enter your new password below.
        </Text>

        {error && (
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            color="red"
            variant="light"
          >
            {error}
          </Alert>
        )}

        <PasswordInput
          label="New Password"
          placeholder="Enter your new password"
          required
          {...form.getInputProps('password')}
        />

        <PasswordInput
          label="Confirm New Password"
          placeholder="Confirm your new password"
          required
          {...form.getInputProps('confirmPassword')}
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          size="md"
          color="blue"
        >
          Reset Password
        </Button>
      </Stack>
    </form>
  );
}