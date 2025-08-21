'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Alert,
  Stack,
  Grid,
  Badge,
  Divider
} from '@mantine/core';
import { 
  IconAlertTriangle, 
  IconBuilding, 
  IconUsers, 
  IconMapPin,
  IconMail,
  IconPhone
} from '@tabler/icons-react';
import { Gym } from '../../lib/gyms-api';

interface DeleteGymModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => void;
  gym: Gym | null;
  loading?: boolean;
}

export function DeleteGymModal({
  opened,
  onClose,
  onConfirm,
  gym,
  loading = false
}: DeleteGymModalProps) {
  if (!gym) return null;

  const hasMembers = gym.statistics.totalMembers > 0;
  const hasCoaches = gym.statistics.coachCount > 0;
  const hasLocations = gym.locations.filter(loc => loc.isActive).length > 0;
  const hasCriticalData = hasMembers || hasCoaches || hasLocations;

  // Format address for display
  const formatAddress = (gym: Gym): string => {
    if (!gym.address) return 'No address';
    const { street, city, state, zipCode } = gym.address;
    const parts = [street, city, state, zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Gym"
      size="md"
      centered
    >
      <Stack gap="md">
        <Alert 
          icon={<IconAlertTriangle size="1rem" />}
          color="red"
          variant="light"
        >
          <Text size="sm" fw={500}>This action cannot be undone!</Text>
        </Alert>

        <div>
          <Text size="sm" mb="md">
            Are you sure you want to delete the following gym?
          </Text>
          
          {/* Gym Details Card */}
          <div 
            style={{
              padding: '1rem',
              backgroundColor: 'var(--mantine-color-gray-0)',
              borderRadius: '8px',
              border: '1px solid var(--mantine-color-gray-3)'
            }}
          >
            <Stack gap="sm">
              {/* Header */}
              <Group align="center" gap="xs">
                <IconBuilding size="1.2rem" color="var(--mantine-color-blue-6)" />
                <Text fw={600} size="lg">
                  {gym.name}
                </Text>
                <Badge 
                  color={gym.subscription?.status === 'active' ? 'green' : 'gray'} 
                  variant="light" 
                  size="sm"
                >
                  {gym.subscription?.status || 'No Subscription'}
                </Badge>
              </Group>

              {/* Owner */}
              <div>
                <Text size="sm" fw={500} c="dimmed">Owner</Text>
                <Text size="sm">
                  {gym.ownerId ? `${gym.ownerId.name} (${gym.ownerId.email})` : 'No owner assigned'}
                </Text>
              </div>

              {/* Contact Info */}
              <Grid>
                {gym.email && (
                  <Grid.Col span={6}>
                    <Group gap="xs" align="center">
                      <IconMail size="0.9rem" color="var(--mantine-color-gray-6)" />
                      <Text size="sm">{gym.email}</Text>
                    </Group>
                  </Grid.Col>
                )}
                
                {gym.phone && (
                  <Grid.Col span={6}>
                    <Group gap="xs" align="center">
                      <IconPhone size="0.9rem" color="var(--mantine-color-gray-6)" />
                      <Text size="sm">{gym.phone}</Text>
                    </Group>
                  </Grid.Col>
                )}
              </Grid>

              {/* Address */}
              <Group gap="xs" align="flex-start">
                <IconMapPin size="0.9rem" color="var(--mantine-color-gray-6)" style={{ marginTop: 2 }} />
                <Text size="sm" c="dimmed">
                  {formatAddress(gym)}
                </Text>
              </Group>

              <Divider />

              {/* Statistics */}
              <Grid>
                <Grid.Col span={4} ta="center">
                  <Group gap="xs" justify="center" align="center">
                    <IconUsers size="0.9rem" color="var(--mantine-color-blue-6)" />
                    <Text size="sm" fw={500}>
                      {gym.statistics.totalMembers}
                    </Text>
                  </Group>
                  <Text size="xs" c="dimmed">Members</Text>
                </Grid.Col>
                
                <Grid.Col span={4} ta="center">
                  <Text size="sm" fw={500}>
                    {gym.statistics.coachCount}
                  </Text>
                  <Text size="xs" c="dimmed">Coaches</Text>
                </Grid.Col>
                
                <Grid.Col span={4} ta="center">
                  <Text size="sm" fw={500}>
                    {gym.locations.filter(loc => loc.isActive).length}
                  </Text>
                  <Text size="xs" c="dimmed">Locations</Text>
                </Grid.Col>
              </Grid>
            </Stack>
          </div>
        </div>

        {/* Warning messages based on data */}
        {hasCriticalData && (
          <Alert color="orange" variant="light">
            <Stack gap="xs">
              <Text size="sm" fw={500}>
                Warning: This gym contains important data
              </Text>
              
              {hasMembers && (
                <Text size="sm">
                  • {gym.statistics.totalMembers} member(s) will lose access to their accounts and data
                </Text>
              )}
              
              {hasCoaches && (
                <Text size="sm">
                  • {gym.statistics.coachCount} coach(es) will lose access to their programs and schedules
                </Text>
              )}
              
              {hasLocations && (
                <Text size="sm">
                  • {gym.locations.filter(loc => loc.isActive).length} location(s) and their schedules will be deleted
                </Text>
              )}
              
              <Text size="sm" mt="xs">
                Consider transferring members and coaches to another gym before deletion.
              </Text>
            </Stack>
          </Alert>
        )}

        {gym.subscription?.status === 'active' && (
          <Alert color="blue" variant="light">
            <Text size="sm">
              <Text component="span" fw={500}>Active Subscription:</Text> This gym has an active 
              subscription ({gym.subscription.plan}). Deletion will immediately cancel the subscription 
              and may affect billing.
            </Text>
          </Alert>
        )}

        {/* Confirmation buttons */}
        <Group justify="flex-end" mt="lg">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={onConfirm}
            loading={loading}
          >
            Delete Gym
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}