import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Stack,
  Group,
  Title,
  Text,
  Card,
  Button,
  TextInput,
  Select,
  Table,
  Pagination,
  Badge,
  Avatar,
  Menu,
  ActionIcon,
  ScrollArea,
  Loader,
  Center,
  Alert
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconFilter,
  IconX,
  IconUser,
  IconDots,
  IconEye,
  IconEdit,
  IconUserCheck,
  IconUserX,
  IconTrophy,
  IconAlertCircle
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { AppLayout } from '../../components/layout/AppLayout';
import { useClients } from '../../hooks/useClients';
import { useAuth } from '../../lib/auth-context';
import { ClientCreateModal, ClientEditModal, ClientViewModal } from '../../components/clients';
import type { Client, UpdateClientData } from '../../lib/clients-api';
import { clientsApi } from '../../lib/clients-api';
import { usersApi, gymsApi, type CreateUserData } from '../../lib/users-api';

export function ClientsPage() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // Clients hook
  const {
    clients: hookClients,
    loading,
    error,
    pagination,
    fetchClients,
    refreshClients,
    searchClients,
    filterClients,
    clearFilters
  } = useClients();

  // For optimistic updates in edit modal
  const [clients, setClients] = useState<Client[]>([]);

  // Update local clients state when hook clients change
  useEffect(() => {
    setClients(hookClients);
  }, [hookClients]);

  // Search and filter state
  const [searchValue, setSearchValue] = useState('');
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>('');
  const [membershipTypeFilter, setMembershipTypeFilter] = useState<string>('');

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Gym options for create modal
  const [gymOptions, setGymOptions] = useState<{ value: string; label: string }[]>([]);

  // Check permissions - only gym owners and admins can access
  const canManageClients = user?.userType === 'gym_owner' || user?.userType === 'admin';

  // Load clients and gym options on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        // Load clients
        const params = {
          page: 1,
          limit: 20
        };
        await fetchClients(params);

        // Load gym options for create modal
        const gymsResponse = await gymsApi.getGyms();
        if (gymsResponse.success) {
          const options = gymsResponse.data.gyms.map(gym => ({
            value: gym._id,
            label: gym.name
          }));
          setGymOptions(options);
        }
      } catch {
        notifications.show({
          title: 'Error',
          message: 'Failed to load data',
          color: 'red',
        });
      }
    };

    if (canManageClients) {
      loadData();
    }
  }, [fetchClients, canManageClients]);

  // Error handling
  useEffect(() => {
    if (error) {
      notifications.show({
        title: 'Error',
        message: error,
        color: 'red',
      });
    }
  }, [error]);

  // Search handler with debouncing
  const handleSearch = useCallback((value: string) => {
    setSearchValue(value);
    searchClients(value);
  }, [searchClients]);

  // Filter handlers
  const handleMembershipStatusFilter = useCallback((value: string) => {
    setMembershipStatusFilter(value);
    filterClients({
      membershipStatus: value || undefined,
      membershipType: membershipTypeFilter || undefined
    });
  }, [filterClients, membershipTypeFilter]);

  const handleMembershipTypeFilter = useCallback((value: string) => {
    setMembershipTypeFilter(value);
    filterClients({
      membershipStatus: membershipStatusFilter || undefined,
      membershipType: value || undefined
    });
  }, [filterClients, membershipStatusFilter]);

  const handleClearFilters = useCallback(() => {
    setSearchValue('');
    setMembershipStatusFilter('');
    setMembershipTypeFilter('');
    clearFilters();
  }, [clearFilters]);

  // Client action handlers
  const handleAddClient = () => {
    setSelectedClient(null);
    setCreateModalOpen(true);
  };

  const handleViewClient = (client: Client) => {
    setSelectedClient(client);
    setViewModalOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setEditModalOpen(true);
  };

  const handleUpdateClient = async (clientData: UpdateClientData): Promise<boolean> => {
    if (!selectedClient) return false;

    try {
      const response = await clientsApi.updateClient(selectedClient._id, clientData);

      if (response.success) {
        // Update the client in the local list with optimistic update
        setClients(prevClients =>
          prevClients.map(client =>
            client._id === selectedClient._id
              ? { ...client, ...response.data.client }
              : client
          )
        );

        notifications.show({
          title: 'Success',
          message: 'Client updated successfully',
          color: 'green',
        });
        return true;
      } else {
        notifications.show({
          title: 'Error',
          message: response.message || 'Failed to update client',
          color: 'red',
        });
        return false;
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to update client',
        color: 'red',
      });
      return false;
    }
  };

  const handleSaveClient = async (userData: CreateUserData): Promise<boolean> => {
    try {
      const response = await usersApi.createUser(userData);

      if (response.success) {
        // Refresh the clients list to include the new client
        await refreshClients();

        notifications.show({
          title: 'Success',
          message: 'Client created successfully',
          color: 'green',
        });
        return true;
      } else {
        notifications.show({
          title: 'Error',
          message: response.message || 'Failed to create client',
          color: 'red',
        });
        return false;
      }
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to create client',
        color: 'red',
      });
      return false;
    }
  };

  const handleToggleClientStatus = async (client: Client) => {
    try {
      // TODO: Implement client status toggle
      const newStatus = !client.membershipInfo.isActive;

      notifications.show({
        title: 'Success',
        message: `Client ${newStatus ? 'activated' : 'deactivated'} successfully`,
        color: 'green',
      });
    } catch {
      notifications.show({
        title: 'Error',
        message: `Failed to ${client.membershipInfo.isActive ? 'deactivate' : 'activate'} client`,
        color: 'red',
      });
    }
  };

  const handleAssignProgram = () => {
    // TODO: Implement program assignment
    notifications.show({
      title: 'Info',
      message: 'Program assignment feature coming soon',
      color: 'blue',
    });
  };

  // Pagination handler
  const handlePageChange = (page: number) => {
    filterClients({ page });
  };

  // Permission check
  if (!canManageClients) {
    return (
      <AppLayout>
        <Center h={400}>
          <Alert icon={<IconAlertCircle size={16} />} title="Access Denied" color="red">
            You don't have permission to manage clients. Only gym owners and administrators can access this page.
          </Alert>
        </Center>
      </AppLayout>
    );
  }

  // Helper function to get membership status badge
  const getMembershipStatusBadge = (client: Client) => {
    if (!client.membershipInfo.isActive) {
      return <Badge color="red" size="sm">Inactive</Badge>;
    }

    // Check if client is currently frozen
    const currentFreeze = client.membershipInfo.freezeHistory?.find(
      freeze => freeze.startDate && !freeze.endDate
    );

    if (currentFreeze) {
      return <Badge color="yellow" size="sm">Frozen</Badge>;
    }

    return <Badge color="green" size="sm">Active</Badge>;
  };

  // Format join date
  const formatJoinDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <AppLayout>
      <Stack gap="md">
        {/* Header */}
        <Card>
          <Group justify="space-between">
            <div>
              <Title order={2}>Client Management</Title>
              <Text c="dimmed" size="sm">
                Manage gym members, memberships, and program assignments
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAddClient}
            >
              Add Client
            </Button>
          </Group>
        </Card>

        {/* Search and Filters */}
        <Card>
          <Stack gap="md">
            <Group align="flex-end" gap="md">
              <TextInput
                label="Search clients"
                placeholder="Search by name or email..."
                leftSection={<IconSearch size={16} />}
                value={searchValue}
                onChange={(e) => handleSearch(e.target.value)}
                style={{ flex: 1 }}
              />
              <Select
                label="Membership Status"
                placeholder="All statuses"
                leftSection={<IconFilter size={16} />}
                value={membershipStatusFilter}
                onChange={(value) => handleMembershipStatusFilter(value || '')}
                data={[
                  { value: 'active', label: 'Active' },
                  { value: 'inactive', label: 'Inactive' },
                  { value: 'frozen', label: 'Frozen' }
                ]}
                clearable
                style={{ minWidth: 180 }}
              />
              <Select
                label="Membership Type"
                placeholder="All types"
                leftSection={<IconFilter size={16} />}
                value={membershipTypeFilter}
                onChange={(value) => handleMembershipTypeFilter(value || '')}
                data={[
                  { value: 'monthly', label: 'Monthly' },
                  { value: 'quarterly', label: 'Quarterly' },
                  { value: 'annual', label: 'Annual' },
                  { value: 'unlimited', label: 'Unlimited' }
                ]}
                clearable
                style={{ minWidth: 180 }}
              />
              {(searchValue || membershipStatusFilter || membershipTypeFilter) && (
                <Button
                  variant="subtle"
                  leftSection={<IconX size={16} />}
                  onClick={handleClearFilters}
                >
                  Clear
                </Button>
              )}
            </Group>
          </Stack>
        </Card>

        {/* Clients Table */}
        <Card>
          {loading ? (
            <Center py="xl">
              <Loader size="md" />
            </Center>
          ) : clients.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconUser size={48} color="gray" />
                <div style={{ textAlign: 'center' }}>
                  <Text size="lg" c="dimmed">
                    No clients found
                  </Text>
                  <Text size="sm" c="dimmed">
                    {searchValue || membershipStatusFilter || membershipTypeFilter
                      ? 'Try adjusting your search or filters'
                      : 'Add your first client to get started'
                    }
                  </Text>
                </div>
                {!searchValue && !membershipStatusFilter && !membershipTypeFilter && (
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleAddClient}
                  >
                    Add Client
                  </Button>
                )}
              </Stack>
            </Center>
          ) : (
            <ScrollArea>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Client</Table.Th>
                    <Table.Th>Contact</Table.Th>
                    <Table.Th>Membership</Table.Th>
                    <Table.Th>Program</Table.Th>
                    <Table.Th>Join Date</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {clients.map((client) => (
                    <Table.Tr key={client._id}>
                      <Table.Td>
                        <Group gap="sm">
                          <Avatar size="sm" radius="xl">
                            {client.user?.name?.charAt(0) || 'U'}
                          </Avatar>
                          <div>
                            <Text fw={500} size="sm">
                              {client.user?.name || 'Unknown User'}
                            </Text>
                            {getMembershipStatusBadge(client)}
                          </div>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text size="sm">{client.user?.email}</Text>
                          {client.personalInfo.phone && (
                            <Text size="xs" c="dimmed">
                              {client.personalInfo.phone}
                            </Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <div>
                          <Text size="sm" tt="capitalize">
                            {client.membershipInfo.membershipType || 'Standard'}
                          </Text>
                          <Text size="xs" c="dimmed">
                            {client.membershipInfo.isActive ? 'Active' : 'Inactive'}
                          </Text>
                        </div>
                      </Table.Td>
                      <Table.Td>
                        {client.currentProgram ? (
                          <div>
                            <Text size="sm" fw={500}>
                              {client.program?.name || 'Assigned'}
                            </Text>
                            <Text size="xs" c="dimmed">
                              Week {client.currentProgram.currentWeek}
                            </Text>
                          </div>
                        ) : (
                          <Text size="sm" c="dimmed">
                            No program
                          </Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm">
                          {formatJoinDate(client.membershipInfo.joinDate)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon size="sm" variant="subtle">
                              <IconDots size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEye size={14} />}
                              onClick={() => handleViewClient(client)}
                            >
                              View Details
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEditClient(client)}
                            >
                              Edit Client
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrophy size={14} />}
                              onClick={() => handleAssignProgram(client)}
                            >
                              Assign Program
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={
                                client.membershipInfo.isActive
                                  ? <IconUserX size={14} />
                                  : <IconUserCheck size={14} />
                              }
                              color={client.membershipInfo.isActive ? 'red' : 'green'}
                              onClick={() => handleToggleClientStatus(client)}
                            >
                              {client.membershipInfo.isActive ? 'Deactivate' : 'Activate'}
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </ScrollArea>
          )}
        </Card>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <Card>
            <Group justify="space-between" align="center">
              <Text size="sm" c="dimmed">
                Showing {clients.length} of {pagination.total} clients
              </Text>
              <Pagination
                value={pagination.page}
                onChange={handlePageChange}
                total={pagination.pages}
                size="sm"
              />
            </Group>
          </Card>
        )}
      </Stack>

      <ClientCreateModal
        opened={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSave={handleSaveClient}
        gymOptions={gymOptions}
        loading={loading}
      />

      <ClientViewModal
        opened={viewModalOpen}
        onClose={() => {
          setViewModalOpen(false);
          setSelectedClient(null);
        }}
        onEdit={() => {
          setViewModalOpen(false);
          setEditModalOpen(true);
        }}
        client={selectedClient}
      />

      <ClientEditModal
        opened={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSave={handleUpdateClient}
        client={selectedClient}
        loading={loading}
      />
    </AppLayout>
  );
}