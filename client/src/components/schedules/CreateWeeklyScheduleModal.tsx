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
import { useForm } from '@mantine/form';
import { IconAlertCircle, IconUser } from '@tabler/icons-react';
import { type ScheduleTemplate } from '../../types/schedules';
import { type CreateWeeklyScheduleData } from '../../lib/weekly-schedules-api';
import { gymsApi, type StaffMember } from '../../lib/gyms-api';

interface CreateWeeklyScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (scheduleData: CreateWeeklyScheduleData) => void;
  templates: ScheduleTemplate[];
  gymId: string;
  loading?: boolean;
}

export function CreateWeeklyScheduleModal({
  opened,
  onClose,
  onSave,
  templates,
  gymId,
  loading = false
}: CreateWeeklyScheduleModalProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<ScheduleTemplate | null>(null);
  const [coaches, setCoaches] = useState<StaffMember[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);
  
  const form = useForm({
    initialValues: {
      templateId: '',
      assignedCoachId: '',
      notes: '',
    },
    validate: {
      templateId: (value) => (!value ? 'Please select a template' : null),
    },
  });

  // Load coaches when modal opens
  useEffect(() => {
    if (opened && gymId) {
      loadCoaches();
    }
  }, [opened, gymId]);

  const loadCoaches = async () => {
    try {
      setLoadingCoaches(true);
      const response = await gymsApi.getGymStaff(gymId);
      if (response.success) {
        setCoaches(response.data.staff);
      }
    } catch (error) {
      console.error('Error loading coaches:', error);
    } finally {
      setLoadingCoaches(false);
    }
  };

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
      
      // Set default coach from template
      if (template?.assignedCoachId) {
        form.setFieldValue('assignedCoachId', template.assignedCoachId);
      }
    } else {
      setSelectedTemplate(null);
      form.setFieldValue('assignedCoachId', '');
    }
  }, [form.values.templateId, templates]);

  const handleSubmit = () => {
    const validation = form.validate();
    
    if (validation.hasErrors) {
      return;
    }

    const scheduleData: CreateWeeklyScheduleData = {
      templateId: form.values.templateId,
      assignedCoachId: selectedTemplate?.assignedCoachId,
      notes: form.values.notes || undefined,
    };

    onSave(scheduleData);
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

  const coachOptions = coaches.map(coach => ({
    value: coach._id,
    label: `${coach.name} (${coach.userType})`,
  }));


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