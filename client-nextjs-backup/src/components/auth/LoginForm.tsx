'use client';

import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Checkbox,
  Group,
  Stack,
  Alert,
  Anchor,
  Text,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../lib/auth-context';
import Link from 'next/link';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export function LoginForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { login } = useAuth();

  const form = useForm<LoginFormData>({
    initialValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
    validate: {
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        return null;
      },
    },
  });

  const handleSubmit = async (values: LoginFormData) => {
    setLoading(true);
    setError(null);

    try {
      await login(values.email, values.password);
      
      // Store remember me preference
      if (values.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      } else {
        localStorage.removeItem('rememberMe');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack gap="md">
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

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          required
          {...form.getInputProps('password')}
        />

        <Group justify="space-between">
          <Checkbox
            label="Remember me"
            {...form.getInputProps('rememberMe', { type: 'checkbox' })}
          />
          <Anchor component={Link} href="/auth/forgot-password" size="sm">
            Forgot password?
          </Anchor>
        </Group>

        <Button
          type="submit"
          fullWidth
          loading={loading}
          size="md"
          color="blue"
        >
          Sign In
        </Button>

        <Text ta="center" size="sm" c="dimmed">
          Don't have an account?{' '}
          <Anchor component={Link} href="/auth/register" size="sm">
            Create account
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}