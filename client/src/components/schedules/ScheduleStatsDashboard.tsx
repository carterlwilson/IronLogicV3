import { useEffect } from 'react';
import {
  Card,
  Grid,
  Group,
  Text,
  Title,
  Stack,
  RingProgress,
  Badge,
  LoadingOverlay,
  Paper,
  ThemeIcon
} from '@mantine/core';
import {
  IconCalendar,
  IconUsers,
  IconClock,
  IconTrendingUp,
  IconChartBar
} from '@tabler/icons-react';
import { useWeeklySchedules } from '../../hooks/useWeeklySchedules';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  color: string;
}

function StatCard({ title, value, description, icon, color }: StatCardProps) {
  return (
    <Card withBorder>
      <Group>
        <ThemeIcon size="xl" radius="md" color={color} variant="light">
          {icon}
        </ThemeIcon>
        <div style={{ flex: 1 }}>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed">
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
          {description && (
            <Text size="xs" c="dimmed">
              {description}
            </Text>
          )}
        </div>
      </Group>
    </Card>
  );
}

interface UtilizationCardProps {
  title: string;
  enrollments: number;
  capacity: number;
  color?: string;
}

function UtilizationCard({ title, enrollments, capacity, color = 'blue' }: UtilizationCardProps) {
  const percentage = capacity > 0 ? Math.round((enrollments / capacity) * 100) : 0;
  
  const getUtilizationColor = (pct: number): string => {
    if (pct >= 90) return 'red';
    if (pct >= 70) return 'orange';
    if (pct >= 50) return 'yellow';
    return 'green';
  };

  const ringColor = getUtilizationColor(percentage);

  return (
    <Card withBorder>
      <Group>
        <RingProgress
          size={80}
          thickness={8}
          sections={[{ value: percentage, color: ringColor }]}
          label={
            <Text ta="center" fw={700} size="sm">
              {percentage}%
            </Text>
          }
        />
        <div style={{ flex: 1 }}>
          <Text size="xs" tt="uppercase" fw={700} c="dimmed">
            {title}
          </Text>
          <Text fw={700} size="lg">
            {enrollments} / {capacity}
          </Text>
          <Badge size="sm" color={ringColor} variant="light">
            {percentage >= 90 ? 'Full' : percentage >= 70 ? 'High' : percentage >= 50 ? 'Medium' : 'Low'} Utilization
          </Badge>
        </div>
      </Group>
    </Card>
  );
}

export function ScheduleStatsDashboard() {
  const { scheduleStats, loading, fetchScheduleStats } = useWeeklySchedules();

  useEffect(() => {
    fetchScheduleStats();
  }, [fetchScheduleStats]);

  if (!scheduleStats) {
    return (
      <Card>
        <LoadingOverlay visible={loading} />
        <Text ta="center" c="dimmed" py="xl">
          Loading schedule statistics...
        </Text>
      </Card>
    );
  }

  const { currentWeek, schedulesByStatus, weeklyUtilization } = scheduleStats;

  // Calculate total schedules
  const totalSchedules = schedulesByStatus.reduce((sum, status) => sum + status.count, 0);

  // Get the most recent utilization data
  const latestUtilization = weeklyUtilization[weeklyUtilization.length - 1];
  const averageUtilization = weeklyUtilization.length > 0 
    ? Math.round(weeklyUtilization.reduce((sum, week) => sum + week.utilization, 0) / weeklyUtilization.length)
    : 0;

  return (
    <Stack gap="md">
      <Title order={3}>Schedule Statistics</Title>
      
      {/* Current Week Stats */}
      <Grid>
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Timeslots"
            value={currentWeek.totalTimeslots}
            description="This week"
            icon={<IconClock size={24} />}
            color="blue"
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Enrollments"
            value={currentWeek.totalEnrollments}
            description="This week"
            icon={<IconUsers size={24} />}
            color="green"
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Schedules"
            value={totalSchedules}
            description="All time"
            icon={<IconCalendar size={24} />}
            color="teal"
          />
        </Grid.Col>
        
        <Grid.Col span={{ base: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Utilization"
            value={`${averageUtilization}%`}
            description="Last 30 days"
            icon={<IconTrendingUp size={24} />}
            color="orange"
          />
        </Grid.Col>
      </Grid>

      {/* Utilization Cards */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <UtilizationCard
            title="Current Week Capacity"
            enrollments={currentWeek.totalEnrollments}
            capacity={currentWeek.totalCapacity}
          />
        </Grid.Col>
        
        {latestUtilization && (
          <Grid.Col span={{ base: 12, md: 6 }}>
            <UtilizationCard
              title="Latest Week Utilization"
              enrollments={latestUtilization.enrollments}
              capacity={latestUtilization.capacity}
            />
          </Grid.Col>
        )}
      </Grid>

      {/* Schedule Status Breakdown */}
      <Card withBorder>
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={4}>Schedules by Status</Title>
            <ThemeIcon size="lg" radius="md" color="violet" variant="light">
              <IconChartBar size={20} />
            </ThemeIcon>
          </Group>
          
          <Grid>
            {schedulesByStatus.map((status) => (
              <Grid.Col key={status._id} span={{ base: 6, sm: 4, md: 2.4 }}>
                <Paper p="md" withBorder ta="center">
                  <Text size="xl" fw={700}>
                    {status.count}
                  </Text>
                  <Text size="sm" tt="capitalize" c="dimmed">
                    {status._id}
                  </Text>
                </Paper>
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      </Card>

      {/* Weekly Utilization Trend */}
      {weeklyUtilization.length > 0 && (
        <Card withBorder>
          <Stack gap="md">
            <Title order={4}>Weekly Utilization Trend</Title>
            
            <Stack gap="sm">
              {weeklyUtilization.slice(-5).map((week) => {
                const percentage = Math.round(week.utilization);
                const getColor = (pct: number): string => {
                  if (pct >= 90) return 'red';
                  if (pct >= 70) return 'orange';
                  if (pct >= 50) return 'yellow';
                  return 'green';
                };

                return (
                  <Group key={week.week} justify="space-between">
                    <Text size="sm">
                      Week of {new Date(week.week).toLocaleDateString()}
                    </Text>
                    <Group gap="sm">
                      <Text size="sm" c="dimmed">
                        {week.enrollments} / {week.capacity}
                      </Text>
                      <Badge color={getColor(percentage)} variant="light">
                        {percentage}%
                      </Badge>
                    </Group>
                  </Group>
                );
              })}
            </Stack>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}