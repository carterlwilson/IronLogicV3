import { Box, Text, Button, Stack, Alert } from '@mantine/core';
import { IconPlus, IconCalendar } from '@tabler/icons-react';
import { TimeslotCard } from './TimeslotCard';
import type { TemplateTimeslot, WeeklyTimeslot } from '../../types/schedules';

interface DayColumnProps {
  dayOfWeek: number;
  timeslots: (TemplateTimeslot | WeeklyTimeslot)[];
  mode: 'template' | 'schedule';
  onAddTimeslot?: () => void;
  onTimeslotAction: (action: 'edit' | 'delete' | 'view', timeslot: TemplateTimeslot | WeeklyTimeslot) => void;
  enrollmentData?: Record<string, { enrolled: number; capacity: number }>;
  canManageTimeslots?: boolean; // Permission to add/edit/delete timeslots
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const DAY_NAMES_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function DayColumn({
  dayOfWeek,
  timeslots,
  mode,
  onAddTimeslot,
  onTimeslotAction,
  enrollmentData,
  canManageTimeslots = false
}: DayColumnProps) {
  const isTemplate = mode === 'template';
  const dayName = DAY_NAMES[dayOfWeek];
  const dayNameFull = DAY_NAMES_FULL[dayOfWeek];

  // Sort timeslots by start time
  const sortedTimeslots = [...timeslots].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });

  const handleTimeslotEdit = (timeslot: TemplateTimeslot | WeeklyTimeslot) => {
    onTimeslotAction('edit', timeslot);
  };

  const handleTimeslotDelete = (timeslot: TemplateTimeslot | WeeklyTimeslot) => {
    onTimeslotAction('delete', timeslot);
  };

  const handleTimeslotView = (timeslot: TemplateTimeslot | WeeklyTimeslot) => {
    onTimeslotAction('view', timeslot);
  };

  const getEnrollmentDataForTimeslot = (timeslot: TemplateTimeslot | WeeklyTimeslot) => {
    if (!enrollmentData || !('timeslotId' in timeslot)) return undefined;
    
    const weeklyTimeslot = timeslot as WeeklyTimeslot;
    return enrollmentData[weeklyTimeslot.timeslotId];
  };

  return (
    <Box
      style={{
        minHeight: 400,
        border: '1px solid #e9ecef',
        borderRadius: 8,
        padding: 16,
        backgroundColor: '#fafafa'
      }}
    >
      {/* Day Header */}
      <Box mb={16}>
        <Text size="lg" fw={700} ta="center" mb={4}>
          {dayName}
        </Text>
        <Text size="xs" c="gray.6" ta="center">
          {dayNameFull}
        </Text>
      </Box>

      {/* Add Timeslot Button */}
      {canManageTimeslots && onAddTimeslot && (
        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          fullWidth
          mb={16}
          size="sm"
          onClick={onAddTimeslot}
        >
          Add Timeslot
        </Button>
      )}

      {/* Timeslots */}
      <Stack gap={0}>
        {sortedTimeslots.length > 0 ? (
          sortedTimeslots.map((timeslot) => (
            <TimeslotCard
              key={'timeslotId' in timeslot ? timeslot.timeslotId : `${timeslot.dayOfWeek}-${timeslot.startTime}-${timeslot.endTime}`}
              timeslot={timeslot}
              mode={mode}
              enrollmentData={getEnrollmentDataForTimeslot(timeslot)}
              onEdit={canManageTimeslots ? () => handleTimeslotEdit(timeslot) : undefined}
              onDelete={canManageTimeslots ? () => handleTimeslotDelete(timeslot) : undefined}
              onViewDetails={!isTemplate ? () => handleTimeslotView(timeslot) : undefined}
            />
          ))
        ) : (
          <Alert
            icon={<IconCalendar size={16} />}
            color="gray"
            variant="light"
            style={{
              textAlign: 'center',
              border: '2px dashed #ced4da',
              backgroundColor: 'transparent'
            }}
          >
            <Text size="sm" c="gray.6">
              {isTemplate ? 'No timeslots scheduled' : 'No classes today'}
            </Text>
            {canManageTimeslots && onAddTimeslot && (
              <Button
                variant="subtle"
                size="xs"
                mt={8}
                onClick={onAddTimeslot}
                leftSection={<IconPlus size={14} />}
              >
                Add first timeslot
              </Button>
            )}
          </Alert>
        )}
      </Stack>
    </Box>
  );
}