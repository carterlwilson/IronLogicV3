'use client';

import { 
  Title, 
  Text, 
  Grid, 
  Card, 
  Group, 
  Badge,
  Stack,
  Button,
  SimpleGrid,
  ThemeIcon,
} from '@mantine/core';
import { 
  IconUsers, 
  IconBuilding, 
  IconBarbell, 
  IconTrophy,
  IconCalendarEvent,
  IconArrowUpRight,
} from '@tabler/icons-react';
import { AppLayout } from '../../components/layout/AppLayout';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../lib/auth-context';

const StatCard = ({ 
  title, 
  value, 
  icon, 
  color, 
  change 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  color: string;
  change?: string;
}) => (
  <Card withBorder p="md" radius="md">
    <Group justify="space-between" mb="xs">
      <Text size="xs" c="dimmed" tt="uppercase" fw={700}>
        {title}
      </Text>
      <ThemeIcon color={color} variant="light" size={30}>
        {icon}
      </ThemeIcon>
    </Group>

    <Group align="flex-end" gap="xs">
      <Text size="xl" fw={700}>
        {value}
      </Text>
      {change && (
        <Badge color={color} variant="light" size="sm">
          {change}
        </Badge>
      )}
    </Group>
  </Card>
);

const getDashboardContent = (userType: string) => {
  switch (userType) {
    case 'admin':
      return {
        title: 'Admin Dashboard',
        subtitle: 'System overview and management',
        stats: [
          {
            title: 'Total Users',
            value: '1,247',
            icon: <IconUsers size="1.2rem" />,
            color: 'blue',
            change: '+12%'
          },
          {
            title: 'Active Gyms',
            value: '42',
            icon: <IconBuilding size="1.2rem" />,
            color: 'green',
            change: '+3%'
          },
          {
            title: 'Total Programs',
            value: '186',
            icon: <IconBarbell size="1.2rem" />,
            color: 'orange',
            change: '+8%'
          },
          {
            title: 'Benchmarks',
            value: '3,721',
            icon: <IconTrophy size="1.2rem" />,
            color: 'purple',
            change: '+15%'
          },
        ]
      };

    case 'gym_owner':
      return {
        title: 'Gym Owner Dashboard',
        subtitle: 'Your gym overview and management',
        stats: [
          {
            title: 'Active Members',
            value: '234',
            icon: <IconUsers size="1.2rem" />,
            color: 'blue',
            change: '+5%'
          },
          {
            title: 'Coaches',
            value: '8',
            icon: <IconUsers size="1.2rem" />,
            color: 'green',
            change: '+1'
          },
          {
            title: 'Programs',
            value: '12',
            icon: <IconBarbell size="1.2rem" />,
            color: 'orange',
            change: '+2'
          },
          {
            title: 'This Week\'s Classes',
            value: '47',
            icon: <IconCalendarEvent size="1.2rem" />,
            color: 'purple',
            change: '95%'
          },
        ]
      };

    case 'coach':
      return {
        title: 'Coach Dashboard',
        subtitle: 'Your coaching overview',
        stats: [
          {
            title: 'My Clients',
            value: '28',
            icon: <IconUsers size="1.2rem" />,
            color: 'blue',
            change: '+3'
          },
          {
            title: 'Programs',
            value: '4',
            icon: <IconBarbell size="1.2rem" />,
            color: 'green',
            change: '+1'
          },
          {
            title: 'This Week\'s Classes',
            value: '12',
            icon: <IconCalendarEvent size="1.2rem" />,
            color: 'orange',
            change: '100%'
          },
          {
            title: 'Client Benchmarks',
            value: '156',
            icon: <IconTrophy size="1.2rem" />,
            color: 'purple',
            change: '+24'
          },
        ]
      };

    default:
      return {
        title: 'Dashboard',
        subtitle: 'Welcome to IronLogic3',
        stats: []
      };
  }
};

function DashboardContent() {
  const { user } = useAuth();
  
  if (!user) return null;
  
  const content = getDashboardContent(user.userType);

  return (
    <AppLayout>
      <Stack gap="lg">
        <div>
          <Title order={2}>{content.title}</Title>
          <Text c="dimmed" size="sm">{content.subtitle}</Text>
        </div>

        {content.stats.length > 0 && (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
            {content.stats.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </SimpleGrid>
        )}

        <Grid>
          <Grid.Col span={{ base: 12, md: 8 }}>
            <Card withBorder p="lg" radius="md">
              <Group justify="space-between" mb="md">
                <Text fw={700}>Recent Activity</Text>
                <Button variant="light" size="xs" rightSection={<IconArrowUpRight size="0.8rem" />}>
                  View All
                </Button>
              </Group>
              
              <Stack gap="sm">
                <Text c="dimmed" size="sm">No recent activity to display</Text>
                <Text c="dimmed" size="xs">
                  Activities will appear here as users interact with the system
                </Text>
              </Stack>
            </Card>
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 4 }}>
            <Card withBorder p="lg" radius="md">
              <Text fw={700} mb="md">Quick Actions</Text>
              <Stack gap="xs">
                {user.userType === 'admin' && (
                  <>
                    <Button variant="light" fullWidth>Create User</Button>
                    <Button variant="light" fullWidth>Add Gym</Button>
                  </>
                )}
                {user.userType === 'gym_owner' && (
                  <>
                    <Button variant="light" fullWidth>Add Coach</Button>
                    <Button variant="light" fullWidth>View Reports</Button>
                  </>
                )}
                {user.userType === 'coach' && (
                  <>
                    <Button variant="light" fullWidth>Create Program</Button>
                    <Button variant="light" fullWidth>Schedule Class</Button>
                  </>
                )}
                <Button variant="outline" fullWidth>Settings</Button>
              </Stack>
            </Card>
          </Grid.Col>
        </Grid>
      </Stack>
    </AppLayout>
  );
}

export default function DashboardPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'gym_owner', 'coach']}>
      <DashboardContent />
    </ProtectedRoute>
  );
}