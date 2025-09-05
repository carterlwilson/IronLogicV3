'use client';

import React, { useEffect } from 'react';
import {
  Modal,
  TextInput,
  Textarea,
  Select,
  Button,
  Stack,
  Group,
  TagsInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { type CreateBenchmarkTemplateData } from '../../lib/benchmark-templates-api';
import { useAuth } from '../../lib/auth-context';

interface AddBenchmarkTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (templateData: CreateBenchmarkTemplateData) => Promise<boolean>;
  gymOptions?: Array<{ value: string; label: string }>;
  loading: boolean;
}

interface FormData {
  name: string;
  gymId: string;
  type: 'weight' | 'time' | 'reps';
  unit: 'lbs' | 'kg' | 'seconds' | 'reps';
  description: string;
  instructions: string;
  notes: string;
  tags: string[];
}

// Valid unit options for each type
const unitOptions = {
  weight: [
    { value: 'lbs', label: 'Pounds (lbs)' },
    { value: 'kg', label: 'Kilograms (kg)' }
  ],
  time: [
    { value: 'seconds', label: 'Seconds' }
  ],
  reps: [
    { value: 'reps', label: 'Repetitions' }
  ]
};

export function AddBenchmarkTemplateModal({
  opened,
  onClose,
  onSubmit,
  gymOptions,
  loading
}: AddBenchmarkTemplateModalProps) {
  const { user } = useAuth();
  
  const form = useForm<FormData>({
    initialValues: {
      name: '',
      gymId: user?.gymId || '',
      type: 'weight',
      unit: 'lbs',
      description: '',
      instructions: '',
      notes: '',
      tags: [],
    },
    validate: {
      name: (value) => {
        if (!value.trim()) return 'Template name is required';
        if (value.length > 100) return 'Template name cannot exceed 100 characters';
        return null;
      },
      type: (value) => {
        if (!value) return 'Type is required';
        return null;
      },
      unit: (value) => {
        if (!value) return 'Unit is required';
        return null;
      },
      description: (value) => {
        if (value && value.length > 500) return 'Description cannot exceed 500 characters';
        return null;
      },
      instructions: (value) => {
        if (value && value.length > 1000) return 'Instructions cannot exceed 1000 characters';
        return null;
      },
      notes: (value) => {
        if (value && value.length > 1000) return 'Notes cannot exceed 1000 characters';
        return null;
      }
    }
  });
  

  // Update unit when type changes
  useEffect(() => {
    const currentType = form.values.type;
    const availableUnits = unitOptions[currentType];
    if (availableUnits.length > 0) {
      form.setFieldValue('unit', availableUnits[0].value as any);
    }
  }, [form.values.type]);
  
  const handleSubmit = async (values: FormData) => {
    // Convert form data to API format
    const templateData: CreateBenchmarkTemplateData = {
      name: values.name.trim(),
      type: values.type,
      unit: values.unit,
      description: values.description.trim() || undefined,
      instructions: values.instructions.trim() || undefined,
      notes: values.notes.trim() || undefined,
      tags: values.tags.filter(tag => tag.trim().length > 0)
    };

    // Always add gymId (required now)
    templateData.gymId = values.gymId;
    
    const success = await onSubmit(templateData);
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
      title="Add Benchmark Template"
      size="lg"
      centered
    >
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <TextInput
            label="Template Name"
            placeholder="e.g., 1RM Back Squat, 5K Run Time, Max Pull-ups"
            required
            {...form.getInputProps('name')}
          />
          
          {/* Gym Selection for Admins */}
          {user?.userType === 'admin' && (
            <Select
              label="Gym"
              placeholder="Select gym to create template for"
              data={gymOptions || []}
              {...form.getInputProps('gymId')}
              required
            />
          )}
          
          {/* Type and Unit Selection */}
          <Group grow>
            <Select
              label="Benchmark Type"
              placeholder="Select type"
              data={[
                { value: 'weight', label: 'Weight-based' },
                { value: 'time', label: 'Time-based' },
                { value: 'reps', label: 'Repetition-based' }
              ]}
              required
              {...form.getInputProps('type')}
            />
            
            <Select
              label="Unit of Measurement"
              placeholder="Select unit"
              data={unitOptions[form.values.type] || []}
              required
              {...form.getInputProps('unit')}
            />
          </Group>
          
          {/* Description */}
          <Textarea
            label="Description"
            placeholder="Brief description of what this benchmark measures..."
            rows={3}
            {...form.getInputProps('description')}
          />
          
          {/* Instructions */}
          <Textarea
            label="Instructions"
            placeholder="Detailed instructions for performing this benchmark test..."
            rows={4}
            {...form.getInputProps('instructions')}
          />
          
          {/* Notes */}
          <Textarea
            label="Notes"
            placeholder="Additional notes, equipment requirements, safety considerations..."
            rows={3}
            {...form.getInputProps('notes')}
          />
          
          {/* Tags */}
          <TagsInput
            label="Tags"
            placeholder="Add tags to categorize this template"
            {...form.getInputProps('tags')}
            description="Press Enter to add a tag. Use tags like 'strength', 'cardio', 'upper-body', etc."
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
              Create Template
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}