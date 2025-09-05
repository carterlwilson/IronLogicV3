'use client';

import { 
  Container,
  Title, 
  Text, 
  Card, 
  Group, 
  Stack,
  Button,
  SimpleGrid,
  Avatar,
  Badge,
  ActionIcon,
  Menu,
} from '@mantine/core';
import { 
  IconBarbell, 
  IconTrophy,
  IconCalendarEvent,
  IconUser,
  IconSettings,
  IconLogout,
  IconDots,
  IconChevronRight,
} from '@tabler/icons-react';
import { ClientOnly } from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../lib/auth-context';
import { useRouter } from 'next/navigation';

function MobileContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    router.push('/auth/login');
  };

  return (
    <Container size="sm" p="md">
      <Stack gap="lg">
        {/* Header */}
        <Card withBorder p="lg" radius="md">
          <Group justify="space-between">
            <Group>
              <Avatar size={50} color="blue">
                {user.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Text fw={700} size="lg">{user.name}</Text>
                <Badge size="sm" color="orange" variant="light">
                  Client
                </Badge>
              </div>
            </Group>
            
            <Menu shadow="md" width={200} position="bottom-end">
              <Menu.Target>
                <ActionIcon variant="light" size="lg">
                  <IconDots size="1.2rem" />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item leftSection={<IconUser size="1rem" />}>
                  Profile
                </Menu.Item>
                <Menu.Item leftSection={<IconSettings size="1rem" />}>
                  Settings
                </Menu.Item>
                <Menu.Divider />
                <Menu.Item
                  leftSection={<IconLogout size="1rem" />}
                  color="red"
                  onClick={handleLogout}
                >
                  Logout
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Card>

        <Title order={2} ta="center">Mobile App</Title>
        <Text c="dimmed" ta="center" mb="lg">
          Welcome to your personalized fitness experience
        </Text>

        {/* Quick Actions */}
        <SimpleGrid cols={2}>
          <Card withBorder p="md" radius="md" style={{ cursor: 'pointer' }}>
            <Stack align="center" gap="xs">
              <IconBarbell size="2rem" color="var(--mantine-color-blue-6)" />
              <Text fw={600} size="sm">My Program</Text>
              <Text c="dimmed" size="xs" ta="center">
                View current workout program
              </Text>
            </Stack>
          </Card>

          <Card withBorder p="md" radius="md" style={{ cursor: 'pointer' }}>
            <Stack align="center" gap="xs">
              <IconCalendarEvent size="2rem" color="var(--mantine-color-green-6)" />
              <Text fw={600} size="sm">Schedule</Text>
              <Text c="dimmed" size="xs" ta="center">
                Book and manage classes
              </Text>
            </Stack>
          </Card>

          <Card withBorder p="md" radius="md" style={{ cursor: 'pointer' }}>
            <Stack align="center" gap="xs">
              <IconTrophy size="2rem" color="var(--mantine-color-orange-6)" />
              <Text fw={600} size="sm">Benchmarks</Text>
              <Text c="dimmed" size="xs" ta="center">
                Track your progress
              </Text>
            </Stack>
          </Card>

          <Card withBorder p="md" radius="md" style={{ cursor: 'pointer' }}>
            <Stack align="center" gap="xs">
              <IconUser size="2rem" color="var(--mantine-color-purple-6)" />
              <Text fw={600} size="sm">Profile</Text>
              <Text c="dimmed" size="xs" ta="center">
                Update your information
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Recent Activity */}
        <Card withBorder p="lg" radius="md">
          <Text fw={700} mb="md">Recent Activity</Text>
          <Stack gap="sm">
            <Group justify="space-between" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)' }}>
              <div>
                <Text size="sm" fw={500}>Workout Completed</Text>
                <Text size="xs" c="dimmed">Upper Body Strength - Day 1</Text>
              </div>
              <Text size="xs" c="dimmed">2 days ago</Text>
            </Group>
            
            <Group justify="space-between" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)' }}>
              <div>
                <Text size="sm" fw={500}>Benchmark Updated</Text>
                <Text size="xs" c="dimmed">Deadlift 1RM: 315 lbs</Text>
              </div>
              <Text size="xs" c="dimmed">5 days ago</Text>
            </Group>
            
            <Group justify="space-between" p="sm" style={{ backgroundColor: 'var(--mantine-color-gray-0)', borderRadius: 'var(--mantine-radius-sm)' }}>
              <div>
                <Text size="sm" fw={500}>Class Booked</Text>
                <Text size="xs" c="dimmed">CrossFit WOD with Coach Sarah</Text>
              </div>
              <Text size="xs" c="dimmed">1 week ago</Text>
            </Group>
          </Stack>
        </Card>

        {/* PWA Install Prompt */}
        <Card withBorder p="lg" radius="md" bg="blue.0">
          <Stack gap="sm">
            <Text fw={700} c="blue">Install Mobile App</Text>
            <Text size="sm" c="dimmed">
              Install the IronLogic3 app on your device for the best mobile experience
            </Text>
            <Button variant="light" color="blue" rightSection={<IconChevronRight size="1rem" />}>
              Install App
            </Button>
          </Stack>
        </Card>

        {/* Footer */}
        <Text size="xs" c="dimmed" ta="center" mt="xl">
          IronLogic3 Mobile • Version 1.0.0
        </Text>
      </Stack>
    </Container>
  );
}

export default function MobilePage() {
  return (
    <ClientOnly>
      <MobileContent />
    </ClientOnly>
  );
}