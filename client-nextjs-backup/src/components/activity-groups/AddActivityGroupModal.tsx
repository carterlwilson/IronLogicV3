'use client';

import React from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Button,
  Stack,
  Group,
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
  
  const form = useForm<FormData>({
    initialValues: {
      name: '',
      gymId: user?.gymId ? String(user.gymId) : '',
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
  
  
  const handleSubmit = async (values: FormData) => {
    // Convert form data to API format
    const groupData: CreateActivityGroupData = {
      name: values.name.trim(),
      description: values.description.trim() || undefined
    };

    // Always include gymId for gym-scoped groups
    if (values.gymId) {
      groupData.gymId = values.gymId;
    }
    
    const success = await onSubmit(groupData);
    if (success) {
      form.reset();
      onClose();
    }
  };
  
  const handleClose = () => {
    form.reset();
    onClose();
  };
  
  
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
          
          {/* Gym Selection for Admins */}
          {user?.userType === 'admin' && (
            <Select
              label="Gym"
              placeholder="Select gym to create group for"
              data={gymOptions || []}
              {...form.getInputProps('gymId')}
              required
            />
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