'use client';

import {
  Modal,
  Text,
  Button,
  Stack,
  Group,
  Badge,
  Alert,
  List
} from '@mantine/core';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import { ActivityGroup } from '../../lib/activity-groups-api';

interface DeleteActivityGroupModalProps {
  opened: boolean;
  onClose: () => void;
  onConfirm: () => Promise<boolean>;
  activityGroup: ActivityGroup | null;
  loading: boolean;
}

export function DeleteActivityGroupModal({
  opened,
  onClose,
  onConfirm,
  activityGroup,
  loading
}: DeleteActivityGroupModalProps) {
  if (!activityGroup) return null;

  const handleConfirm = async () => {
    const success = await onConfirm();
    if (success) {
      onClose();
    }
  };

  const canDelete = activityGroup.count === 0;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Delete Activity Group"
      size="md"
      centered
    >
      <Stack gap="md">
        <Group gap="xs" align="center">
          <IconAlertTriangle size="1.2rem" color="var(--mantine-color-red-6)" />
          <Text size="lg" fw={600}>
            Are you sure you want to delete "{activityGroup.name}"?
          </Text>
        </Group>

        {/* Activity Group Info */}
        <Stack gap="xs">
          <Group gap="xs">
            <Text size="sm" c="dimmed">Scope:</Text>
            <Badge
              size="sm"
              color={activityGroup.gymId ? 'blue' : 'purple'}
              variant="light"
            >
              {activityGroup.gymId ? 'Gym Activity Group' : 'Global Activity Group'}
            </Badge>
          </Group>
          
          <Group gap="xs">
            <Text size="sm" c="dimmed">Activities using this group:</Text>
            <Badge
              size="sm"
              variant="light"
              color={activityGroup.count > 0 ? 'red' : 'green'}
            >
              {activityGroup.count} {activityGroup.count === 1 ? 'activity' : 'activities'}
            </Badge>
          </Group>
          
          {activityGroup.description && (
            <div>
              <Text size="sm" c="dimmed">Description:</Text>
              <Text size="sm">{activityGroup.description}</Text>
            </div>
          )}
        </Stack>

        {/* Warning or Info */}
        {!canDelete ? (
          <Alert
            icon={<IconAlertTriangle size="1rem" />}
            color="red"
            title="Cannot Delete Activity Group"
          >
            <Stack gap="xs">
              <Text size="sm">
                This activity group cannot be deleted because it is currently being used by {activityGroup.count} {activityGroup.count === 1 ? 'activity' : 'activities'}.
              </Text>
              <Text size="sm" fw={500}>
                To delete this activity group, you must:
              </Text>
              <List size="sm">
                <List.Item>Remove all activities that use this group, or</List.Item>
                <List.Item>Move those activities to a different activity group</List.Item>
              </List>
            </Stack>
          </Alert>
        ) : (
          <Alert
            icon={<IconInfoCircle size="1rem" />}
            color="blue"
            title="Safe to Delete"
          >
            <Text size="sm">
              This activity group is not currently being used by any activities and can be safely deleted.
            </Text>
          </Alert>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" mt="md">
          <Button
            variant="subtle"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          {canDelete && (
            <Button
              color="red"
              onClick={handleConfirm}
              loading={loading}
            >
              Delete Activity Group
            </Button>
          )}
        </Group>
        
        {canDelete && (
          <Text size="xs" c="dimmed" ta="center">
            This action cannot be undone.
          </Text>
        )}
      </Stack>
    </Modal>
  );
}