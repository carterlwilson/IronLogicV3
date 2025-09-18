import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Button,
  Group,
  Select,
  LoadingOverlay
} from '@mantine/core';
import {
  IconUser
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { type ScheduleTemplate } from '../../types/schedules';
import type { CreateScheduleTemplateData } from '../../lib/schedule-templates-api';
import { gymsApi } from '../../lib/gyms-api';
import type { StaffMember } from '../../lib/gyms-api';

interface ScheduleTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (templateData: CreateScheduleTemplateData) => void;
  template?: ScheduleTemplate | null;
  loading?: boolean;
  gymId?: string;
}



export function ScheduleTemplateModal({
  opened,
  onClose,
  onSave,
  template,
  loading = false,
  gymId = ''
}: ScheduleTemplateModalProps) {
  const [currentTemplate, setCurrentTemplate] = useState<ScheduleTemplate | null>(null);
  const [coaches, setCoaches] = useState<StaffMember[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      assignedCoachId: '',
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name must have at least 2 characters' : null),
      assignedCoachId: (value) => (!value ? 'Please assign a coach to this schedule' : null),
    },
  });

  // Load data when modal opens
  useEffect(() => {
    if (opened && gymId) {
      loadModalData();
    }
  }, [opened, gymId]);

  const loadModalData = async () => {
    try {
      setLoadingData(true);

      // Get staff (coaches and gym owners) for this gym
      const staffResponse = await gymsApi.getGymStaff(gymId);

      if (staffResponse.success) {
        setCoaches(staffResponse.data.staff);
      }
    } catch (error) {
      console.error('Error loading modal data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (opened) {
      if (template) {
        form.setValues({
          name: template.name,
          description: template.description || '',
          assignedCoachId: template.assignedCoachId || '',
        });

        setCurrentTemplate(template);
      } else {
        form.reset();
        setCurrentTemplate({
          _id: '',
          name: '',
          description: '',
          assignedCoachId: '',
          timeslots: [],
          gymId: gymId,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: true,
          createdBy: ''
        });
      }
    }
  }, [opened, template, gymId]);

  const handleSubmit = () => {
    const formErrors = form.validate();

    if (formErrors.hasErrors) {
      return;
    }

    if (!currentTemplate) {
      return;
    }

    const templateData: CreateScheduleTemplateData = {
      name: form.values.name,
      description: form.values.description || undefined,
      assignedCoachId: form.values.assignedCoachId || undefined,
      timeslots: [],
    };

    onSave(templateData);
  };

  const coachOptions = coaches.map(coach => ({
    value: coach._id,
    label: `${coach.name} (${coach.userType})`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={template ? 'Edit Schedule Template' : 'Create Schedule Template'}
      size="xl"
    >
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading || loadingData} />

        <Stack gap="md">
          <TextInput
            label="Template Name"
            placeholder="Enter template name"
            required
            {...form.getInputProps('name')}
          />

          <Textarea
            label="Description"
            placeholder="Optional description"
            rows={3}
            {...form.getInputProps('description')}
          />


          <Select
            label="Assigned Coach"
            placeholder="Select a coach for this schedule"
            leftSection={<IconUser size={16} />}
            required
            data={coachOptions}
            {...form.getInputProps('assignedCoachId')}
            disabled={loadingData}
            searchable
          />
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {template ? 'Update Template' : 'Create Template'}
            </Button>
          </Group>
        </Stack>
      </div>
    </Modal>
  );
}