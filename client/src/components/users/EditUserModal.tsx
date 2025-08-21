'use client';

import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Select,
  Button,
  Stack,
  Group,
  Text,
  Textarea,
  Grid,
  Switch
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { User, UpdateUserData } from '../../lib/users-api';

interface EditUserModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (id: string, userData: UpdateUserData) => Promise<boolean>;
  user: User | null;
  gymOptions: { value: string; label: string }[];
  loading?: boolean;
}

interface FormData {
  name: string;
  email: string;
  userType: 'admin' | 'gym_owner' | 'coach' | 'client';
  gymId: string;
  isActive: boolean;
  membershipType: string;
  fitnessGoals: string;
  medicalConditions: string;
  phone: string;
}

export function EditUserModal({
  opened,
  onClose,
  onSubmit,
  user,
  gymOptions,
  loading = false
}: EditUserModalProps) {
  const form = useForm<FormData>({
    initialValues: {
      name: '',
      email: '',
      userType: 'client',
      gymId: '',
      isActive: true,
      membershipType: 'standard',
      fitnessGoals: '',
      medicalConditions: '',
      phone: ''
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
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Invalid email format';
        return null;
      },
      userType: (value) => {
        if (!value) return 'User type is required';
        return null;
      },
      gymId: (value, values) => {
        if (values.userType !== 'admin' && !value) {
          return 'Gym is required for non-admin users';
        }
        return null;
      }
    }
  });

  // Populate form when user changes
  useEffect(() => {
    if (user && opened) {
      form.setValues({
        name: user.name,
        email: user.email,
        userType: user.userType,
        gymId: user.gymId?._id || '',
        isActive: user.isActive,
        membershipType: 'standard', // This would come from clientProfile in a full implementation
        fitnessGoals: '',
        medicalConditions: '',
        phone: ''
      });
    }
  }, [user, opened]);

  const handleSubmit = async (values: FormData) => {
    if (!user) return;

    const userData: UpdateUserData = {
      name: values.name,
      email: values.email,
      userType: values.userType,
      isActive: values.isActive,
      ...(values.userType !== 'admin' && { gymId: values.gymId })
    };

    // Add client profile data if user is a client
    if (values.userType === 'client') {
      userData.clientProfile = {
        personalInfo: {
          phone: values.phone || undefined,
          fitnessGoals: values.fitnessGoals ? values.fitnessGoals.split(',').map(g => g.trim()) : [],
          medicalConditions: values.medicalConditions ? values.medicalConditions.split(',').map(c => c.trim()) : []
        },
        membershipType: values.membershipType
      };
    }

    const success = await onSubmit(user._id, userData);
    if (success) {
      onClose();
    }
  };

  const isClient = form.values.userType === 'client';
  const requiresGym = form.values.userType !== 'admin';

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit User"
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Full Name"
                placeholder="Enter full name"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Email"
                placeholder="Enter email address"
                type="email"
                required
                {...form.getInputProps('email')}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="User Type"
                placeholder="Select user type"
                required
                data={[
                  { value: 'admin', label: 'Administrator' },
                  { value: 'gym_owner', label: 'Gym Owner' },
                  { value: 'coach', label: 'Coach' },
                  { value: 'client', label: 'Client' }
                ]}
                {...form.getInputProps('userType')}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              {requiresGym && (
                <Select
                  label="Gym"
                  placeholder="Select gym"
                  required={requiresGym}
                  data={gymOptions}
                  {...form.getInputProps('gymId')}
                  description="The gym this user will be associated with"
                />
              )}
            </Grid.Col>
          </Grid>

          <Switch
            label="Active User"
            description="Inactive users cannot log in to the system"
            {...form.getInputProps('isActive', { type: 'checkbox' })}
          />

          {/* Client-specific fields */}
          {isClient && (
            <>
              <Text size="sm" fw={500} mt="md">Client Profile Information</Text>
              
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Phone Number"
                    placeholder="Enter phone number"
                    {...form.getInputProps('phone')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Membership Type"
                    placeholder="Select membership type"
                    data={[
                      { value: 'standard', label: 'Standard' },
                      { value: 'premium', label: 'Premium' },
                      { value: 'student', label: 'Student' },
                      { value: 'senior', label: 'Senior' }
                    ]}
                    {...form.getInputProps('membershipType')}
                  />
                </Grid.Col>
              </Grid>

              <Textarea
                label="Fitness Goals"
                placeholder="Enter fitness goals (comma-separated)"
                description="e.g., Weight loss, Muscle building, Strength training"
                {...form.getInputProps('fitnessGoals')}
              />

              <Textarea
                label="Medical Conditions"
                placeholder="Enter any medical conditions (comma-separated)"
                description="e.g., Diabetes, High blood pressure, Back injury"
                {...form.getInputProps('medicalConditions')}
              />
            </>
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
              type="submit"
              loading={loading}
            >
              Update User
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}