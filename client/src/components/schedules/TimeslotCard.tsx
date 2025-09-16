import { Card, Text, Group, Badge, Stack, ActionIcon, Tooltip, Progress } from '@mantine/core';
import { IconPlus, IconUsers, IconClock } from '@tabler/icons-react';
import type { TemplateTimeslot, WeeklyTimeslot, ClientEnrollment } from '../../types/schedules';

interface TimeslotCardProps {
  timeslot?: TemplateTimeslot | WeeklyTimeslot;
  dayOfWeek: number;
  onAdd?: () => void;
  onEdit?: (timeslot: TemplateTimeslot | WeeklyTimeslot) => void;
  onEnroll?: (timeslot: WeeklyTimeslot) => void;
  isTemplate?: boolean;
}

export function TimeslotCard({ 
  timeslot, 
  dayOfWeek, 
  onAdd, 
  onEdit, 
  onEnroll, 
  isTemplate = false 
}: TimeslotCardProps) {
  
  if (!timeslot) {
    return (
      <Card 
        withBorder 
        p="md" 
        style={{ 
          minHeight: 120, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer',
          borderStyle: 'dashed',
          borderColor: '#e0e0e0'
        }}
        onClick={onAdd}
      >
        <Stack align="center" gap="xs">
          <ActionIcon variant="light" size="lg" radius="xl">
            <IconPlus size={16} />
          </ActionIcon>
          <Text size="sm" c="dimmed">Add Class</Text>
        </Stack>
      </Card>
    );
  }

  const enrollments = 'enrollments' in timeslot ? timeslot.enrollments : [];
  const currentEnrollments = enrollments.length;
  const maxCapacity = timeslot.maxCapacity;
  const isWeeklySlot = 'enrollments' in timeslot;
  
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getCapacityColor = (current: number, max: number) => {
    const percentage = (current / max) * 100;
    if (percentage >= 100) return 'red';
    if (percentage >= 80) return 'orange';
    if (percentage >= 60) return 'yellow';
    return 'green';
  };

  return (
    <Card 
      withBorder 
      p="md" 
      style={{ minHeight: 120, cursor: 'pointer' }}
      onClick={() => isWeeklySlot && onEnroll ? onEnroll(timeslot as WeeklyTimeslot) : onEdit?.(timeslot)}
    >
      <Stack gap="xs">
        <Group justify="space-between" align="flex-start">
          <div>
            <Group gap="xs" align="center">
              <IconClock size={14} color="gray" />
              <Text fw={600} size="sm">
                {formatTime(timeslot.startTime)}
              </Text>
            </Group>
            <Text size="lg" fw={500} mt={2}>
              {timeslot.className || 'Class'}
            </Text>
          </div>
          
          <Badge 
            color={getCapacityColor(currentEnrollments, maxCapacity)}
            variant="light"
            size="sm"
          >
            {currentEnrollments}/{maxCapacity}
          </Badge>
        </Group>

        {/* Template view - show basic info */}
        {isTemplate && (
          <Group gap="xs">
            <IconUsers size={14} color="gray" />
            <Text size="xs" c="dimmed">
              Capacity: {maxCapacity}
            </Text>
          </Group>
        )}

        {/* Capacity Progress Bar */}
        {isWeeklySlot && maxCapacity > 0 && (
          <Stack gap={4}>
            <Progress 
              value={(currentEnrollments / maxCapacity) * 100} 
              color={getCapacityColor(currentEnrollments, maxCapacity)}
              size="sm"
              radius="xs"
            />
            <Text size="xs" c="dimmed" ta="center">
              {currentEnrollments > 0 ? `${currentEnrollments} enrolled` : 'Available'}
            </Text>
          </Stack>
        )}

        {/* Weekly schedule view - show enrollments */}
        {isWeeklySlot && enrollments.length > 0 && (
          <Stack gap={2}>
            {enrollments.slice(0, 2).map((enrollment: ClientEnrollment, index) => (
              <Group key={index} gap={4}>
                <div style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  backgroundColor: '#339af0' 
                }} />
                <Text size="xs" truncate style={{ maxWidth: 120 }}>
                  Client {enrollment.clientId.slice(-4)}
                </Text>
              </Group>
            ))}
            {enrollments.length > 2 && (
              <Text size="xs" c="dimmed">
                +{enrollments.length - 2} more
              </Text>
            )}
          </Stack>
        )}

        {timeslot.notes && (
          <Tooltip label={timeslot.notes}>
            <Text size="xs" c="dimmed" truncate>
              {timeslot.notes}
            </Text>
          </Tooltip>
        )}
      </Stack>
    </Card>
  );
}