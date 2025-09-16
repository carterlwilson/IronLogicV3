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
  LoadingOverlay,
  Badge,
  Card,
  Title
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconUsers, IconClock, IconMapPin, IconAlertCircle } from '@tabler/icons-react';
import { type WeeklyTimeslot } from '../../types/schedules';

interface TimeslotEnrollmentModalProps {
  opened: boolean;
  onClose: () => void;
  onEnroll: (clientId: string, notes?: string) => void;
  onCancelEnrollment: (clientId: string) => void;
  timeslot?: WeeklyTimeslot | null;
  availableClients?: Array<{ _id: string; name: string; }>;
  loading?: boolean;
}

export function TimeslotEnrollmentModal({
  opened,
  onClose,
  onEnroll,
  onCancelEnrollment,
  timeslot,
  availableClients = [],
  loading = false
}: TimeslotEnrollmentModalProps) {
  const [action, setAction] = useState<'enroll' | 'cancel'>('enroll');
  
  const enrollForm = useForm({
    initialValues: {
      clientId: '',
      notes: '',
    },
    validate: {
      clientId: (value) => (!value ? 'Please select a client' : null),
    },
  });

  const cancelForm = useForm({
    initialValues: {
      clientId: '',
    },
    validate: {
      clientId: (value) => (!value ? 'Please select a client to cancel' : null),
    },
  });

  // Reset forms when modal opens/closes
  useEffect(() => {
    if (opened) {
      enrollForm.reset();
      cancelForm.reset();
      setAction('enroll');
    }
  }, [opened]);

  if (!timeslot) {
    return null;
  }

  const enrolledClients = timeslot.enrollments
    .filter(enrollment => enrollment.status === 'enrolled')
    .map(enrollment => ({
      id: enrollment.clientId,
      notes: enrollment.notes
    }));

  const availableForEnrollment = availableClients.filter(
    client => !enrolledClients.some(enrolled => enrolled.id === client._id)
  );

  const enrolledClientOptions = enrolledClients.map(enrollment => {
    const client = availableClients.find(c => c._id === enrollment.id);
    return {
      value: enrollment.id,
      label: client?.name || 'Unknown Client'
    };
  });

  const availableClientOptions = availableForEnrollment.map(client => ({
    value: client._id,
    label: client.name
  }));

  const handleEnroll = () => {
    const validation = enrollForm.validate();
    if (validation.hasErrors) return;

    onEnroll(enrollForm.values.clientId, enrollForm.values.notes || undefined);
  };

  const handleCancel = () => {
    const validation = cancelForm.validate();
    if (validation.hasErrors) return;

    onCancelEnrollment(cancelForm.values.clientId);
  };

  const capacityPercentage = Math.round((enrolledClients.length / timeslot.maxCapacity) * 100);
  const getCapacityColor = (percentage: number): string => {
    if (percentage >= 100) return 'red';
    if (percentage >= 80) return 'orange';
    if (percentage >= 60) return 'yellow';
    return 'green';
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Manage Timeslot Enrollment"
      size="md"
    >
      <div style={{ position: 'relative' }}>
        <LoadingOverlay visible={loading} />
        
        <Stack gap="md">
          {/* Timeslot Info */}
          <Card withBorder>
            <Stack gap="sm">
              <Group justify="space-between">
                <Title order={4}>
                  {timeslot.className || 'Class'}
                </Title>
                <Badge color={getCapacityColor(capacityPercentage)}>
                  {enrolledClients.length}/{timeslot.maxCapacity}
                </Badge>
              </Group>
              
              <Group gap="md">
                <Group gap="xs">
                  <IconClock size={16} />
                  <Text size="sm">
                    {timeslot.startTime} - {timeslot.endTime}
                  </Text>
                </Group>
                
                <Group gap="xs">
                  <IconMapPin size={16} />
                  <Text size="sm">
                    Location: {timeslot.locationId}
                  </Text>
                </Group>
              </Group>

              <Group gap="xs">
                <IconUsers size={16} />
                <Text size="sm">
                  {enrolledClients.length} enrolled, {timeslot.maxCapacity - enrolledClients.length} spots available
                </Text>
              </Group>
            </Stack>
          </Card>

          {/* Action Selection */}
          <Group gap="md">
            <Button
              variant={action === 'enroll' ? 'filled' : 'light'}
              onClick={() => setAction('enroll')}
              disabled={availableForEnrollment.length === 0}
            >
              Enroll Client
            </Button>
            <Button
              variant={action === 'cancel' ? 'filled' : 'light'}
              onClick={() => setAction('cancel')}
              disabled={enrolledClients.length === 0}
              color="red"
            >
              Cancel Enrollment
            </Button>
          </Group>

          {/* Enrollment Form */}
          {action === 'enroll' && (
            <Stack gap="md">
              {availableForEnrollment.length === 0 ? (
                <Alert color="blue" icon={<IconAlertCircle size={16} />}>
                  No clients available for enrollment. All available clients are already enrolled.
                </Alert>
              ) : (
                <>
                  <Select
                    label="Select Client"
                    placeholder="Choose a client to enroll"
                    required
                    data={availableClientOptions}
                    searchable
                    {...enrollForm.getInputProps('clientId')}
                  />

                  <Textarea
                    label="Notes (Optional)"
                    placeholder="Any special notes for this enrollment"
                    rows={2}
                    {...enrollForm.getInputProps('notes')}
                  />

                  <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button onClick={handleEnroll} loading={loading}>
                      Enroll Client
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          )}

          {/* Cancellation Form */}
          {action === 'cancel' && (
            <Stack gap="md">
              {enrolledClients.length === 0 ? (
                <Alert color="blue" icon={<IconAlertCircle size={16} />}>
                  No clients are currently enrolled in this timeslot.
                </Alert>
              ) : (
                <>
                  <Select
                    label="Select Client to Cancel"
                    placeholder="Choose a client to cancel enrollment"
                    required
                    data={enrolledClientOptions}
                    searchable
                    {...cancelForm.getInputProps('clientId')}
                  />

                  <Alert color="orange" icon={<IconAlertCircle size={16} />}>
                    This will cancel the selected client's enrollment for this timeslot.
                  </Alert>

                  <Group justify="flex-end" gap="sm">
                    <Button variant="default" onClick={onClose}>
                      Cancel
                    </Button>
                    <Button color="red" onClick={handleCancel} loading={loading}>
                      Cancel Enrollment
                    </Button>
                  </Group>
                </>
              )}
            </Stack>
          )}
        </Stack>
      </div>
    </Modal>
  );
}