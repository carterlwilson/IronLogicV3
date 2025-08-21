'use client';

import { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
  Text,
  Badge
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { UpdateActivityData } from '../../lib/activities-api';
import { ActivityTemplate, ActivityGroup } from '../../../shared/src/types';
import { useAuth } from '../../lib/auth-context';

interface EditActivityModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (id: string, activityData: UpdateActivityData) => Promise<boolean>;
  activity: ActivityTemplate | null;
  activityGroups: ActivityGroup[];
  loading: boolean;
}

interface FormData {
  name: string;
  activityGroupId: string;
  type: 'primary lift' | 'accessory lift' | 'conditioning' | 'diagnostic';
  description: string;
  instructions: string;
}


export function EditActivityModal({
  opened,
  onClose,
  onSubmit,
  activity,
  activityGroups,
  loading
}: EditActivityModalProps) {
  const { user } = useAuth();
  
  const form = useForm<FormData>({
    initialValues: {
      name: '',
      activityGroupId: '',
      type: 'primary lift',
      description: '',
      instructions: '',
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Activity name is required';
        if (value.length > 100) return 'Activity name cannot exceed 100 characters';
        return null;
      },
      activityGroupId: (value) => {
        if (!value.trim()) return 'Activity group is required';
        return null;
      },
      type: (value) => {
        if (!value) return 'Activity type is required';
        return null;
      },
      description: (value) => {
        if (value && value.length > 500) return 'Description cannot exceed 500 characters';
        return null;
      },
      instructions: (value) => {
        if (value && value.length > 1000) return 'Instructions cannot exceed 1000 characters';
        return null;
      }
    }
  });
  
  // Populate form when activity changes
  useEffect(() => {
    if (activity) {
      form.setValues({
        name: activity.name,
        activityGroupId: activity.activityGroupId,
        type: activity.type,
        description: activity.description || '',
        instructions: activity.instructions || '',
      });
    }
  }, [activity]);
  
  
  const handleSubmit = async (values: FormData) => {
    if (!activity) return;
    
    // Convert form data to API format
    const activityData: UpdateActivityData = {
      name: values.name.trim(),
      activityGroupId: values.activityGroupId,
      type: values.type,
      description: values.description.trim() || undefined,
      instructions: values.instructions.trim() || undefined,
    };
    
    const success = await onSubmit(activity._id, activityData);
    if (success) {
      onClose();
    }
  };
  
  const handleClose = () => {
    form.reset();
    onClose();
  };
  
  // If user can access this page, they can edit activities
  
  if (!activity) return null;
  
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Edit Activity Template"
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Activity Scope Indicator */}
          <Group gap="xs">
            <Text size="sm" c="dimmed">Scope:</Text>
            <Badge
              size="sm"
              color={activity.gymId ? 'blue' : 'purple'}
              variant="light"
            >
              {activity.gymId ? 'Gym Activity' : 'Global Activity'}
            </Badge>
          </Group>
          
          {/* Basic Information */}
          <TextInput
            label="Activity Name"
            placeholder="e.g., Barbell Back Squat"
            required
            disabled={false}
            {...form.getInputProps('name')}
          />
          
          {/* Activity Group */}
          <Select
            label="Activity Group"
            placeholder="Select an activity group"
            data={activityGroups.map(group => ({
              value: group._id,
              label: `${group.name} (${group.count} activities)`
            }))}
            required
            disabled={false}
            {...form.getInputProps('activityGroupId')}
            description={canEdit() ? (activityGroups.length > 0 ? "Select an existing activity group" : "No activity groups available") : "Activity group"}
          />
          
          {activityGroups.length === 0 && (
            <Text size="xs" c="orange">
              No activity groups available. Create one first.
            </Text>
          )}
          
          {/* Type */}
          <Select
            label="Activity Type"
            placeholder="Select activity type"
            data={[
              { value: 'primary lift', label: 'Primary Lift' },
              { value: 'accessory lift', label: 'Accessory Lift' },
              { value: 'conditioning', label: 'Conditioning' },
              { value: 'diagnostic', label: 'Diagnostic' }
            ]}
            required
            disabled={false}
            {...form.getInputProps('type')}
          />
          
          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Brief description of the activity..."
            rows={3}
            disabled={false}
            {...form.getInputProps('description')}
          />
          
          {/* Instructions */}
          <Textarea
            label="Instructions"
            placeholder="Detailed instructions for performing the activity..."
            rows={4}
            disabled={false}
            {...form.getInputProps('instructions')}
          />
          
          
          
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
                Update Activity
              </Button>
            )}
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}