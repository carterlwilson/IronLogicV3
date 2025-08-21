'use client';

import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Badge,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { ActivityGroup, UpdateActivityGroupData } from '../../lib/activity-groups-api';
import { useAuth } from '../../lib/auth-context';

interface EditActivityGroupModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (id: string, groupData: UpdateActivityGroupData) => Promise<boolean>;
  activityGroup: ActivityGroup | null;
  loading: boolean;
}

interface FormData {
  name: string;
  description: string;
}

export function EditActivityGroupModal({
  opened,
  onClose,
  onSubmit,
  activityGroup,
  loading
}: EditActivityGroupModalProps) {
  const { user } = useAuth();
  
  const form = useForm<FormData>({
    initialValues: {
      name: '',
      description: ''
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Activity group name is required';
        if (value.length > 50) return 'Activity group name cannot exceed 50 characters';
        return null;
      },
      description: (value) => {
        if (value && value.length > 200) return 'Description cannot exceed 200 characters';
        return null;
      }
    }
  });
  
  // Populate form when activity group changes
  useEffect(() => {
    if (activityGroup) {
      form.setValues({
        name: activityGroup.name,
        description: activityGroup.description || ''
      });
    }
  }, [activityGroup]);
  
  const handleSubmit = async (values: FormData) => {
    if (!activityGroup) return;
    
    // Convert form data to API format
    const groupData: UpdateActivityGroupData = {
      name: values.name.trim(),
      description: values.description.trim() || undefined
    };
    
    const success = await onSubmit(activityGroup._id, groupData);
    if (success) {
      onClose();
    }
  };
  
  const handleClose = () => {
    form.reset();
    onClose();
  };
  
  // If user can access this page, they can edit activity groups
  
  if (!activityGroup) return null;
  
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Activity Group"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Activity Group Scope Indicator */}
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
          
          {activityGroup.count > 0 && (
            <Group gap="xs">
              <Text size="sm" c="dimmed">Activities:</Text>
              <Badge
                size="sm"
                variant="light"
                color="blue"
              >
                {activityGroup.count} {activityGroup.count === 1 ? 'activity' : 'activities'} using this group
              </Badge>
            </Group>
          )}
          
          {/* Basic Information */}
          <TextInput
            label="Group Name"
            placeholder="e.g., Upper Body, Lower Body, Cardio"
            required
            disabled={false}
            {...form.getInputProps('name')}
          />
          
          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Optional description for this activity group..."
            rows={3}
            disabled={false}
            {...form.getInputProps('description')}
          />
          
          
          {/* Activity Count Warning */}
          {activityGroup.count > 0 && (
            <Text size="sm" c="yellow">
              Note: This group is currently used by {activityGroup.count} {activityGroup.count === 1 ? 'activity' : 'activities'}. 
              Changes will affect all associated activities.
            </Text>
          )}
          
          {/* Footer */}
          <Group justify="flex-end" mt="md">
            <Button
              variant="subtle"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            {(
              <Button
                type="submit"
                loading={loading}
              >
                Update Group
              </Button>
            )}
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}