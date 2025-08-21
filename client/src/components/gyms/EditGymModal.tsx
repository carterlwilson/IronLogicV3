'use client';

import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Button,
  Group,
  Stack,
  Select,
  Textarea,
  NumberInput,
  Grid,
  Text,
  Divider,
  Switch,
  Accordion
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconBuilding, IconMail, IconPhone, IconWorld } from '@tabler/icons-react';
import { UpdateGymData, GymOwner, Gym } from '../../lib/gyms-api';

interface EditGymModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (id: string, gymData: UpdateGymData) => Promise<boolean>;
  gym: Gym | null;
  gymOwners: GymOwner[];
  loading?: boolean;
}

interface FormData {
  name: string;
  ownerId: string;
  description: string;
  phone: string;
  email: string;
  website: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  settings: {
    timezone: string;
    currency: string;
    membershipTypes: string;
    classCapacityDefault: number;
    bookingWindowDays: number;
    cancellationPolicy: {
      enabled: boolean;
      hoursBefore: number;
      penaltyType: 'none' | 'fee' | 'credit_loss';
      penaltyAmount: number;
    };
  };
}

const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Phoenix', label: 'Arizona Time (MST)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKST)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' }
];

const currencyOptions = [
  { value: 'USD', label: 'US Dollar ($)' },
  { value: 'CAD', label: 'Canadian Dollar (C$)' },
  { value: 'EUR', label: 'Euro (€)' },
  { value: 'GBP', label: 'British Pound (£)' }
];

