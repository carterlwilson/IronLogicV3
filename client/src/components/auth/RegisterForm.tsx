'use client';

import { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Stack,
  Alert,
  Anchor,
  Text,
  Select,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../lib/auth-context';
import { Link } from 'react-router-dom';

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  userType: 'admin' | 'gym_owner' | 'coach' | 'client';
  gymId?: string | undefined;
}


export function RegisterForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { register } = useAuth();

  const form = useForm<RegisterFormData>({
    initialValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      userType: 'admin',
      gymId: undefined,
    },
    validate: {
      name: (value) => {
        if (!value) return 'Name is required';
        if (value.length < 2) return 'Name must be at least 2 characters';
        if (value.length > 100) return 'Name cannot exceed 100 characters';
        return null;
      },
      email: (value) => {
        if (!value) return 'Email is required';
        if (!/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 1) return 'Password is required';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password';
        if (value !== values.password) return 'Passwords do not match';
        return null;
      },
      userType: (value) => {
        if (!value) return 'User type is required';
        return null;
      },
      gymId: (value, values) => {
        if (values.userType !== 'admin' && !value) {
          return 'Gym ID is required for non-admin users';
        }
        return null;
      },
    },
  });


  const handleSubmit = async (values: RegisterFormData) => {
    setLoading(true);
    setError(null);

    try {
      await register({
        name: values.name,
        email: values.email,
        password: values.password,
        userType: values.userType,
        ...(values.userType !== 'admin' && values.gymId && { gymId: values.gymId })
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
          label="Full Name"
          placeholder="Enter your full name"
          required
          {...form.getInputProps('name')}
        />

        <TextInput
          label="Email"
          placeholder="Enter your email"
          required
          type="email"
          {...form.getInputProps('email')}
        />

        <Select
          label="User Type"
          placeholder="Select user type"
          required
          data={[
            { value: 'admin', label: 'Administrator' },
            { value: 'gym_owner', label: 'Gym Owner' },
            { value: 'coach', label: 'Coach' },
            { value: 'client', label: 'Client' },
          ]}
          {...form.getInputProps('userType')}
        />

        {form.values.userType !== 'admin' && (
          <TextInput
            label="Gym ID"
            placeholder="Enter gym ID (will be provided by admin)"
            required
            {...form.getInputProps('gymId')}
            description="This will be provided by your gym administrator"
          />
        )}

        <PasswordInput
          label="Password"
          placeholder="Enter your password"
          required
          {...form.getInputProps('password')}
        />

        <PasswordInput
          label="Confirm Password"
          placeholder="Confirm your password"
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
          Create Account
        </Button>

        <Text ta="center" size="sm" c="dimmed">
          Already have an account?{' '}
          <Anchor component={Link} href="/auth/login" size="sm">
            Sign in
          </Anchor>
        </Text>
      </Stack>
    </form>
  );
}