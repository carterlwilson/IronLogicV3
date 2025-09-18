import { Box, Grid, Text, Group, Badge, Button, Stack } from '@mantine/core';
import { IconCalendar, IconUsers, IconClock } from '@tabler/icons-react';
import { DayColumn } from './DayColumn';
import type { WeeklySchedule, WeeklyTimeslot } from '../../types/schedules';

interface WeeklyScheduleCalendarViewProps {
  schedule: WeeklySchedule;
  onViewTimeslot: (timeslot: WeeklyTimeslot) => void;
  onEditSchedule?: () => void;
  onAddTimeslot?: (dayOfWeek: number) => void;
  onEditTimeslot?: (timeslot: WeeklyTimeslot) => void;
  onDeleteTimeslot?: (timeslot: WeeklyTimeslot) => void;
  canManageTimeslots?: boolean;
  loading?: boolean;
}

export function WeeklyScheduleCalendarView({
  schedule,
  onViewTimeslot,
  onEditSchedule,
  onAddTimeslot,
  onEditTimeslot,
  onDeleteTimeslot,
  canManageTimeslots = false,
  loading = false
}: WeeklyScheduleCalendarViewProps) {
  // Group timeslots by day of week (1=Monday, 7=Sunday)
  const timeslotsByDay = schedule.timeslots.reduce((acc, timeslot) => {
    const day = timeslot.dayOfWeek;
    if (!acc[day]) acc[day] = [];
    acc[day].push(timeslot);
    return acc;
  }, {} as Record<number, WeeklyTimeslot[]>);

  // Calculate enrollment data for each timeslot
  const enrollmentData = schedule.timeslots.reduce((acc, timeslot) => {
    const enrolledCount = timeslot.enrollments?.filter(e => e.status === 'enrolled').length || 0;
    acc[timeslot.timeslotId] = {
      enrolled: enrolledCount,
      capacity: timeslot.maxCapacity
    };
    return acc;
  }, {} as Record<string, { enrolled: number; capacity: number }>);

  // Calculate overall stats
  const totalEnrolled = Object.values(enrollmentData).reduce((sum, data) => sum + data.enrolled, 0);
  const totalCapacity = Object.values(enrollmentData).reduce((sum, data) => sum + data.capacity, 0);
  const utilizationPercentage = totalCapacity > 0 ? (totalEnrolled / totalCapacity) * 100 : 0;

  const handleTimeslotAction = (action: 'edit' | 'delete' | 'view', timeslot: WeeklyTimeslot) => {
    if (action === 'view') {
      onViewTimeslot(timeslot);
    } else if (action === 'edit' && onEditTimeslot) {
      onEditTimeslot(timeslot);
    } else if (action === 'delete' && onDeleteTimeslot) {
      onDeleteTimeslot(timeslot);
    }
  };

  const handleAddTimeslotForDay = (dayOfWeek: number) => {
    if (onAddTimeslot) {
      onAddTimeslot(dayOfWeek);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'gray';
      case 'published': return 'blue';
      case 'active': return 'green';
      case 'completed': return 'teal';
      case 'cancelled': return 'red';
      default: return 'gray';
    }
  };


  return (
    <Box>
      <Stack gap="md">
        {/* Schedule Header */}
        <Box 
          p="md" 
          style={{ 
            backgroundColor: '#f8f9fa', 
            borderRadius: 8, 
            border: '1px solid #e9ecef' 
          }}
        >
          <Group justify="space-between" align="flex-start">
            <Box>
              <Group gap="sm" mb="xs">
                <IconCalendar size={20} />
                <Text size="lg" fw={600}>
                  Weekly Schedule
                </Text>
                <Badge color={getStatusColor(schedule.status)} variant="light">
                  {schedule.status.toUpperCase()}
                </Badge>
              </Group>
              
              <Group gap="xl">
                <Group gap="xs">
                  <IconUsers size={16} />
                  <Text size="sm" c="gray.7">
                    {totalEnrolled}/{totalCapacity} enrolled ({utilizationPercentage.toFixed(0)}% utilization)
                  </Text>
                </Group>
                
                <Group gap="xs">
                  <IconClock size={16} />
                  <Text size="sm" c="gray.7">
                    {schedule.timeslots.length} classes scheduled
                  </Text>
                </Group>
              </Group>
              
              {schedule.notes && (
                <Text size="sm" c="gray.6" mt="xs" style={{ fontStyle: 'italic' }}>
                  {schedule.notes}
                </Text>
              )}
            </Box>
            
            {onEditSchedule && (
              <Button variant="light" size="sm" onClick={onEditSchedule}>
                Edit Schedule
              </Button>
            )}
          </Group>
        </Box>

        {/* Weekly Calendar Grid */}
        <Box>
          <Grid gutter="md">
            {/* Monday through Sunday (1-7) */}
            {[1, 2, 3, 4, 5, 6, 7].map((dayOfWeek) => (
              <Grid.Col key={dayOfWeek} span={{ base: 12, sm: 6, md: 4, lg: 12/7 }}>
                <DayColumn
                  dayOfWeek={dayOfWeek}
                  timeslots={timeslotsByDay[dayOfWeek] || []}
                  mode="schedule"
                  onAddTimeslot={() => handleAddTimeslotForDay(dayOfWeek)}
                  onTimeslotAction={handleTimeslotAction}
                  enrollmentData={enrollmentData}
                  canManageTimeslots={canManageTimeslots}
                />
              </Grid.Col>
            ))}
          </Grid>
        </Box>

        {/* Summary Stats */}
        <Box 
          p="md" 
          style={{ 
            backgroundColor: '#f8f9fa', 
            borderRadius: 8, 
            border: '1px solid #e9ecef' 
          }}
        >
          <Text size="sm" fw={500} mb="xs">Weekly Summary</Text>
          <Group gap="xl">
            <Text size="sm" c="gray.7">
              <strong>{schedule.timeslots.length}</strong> total classes
            </Text>
            <Text size="sm" c="gray.7">
              <strong>{totalCapacity}</strong> total capacity
            </Text>
            <Text size="sm" c="gray.7">
              <strong>{totalEnrolled}</strong> total enrollments
            </Text>
            <Text size="sm" c="gray.7">
              <strong>{utilizationPercentage.toFixed(1)}%</strong> utilization
            </Text>
          </Group>
        </Box>
      </Stack>
    </Box>
  );
}