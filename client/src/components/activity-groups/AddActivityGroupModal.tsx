'use client';

import { useState, useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
  Switch,
  Select,
  Text
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { CreateActivityGroupData } from '../../lib/activity-groups-api';
import { useAuth } from '../../lib/auth-context';

interface AddActivityGroupModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (groupData: CreateActivityGroupData) => Promise<boolean>;
  gymOptions?: Array<{ value: string; label: string }>;
  loading: boolean;
}

interface FormData {
  name: string;
  gymId: string;
  description: string;
}

export function AddActivityGroupModal({
  opened,
  onClose,
  onSubmit,
  gymOptions,
  loading
}: AddActivityGroupModalProps) {
  const { user } = useAuth();
  const [isGlobal, setIsGlobal] = useState(false);
  
  const form = useForm<FormData>({
    initialValues: {
      name: '',
      gymId: user?.userType === 'admin' ? 'global' : (user?.gymId ? String(user.gymId) : ''),
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
    const groupData: CreateActivityGroupData = {
      name: values.name.trim(),
      description: values.description.trim() || undefined
    };

    // Only add gymId if it's not global
    if (values.gymId && values.gymId !== 'global') {
      groupData.gymId = values.gymId;
    }
    
    const success = await onSubmit(groupData);
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
  
  // Check if user can create global activity groups
  const canCreateGlobal = user?.userType === 'admin';
  
  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title="Add Activity Group"
      size="md"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <TextInput
            label="Group Name"
            placeholder="e.g., Upper Body, Lower Body, Cardio"
            required
            {...form.getInputProps('name')}
          />
          
          {/* Scope Selection */}
          {canCreateGlobal && (
            <Stack gap="xs">
              <Switch
                label="Global Activity Group"
                description="Global activity groups are available to all gyms"
                checked={isGlobal}
                onChange={(event) => setIsGlobal(event.currentTarget.checked)}
              />
              
              {!isGlobal && gymOptions && (
                <Select
                  label="Gym"
                  placeholder="Select gym"
                  data={gymOptions}
                  {...form.getInputProps('gymId')}
                  required
                />
              )}
            </Stack>
          )}
          
          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Optional description for this activity group..."
            rows={3}
            {...form.getInputProps('description')}
          />
          
          <Text size="xs" c="dimmed">
            Activity groups help categorize and organize workout activities for better program building.
          </Text>
          
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
              Create Group
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}