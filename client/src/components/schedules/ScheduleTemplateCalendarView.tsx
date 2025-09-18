import { useState } from 'react';
import { Box, Grid, Alert, Stack, Text, LoadingOverlay } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { DayColumn } from './DayColumn';
import { TimeslotModal } from './TimeslotModal';
import type { ScheduleTemplate, TemplateTimeslot } from '../../types/schedules';

interface ScheduleTemplateCalendarViewProps {
  template: ScheduleTemplate;
  onAddTimeslot: (timeslotData: Omit<TemplateTimeslot, 'timeslotId'>) => void;
  onEditTimeslot: (timeslotId: string, timeslotData: Omit<TemplateTimeslot, 'timeslotId'>) => void;
  onDeleteTimeslot: (timeslotId: string) => void;
  loading?: boolean;
  gymId: string;
}

export function ScheduleTemplateCalendarView({
  template,
  onAddTimeslot,
  onEditTimeslot,
  onDeleteTimeslot,
  loading = false,
  gymId
}: ScheduleTemplateCalendarViewProps) {
  const [timeslotModalOpened, setTimeslotModalOpened] = useState(false);
  const [selectedDayOfWeek, setSelectedDayOfWeek] = useState<number>(1);
  const [editingTimeslot, setEditingTimeslot] = useState<TemplateTimeslot | null>(null);

  // Group timeslots by day of week (1=Monday, 7=Sunday)
  const timeslotsByDay = template.timeslots.reduce((acc, timeslot) => {
    const day = timeslot.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(timeslot);
    return acc;
  }, {} as Record<number, TemplateTimeslot[]>);

  // Detect conflicts
  const conflicts = detectConflicts(template.timeslots);

  const handleAddTimeslot = (dayOfWeek: number) => {
    setSelectedDayOfWeek(dayOfWeek);
    setEditingTimeslot(null);
    setTimeslotModalOpened(true);
  };

  const handleEditTimeslot = (timeslot: TemplateTimeslot) => {
    setEditingTimeslot(timeslot);
    setSelectedDayOfWeek(timeslot.dayOfWeek);
    setTimeslotModalOpened(true);
  };

  const handleDeleteTimeslot = (timeslot: TemplateTimeslot) => {
    if (window.confirm('Are you sure you want to delete this timeslot?')) {
      onDeleteTimeslot(timeslot.timeslotId);
    }
  };

  const handleTimeslotSave = (timeslotData: Omit<TemplateTimeslot, 'timeslotId'>) => {
    if (editingTimeslot) {
      onEditTimeslot(editingTimeslot.timeslotId, timeslotData);
    } else {
      onAddTimeslot(timeslotData);
    }
    setTimeslotModalOpened(false);
    setEditingTimeslot(null);
  };

  const handleTimeslotAction = (action: 'edit' | 'delete' | 'view', timeslot: TemplateTimeslot) => {
    switch (action) {
      case 'edit':
        handleEditTimeslot(timeslot);
        break;
      case 'delete':
        handleDeleteTimeslot(timeslot);
        break;
    }
  };

  return (
    <Box pos="relative">
      <LoadingOverlay visible={loading} />
      
      <Stack gap="md">
        {/* Conflict Warnings */}
        {conflicts.length > 0 && (
          <Alert icon={<IconAlertCircle size={16} />} color="orange" title="Schedule Conflicts Detected">
            <Stack gap="xs">
              {conflicts.map((conflict, index) => (
                <Text key={index} size="sm">{conflict}</Text>
              ))}
            </Stack>
          </Alert>
        )}

        {/* Weekly Calendar Grid */}
        <Box>
          <Grid gutter="md">
            {/* Monday through Sunday (1-7) */}
            {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => (
              <Grid.Col key={dayOfWeek} span={{ base: 12, sm: 6, md: 4, lg: 12/7 }}>
                <DayColumn
                  dayOfWeek={dayOfWeek}
                  timeslots={timeslotsByDay[dayOfWeek] || []}
                  mode="template"
                  onAddTimeslot={() => handleAddTimeslot(dayOfWeek)}
                  onTimeslotAction={handleTimeslotAction}
                />
              </Grid.Col>
            ))}
          </Grid>
        </Box>
      </Stack>

      {/* Timeslot Modal */}
      <TimeslotModal
        opened={timeslotModalOpened}
        onClose={() => {
          setTimeslotModalOpened(false);
          setEditingTimeslot(null);
        }}
        onSave={handleTimeslotSave}
        timeslot={editingTimeslot}
        dayOfWeek={selectedDayOfWeek}
        gymId={gymId}
      />
    </Box>
  );
}

// Helper function to detect scheduling conflicts
function detectConflicts(timeslots: TemplateTimeslot[]): string[] {
  const conflicts: string[] = [];
  const dayNames = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (let i = 0; i < timeslots.length; i++) {
    for (let j = i + 1; j < timeslots.length; j++) {
      const slot1 = timeslots[i];
      const slot2 = timeslots[j];

      // Check for location conflicts on same day
      if (slot1.dayOfWeek === slot2.dayOfWeek && 
          slot1.location === slot2.location && 
          slot1.location.trim() !== '') {
        
        const start1 = new Date(`2000-01-01T${slot1.startTime}:00`);
        const end1 = new Date(`2000-01-01T${slot1.endTime}:00`);
        const start2 = new Date(`2000-01-01T${slot2.startTime}:00`);
        const end2 = new Date(`2000-01-01T${slot2.endTime}:00`);
        
        if (start1 < end2 && start2 < end1) {
          conflicts.push(
            `⚠️ Location conflict on ${dayNames[slot1.dayOfWeek]}: "${slot1.location}" is double-booked from ${slot1.startTime}-${slot1.endTime} and ${slot2.startTime}-${slot2.endTime}`
          );
        }
      }
    }
  }

  return conflicts;
}