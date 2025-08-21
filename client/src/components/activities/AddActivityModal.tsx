'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
  Switch,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { CreateActivityData } from '../../lib/activities-api';
import { ActivityGroup } from '../../lib/activity-groups-api';
import { useAuth } from '../../lib/auth-context';

interface AddActivityModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (activityData: CreateActivityData) => Promise<boolean>;
  activityGroups: ActivityGroup[];
  gymOptions?: Array<{ value: string; label: string }>;
  loading: boolean;
}

interface FormData {
  name: string;
  gymId: string;
  activityGroupId: string;
  type: 'primary lift' | 'accessory lift' | 'conditioning' | 'diagnostic';
  description: string;
  instructions: string;
}


export function AddActivityModal({
  opened,
  onClose,
  onSubmit,
  activityGroups,
  gymOptions,
  loading
}: AddActivityModalProps) {
  const { user } = useAuth();
  const [isGlobal, setIsGlobal] = useState(false);
  
  const form = useForm<FormData>({
    initialValues: {
      name: '',
      gymId: user?.userType === 'admin' ? 'global' : (user?.gymId || ''),
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
  
  // Update gymId when global toggle changes
  useEffect(() => {
    if (user?.userType === 'admin') {
      if (isGlobal) {
        form.setFieldValue('gymId', 'global');
      } else if (gymOptions && gymOptions.length > 0) {
        form.setFieldValue('gymId', gymOptions[0]?.value || '');
      }
    }
  }, [isGlobal, gymOptions, user?.userType]);
  
  
  const handleSubmit = async (values: FormData) => {
    // Convert form data to API format
    const activityData: CreateActivityData = {
      name: values.name.trim(),
      activityGroupId: values.activityGroupId,
      type: values.type,
      description: values.description.trim() || undefined,
      instructions: values.instructions.trim() || undefined,
    };

    // Only add gymId if it's not global
    if (values.gymId && values.gymId !== 'global') {
      activityData.gymId = values.gymId;
    }
    
    const success = await onSubmit(activityData);
    if (success) {
      form.reset();
      setIsGlobal(false);
      onClose();
    }
  };
  
  const handleClose = () => {
    form.reset();
    setIsGlobal(false);
    onClose();
  };
  
  // Check if user can create global activities
  const canCreateGlobal = user?.userType === 'admin';
  
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add Activity Template"
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <TextInput
            label="Activity Name"
            placeholder="e.g., Barbell Back Squat"
            required
            {...form.getInputProps('name')}
          />
          
          {/* Scope Selection */}
          {canCreateGlobal && (
            <Stack gap="xs">
              <Switch
                label="Global Activity"
                description="Global activities are available to all gyms"
                checked={isGlobal}
                onChange={(event) => setIsGlobal(event.currentTarget.checked)}
              />
              
              {!isGlobal && (
                <Select
                  label="Gym"
                  placeholder="Select gym"
                  data={gymOptions || []}
                  {...form.getInputProps('gymId')}
                  required
                />
              )}
            </Stack>
          )}
          
          {/* Activity Group */}
          <Select
            label="Activity Group"
            placeholder="Select an activity group"
            data={activityGroups.map(group => ({
              value: group._id,
              label: `${group.name} (${group.count} activities)`
            }))}
            required
            {...form.getInputProps('activityGroupId')}
            description={activityGroups.length > 0 ? "Select an existing activity group" : "No activity groups available. Create one first."}
          />
          
          {activityGroups.length === 0 && (
            <Text size="xs" c="orange">
              You need to create activity groups first before adding activities.
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
            {...form.getInputProps('type')}
          />
          
          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Brief description of the activity..."
            rows={3}
            {...form.getInputProps('description')}
          />
          
          {/* Instructions */}
          <Textarea
            label="Instructions"
            placeholder="Detailed instructions for performing the activity..."
            rows={4}
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
            <Button
              type="submit"
              loading={loading}
            >
              Create Activity
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}