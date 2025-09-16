import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  Select,
  Textarea,
  Button,
  Group,
  Text,
  Alert,
  LoadingOverlay
} from '@mantine/core';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { IconCalendar, IconAlertCircle } from '@tabler/icons-react';
import { type ScheduleTemplate } from '../../types/schedules';
import { type CreateWeeklyScheduleData } from '../../lib/weekly-schedules-api';

interface CreateWeeklyScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (scheduleData: CreateWeeklyScheduleData) => void;
  templates: ScheduleTemplate[];
  loading?: boolean;
}

export function CreateWeeklyScheduleModal({
  opened,
  onClose,
  onSave,
  templates,
  loading = false
}: CreateWeeklyScheduleModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  
  const form = useForm({
    initialValues: {
      templateId: '',
      weekStartDate: null as Date | null,
      notes: '',
    },
    validate: {
      templateId: (value) => (!value ? 'Please select a template' : null),
      weekStartDate: (value) => {
        if (!value) return 'Please select a week start date';
        
        // Check if it's a Monday
        if (value.getDay() !== 1) {
          return 'Week start date must be a Monday';
        }
        
        return null;
      },
    },
  });

  // Reset form when modal opens/closes
  useEffect(() => {
    if (opened) {
      form.reset();
      setSelectedTemplate(null);
    }
  }, [opened]);

  // Update selected template when templateId changes
  useEffect(() => {
    if (form.values.templateId) {
      const template = templates.find(t => t._id === form.values.templateId);
      setSelectedTemplate(template || null);
    } else {
      setSelectedTemplate(null);
    }
  }, [form.values.templateId, templates]);

  const handleSubmit = () => {
    const validation = form.validate();
    
    if (validation.hasErrors) {
      return;
    }

    const scheduleData: CreateWeeklyScheduleData = {
      templateId: form.values.templateId,
      weekStartDate: form.values.weekStartDate!.toISOString(),
      notes: form.values.notes || undefined,
    };

    onSave(scheduleData);
  };

  const getNextMonday = (): Date => {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysUntilMonday = dayOfWeek === 0 ? 1 : 8 - dayOfWeek; // If Sunday, next Monday is 1 day away
    const nextMonday = new Date(today);
    nextMonday.setDate(today.getDate() + daysUntilMonday);
    nextMonday.setHours(0, 0, 0, 0);
    return nextMonday;
  };

  const templateOptions = Array.isArray(templates) 
    ? templates
        .filter(template => template.isActive)
        .map(template => ({
          value: template._id,
          label: template.name,
          description: template.description,
        }))
    : [];

  const formatWeekRange = (startDate: Date): string => {
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric' 
    };
    
    const startStr = startDate.toLocaleDateString('en-US', options);
    const endStr = endDate.toLocaleDateString('en-US', options);
    
    return `${startStr} - ${endStr}`;
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Create Weekly Schedule"
      size="md"
    >
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} />
        
        <Stack gap="md">
          <Select
            label="Schedule Template"
            placeholder="Choose a template"
            required
            data={templateOptions}
            searchable
            {...form.getInputProps('templateId')}
          />

          {selectedTemplate && (
            <Alert color="blue" icon={<IconAlertCircle size={16} />}>
              <Text size="sm" fw={500}>Template: {selectedTemplate.name}</Text>
              {selectedTemplate.description && (
                <Text size="sm" mt={4}>{selectedTemplate.description}</Text>
              )}
              <Text size="sm" mt={4}>
                This template has {selectedTemplate.totalTimeslots || 0} timeslots 
                across {selectedTemplate.totalCoaches || 0} coaches.
              </Text>
            </Alert>
          )}

          <DateInput
            label="Week Start Date"
            placeholder="Select a Monday"
            required
            leftSection={<IconCalendar size={16} />}
            defaultValue={getNextMonday()}
            getDayProps={(date) => {
              const isMonday = date.getDay() === 1;
              return {
                style: {
                  backgroundColor: isMonday ? undefined : '#f8f9fa',
                  color: isMonday ? undefined : '#adb5bd',
                  cursor: isMonday ? 'pointer' : 'not-allowed',
                },
              };
            }}
            filter={(date) => date.getDay() === 1} // Only allow Mondays
            {...form.getInputProps('weekStartDate')}
          />

          {form.values.weekStartDate && (
            <Alert color="teal">
              <Text size="sm">
                Schedule will be created for the week of{' '}
                <Text component="span" fw={500}>
                  {formatWeekRange(form.values.weekStartDate)}
                </Text>
              </Text>
            </Alert>
          )}

          <Textarea
            label="Notes"
            placeholder="Optional notes for this weekly schedule"
            rows={3}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Create Schedule
            </Button>
          </Group>
        </Stack>
      </div>
    </Modal>
  );
}