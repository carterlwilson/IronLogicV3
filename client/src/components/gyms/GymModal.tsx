import { useEffect } from 'react';
import {
  Modal,
  Stack,
  Group,
  TextInput,
  Textarea,
  Select,
  Button,
  Divider,
  Grid,
  Title,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBuilding, IconUser, IconMail, IconPhone, IconWorld } from '@tabler/icons-react';
import type { Gym, GymOwner, CreateGymData, UpdateGymData } from '../../types/gyms';

interface GymModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (gymData: CreateGymData | UpdateGymData) => Promise<void>;
  gym?: Gym | null;
  gymOwners: GymOwner[];
  loading?: boolean;
}

export function GymModal({ opened, onClose, onSave, gym, gymOwners, loading = false }: GymModalProps) {
  const form = useForm<CreateGymData | UpdateGymData>({
    initialValues: {
      name: '',
      ownerId: '',
      description: '',
      phone: '',
      email: '',
      website: '',
      address: {
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'USA'
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        membershipTypes: ['Monthly', 'Annual'],
        classCapacityDefault: 20,
        bookingWindowDays: 7,
        cancellationPolicy: {
          enabled: true,
          hoursBefore: 24,
          penaltyType: 'none',
          penaltyAmount: 0
        }
      }
    },
    validate: {
      name: (value) => (!value || value.trim().length < 2 ? 'Gym name must be at least 2 characters' : null),
      email: (value) => {
        if (!value) return null;
        return /^\S+@\S+\.\S+$/.test(value) ? null : 'Invalid email format';
      },
      website: (value) => {
        if (!value) return null;
        try {
          new URL(value);
          return null;
        } catch {
          return 'Invalid website URL';
        }
      },
      'settings.classCapacityDefault': (value) => {
        const num = Number(value);
        return num < 1 || num > 1000 ? 'Capacity must be between 1 and 1000' : null;
      },
      'settings.bookingWindowDays': (value) => {
        const num = Number(value);
        return num < 1 || num > 365 ? 'Booking window must be between 1 and 365 days' : null;
      }
    }
  });

  // Update form when gym changes (for editing)
  useEffect(() => {
    if (opened) {
      if (gym) {
        form.setValues({
          name: gym.name || '',
          ownerId: gym.ownerId && typeof gym.ownerId === 'object' ? gym.ownerId._id : (gym.ownerId as string) || '',
          description: gym.description || '',
          phone: gym.phone || '',
          email: gym.email || '',
          website: gym.website || '',
          address: {
            street: gym.address?.street || '',
            city: gym.address?.city || '',
            state: gym.address?.state || '',
            zipCode: gym.address?.zipCode || '',
            country: gym.address?.country || 'USA'
          },
          settings: {
            timezone: gym.settings?.timezone || 'America/New_York',
            currency: gym.settings?.currency || 'USD',
            membershipTypes: gym.settings?.membershipTypes || ['Monthly', 'Annual'],
            classCapacityDefault: gym.settings?.classCapacityDefault || 20,
            bookingWindowDays: gym.settings?.bookingWindowDays || 7,
            cancellationPolicy: {
              enabled: gym.settings?.cancellationPolicy?.enabled ?? true,
              hoursBefore: gym.settings?.cancellationPolicy?.hoursBefore || 24,
              penaltyType: gym.settings?.cancellationPolicy?.penaltyType || 'none',
              penaltyAmount: gym.settings?.cancellationPolicy?.penaltyAmount || 0
            }
          }
        });
      } else {
        // Reset form for creating new gym
        form.reset();
      }
    }
  }, [gym, opened]);

  const handleSubmit = async (values: CreateGymData | UpdateGymData) => {
    try {
      // Clean up empty fields
      const cleanedValues = {
        ...values,
        description: values.description?.trim() || undefined,
        phone: values.phone?.trim() || undefined,
        email: values.email?.trim() || undefined,
        website: values.website?.trim() || undefined,
        address: values.address && (
          values.address.street || values.address.city || values.address.state || values.address.zipCode
        ) ? {
          ...values.address,
          street: values.address.street?.trim() || undefined,
          city: values.address.city?.trim() || undefined,
          state: values.address.state?.trim() || undefined,
          zipCode: values.address.zipCode?.trim() || undefined
        } : undefined
      };

      await onSave(cleanedValues);
      form.reset();
    } catch {
      // Error handling is done in the parent component
    }
  };

  const handleClose = () => {
    form.reset();
    onClose();
  };

  // Currency options
  const currencyOptions = [
    { value: 'USD', label: 'USD ($)' },
    { value: 'EUR', label: 'EUR (€)' },
    { value: 'GBP', label: 'GBP (£)' },
    { value: 'CAD', label: 'CAD ($)' },
    { value: 'AUD', label: 'AUD ($)' }
  ];

  // Timezone options (simplified)
  const timezoneOptions = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona Time (AZ)' },
    { value: 'America/Anchorage', label: 'Alaska Time (AK)' },
    { value: 'Pacific/Honolulu', label: 'Hawaii Time (HI)' }
  ];

  const penaltyTypeOptions = [
    { value: 'none', label: 'No Penalty' },
    { value: 'fee', label: 'Fee' },
    { value: 'credit_loss', label: 'Credit Loss' }
  ];

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={
        <Group gap="sm">
          <IconBuilding size={20} />
          <span>{gym ? 'Edit Gym' : 'Create New Gym'}</span>
        </Group>
      }
      size="lg"
      scrollAreaComponent={Modal.NativeScrollArea}
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="lg">
          {/* Basic Information */}
          <div>
            <Title order={4} mb="md">Basic Information</Title>
            <Stack gap="md">
              <TextInput
                label="Gym Name"
                placeholder="Enter gym name"
                leftSection={<IconBuilding size={16} />}
                required
                {...form.getInputProps('name')}
              />
              
              <Select
                label="Owner"
                placeholder="Select gym owner"
                leftSection={<IconUser size={16} />}
                data={[
                  { value: '', label: 'No Owner Assigned' },
                  ...gymOwners.map(owner => ({
                    value: owner._id,
                    label: `${owner.name} (${owner.email})`
                  }))
                ]}
                searchable
                clearable
                {...form.getInputProps('ownerId')}
              />
              
              <Textarea
                label="Description"
                placeholder="Brief description of the gym"
                minRows={2}
                maxRows={4}
                {...form.getInputProps('description')}
              />
            </Stack>
          </div>

          <Divider />

          {/* Contact Information */}
          <div>
            <Title order={4} mb="md">Contact Information</Title>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Phone"
                  placeholder="(555) 123-4567"
                  leftSection={<IconPhone size={16} />}
                  {...form.getInputProps('phone')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Email"
                  placeholder="info@gym.com"
                  leftSection={<IconMail size={16} />}
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Website"
                  placeholder="https://www.gym.com"
                  leftSection={<IconWorld size={16} />}
                  {...form.getInputProps('website')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Address */}
          <div>
            <Title order={4} mb="md">Address</Title>
            <Stack gap="md">
              <TextInput
                label="Street Address"
                placeholder="123 Main Street"
                {...form.getInputProps('address.street')}
              />
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="City"
                    placeholder="New York"
                    {...form.getInputProps('address.city')}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    label="State"
                    placeholder="NY"
                    {...form.getInputProps('address.state')}
                  />
                </Grid.Col>
                <Grid.Col span={3}>
                  <TextInput
                    label="Zip Code"
                    placeholder="10001"
                    {...form.getInputProps('address.zipCode')}
                  />
                </Grid.Col>
              </Grid>
            </Stack>
          </div>

          <Divider />

          {/* Settings */}
          <div>
            <Title order={4} mb="md">Settings</Title>
            <Stack gap="md">
              <Grid>
                <Grid.Col span={6}>
                  <Select
                    label="Timezone"
                    data={timezoneOptions}
                    {...form.getInputProps('settings.timezone')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <Select
                    label="Currency"
                    data={currencyOptions}
                    {...form.getInputProps('settings.currency')}
                  />
                </Grid.Col>
              </Grid>
              
              <Grid>
                <Grid.Col span={6}>
                  <TextInput
                    label="Default Class Capacity"
                    type="number"
                    min={1}
                    max={1000}
                    {...form.getInputProps('settings.classCapacityDefault')}
                  />
                </Grid.Col>
                <Grid.Col span={6}>
                  <TextInput
                    label="Booking Window (Days)"
                    type="number"
                    min={1}
                    max={365}
                    {...form.getInputProps('settings.bookingWindowDays')}
                  />
                </Grid.Col>
              </Grid>

              {/* Cancellation Policy */}
              <div>
                <Text size="sm" fw={500} mb="xs">Cancellation Policy</Text>
                <Grid>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Hours Before"
                      type="number"
                      min={1}
                      {...form.getInputProps('settings.cancellationPolicy.hoursBefore')}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <Select
                      label="Penalty Type"
                      data={penaltyTypeOptions}
                      {...form.getInputProps('settings.cancellationPolicy.penaltyType')}
                    />
                  </Grid.Col>
                  <Grid.Col span={4}>
                    <TextInput
                      label="Penalty Amount"
                      type="number"
                      min={0}
                      disabled={form.values.settings?.cancellationPolicy?.penaltyType === 'none'}
                      {...form.getInputProps('settings.cancellationPolicy.penaltyAmount')}
                    />
                  </Grid.Col>
                </Grid>
              </div>
            </Stack>
          </div>

          {/* Actions */}
          <Group justify="flex-end" gap="md">
            <Button variant="subtle" onClick={handleClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {gym ? 'Update Gym' : 'Create Gym'}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}