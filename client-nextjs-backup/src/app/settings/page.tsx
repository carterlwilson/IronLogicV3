'use client';

import { Title, Text, Stack, Card, Switch, Button, Group, Divider } from '@mantine/core';
import { AppLayout } from '../../components/layout/AppLayout';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';
import { useAuth } from '../../lib/auth-context';

function SettingsContent() {
  const { user } = useAuth();

  return (
    <AppLayout>
      <Stack gap="lg">
        <div>
          <Title order={2}>Settings</Title>
          <Text c="dimmed">Manage your account preferences and application settings.</Text>
        </div>

        <Card withBorder p="lg" radius="md">
          <Text fw={700} mb="md">Account Settings</Text>
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>Email Notifications</Text>
                <Text size="xs" c="dimmed">Receive notifications about schedule changes</Text>
              </div>
              <Switch defaultChecked />
            </Group>

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>Push Notifications</Text>
                <Text size="xs" c="dimmed">Receive mobile push notifications</Text>
              </div>
              <Switch />
            </Group>

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>Marketing Communications</Text>
                <Text size="xs" c="dimmed">Receive updates about new features</Text>
              </div>
              <Switch />
            </Group>
          </Stack>
        </Card>

        <Card withBorder p="lg" radius="md">
          <Text fw={700} mb="md">Appearance</Text>
          <Stack gap="md">
            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>Dark Mode</Text>
                <Text size="xs" c="dimmed">Toggle dark theme</Text>
              </div>
              <Switch />
            </Group>

            <Group justify="space-between">
              <div>
                <Text size="sm" fw={500}>Compact View</Text>
                <Text size="xs" c="dimmed">Use compact layout for tables</Text>
              </div>
              <Switch />
            </Group>
          </Stack>
        </Card>

        {(user?.userType === 'admin' || user?.userType === 'gym_owner') && (
          <Card withBorder p="lg" radius="md">
            <Text fw={700} mb="md">Admin Settings</Text>
            <Stack gap="md">
              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={500}>Advanced Features</Text>
                  <Text size="xs" c="dimmed">Enable experimental features</Text>
                </div>
                <Switch />
              </Group>

              <Group justify="space-between">
                <div>
                  <Text size="sm" fw={500}>Debug Mode</Text>
                  <Text size="xs" c="dimmed">Show additional debugging information</Text>
                </div>
                <Switch />
              </Group>
            </Stack>
          </Card>
        )}

        <Card withBorder p="lg" radius="md">
          <Text fw={700} mb="md" c="red">Danger Zone</Text>
          <Stack gap="md">
            <div>
              <Text size="sm" fw={500} mb="xs">Change Password</Text>
              <Button variant="light" color="yellow">
                Update Password
              </Button>
            </div>

            <Divider />

            <div>
              <Text size="sm" fw={500} mb="xs">Delete Account</Text>
              <Text size="xs" c="dimmed" mb="sm">
                Permanently delete your account and all associated data
              </Text>
              <Button variant="light" color="red">
                Delete Account
              </Button>
            </div>
          </Stack>
        </Card>

        <Group justify="flex-end">
          <Button variant="outline">Cancel</Button>
          <Button>Save Changes</Button>
        </Group>
      </Stack>
    </AppLayout>
  );
}

export default function SettingsPage() {
  return (
    <ProtectedRoute allowedRoles={['admin', 'gym_owner', 'coach']}>
      <SettingsContent />
    </ProtectedRoute>
  );
}