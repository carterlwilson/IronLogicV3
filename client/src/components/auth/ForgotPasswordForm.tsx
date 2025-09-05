'use client';

import { useState } from 'react';
import {
  TextInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconCheck } from '@tabler/icons-react';
import { useAuth } from '../../lib/auth-context';
import { Link } from 'react-router-dom';

interface ForgotPasswordFormData {
  email: string;
}

export function ForgotPasswordForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { forgotPassword } = useAuth();

  const form = useForm<ForgotPasswordFormData>({
    initialValues: {
      email: '',
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
    },
  });

  const handleSubmit = async (values: ForgotPasswordFormData) => {
    setLoading(true);
    setError(null);

    try {
      await forgotPassword(values.email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
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
          Reset instructions have been sent to your email address.
        </Alert>
        
        <Text size="sm" c="dimmed" ta="center">
          Please check your email and follow the instructions to reset your password.
          If you don't see the email, check your spam folder.
        </Text>

        <Button
          variant="outline"
          fullWidth
          onClick={() => {
            setSuccess(false);
            setError(null);
            form.reset();
          }}
        >
          Send Another Email
        </Button>

        <Text ta="center" size="sm" c="dimmed">
          <Anchor component={Link} href="/auth/login" size="sm">
            Back to login
          </Anchor>
        </Text>
      </Stack>
    );
  }

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
        <Text size="sm" c="dimmed" ta="center">
          Enter your email address and we'll send you instructions to reset your password.
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

        <TextInput
          label="Email"
          placeholder="Enter your email"
          required
          type="email"
          {...form.getInputProps('email')}
        />

        <Button
          type="submit"
          fullWidth
          loading={loading}
          size="md"
          color="blue"
        >
          Send Reset Instructions
        </Button>

        <Text ta="center" size="sm" c="dimmed">
          Remember your password?{' '}
          <Anchor component={Link} href="/auth/login" size="sm">
            Back to login
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}