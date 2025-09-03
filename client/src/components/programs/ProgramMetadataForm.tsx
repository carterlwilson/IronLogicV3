'use client';

import { useState, useEffect } from 'react';
import {
  Stack,
  TextInput,
  Textarea,
  Switch,
  Group,
  Text
} from '@mantine/core';
import type { WorkoutProgram } from '../../types/index';

interface ProgramMetadataFormProps {
  program: WorkoutProgram;
  onUpdate: (updates: Partial<WorkoutProgram>) => void;
}

export function ProgramMetadataForm({ program, onUpdate }: ProgramMetadataFormProps) {
  const [formData, setFormData] = useState({
    name: program.name,
    description: program.description || '',
    isTemplate: program.isTemplate
  });

  // Update form data when program changes
  useEffect(() => {
    setFormData({
      name: program.name,
      description: program.description || '',
      isTemplate: program.isTemplate
    });
  }, [program]);

  const handleChange = (field: string, value: string | boolean) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);
    onUpdate({ [field]: value });
  };

  return (
    <Stack gap="md">
      <TextInput
        label="Program Name"
        placeholder="Enter program name"
        required
        value={formData.name}
        onChange={(event) => handleChange('name', event.currentTarget.value)}
        error={!formData.name.trim() ? 'Program name is required' : null}
      />

      <Textarea
        label="Description"
        placeholder="Describe the program goals and structure..."
        rows={4}
        value={formData.description}
        onChange={(event) => handleChange('description', event.currentTarget.value)}
      />

      <div>
        <Switch
          label="Template Program"
          description="Templates can be used to create new programs"
          checked={formData.isTemplate}
          onChange={(event) => handleChange('isTemplate', event.currentTarget.checked)}
        />
      </div>

      {/* Program Info */}
      <div>
        <Text size="sm" c="dimmed" mb="xs">Program Info</Text>
        <Group gap="md">
          <div>
            <Text size="xs" c="dimmed">Version</Text>
            <Text size="sm">{program.version}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">Created</Text>
            <Text size="sm">{new Date(program.createdAt).toLocaleDateString()}</Text>
          </div>
          <div>
            <Text size="xs" c="dimmed">Updated</Text>
            <Text size="sm">{new Date(program.updatedAt).toLocaleDateString()}</Text>
          </div>
        </Group>
      </div>
    </Stack>
  );
}