'use client';

import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Select,
  PasswordInput,
  Button,
  Stack,
  Group,
  Text,
  Textarea,
  Grid
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { type CreateUserData } from '../../lib/users-api';

interface ClientCreateModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (userData: CreateUserData) => Promise<boolean>;
  gymOptions: { value: string; label: string }[];
  loading?: boolean;
}

interface FormData {
  // User Information
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  gymId: string;

  // Personal Information
  phone: string;
  dateOfBirth: Date | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;

  // Membership Information
  membershipType: string;
  joinDate: Date | null;

  // Preferences
  fitnessGoals: string;
  medicalConditions: string;
  notes: string;
}

export function ClientCreateModal({
  opened,
  onClose,
  onSave,
  gymOptions,
  loading = false
}: ClientCreateModalProps) {
  const form = useForm<FormData>({
    initialValues: {
      // User Information
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      gymId: '',

      // Personal Information
      phone: '',
      dateOfBirth: null,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',

      // Membership Information
      membershipType: 'standard',
      joinDate: new Date(),

      // Preferences
      fitnessGoals: '',
      medicalConditions: '',
      notes: ''
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
      password: (value) => {
        if (!value) return 'Password is required';
        if (value.length < 6) return 'Password must be at least 6 characters';
        return null;
      },
      confirmPassword: (value, values) => {
        if (!value) return 'Please confirm your password';
        if (value !== values.password) return 'Passwords do not match';
        return null;
      },
      gymId: (value) => {
        if (!value) return 'Gym is required';
        return null;
      },
      membershipType: (value) => {
        if (!value) return 'Membership type is required';
        return null;
      },
      phone: (value) => {
        if (value && !/^\+?[\d\s\-()]+$/.test(value)) {
          return 'Invalid phone number format';
        }
        return null;
      },
      emergencyContactPhone: (value, values) => {
        if (values.emergencyContactName && !value) {
          return 'Emergency contact phone is required when name is provided';
        }
        if (value && !/^\+?[\d\s\-()]+$/.test(value)) {
          return 'Invalid phone number format';
        }
        return null;
      },
      emergencyContactName: (value, values) => {
        if (values.emergencyContactPhone && !value) {
          return 'Emergency contact name is required when phone is provided';
        }
        return null;
      },
      dateOfBirth: (value) => {
        if (value && value > new Date()) {
          return 'Date of birth cannot be in the future';
        }
        return null;
      },
      joinDate: (value) => {
        if (!value) return 'Join date is required';
        return null;
      }
    }
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      form.reset();
      form.setFieldValue('joinDate', new Date());
    }
  }, [opened]);

  const handleSubmit = async (values: FormData) => {
    try {
      // Validate required fields
      if (!values.name.trim() || !values.email.trim() || !values.password || !values.gymId) {
        return;
      }

      const userData: CreateUserData = {
        name: values.name.trim(),
        email: values.email.toLowerCase().trim(),
        password: values.password,
        userType: 'client',
        gymId: values.gymId,
        clientProfile: {
          personalInfo: {
            phone: values.phone?.trim() || undefined,
            dateOfBirth: values.dateOfBirth?.toISOString(),
            emergencyContact: values.emergencyContactName?.trim() && values.emergencyContactPhone?.trim() ? {
              name: values.emergencyContactName.trim(),
              phone: values.emergencyContactPhone.trim(),
              relationship: values.emergencyContactRelationship || 'other'
            } : undefined,
            fitnessGoals: values.fitnessGoals ?
              values.fitnessGoals.split(',').map(g => g.trim()).filter(g => g.length > 0) : [],
            medicalConditions: values.medicalConditions ?
              values.medicalConditions.split(',').map(c => c.trim()).filter(c => c.length > 0) : [],
            notes: values.notes?.trim() || undefined
          },
          membershipType: values.membershipType,
          membershipInfo: {
            startDate: values.joinDate?.toISOString() || new Date().toISOString(),
            isActive: true
          }
        }
      };

      const success = await onSave(userData);
      if (success) {
        form.reset();
        onClose();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create New Client"
      size="xl"
      centered
      scrollAreaComponent={Modal.Scrollarea}
      transitionProps={{ transition: 'fade', duration: 200 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* User Information Section */}
          <Text size="sm" fw={500} c="dimmed">Account Information</Text>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Full Name"
                placeholder="Enter full name"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Email"
                placeholder="Enter email address"
                type="email"
                required
                {...form.getInputProps('email')}
              />
            </Grid.Col>
          </Grid>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <PasswordInput
                label="Password"
                placeholder="Enter password"
                required
                {...form.getInputProps('password')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <PasswordInput
                label="Confirm Password"
                placeholder="Confirm password"
                required
                {...form.getInputProps('confirmPassword')}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Gym"
            placeholder="Select gym"
            required
            data={gymOptions}
            {...form.getInputProps('gymId')}
            description="The gym this client will be associated with"
          />

          {/* Personal Information Section */}
          <Text size="sm" fw={500} c="dimmed" mt="lg">Personal Information</Text>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Phone Number"
                placeholder="Enter phone number"
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DateInput
                label="Date of Birth"
                placeholder="Select date of birth"
                valueFormat="MM/DD/YYYY"
                maxDate={new Date()}
                {...form.getInputProps('dateOfBirth')}
              />
            </Grid.Col>
          </Grid>

          <Text size="sm" fw={500} mt="sm">Emergency Contact</Text>
          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Name"
                placeholder="Emergency contact name"
                {...form.getInputProps('emergencyContactName')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput
                label="Phone"
                placeholder="Emergency contact phone"
                {...form.getInputProps('emergencyContactPhone')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select
                label="Relationship"
                placeholder="Select relationship"
                data={[
                  { value: 'spouse', label: 'Spouse' },
                  { value: 'parent', label: 'Parent' },
                  { value: 'child', label: 'Child' },
                  { value: 'sibling', label: 'Sibling' },
                  { value: 'friend', label: 'Friend' },
                  { value: 'other', label: 'Other' }
                ]}
                {...form.getInputProps('emergencyContactRelationship')}
              />
            </Grid.Col>
          </Grid>

          {/* Membership Information Section */}
          <Text size="sm" fw={500} c="dimmed" mt="lg">Membership Information</Text>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <Select
                label="Membership Type"
                placeholder="Select membership type"
                required
                data={[
                  { value: 'standard', label: 'Standard' },
                  { value: 'premium', label: 'Premium' },
                  { value: 'student', label: 'Student' },
                  { value: 'senior', label: 'Senior' },
                  { value: 'family', label: 'Family' }
                ]}
                {...form.getInputProps('membershipType')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <DateInput
                label="Join Date"
                placeholder="Select join date"
                valueFormat="MM/DD/YYYY"
                required
                {...form.getInputProps('joinDate')}
              />
            </Grid.Col>
          </Grid>

          {/* Preferences Section */}
          <Text size="sm" fw={500} c="dimmed" mt="lg">Health & Goals</Text>

          <Textarea
            label="Fitness Goals"
            placeholder="Enter fitness goals (comma-separated)"
            description="e.g., Weight loss, Muscle building, Strength training, Marathon preparation"
            minRows={2}
            {...form.getInputProps('fitnessGoals')}
          />

          <Textarea
            label="Medical Conditions"
            placeholder="Enter any medical conditions (comma-separated)"
            description="e.g., Diabetes, High blood pressure, Back injury, Previous surgeries"
            minRows={2}
            {...form.getInputProps('medicalConditions')}
          />

          <Textarea
            label="Additional Notes"
            placeholder="Any additional notes about the client"
            description="Special considerations, preferences, or other relevant information"
            minRows={2}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" mt="xl" pt="md" style={{ borderTop: '1px solid var(--mantine-color-gray-3)' }}>
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
              size="md"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
              size="md"
              color="blue"
            >
              Create Client
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}