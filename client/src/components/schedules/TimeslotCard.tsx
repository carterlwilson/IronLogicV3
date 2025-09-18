import { Card, Text, Group, ActionIcon, Badge, Box, Tooltip } from '@mantine/core';
import { IconEdit, IconTrash, IconEye } from '@tabler/icons-react';
import type { TemplateTimeslot, WeeklyTimeslot } from '../../types/schedules';

interface TimeslotCardProps {
  timeslot: TemplateTimeslot | WeeklyTimeslot;
  mode: 'template' | 'schedule';
  enrollmentData?: { enrolled: number; capacity: number };
  onEdit?: () => void;
  onDelete?: () => void;
  onViewDetails?: () => void;
}

export function TimeslotCard({
  timeslot,
  mode,
  enrollmentData,
  onEdit,
  onDelete,
  onViewDetails
}: TimeslotCardProps) {
  const isWeeklySchedule = mode === 'schedule';
  const capacity = enrollmentData?.capacity || timeslot.maxCapacity;
  const enrolled = enrollmentData?.enrolled || 0;
  const enrollmentPercentage = capacity > 0 ? (enrolled / capacity) * 100 : 0;

  // Determine card background color based on enrollment
  const getCardColor = () => {
    if (!isWeeklySchedule) return undefined;
    
    if (enrollmentPercentage >= 100) return '#ffe3e3'; // Light red - full
    if (enrollmentPercentage >= 80) return '#e3ffe3'; // Light green - high
    return undefined; // Default
  };

  // Determine border color for conflicts or status
  const getBorderColor = () => {
    if (enrollmentPercentage >= 100) return '#ff6b6b'; // Red border when full
    return undefined;
  };

  const formatTime = (time: string) => {
    // Convert "09:00" to "9:00 AM" format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <Card
      shadow="sm"
      padding="sm"
      radius="md"
      withBorder
      style={{
        backgroundColor: getCardColor(),
        borderColor: getBorderColor(),
        borderWidth: getBorderColor() ? 2 : 1,
        marginBottom: 8,
        minHeight: isWeeklySchedule ? 120 : 100
      }}
    >
      <Box>
        {/* Time Range - Prominent Display */}
        <Text size="sm" fw={700} mb={4}>
          {formatTime(timeslot.startTime)} - {formatTime(timeslot.endTime)}
        </Text>

        {/* Class Name */}
        {timeslot.className && (
          <Text size="md" fw={500} mb={2} c="gray.8">
            {timeslot.className}
          </Text>
        )}

        {/* Location */}
        <Text size="sm" c="gray.6" mb={2}>
          📍 {timeslot.location}
        </Text>

        {/* Capacity/Enrollment Info */}
        {isWeeklySchedule ? (
          <Group gap="xs" mb={8}>
            <Badge
              color={
                enrollmentPercentage >= 100 ? 'red' :
                enrollmentPercentage >= 80 ? 'green' :
                enrollmentPercentage >= 50 ? 'yellow' : 'gray'
              }
              variant="light"
              size="sm"
            >
              {enrolled}/{capacity} enrolled
            </Badge>
            {enrollmentPercentage >= 100 && (
              <Badge color="red" variant="filled" size="xs">
                FULL
              </Badge>
            )}
          </Group>
        ) : (
          <Text size="sm" c="gray.6" mb={8}>
            Max capacity: {timeslot.maxCapacity}
          </Text>
        )}

        {/* Notes (if any) */}
        {timeslot.notes && (
          <Text size="xs" c="gray.5" mb={8} style={{ fontStyle: 'italic' }}>
            Note: {timeslot.notes}
          </Text>
        )}

        {/* Action Buttons */}
        <Group justify="flex-end" gap="xs">
          {onViewDetails && (
            <Tooltip label="View enrollment details">
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                onClick={onViewDetails}
              >
                <IconEye size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {onEdit && (
            <Tooltip label="Edit timeslot">
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                onClick={onEdit}
              >
                <IconEdit size={14} />
              </ActionIcon>
            </Tooltip>
          )}
          {onDelete && (
            <Tooltip label="Delete timeslot">
              <ActionIcon
                variant="light"
                color="red"
                size="sm"
                onClick={onDelete}
              >
                <IconTrash size={14} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>
      </Box>
    </Card>
  );
}