export function EditGymModal({
  opened,
  onClose,
  onSubmit,
  gym,
  gymOwners,
  loading = false
}: EditGymModalProps) {
  const form = useForm<FormData>({
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
        country: 'United States'
      },
      settings: {
        timezone: 'America/New_York',
        currency: 'USD',
        membershipTypes: 'Monthly, Annual',
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
      name: (value) => {
        if (!value) return 'Gym name is required';
        if (value.length < 2) return 'Gym name must be at least 2 characters';
        return null;
      },
      // ownerId is now optional, no validation needed
      email: (value) => {
        if (value && !/^\S+@\S+\.\S+$/.test(value)) return 'Invalid email format';
        return null;
      },
      website: (value) => {
        if (value && !value.startsWith('http://') && !value.startsWith('https://')) {
          return 'Website must start with http:// or https://';
        }
        return null;
      }
    }
  });

  // Populate form when gym data changes
  useEffect(() => {
    if (opened && gym) {
      form.setValues({
        name: gym.name,
        ownerId: gym.ownerId?._id || '',
        description: gym.description || '',
        phone: gym.phone || '',
        email: gym.email || '',
        website: gym.website || '',
        address: {
          street: gym.address?.street || '',
          city: gym.address?.city || '',
          state: gym.address?.state || '',
          zipCode: gym.address?.zipCode || '',
          country: gym.address?.country || 'United States'
        },
        settings: {
          timezone: gym.settings.timezone || 'America/New_York',
          currency: gym.settings.currency || 'USD',
          membershipTypes: gym.settings.membershipTypes?.join(', ') || 'Monthly, Annual',
          classCapacityDefault: gym.settings.classCapacityDefault || 20,
          bookingWindowDays: gym.settings.bookingWindowDays || 7,
          cancellationPolicy: {
            enabled: gym.settings.cancellationPolicy?.enabled || true,
            hoursBefore: gym.settings.cancellationPolicy?.hoursBefore || 24,
            penaltyType: gym.settings.cancellationPolicy?.penaltyType || 'none',
            penaltyAmount: gym.settings.cancellationPolicy?.penaltyAmount || 0
          }
        }
      });
    }
  }, [opened, gym]);

  const handleSubmit = async (values: FormData) => {
    if (!gym) return;

    // Convert form data to API format
    const gymData: UpdateGymData = {
      name: values.name,
      ...(values.ownerId && { ownerId: values.ownerId }),
      ...(values.description && { description: values.description }),
      ...(values.phone && { phone: values.phone }),
      ...(values.email && { email: values.email }),
      ...(values.website && { website: values.website }),
      ...(values.address.street || values.address.city || values.address.state || values.address.zipCode || values.address.country ? {
        address: {
          ...(values.address.street && { street: values.address.street }),
          ...(values.address.city && { city: values.address.city }),
          ...(values.address.state && { state: values.address.state }),
          ...(values.address.zipCode && { zipCode: values.address.zipCode }),
          ...(values.address.country && { country: values.address.country })
        }
      } : {}),
      settings: {
        timezone: values.settings.timezone,
        currency: values.settings.currency,
        membershipTypes: values.settings.membershipTypes.split(',').map(t => t.trim()).filter(Boolean),
        classCapacityDefault: values.settings.classCapacityDefault,
        bookingWindowDays: values.settings.bookingWindowDays,
        cancellationPolicy: values.settings.cancellationPolicy
      }
    };

    const success = await onSubmit(gym._id, gymData);
    if (success) {
      onClose();
    }
  };

  const gymOwnerOptions = gymOwners.map(owner => ({
    value: owner._id,
    label: `${owner.name} (${owner.email})`
  }));

  if (!gym) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Gym"
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <div>
            <Text fw={500} mb="sm">Basic Information</Text>
            <Stack gap="sm">
              <TextInput
                label="Gym Name"
                placeholder="Enter gym name"
                required
                leftSection={<IconBuilding size="1rem" />}
                {...form.getInputProps('name')}
              />

              <Select
                label="Gym Owner"
                placeholder="Select gym owner (optional)"
                data={gymOwnerOptions}
                searchable
                clearable
                {...form.getInputProps('ownerId')}
              />

              <Textarea
                label="Description"
                placeholder="Brief description of the gym"
                rows={3}
                {...form.getInputProps('description')}
              />
            </Stack>
          </div>

          <Divider />

          {/* Contact Information */}
          <div>
            <Text fw={500} mb="sm">Contact Information</Text>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Email"
                  placeholder="gym@example.com"
                  leftSection={<IconMail size="1rem" />}
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Phone"
                  placeholder="(555) 123-4567"
                  leftSection={<IconPhone size="1rem" />}
                  {...form.getInputProps('phone')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Website"
                  placeholder="https://www.example.com"
                  leftSection={<IconWorld size="1rem" />}
                  {...form.getInputProps('website')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Address Information */}
          <div>
            <Text fw={500} mb="sm">Address</Text>
            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label="Street Address"
                  placeholder="123 Main St"
                  {...form.getInputProps('address.street')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="City"
                  placeholder="City"
                  {...form.getInputProps('address.city')}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="State"
                  placeholder="State"
                  {...form.getInputProps('address.state')}
                />
              </Grid.Col>
              <Grid.Col span={3}>
                <TextInput
                  label="ZIP Code"
                  placeholder="12345"
                  {...form.getInputProps('address.zipCode')}
                />
              </Grid.Col>
              <Grid.Col span={12}>
                <TextInput
                  label="Country"
                  placeholder="Country"
                  {...form.getInputProps('address.country')}
                />
              </Grid.Col>
            </Grid>
          </div>

          <Divider />

          {/* Settings */}
          <Accordion variant="contained">
            <Accordion.Item value="settings">
              <Accordion.Control>
                <Text fw={500}>Gym Settings</Text>
              </Accordion.Control>
              <Accordion.Panel>
                <Stack gap="sm">
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

                  <TextInput
                    label="Membership Types"
                    placeholder="Monthly, Annual, Day Pass"
                    description="Comma-separated list of membership types"
                    {...form.getInputProps('settings.membershipTypes')}
                  />

                  <Grid>
                    <Grid.Col span={6}>
                      <NumberInput
                        label="Default Class Capacity"
                        placeholder="20"
                        min={1}
                        max={200}
                        {...form.getInputProps('settings.classCapacityDefault')}
                      />
                    </Grid.Col>
                    <Grid.Col span={6}>
                      <NumberInput
                        label="Booking Window (Days)"
                        placeholder="7"
                        description="How many days in advance clients can book"
                        min={1}
                        max={365}
                        {...form.getInputProps('settings.bookingWindowDays')}
                      />
                    </Grid.Col>
                  </Grid>

                  {/* Cancellation Policy */}
                  <div>
                    <Text size="sm" fw={500} mb="xs">Cancellation Policy</Text>
                    <Stack gap="xs">
                      <Switch
                        label="Enable cancellation policy"
                        {...form.getInputProps('settings.cancellationPolicy.enabled', { type: 'checkbox' })}
                      />
                      
                      {form.values.settings.cancellationPolicy.enabled && (
                        <>
                          <NumberInput
                            label="Cancel before (hours)"
                            placeholder="24"
                            min={1}
                            max={168}
                            {...form.getInputProps('settings.cancellationPolicy.hoursBefore')}
                          />
                          
                          <Select
                            label="Penalty Type"
                            data={[
                              { value: 'none', label: 'No Penalty' },
                              { value: 'fee', label: 'Fee' },
                              { value: 'credit_loss', label: 'Credit Loss' }
                            ]}
                            {...form.getInputProps('settings.cancellationPolicy.penaltyType')}
                          />
                          
                          {form.values.settings.cancellationPolicy.penaltyType === 'fee' && (
                            <NumberInput
                              label="Penalty Amount"
                              placeholder="0"
                              min={0}
                              prefix="$"
                              {...form.getInputProps('settings.cancellationPolicy.penaltyAmount')}
                            />
                          )}
                        </>
                      )}
                    </Stack>
                  </div>
                </Stack>
              </Accordion.Panel>
            </Accordion.Item>
          </Accordion>

          {/* Submit buttons */}
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
              Update Gym
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}