import { Grid, Text, Stack, Group, Card, Button } from '@mantine/core';
import { IconPlus, IconCopy } from '@tabler/icons-react';
import { TimeslotCard } from './TimeslotCard';
import type { ScheduleTemplate, WeeklySchedule, TemplateTimeslot, WeeklyTimeslot } from '../../types/schedules';

interface WeeklyScheduleGridProps {
  template?: ScheduleTemplate;
  weeklySchedule?: WeeklySchedule;
  isTemplate?: boolean;
  onAddTimeslot?: (dayOfWeek: number) => void;
  onEditTimeslot?: (timeslot: TemplateTimeslot | WeeklyTimeslot) => void;
  onEnrollClient?: (timeslot: WeeklyTimeslot) => void;
  onCopyFromTemplate?: () => void;
}

const DAYS_OF_WEEK = [
  { day: 1, name: 'Monday', short: 'MON' },
  { day: 2, name: 'Tuesday', short: 'TUE' },
  { day: 3, name: 'Wednesday', short: 'WED' },
  { day: 4, name: 'Thursday', short: 'THU' },
  { day: 5, name: 'Friday', short: 'FRI' },
  { day: 6, name: 'Saturday', short: 'SAT' },
  { day: 7, name: 'Sunday', short: 'SUN' }
];

export function WeeklyScheduleGrid({
  template,
  weeklySchedule,
  isTemplate = false,
  onAddTimeslot,
  onEditTimeslot,
  onEnrollClient,
  onCopyFromTemplate
}: WeeklyScheduleGridProps) {
  
  const timeslots = isTemplate ? template?.timeslots || [] : weeklySchedule?.timeslots || [];
  
  const getTimeslotsForDay = (dayOfWeek: number) => {
    return timeslots
      .filter(slot => slot.dayOfWeek === dayOfWeek)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  };

  const getAllUniqueTimes = () => {
    const times = new Set<string>();
    timeslots.forEach(slot => times.add(slot.startTime));
    return Array.from(times).sort();
  };

  const uniqueTimes = getAllUniqueTimes();
  const hasTimeslots = timeslots.length > 0;

  return (
    <Stack gap="md">
      {/* Header with action buttons */}
      {!isTemplate && (
        <Card withBorder p="md">
          <Group justify="space-between">
            <div>
              <Text fw={600} size="lg">
                Weekly Schedule
              </Text>
              <Text size="sm" c="dimmed">
                {weeklySchedule?.status && (
                  <span style={{ textTransform: 'capitalize' }}>{weeklySchedule.status}</span>
                )}
              </Text>
            </div>
            <Group gap="sm">
              <Button
                leftSection={<IconCopy size={16} />}
                variant="light"
                onClick={onCopyFromTemplate}
              >
                Copy from Template
              </Button>
              <Button>Publish</Button>
            </Group>
          </Group>
        </Card>
      )}

      {/* Main Schedule Grid */}
      <Card withBorder p="md">
        {hasTimeslots ? (
          <div style={{ overflowX: 'auto' }}>
            {/* Days header */}
            <Grid gutter="md" style={{ minWidth: 800 }}>
              {DAYS_OF_WEEK.map(({ day, name, short }) => (
                <Grid.Col key={day} span={{ base: 12, sm: 6, md: 1.71 }}>
                  <Text fw={600} ta="center" mb="md">
                    {name}
                  </Text>
                  <Text size="sm" c="dimmed" ta="center" mb="lg">
                    {short}
                  </Text>
                </Grid.Col>
              ))}
            </Grid>

            {/* Time-based grid layout */}
            {uniqueTimes.length > 0 ? (
              <Stack gap="lg">
                {uniqueTimes.map(time => (
                  <div key={time}>
                    <Grid gutter="md" style={{ minWidth: 800 }}>
                      {DAYS_OF_WEEK.map(({ day }) => {
                        const dayTimeslots = getTimeslotsForDay(day).filter(slot => slot.startTime === time);
                        const timeslot = dayTimeslots[0]; // Take first timeslot for this time
                        
                        return (
                          <Grid.Col key={`${day}-${time}`} span={{ base: 12, sm: 6, md: 1.71 }}>
                            <TimeslotCard
                              timeslot={timeslot}
                              dayOfWeek={day}
                              onAdd={() => onAddTimeslot?.(day)}
                              onEdit={onEditTimeslot}
                              onEnroll={onEnrollClient}
                              isTemplate={isTemplate}
                            />
                          </Grid.Col>
                        );
                      })}
                    </Grid>
                  </div>
                ))}
              </Stack>
            ) : (
              // Simple day columns if no times defined
              <Grid gutter="md">
                {DAYS_OF_WEEK.map(({ day }) => {
                  const dayTimeslots = getTimeslotsForDay(day);
                  
                  return (
                    <Grid.Col key={day} span={{ base: 12, sm: 6, md: 1.71 }}>
                      <Stack gap="sm">
                        {dayTimeslots.map(timeslot => (
                          <TimeslotCard
                            key={timeslot.timeslotId}
                            timeslot={timeslot}
                            dayOfWeek={day}
                            onEdit={onEditTimeslot}
                            onEnroll={onEnrollClient}
                            isTemplate={isTemplate}
                          />
                        ))}
                        <TimeslotCard
                          dayOfWeek={day}
                          onAdd={() => onAddTimeslot?.(day)}
                        />
                      </Stack>
                    </Grid.Col>
                  );
                })}
              </Grid>
            )}
          </div>
        ) : (
          // Empty state
          <Stack align="center" gap="md" py="xl">
            <Text size="lg" c="dimmed">
              {isTemplate ? 'No timeslots in this template' : 'No schedule for this week'}
            </Text>
            <Text size="sm" c="dimmed" ta="center">
              {isTemplate 
                ? 'Add timeslots to create a schedule template'
                : 'Copy from a template or add timeslots manually'
              }
            </Text>
            {isTemplate && template && (
              <Text size="xs" c="dimmed" ta="center">
                Template: {template.name}
              </Text>
            )}
            <Group gap="sm">
              {!isTemplate && (
                <Button
                  leftSection={<IconCopy size={16} />}
                  variant="light"
                  onClick={onCopyFromTemplate}
                >
                  Copy from Template
                </Button>
              )}
              <Button
                leftSection={<IconPlus size={16} />}
                onClick={() => onAddTimeslot?.(1)} // Default to Monday
              >
                Add First Timeslot
              </Button>
            </Group>
          </Stack>
        )}
      </Card>
    </Stack>
  );
}