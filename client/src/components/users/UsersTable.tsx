'use client';

import { useState, useEffect } from 'react';
import {
  Table,
  Group,
  Text,
  ActionIcon,
  Badge,
  Menu,
  TextInput,
  Select,
  Button,
  Pagination,
  Stack,
  Paper,
  Checkbox,
  Tooltip,
  Flex,
  Box
} from '@mantine/core';
import {
  IconSearch,
  IconEdit,
  IconTrash,
  IconDots,
  IconKey,
  IconEye,
  IconPlus,
  IconRefresh,
  IconFilter
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { type User } from '../../types/auth';

interface UsersTableProps {
  users: User[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  onEditUser: (user: User) => void;
  onDeleteUser: (user: User) => void;
  onResetPassword: (user: User) => void;
  onViewUser: (user: User) => void;
  onAddUser: () => void;
  onSearch: (filters: any) => void;
  onPageChange: (page: number) => void;
  gymOptions: { value: string; label: string }[];
}

const getUserTypeBadge = (userType: string) => {
  const colors = {
    admin: 'red',
    gym_owner: 'blue',
    coach: 'green',
    client: 'orange'
  };
  
  const labels = {
    admin: 'Admin',
    gym_owner: 'Gym Owner',
    coach: 'Coach',
    client: 'Client'
  };

  return (
    <Badge color={colors[userType as keyof typeof colors]} variant="light" size="sm">
      {labels[userType as keyof typeof labels]}
    </Badge>
  );
};

export function UsersTable({
  users,
  loading,
  pagination,
  onEditUser,
  onDeleteUser,
  onResetPassword,
  onViewUser,
  onAddUser,
  onSearch,
  onPageChange,
  gymOptions
}: UsersTableProps) {
  const [search, setSearch] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState<string>('');
  const [gymFilter, setGymFilter] = useState<string>('');
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [debouncedSearch] = useDebouncedValue(search, 300);

  // Trigger search when filters change
  useEffect(() => {
    const filters: any = {};
    
    if (debouncedSearch) filters.search = debouncedSearch;
    if (userTypeFilter) filters.userType = userTypeFilter;
    if (gymFilter) filters.gymId = gymFilter;
    
    onSearch(filters);
  }, [debouncedSearch, userTypeFilter, gymFilter, onSearch]);

  const handlePageChange = (page: number) => {
    onPageChange(page);
  };

  const handleSelectAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set((users || []).map(user => user._id)));
    }
  };

  const handleSelectUser = (userId: string) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const clearFilters = () => {
    setSearch('');
    setUserTypeFilter('');
    setGymFilter('');
  };

  const hasFilters = search || userTypeFilter || gymFilter;

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={600}>User Management</Text>
          <Text c="dimmed" size="sm">
            Manage users, permissions, and access across your system
          </Text>
        </div>
        <Group>
          <Button
            leftSection={<IconRefresh size="1rem" />}
            variant="light"
            onClick={() => onSearch({})}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={onAddUser}
          >
            Add User
          </Button>
        </Group>
      </Group>

      {/* Filters */}
      <Paper p="md" withBorder>
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder="Search users..."
            leftSection={<IconSearch size="1rem" />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ minWidth: 250 }}
          />
          
          <Select
            placeholder="User Type"
            value={userTypeFilter}
            onChange={(value) => setUserTypeFilter(value || '')}
            data={[
              { value: '', label: 'All Types' },
              { value: 'admin', label: 'Admin' },
              { value: 'gym_owner', label: 'Gym Owner' },
              { value: 'coach', label: 'Coach' },
              { value: 'client', label: 'Client' }
            ]}
            clearable
            style={{ minWidth: 150 }}
          />

          <Select
            placeholder="Gym"
            value={gymFilter}
            onChange={(value) => setGymFilter(value || '')}
            data={[
              { value: '', label: 'All Gyms' },
              ...gymOptions
            ]}
            clearable
            style={{ minWidth: 200 }}
          />

          {hasFilters && (
            <Button
              variant="light"
              leftSection={<IconFilter size="1rem" />}
              onClick={clearFilters}
            >
              Clear Filters
            </Button>
          )}
        </Group>
      </Paper>

      {/* Bulk Actions */}
      {selectedUsers.size > 0 && (
        <Paper p="md" withBorder bg="blue.0">
          <Group justify="space-between">
            <Text size="sm" fw={500}>
              {selectedUsers.size} user{selectedUsers.size > 1 ? 's' : ''} selected
            </Text>
            <Group gap="xs">
              <Button size="xs" variant="light" color="red">
                Delete Selected
              </Button>
              <Button size="xs" variant="light">
                Export Selected
              </Button>
            </Group>
          </Group>
        </Paper>
      )}

      {/* Table */}
      <Paper withBorder style={{ overflow: 'hidden' }}>
        <Box style={{ overflowX: 'auto' }}>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>
                  <Checkbox
                    checked={users.length > 0 && selectedUsers.size === users.length}
                    indeterminate={selectedUsers.size > 0 && selectedUsers.size < users.length}
                    onChange={handleSelectAll}
                  />
                </Table.Th>
                <Table.Th>Name</Table.Th>
                <Table.Th>Email</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Gym</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Created</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {(users || []).map((user) => (
                <Table.Tr key={user._id}>
                  <Table.Td>
                    <Checkbox
                      checked={selectedUsers.has(user._id)}
                      onChange={() => handleSelectUser(user._id)}
                    />
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{user.name}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text c="dimmed">{user.email}</Text>
                  </Table.Td>
                  <Table.Td>
                    {getUserTypeBadge(user.userType)}
                  </Table.Td>
                  <Table.Td>
                    {user.gymId ? (
                      <Text size="sm">{user.gymId.name}</Text>
                    ) : (
                      <Text size="sm" c="dimmed">No gym</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge 
                      color={user.isActive ? 'green' : 'red'}
                      variant="light"
                      size="sm"
                    >
                      {user.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" c="dimmed">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Group gap="xs">
                      <Tooltip label="View Details">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => onViewUser(user)}
                        >
                          <IconEye size="1rem" />
                        </ActionIcon>
                      </Tooltip>
                      
                      <Tooltip label="Edit User">
                        <ActionIcon
                          variant="subtle"
                          color="blue"
                          onClick={() => onEditUser(user)}
                        >
                          <IconEdit size="1rem" />
                        </ActionIcon>
                      </Tooltip>

                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDots size="1rem" />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconKey size="0.9rem" />}
                            onClick={() => onResetPassword(user)}
                          >
                            Reset Password
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size="0.9rem" />}
                            color="red"
                            onClick={() => onDeleteUser(user)}
                          >
                            Delete User
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </Box>

        {users.length === 0 && !loading && (
          <Flex justify="center" align="center" p="xl" direction="column" gap="md">
            <Text c="dimmed" size="lg">No users found</Text>
            <Text c="dimmed" size="sm">
              {hasFilters ? 'Try adjusting your filters' : 'Get started by adding your first user'}
            </Text>
            {!hasFilters && (
              <Button onClick={onAddUser} leftSection={<IconPlus size="1rem" />}>
                Add First User
              </Button>
            )}
          </Flex>
        )}
      </Paper>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} users
          </Text>
          <Pagination
            total={pagination.totalPages}
            value={pagination.page}
            onChange={handlePageChange}
            size="sm"
          />
        </Group>
      )}
    </Stack>
  );
}