'use client';

import {
  Modal,
  Text,
  Button,
  Group,
  Stack,
  Badge,
  Alert
} from '@mantine/core';
import { IconAlertTriangle } from '@tabler/icons-react';
import { ActivityTemplate } from '../../lib/activities-api';
import { useAuth } from '../../lib/auth-context';

interface DeleteActivityModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
  activity: ActivityTemplate | null;
  loading: boolean;
}

export function DeleteActivityModal({
  opened,
  onClose,
  onConfirm,
  activity,
  loading
}: DeleteActivityModalProps) {
  const { user } = useAuth();

  const handleConfirm = async () => {
    if (!activity) return;
    
    const success = await onConfirm(activity._id);
    if (success) {
      onClose();
    }
  };

  // Check if user can delete this activity
  const canDelete = () => {
    if (!activity || !user) return false;
    
    if (user.userType === 'admin') return true;
    
    // Non-admin users can only delete activities for their gym
    if (activity.gymId && user.gymId === activity.gymId) return true;
    
    // Can't delete global activities unless admin
    return false;
  };

  if (!activity) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Activity Template"
      centered
      size="md"
    >
      <Stack gap="md">
        <Alert
          icon={<IconAlertTriangle size="1rem" />}
          title="Warning"
          color="red"
          variant="light"
        >
          This action cannot be undone. The activity template will be permanently deleted.
        </Alert>

        <Stack gap="xs">
          <Text size="sm" c="dimmed">You are about to delete:</Text>
          
          <Group gap="xs" align="center">
            <Text fw={500} size="lg">{activity.name}</Text>
            <Badge
              size="sm"
              color={activity.gymId ? 'blue' : 'purple'}
              variant="light"
            >
              {activity.gymId ? 'Gym Activity' : 'Global Activity'}
            </Badge>
          </Group>

          {activity.description && (
            <Text size="sm" c="dimmed" lineClamp={2}>
              {activity.description}
            </Text>
          )}

          <Group gap="xs">
            <Text size="sm" c="dimmed">Group:</Text>
            <Text size="sm">{activity.activityGroup}</Text>
          </Group>

          <Group gap="xs">
            <Text size="sm" c="dimmed">Type:</Text>
            <Badge size="sm" variant="outline">
              {activity.type}
            </Badge>
          </Group>
        </Stack>

        {!canDelete() && (
          <Alert
            color="orange"
            variant="light"
          >
            You don't have permission to delete this activity template.
          </Alert>
        )}

        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {canDelete() && (
            <Button
              color="red"
              onClick={handleConfirm}
              loading={loading}
            >
              Delete Activity
            </Button>
          )}
        </Group>
      </Stack>
    </Modal>
  );
}