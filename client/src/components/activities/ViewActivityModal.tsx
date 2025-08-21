'use client';

import {
  Modal,
  Text,
  Badge,
  Stack,
  Group,
  Button,
  Divider,
  Card
} from '@mantine/core';
import { IconCalendar, IconUser, IconEdit } from '@tabler/icons-react';
import { ActivityTemplate } from '../../lib/activities-api';
import { useAuth } from '../../lib/auth-context';

interface ViewActivityModalProps {
  opened: boolean;
  onClose: () => void;
  onEdit?: (activity: ActivityTemplate) => void;
  activity: ActivityTemplate | null;
}

export function ViewActivityModal({
  opened,
  onClose,
  onEdit,
  activity
}: ViewActivityModalProps) {
  const { user } = useAuth();

  // If user can access this page, they can edit activities

  const handleEdit = () => {
    if (activity && onEdit) {
      onEdit(activity);
      onClose();
    }
  };

  // Type badge color mapping
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'primary lift': return 'blue';
      case 'accessory lift': return 'indigo';
      case 'conditioning': return 'green';
      case 'diagnostic': return 'orange';
      default: return 'gray';
    }
  };

  if (!activity) return null;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Activity Template Details"
      size="lg"
      centered
    >
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <div style={{ flex: 1 }}>
            <Text size="xl" fw={600} mb="xs">{activity.name}</Text>
            <Group gap="xs">
              <Badge
                size="md"
                color={getTypeBadgeColor(activity.type)}
                variant="light"
              >
                {activity.type}
              </Badge>
              <Badge
                size="md"
                color={activity.gymId ? 'blue' : 'purple'}
                variant="light"
              >
                {activity.gymId ? 'Gym Activity' : 'Global Activity'}
              </Badge>
            </Group>
          </div>
          
          {onEdit && (
            <Button
              variant="light"
              leftSection={<IconEdit size="1rem" />}
              onClick={handleEdit}
            >
              Edit
            </Button>
          )}
        </Group>

        <Divider />

        {/* Basic Information */}
        <Stack gap="sm">
          <Group gap="lg">
            <div>
              <Text size="sm" c="dimmed" mb="xs">Activity Group</Text>
              <Text fw={500}>{activity.activityGroup?.name || 'Unknown'}</Text>
              {activity.activityGroup?.description && (
                <Text size="sm" c="dimmed" mt="xs">
                  {activity.activityGroup.description}
                </Text>
              )}
            </div>
          </Group>

          {activity.description && (
            <div>
              <Text size="sm" c="dimmed" mb="xs">Description</Text>
              <Text>{activity.description}</Text>
            </div>
          )}

          {activity.instructions && (
            <div>
              <Text size="sm" c="dimmed" mb="xs">Instructions</Text>
              <Card withBorder p="md" bg="gray.0">
                <Text style={{ whiteSpace: 'pre-wrap' }}>
                  {activity.instructions}
                </Text>
              </Card>
            </div>
          )}
        </Stack>

        <Divider />


        <Divider />

        {/* Metadata */}
        <Group gap="lg">
          <Group gap="xs">
            <IconCalendar size="1rem" />
            <div>
              <Text size="xs" c="dimmed">Created</Text>
              <Text size="sm">
                {new Date(activity.createdAt).toLocaleDateString()}
              </Text>
            </div>
          </Group>
          
          <Group gap="xs">
            <IconCalendar size="1rem" />
            <div>
              <Text size="xs" c="dimmed">Last Updated</Text>
              <Text size="sm">
                {new Date(activity.updatedAt).toLocaleDateString()}
              </Text>
            </div>
          </Group>

          <Group gap="xs">
            <IconUser size="1rem" />
            <div>
              <Text size="xs" c="dimmed">Status</Text>
              <Badge
                size="sm"
                color={activity.isActive ? 'green' : 'red'}
                variant="dot"
              >
                {activity.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </Group>
        </Group>

        {/* Footer */}
        <Group justify="flex-end" mt="lg">
          <Button variant="subtle" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}