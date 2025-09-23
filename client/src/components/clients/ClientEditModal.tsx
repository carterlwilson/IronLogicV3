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
  Badge,
  Anchor
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { DateInput } from '@mantine/dates';
import { type Client, type UpdateClientData } from '../../lib/clients-api';

interface ClientEditModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (clientData: UpdateClientData) => Promise<boolean>;
  client: Client | null;
  loading?: boolean;
}

interface FormData {
  // Personal Information
  phone: string;
  dateOfBirth: Date | null;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelationship: string;

  // Membership Information
  membershipType: string;
  joinDate: Date | null;
  isActive: boolean;

  // Preferences
  fitnessGoals: string;
  medicalConditions: string;
  notes: string;
}

export function ClientEditModal({
  opened,
  onClose,
  onSave,
  client,
  loading = false
}: ClientEditModalProps) {
  const form = useForm<FormData>({
    initialValues: {
      // Personal Information
      phone: '',
      dateOfBirth: null,
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelationship: '',

      // Membership Information
      membershipType: 'standard',
      joinDate: null,
      isActive: true,

      // Preferences
      fitnessGoals: '',
      medicalConditions: '',
      notes: ''
    },
    validate: {
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

  // Pre-populate form when client data changes
  useEffect(() => {
    if (opened && client) {
      // Convert arrays to comma-separated strings for editing
      const fitnessGoalsString = client.personalInfo.fitnessGoals?.join(', ') || '';
      const medicalConditionsString = client.personalInfo.medicalConditions?.join(', ') || '';

      // Parse dates
      const dateOfBirth = client.personalInfo.dateOfBirth
        ? new Date(client.personalInfo.dateOfBirth)
        : null;
      const joinDate = client.membershipInfo.joinDate
        ? new Date(client.membershipInfo.joinDate)
        : null;

      form.setValues({
        // Personal Information
        phone: client.personalInfo.phone || '',
        dateOfBirth,
        emergencyContactName: client.personalInfo.emergencyContact?.name || '',
        emergencyContactPhone: client.personalInfo.emergencyContact?.phone || '',
        emergencyContactRelationship: client.personalInfo.emergencyContact?.relationship || '',

        // Membership Information
        membershipType: client.membershipInfo.membershipType || 'standard',
        joinDate,
        isActive: client.membershipInfo.isActive,

        // Preferences
        fitnessGoals: fitnessGoalsString,
        medicalConditions: medicalConditionsString,
        notes: ''
      });
    }
  }, [opened, client]);

  // Reset form when modal closes
  useEffect(() => {
    if (!opened) {
      form.reset();
    }
  }, [opened]);

  const handleSubmit = async (values: FormData) => {
    if (!client) return;

    try {
      // Build update data - only include changed fields
      const updateData: UpdateClientData = {
        personalInfo: {
          phone: values.phone?.trim() || undefined,
          dateOfBirth: values.dateOfBirth?.toISOString(),
          emergencyContact: values.emergencyContactName?.trim() && values.emergencyContactPhone?.trim() ? {
            name: values.emergencyContactName.trim(),
            phone: values.emergencyContactPhone.trim(),
            relationship: values.emergencyContactRelationship || 'other'
          } : undefined,
          fitnessGoals: values.fitnessGoals
            ? values.fitnessGoals.split(',').map(g => g.trim()).filter(g => g.length > 0)
            : [],
          medicalConditions: values.medicalConditions
            ? values.medicalConditions.split(',').map(c => c.trim()).filter(c => c.length > 0)
            : []
        },
        membershipInfo: {
          membershipType: values.membershipType,
          joinDate: values.joinDate?.toISOString() || client.membershipInfo.joinDate,
          isActive: values.isActive
        }
      };

      // Add notes if provided
      if (values.notes?.trim()) {
        updateData.notes = values.notes.trim();
      }

      const success = await onSave(updateData);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  if (!client) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Client Profile"
      size="xl"
      centered
      scrollAreaComponent={Modal.Scrollarea}
      transitionProps={{ transition: 'fade', duration: 200 }}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* User Information Section - Read Only */}
          <Text size="sm" fw={500} c="dimmed">Account Information</Text>

          <Grid gutter="md">
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Full Name"
                value={client.user?.name || 'N/A'}
                readOnly
                description="To change name, contact system administrator"
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Email"
                value={client.user?.email || 'N/A'}
                readOnly
                description="To change email, contact system administrator"
              />
            </Grid.Col>
          </Grid>

          <Group gap="sm">
            <Text size="sm" c="dimmed">Status:</Text>
            <Badge
              color={client.user?.isActive ? 'green' : 'red'}
              variant="light"
            >
              {client.user?.isActive ? 'Active' : 'Inactive'}
            </Badge>
            <Badge
              color={client.membershipInfo.isActive ? 'blue' : 'gray'}
              variant="light"
            >
              {client.membershipInfo.isActive ? 'Member Active' : 'Member Inactive'}
            </Badge>
          </Group>

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
            <Grid.Col span={{ base: 12, sm: 4 }}>
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
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <DateInput
                label="Join Date"
                placeholder="Select join date"
                valueFormat="MM/DD/YYYY"
                required
                {...form.getInputProps('joinDate')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <Select
                label="Membership Status"
                required
                data={[
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' }
                ]}
                value={form.values.isActive.toString()}
                onChange={(value) => form.setFieldValue('isActive', value === 'true')}
              />
            </Grid.Col>
          </Grid>

          {/* Current Program Section - Read Only */}
          {client.currentProgram && (
            <>
              <Text size="sm" fw={500} c="dimmed" mt="lg">Current Program</Text>
              <Grid gutter="md">
                <Grid.Col span={{ base: 12, sm: 6 }}>
                  <TextInput
                    label="Program"
                    value={client.program?.name || 'Unknown Program'}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <TextInput
                    label="Current Week"
                    value={client.currentProgram.currentWeek.toString()}
                    readOnly
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 6, sm: 3 }}>
                  <TextInput
                    label="Current Day"
                    value={client.currentProgram.currentDay.toString()}
                    readOnly
                  />
                </Grid.Col>
              </Grid>
              <Text size="xs" c="dimmed">
                To modify program assignments, use the{' '}
                <Anchor component="button" type="button" size="xs">
                  Program Management
                </Anchor>
                {' '}section
              </Text>
            </>
          )}

          {/* Health & Goals Section */}
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
            placeholder="Any additional notes about this update"
            description="Notes about changes made or special considerations"
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
              Save Changes
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}