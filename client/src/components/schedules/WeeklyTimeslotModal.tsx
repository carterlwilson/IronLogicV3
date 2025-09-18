import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  NumberInput,
  Text,
  Alert,
  LoadingOverlay
} from '@mantine/core';
import {
  IconClock,
  IconMapPin,
  IconUser,
  IconAlertCircle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import type { WeeklyTimeslot } from '../../types/schedules';
import { gymsApi, type StaffMember } from '../../lib/gyms-api';

interface WeeklyTimeslotModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (timeslotData: Omit<WeeklyTimeslot, 'timeslotId' | 'templateTimeslotId' | 'enrollments'>) => void;
  timeslot?: WeeklyTimeslot | null;
  dayOfWeek: number;
  loading?: boolean;
  gymId: string;
}

const DAYS_OF_WEEK = [
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
  { value: '7', label: 'Sunday' },
];

const TIME_OPTIONS = Array.from({ length: 24 }, (_, hour) =>
  [`${hour.toString().padStart(2, '0')}:00`, `${hour.toString().padStart(2, '0')}:30`]
).flat().map(time => ({ value: time, label: time }));

export function WeeklyTimeslotModal({
  opened,
  onClose,
  onSave,
  timeslot,
  dayOfWeek,
  loading = false,
  gymId
}: WeeklyTimeslotModalProps) {
  const [loadingData, setLoadingData] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [coaches, setCoaches] = useState<StaffMember[]>([]);

  const form = useForm({
    initialValues: {
      dayOfWeek: dayOfWeek.toString(),
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      maxCapacity: 20,
      className: '',
      notes: '',
      isActive: true,
      coachId: '',
      actualStartTime: '',
      actualEndTime: ''
    },
    validate: {
      startTime: (value) => !value ? 'Start time is required' : null,
      endTime: (value, values) => {
        if (!value) return 'End time is required';
        if (value <= values.startTime) return 'End time must be after start time';
        return null;
      },
      location: (value) => !value ? 'Location is required' : null,
      maxCapacity: (value) => {
        if (!value || value < 1) return 'Capacity must be at least 1';
        if (value > 100) return 'Capacity cannot exceed 100';
        return null;
      },
    },
  });

  // Load data when modal opens
  useEffect(() => {
    if (opened && gymId) {
      loadModalData();
    }
  }, [opened, gymId]);

  // Reset form when modal opens/closes or timeslot changes
  useEffect(() => {
    if (opened) {
      if (timeslot) {
        form.setValues({
          dayOfWeek: timeslot.dayOfWeek.toString(),
          startTime: timeslot.startTime,
          endTime: timeslot.endTime,
          location: timeslot.location,
          maxCapacity: timeslot.maxCapacity,
          className: timeslot.className || '',
          notes: timeslot.notes || '',
          isActive: timeslot.isActive,
          coachId: timeslot.coachId?.toString() || '',
          actualStartTime: timeslot.actualStartTime || '',
          actualEndTime: timeslot.actualEndTime || ''
        });
      } else {
        form.setValues({
          dayOfWeek: dayOfWeek.toString(),
          startTime: '09:00',
          endTime: '10:00',
          location: '',
          maxCapacity: 20,
          className: '',
          notes: '',
          isActive: true,
          coachId: '',
          actualStartTime: '',
          actualEndTime: ''
        });
      }
      setValidationErrors([]);
    }
  }, [opened, timeslot, dayOfWeek]);

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

  const validateTimeslot = () => {
    const errors: string[] = [];
    const values = form.values;

    // Check if editing and if there are enrollments that would be affected
    if (timeslot && timeslot.enrollments && timeslot.enrollments.length > 0) {
      const enrolledCount = timeslot.enrollments.filter(e => e.status === 'enrolled').length;
      if (values.maxCapacity < enrolledCount) {
        errors.push(`Cannot reduce capacity below current enrollments (${enrolledCount})`);
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleSubmit = () => {
    const formErrors = form.validate();

    if (formErrors.hasErrors) {
      return;
    }

    if (!validateTimeslot()) {
      return;
    }

    const timeslotData = {
      dayOfWeek: parseInt(form.values.dayOfWeek),
      startTime: form.values.startTime,
      endTime: form.values.endTime,
      location: form.values.location,
      maxCapacity: form.values.maxCapacity,
      className: form.values.className || undefined,
      notes: form.values.notes || undefined,
      isActive: form.values.isActive,
      coachId: form.values.coachId || undefined,
      actualStartTime: form.values.actualStartTime || undefined,
      actualEndTime: form.values.actualEndTime || undefined,
    };

    onSave(timeslotData);
  };

  const coachOptions = coaches.map(coach => ({
    value: coach._id,
    label: `${coach.name} (${coach.userType})`,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={timeslot ? 'Edit Weekly Timeslot' : 'Create New Weekly Timeslot'}
      size="lg"
    >
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading || loadingData} />

        <Stack gap="md">
          {validationErrors.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="red">
              <Stack gap="xs">
                {validationErrors.map((error, index) => (
                  <Text key={index} size="sm">{error}</Text>
                ))}
              </Stack>
            </Alert>
          )}

          {timeslot && timeslot.enrollments && timeslot.enrollments.length > 0 && (
            <Alert icon={<IconAlertCircle size={16} />} color="blue">
              <Text size="sm">
                This timeslot has {timeslot.enrollments.filter(e => e.status === 'enrolled').length} active enrollments.
                Changes may affect enrolled clients.
              </Text>
            </Alert>
          )}

          <Group grow>
            <Select
              label="Day of Week"
              leftSection={<IconClock size={16} />}
              required
              data={DAYS_OF_WEEK}
              {...form.getInputProps('dayOfWeek')}
            />

            <NumberInput
              label="Max Capacity"
              required
              min={1}
              max={100}
              {...form.getInputProps('maxCapacity')}
            />
          </Group>

          <Group grow>
            <Select
              label="Start Time"
              required
              data={TIME_OPTIONS}
              searchable
              {...form.getInputProps('startTime')}
            />
            <Select
              label="End Time"
              required
              data={TIME_OPTIONS}
              searchable
              {...form.getInputProps('endTime')}
            />
          </Group>

          <TextInput
            label="Location"
            placeholder="Enter location name"
            leftSection={<IconMapPin size={16} />}
            required
            {...form.getInputProps('location')}
          />

          <Select
            label="Assigned Coach"
            placeholder="Select a coach for this timeslot"
            leftSection={<IconUser size={16} />}
            data={coachOptions}
            {...form.getInputProps('coachId')}
            disabled={loadingData}
            searchable
            clearable
          />

          <TextInput
            label="Class Name"
            placeholder="e.g., Morning Strength, HIIT Class"
            {...form.getInputProps('className')}
          />

          <Textarea
            label="Notes"
            placeholder="Additional notes or instructions"
            rows={3}
            {...form.getInputProps('notes')}
          />

          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              {timeslot ? 'Update Timeslot' : 'Create Timeslot'}
            </Button>
          </Group>
        </Stack>
      </div>
    </Modal>
  );
}