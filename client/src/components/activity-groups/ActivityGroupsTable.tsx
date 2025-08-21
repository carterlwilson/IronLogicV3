'use client';

import {
  Table,
  Card,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  LoadingOverlay,
  Center,
  Button
} from '@mantine/core';
import {
  IconDots,
  IconEdit,
  IconTrash,
  IconPlus
} from '@tabler/icons-react';
import { ActivityGroup } from '../../lib/activity-groups-api';
import { useAuth } from '../../lib/auth-context';

interface ActivityGroupsTableProps {
  activityGroups: ActivityGroup[];
  loading: boolean;
  onEdit?: (group: ActivityGroup) => void;
  onDelete?: (group: ActivityGroup) => void;
  onAdd?: () => void;
}

export function ActivityGroupsTable({
  activityGroups,
  loading,
  onEdit,
  onDelete,
  onAdd
}: ActivityGroupsTableProps) {
  const { user } = useAuth();
  
  // Check if user can perform actions
  const canPerformActions = (onEdit || onDelete) && (user?.userType === 'admin' || user?.userType === 'gym_owner' || user?.userType === 'coach');
  
  if (loading && activityGroups.length === 0) {
    return (
      <Card>
        <LoadingOverlay visible={true} />
        <div style={{ height: 300 }} />
      </Card>
    );
  }
  
  return (
    <Card>
      <LoadingOverlay visible={loading} />
      
      {activityGroups.length === 0 ? (
        <Center py="xl">
          <Stack align="center" gap="sm">
            <Text size="lg" fw={500} c="dimmed">No activity groups found</Text>
            <Text size="sm" c="dimmed">
              Activity groups help organize and categorize workout activities
            </Text>
            {onAdd && (
              <Button
                leftSection={<IconPlus size="1rem" />}
                onClick={onAdd}
                mt="md"
              >
                Create your first activity group
              </Button>
            )}
          </Stack>
        </Center>
      ) : (
        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Description</Table.Th>
              <Table.Th>Activities Count</Table.Th>
              <Table.Th>Scope</Table.Th>
              <Table.Th>Status</Table.Th>
              {canPerformActions && <Table.Th w={60}>Actions</Table.Th>}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {activityGroups.map((group) => (
              <Table.Tr key={group._id}>
                <Table.Td>
                  <div>
                    <Text fw={500} lineClamp={1}>{group.name}</Text>
                    <Text size="xs" c="dimmed">
                      Created: {new Date(group.createdAt).toLocaleDateString()}
                    </Text>
                  </div>
                </Table.Td>
                
                <Table.Td>
                  <Text size="sm" lineClamp={2} c={group.description ? undefined : 'dimmed'}>
                    {group.description || 'No description'}
                  </Text>
                </Table.Td>
                
                <Table.Td>
                  <Badge
                    size="sm"
                    variant="light"
                    color={group.count > 0 ? 'blue' : 'gray'}
                  >
                    {group.count} {group.count === 1 ? 'activity' : 'activities'}
                  </Badge>
                </Table.Td>
                
                <Table.Td>
                  <Badge
                    size="sm"
                    color={group.gymId ? 'blue' : 'purple'}
                    variant="light"
                  >
                    {group.gymId ? 'Gym' : 'Global'}
                  </Badge>
                </Table.Td>
                
                <Table.Td>
                  <Badge
                    size="sm"
                    color={group.isActive ? 'green' : 'red'}
                    variant="dot"
                  >
                    {group.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </Table.Td>
                
                {canPerformActions && (
                  <Table.Td>
                    <Menu shadow="md" width={160}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDots size="1rem" />
                        </ActionIcon>
                      </Menu.Target>
                      
                      <Menu.Dropdown>
                        {onEdit && (
                          <Menu.Item
                            leftSection={<IconEdit size="1rem" />}
                            onClick={() => onEdit(group)}
                          >
                            Edit
                          </Menu.Item>
                        )}
                        {onDelete && (
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={() => onDelete(group)}
                            disabled={group.count > 0}
                          >
                            Delete
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Card>
  );
}