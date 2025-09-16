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
  IconBarbell,
  IconAlertCircle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { usersApi } from '../../lib/users-api';
import { gymsApi } from '../../lib/gyms-api';
import { getWorkoutPrograms } from '../../lib/workout-programs-api';
import type { TemplateTimeslot } from '../../types/schedules';
import type { User } from '../../types/auth';
import type { Gym, Location } from '../../lib/gyms-api';
import type { WorkoutProgram } from '../../types/index';

interface TimeslotModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (timeslotData: Omit<TemplateTimeslot, 'timeslotId'>) => void;
  timeslot?: TemplateTimeslot | null;
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

export function TimeslotModal({
  opened,
  onClose,
  onSave,
  timeslot,
  dayOfWeek,
  loading = false,
  gymId
}: TimeslotModalProps) {
  const [coaches, setCoaches] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  
  const form = useForm({
    initialValues: {
      dayOfWeek: dayOfWeek,
      startTime: '09:00',
      endTime: '10:00',
      locationId: '',
      coachId: '',
      programId: '',
      maxCapacity: 20,
      className: '',
      notes: '',
      isActive: true,
    },
    validate: {
      startTime: (value) => !value ? 'Start time is required' : null,
      endTime: (value, values) => {
        if (!value) return 'End time is required';
        if (value <= values.startTime) return 'End time must be after start time';
        return null;
      },
      locationId: (value) => !value ? 'Location is required' : null,
      coachId: (value) => !value ? 'Coach is required' : null,
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
          dayOfWeek: timeslot.dayOfWeek,
          startTime: timeslot.startTime,
          endTime: timeslot.endTime,
          locationId: timeslot.locationId,
          coachId: timeslot.coachId,
          programId: timeslot.programId || '',
          maxCapacity: timeslot.maxCapacity,
          className: timeslot.className || '',
          notes: timeslot.notes || '',
          isActive: timeslot.isActive,
        });
      } else {
        form.setValues({
          dayOfWeek: dayOfWeek,
          startTime: '09:00',
          endTime: '10:00',
          locationId: '',
          coachId: '',
          programId: '',
          maxCapacity: 20,
          className: '',
          notes: '',
          isActive: true,
        });
      }
      setValidationErrors([]);
    }
  }, [opened, timeslot, dayOfWeek]);

  const loadModalData = async () => {
    try {
      setLoadingData(true);
      
      const [coachesResponse, gymResponse, programsResponse] = await Promise.all([
        // Get coaches and gym owners for this gym
        usersApi.getUsers({ 
          gymId, 
          userType: 'coach,gym_owner', 
          limit: 100 
        }),
        // Get gym details with locations
        gymsApi.getGym(gymId),
        // Get workout programs for this gym
        getWorkoutPrograms({ 
          gymId, 
          limit: 100 
        })
      ]);

      if (coachesResponse.success) {
        setCoaches(coachesResponse.data.users.filter(user => 
          ['coach', 'gym_owner'].includes(user.userType) && user.isActive
        ));
      }

      if (gymResponse.success) {
        setLocations(gymResponse.data.gym.locations || []);
      }

      setPrograms(programsResponse.programs || []);
    } catch (error) {
      console.error('Error loading modal data:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const validateTimeslot = () => {
    const errors: string[] = [];
    const values = form.values;

    // Check time conflict logic could be added here
    // For now, basic validation is handled by form.validate()

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
      dayOfWeek: form.values.dayOfWeek,
      startTime: form.values.startTime,
      endTime: form.values.endTime,
      locationId: form.values.locationId,
      coachId: form.values.coachId,
      programId: form.values.programId || undefined,
      maxCapacity: form.values.maxCapacity,
      className: form.values.className || undefined,
      notes: form.values.notes || undefined,
      isActive: form.values.isActive,
    };

    onSave(timeslotData);
  };

  const coachOptions = coaches.map(coach => ({
    value: coach._id,
    label: `${coach.name} (${coach.userType})`,
  }));

  const locationOptions = locations.map(location => ({
    value: location.locationId,
    label: location.name,
  }));

  const programOptions = [
    { value: '', label: 'No Program (Open Class)' },
    ...programs.map(program => ({
      value: program._id,
      label: program.name,
    }))
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={timeslot ? 'Edit Timeslot' : 'Create New Timeslot'}
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

          <Group grow>
            <Select
              label="Day of Week"
              leftSection={<IconClock size={16} />}
              required
              {...form.getInputProps('dayOfWeek')}
              data={DAYS_OF_WEEK}
              value={form.values.dayOfWeek.toString()}
              onChange={(value) => form.setFieldValue('dayOfWeek', parseInt(value || '1'))}
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

          <Select
            label="Location"
            placeholder="Select a location"
            leftSection={<IconMapPin size={16} />}
            required
            data={locationOptions}
            {...form.getInputProps('locationId')}
            disabled={loadingData}
          />

          <Select
            label="Coach"
            placeholder="Select a coach"
            leftSection={<IconUser size={16} />}
            required
            data={coachOptions}
            {...form.getInputProps('coachId')}
            disabled={loadingData}
          />

          <Select
            label="Workout Program"
            placeholder="Select a program (optional)"
            leftSection={<IconBarbell size={16} />}
            data={programOptions}
            {...form.getInputProps('programId')}
            disabled={loadingData}
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