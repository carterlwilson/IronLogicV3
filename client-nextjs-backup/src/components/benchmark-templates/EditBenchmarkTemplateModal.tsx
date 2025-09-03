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
  TagsInput
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { UpdateBenchmarkTemplateData, BenchmarkTemplate } from '../../lib/benchmark-templates-api';

interface EditBenchmarkTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (id: string, templateData: UpdateBenchmarkTemplateData) => Promise<boolean>;
  template: BenchmarkTemplate | null;
  loading: boolean;
}

interface FormData {
  name: string;
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

export function EditBenchmarkTemplateModal({
  opened,
  onClose,
  onSubmit,
  template,
  loading
}: EditBenchmarkTemplateModalProps) {
  const form = useForm<FormData>({
    initialValues: {
      name: '',
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
  
  // Load template data into form when template changes
  useEffect(() => {
    if (template && opened) {
      form.setValues({
        name: template.name,
        type: template.type,
        unit: template.unit,
        description: template.description || '',
        instructions: template.instructions || '',
        notes: template.notes || '',
        tags: template.tags || [],
      });
    }
  }, [template, opened]);

  // Update unit when type changes
  useEffect(() => {
    const currentType = form.values.type;
    const availableUnits = unitOptions[currentType];
    const currentUnit = form.values.unit;
    
    // Only change unit if current unit is not valid for the new type
    const isCurrentUnitValid = availableUnits.some(option => option.value === currentUnit);
    if (!isCurrentUnitValid && availableUnits.length > 0) {
      form.setFieldValue('unit', availableUnits[0].value as any);
    }
  }, [form.values.type]);
  
  const handleSubmit = async (values: FormData) => {
    if (!template) return;
    
    // Convert form data to API format
    const templateData: UpdateBenchmarkTemplateData = {
      name: values.name.trim(),
      type: values.type,
      unit: values.unit,
      description: values.description.trim() || undefined,
      instructions: values.instructions.trim() || undefined,
      notes: values.notes.trim() || undefined,
      tags: values.tags.filter(tag => tag.trim().length > 0)
    };
    
    const success = await onSubmit(template._id, templateData);
    if (success) {
      onClose();
    }
  };
  
  if (!template) return null;
  
  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Benchmark Template"
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
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              loading={loading}
            >
              Update Template
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}