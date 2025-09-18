import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Text,
  LoadingOverlay
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUser } from '@tabler/icons-react';
import type { WeeklySchedule } from '../../types/schedules';
import type { UpdateWeeklyScheduleData } from '../../lib/weekly-schedules-api';
import { gymsApi, type StaffMember } from '../../lib/gyms-api';

interface EditWeeklyScheduleModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (scheduleData: UpdateWeeklyScheduleData) => void;
  schedule: WeeklySchedule | null;
  gymId: string;
  loading?: boolean;
}

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
];

export function EditWeeklyScheduleModal({
  opened,
  onClose,
  onSave,
  schedule,
  gymId,
  loading = false
}: EditWeeklyScheduleModalProps) {
  const [coaches, setCoaches] = useState<StaffMember[]>([]);
  const [loadingCoaches, setLoadingCoaches] = useState(false);

  const form = useForm({
    initialValues: {
      status: 'draft',
      assignedCoachId: '',
      notes: '',
    },
    validate: {
      status: (value) => (!value ? 'Please select a status' : null),
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

  // Reset form when modal opens/closes or schedule changes
  useEffect(() => {
    if (opened && schedule) {
      form.setValues({
        status: schedule.status,
        assignedCoachId: schedule.assignedCoachId || '',
        notes: schedule.notes || '',
      });
    } else if (opened) {
      form.reset();
    }
  }, [opened, schedule]);

  const handleSubmit = () => {
    const validation = form.validate();

    if (validation.hasErrors) {
      return;
    }

    if (!schedule) {
      return;
    }

    const scheduleData: UpdateWeeklyScheduleData = {
      status: form.values.status as any,
      assignedCoachId: form.values.assignedCoachId || undefined,
      notes: form.values.notes || undefined,
    };

    onSave(scheduleData);
  };

  const coachOptions = coaches.map(coach => ({
    value: coach._id,
    label: `${coach.name} (${coach.userType})`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Edit Weekly Schedule"
      size="md"
    >
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading || loadingCoaches} />

        <Stack gap="md">
          {schedule && (
            <div>
              <Text size="sm" c="dimmed" mb="md">
                Editing schedule based on template: <Text component="span" fw={500}>{schedule.templateId?.name || 'Unknown Template'}</Text>
              </Text>
            </div>
          )}

          <Select
            label="Status"
            placeholder="Select schedule status"
            required
            data={STATUS_OPTIONS}
            {...form.getInputProps('status')}
          />

          <Select
            label="Assigned Coach"
            placeholder="Select a coach for this schedule"
            description="Coach assigned to this schedule (overrides template's coach)"
            leftSection={<IconUser size={16} />}
            data={coachOptions}
            {...form.getInputProps('assignedCoachId')}
            disabled={loadingCoaches}
            searchable
            clearable
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
              Update Schedule
            </Button>
          </Group>
        </Stack>
      </div>
    </Modal>
  );
}