import { useState, useEffect } from 'react';
import {
  Modal,
  Stack,
  TextInput,
  Textarea,
  Switch,
  Button,
  Group,
  Card,
  Title,
  Table,
  Select,
  NumberInput,
  ActionIcon,
  Text,
  Alert,
  LoadingOverlay
} from '@mantine/core';
import {
  IconPlus,
  IconTrash,
  IconClock,
  IconMapPin,
  IconUser,
  IconAlertCircle
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { type ScheduleTemplate } from '../../types/schedules';
import type { CreateScheduleTemplateData, CreateTimeslotData } from '../../lib/schedule-templates-api';
import { usersApi } from '../../lib/users-api';
import { gymsApi } from '../../lib/gyms-api';
import { getWorkoutPrograms } from '../../lib/workout-programs-api';
import type { User } from '../../types/auth';
import type { Gym, Location } from '../../lib/gyms-api';
import type { WorkoutProgram } from '../../types/index';

interface ScheduleTemplateModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (templateData: CreateScheduleTemplateData) => void;
  template?: ScheduleTemplate | null;
  loading?: boolean;
  gymId?: string;
}

interface TimeslotFormData extends CreateTimeslotData {
  id: string; // Temporary ID for form management
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

export function ScheduleTemplateModal({
  opened,
  onClose,
  onSave,
  template,
  loading = false,
  gymId = ''
}: ScheduleTemplateModalProps) {
  const [timeslots, setTimeslots] = useState<TimeslotFormData[]>([]);
  const [coaches, setCoaches] = useState<User[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  
  const form = useForm({
    initialValues: {
      name: '',
      description: '',
      isDefault: false,
    },
    validate: {
      name: (value) => (value.trim().length < 2 ? 'Name must have at least 2 characters' : null),
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

  // Reset form when modal opens/closes or template changes
  useEffect(() => {
    if (opened) {
      if (template) {
        form.setValues({
          name: template.name,
          description: template.description || '',
          isDefault: template.isDefault,
        });
        
        setTimeslots(
          template.timeslots.map((slot, index) => ({
            id: `existing-${index}`,
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
            locationId: slot.locationId,
            coachId: slot.coachId,
            programId: slot.programId,
            maxCapacity: slot.maxCapacity,
            className: slot.className,
            notes: slot.notes,
          }))
        );
      } else {
        form.reset();
        setTimeslots([]);
      }
    }
  }, [opened, template]);

  const addTimeslot = () => {
    const newTimeslot: TimeslotFormData = {
      id: `new-${Date.now()}`,
      dayOfWeek: 1,
      startTime: '09:00',
      endTime: '10:00',
      locationId: '',
      coachId: '',
      programId: '',
      maxCapacity: 20,
      className: '',
      notes: '',
      isActive: true,
    };
    setTimeslots([...timeslots, newTimeslot]);
  };

  const updateTimeslot = (id: string, field: keyof TimeslotFormData, value: any) => {
    setTimeslots(prev =>
      prev.map(slot =>
        slot.id === id ? { ...slot, [field]: value } : slot
      )
    );
  };

  const removeTimeslot = (id: string) => {
    setTimeslots(prev => prev.filter(slot => slot.id !== id));
  };

  const validateTimeslots = (): string[] => {
    const errors: string[] = [];
    
    timeslots.forEach((slot, index) => {
      if (!slot.locationId) {
        errors.push(`Timeslot ${index + 1}: Location is required`);
      }
      if (!slot.coachId) {
        errors.push(`Timeslot ${index + 1}: Coach is required`);
      }
      if (slot.startTime >= slot.endTime) {
        errors.push(`Timeslot ${index + 1}: End time must be after start time`);
      }
      if (slot.maxCapacity < 1) {
        errors.push(`Timeslot ${index + 1}: Capacity must be at least 1`);
      }
    });

    // Check for overlapping timeslots at same location
    for (let i = 0; i < timeslots.length; i++) {
      for (let j = i + 1; j < timeslots.length; j++) {
        const slot1 = timeslots[i];
        const slot2 = timeslots[j];
        
        if (slot1.dayOfWeek === slot2.dayOfWeek && slot1.locationId === slot2.locationId && slot1.locationId) {
          const start1 = new Date(`2000-01-01T${slot1.startTime}:00`);
          const end1 = new Date(`2000-01-01T${slot1.endTime}:00`);
          const start2 = new Date(`2000-01-01T${slot2.startTime}:00`);
          const end2 = new Date(`2000-01-01T${slot2.endTime}:00`);
          
          if (start1 < end2 && start2 < end1) {
            errors.push(`⚠️ Location conflict: Timeslots ${i + 1} and ${j + 1} overlap at same location on ${DAYS_OF_WEEK[slot1.dayOfWeek - 1]?.label}`);
          }
        }

        // Check for coach double-booking
        if (slot1.dayOfWeek === slot2.dayOfWeek && slot1.coachId === slot2.coachId && slot1.coachId) {
          const start1 = new Date(`2000-01-01T${slot1.startTime}:00`);
          const end1 = new Date(`2000-01-01T${slot1.endTime}:00`);
          const start2 = new Date(`2000-01-01T${slot2.startTime}:00`);
          const end2 = new Date(`2000-01-01T${slot2.endTime}:00`);
          
          if (start1 < end2 && start2 < end1) {
            const coachName = coaches.find(c => c._id === slot1.coachId)?.name || 'Unknown Coach';
            errors.push(`⚠️ Coach conflict: ${coachName} is double-booked on ${DAYS_OF_WEEK[slot1.dayOfWeek - 1]?.label} (timeslots ${i + 1} and ${j + 1})`);
          }
        }
      }
    }

    return errors;
  };

  // Real-time conflict detection
  const currentConflicts = validateTimeslots();

  const handleSubmit = () => {
    const formErrors = form.validate();
    const timeslotErrors = validateTimeslots();
    
    if (formErrors.hasErrors) {
      return;
    }
    
    if (timeslotErrors.length > 0) {
      // Show validation errors - in a real app you'd want better error handling
      alert(timeslotErrors.join('\n'));
      return;
    }

    const templateData: CreateScheduleTemplateData = {
      name: form.values.name,
      description: form.values.description || undefined,
      isDefault: form.values.isDefault,
      timeslots: timeslots.map(({ id, ...slot }) => slot), // Remove the temporary ID
    };

    onSave(templateData);
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

  const timeslotRows = timeslots.map((slot) => (
    <Table.Tr key={slot.id}>
      <Table.Td>
        <Select
          value={slot.dayOfWeek.toString()}
          onChange={(value) => updateTimeslot(slot.id, 'dayOfWeek', parseInt(value || '1'))}
          data={DAYS_OF_WEEK}
          size="sm"
        />
      </Table.Td>
      <Table.Td>
        <Group gap="xs">
          <Select
            value={slot.startTime}
            onChange={(value) => updateTimeslot(slot.id, 'startTime', value || '09:00')}
            data={TIME_OPTIONS}
            size="sm"
            w={80}
            searchable
          />
          <Text size="sm">to</Text>
          <Select
            value={slot.endTime}
            onChange={(value) => updateTimeslot(slot.id, 'endTime', value || '10:00')}
            data={TIME_OPTIONS}
            size="sm"
            w={80}
            searchable
          />
        </Group>
      </Table.Td>
      <Table.Td>
        <Select
          placeholder="Select location"
          value={slot.locationId}
          onChange={(value) => updateTimeslot(slot.id, 'locationId', value || '')}
          data={locationOptions}
          size="sm"
          leftSection={<IconMapPin size={14} />}
          disabled={loadingData}
          searchable
        />
      </Table.Td>
      <Table.Td>
        <Select
          placeholder="Select coach"
          value={slot.coachId}
          onChange={(value) => updateTimeslot(slot.id, 'coachId', value || '')}
          data={coachOptions}
          size="sm"
          leftSection={<IconUser size={14} />}
          disabled={loadingData}
          searchable
        />
      </Table.Td>
      <Table.Td>
        <NumberInput
          value={slot.maxCapacity}
          onChange={(value) => updateTimeslot(slot.id, 'maxCapacity', value || 1)}
          min={1}
          max={100}
          size="sm"
          w={70}
        />
      </Table.Td>
      <Table.Td>
        <Select
          placeholder="Select program"
          value={slot.programId || ''}
          onChange={(value) => updateTimeslot(slot.id, 'programId', value || '')}
          data={programOptions}
          size="sm"
          disabled={loadingData}
          searchable
        />
      </Table.Td>
      <Table.Td>
        <TextInput
          placeholder="Class name"
          value={slot.className}
          onChange={(event) => updateTimeslot(slot.id, 'className', event.currentTarget.value)}
          size="sm"
        />
      </Table.Td>
      <Table.Td>
        <ActionIcon
          color="red"
          variant="subtle"
          onClick={() => removeTimeslot(slot.id)}
        >
          <IconTrash size={16} />
        </ActionIcon>
      </Table.Td>
    </Table.Tr>
  ));

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

          <Switch
            label="Set as default template"
            description="This template will be used as the default for creating new schedules"
            {...form.getInputProps('isDefault', { type: 'checkbox' })}
          />

          <Card>
            <Stack gap="md">
              <Group justify="space-between">
                <Title order={4}>Timeslots</Title>
                <Button
                  leftSection={<IconPlus size={16} />}
                  onClick={addTimeslot}
                  size="sm"
                >
                  Add Timeslot
                </Button>
              </Group>

              {currentConflicts.length > 0 && (
                <Alert icon={<IconAlertCircle size={16} />} color="orange" title="Conflicts Detected">
                  <Stack gap="xs">
                    {currentConflicts.map((conflict, index) => (
                      <Text key={index} size="sm">{conflict}</Text>
                    ))}
                  </Stack>
                </Alert>
              )}

              {timeslots.length === 0 ? (
                <Alert icon={<IconAlertCircle size={16} />} color="blue">
                  No timeslots added yet. Add timeslots to define when classes are scheduled.
                </Alert>
              ) : (
                <Table>
                  <Table.Thead>
                    <Table.Tr>
                      <Table.Th>Day</Table.Th>
                      <Table.Th>Time</Table.Th>
                      <Table.Th>Location</Table.Th>
                      <Table.Th>Coach</Table.Th>
                      <Table.Th>Capacity</Table.Th>
                      <Table.Th>Program</Table.Th>
                      <Table.Th>Class Name</Table.Th>
                      <Table.Th></Table.Th>
                    </Table.Tr>
                  </Table.Thead>
                  <Table.Tbody>{timeslotRows}</Table.Tbody>
                </Table>
              )}
            </Stack>
          </Card>

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