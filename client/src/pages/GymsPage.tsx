import { useState, useEffect } from 'react';
import {
  Stack,
  Group,
  Title,
  Text,
  Card,
  Button,
  TextInput,
  Table,
  ActionIcon,
  Badge,
  Menu,
  Loader,
  Center,
  Pagination,
  Select
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconBuilding,
  IconUsers,
  IconTrendingUp
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { AppLayout } from '../components/layout/AppLayout';
import { useGyms } from '../hooks/useGyms';
import { GymModal } from '../components/gyms/GymModal';
import type { Gym, GymOwner } from '../types/gyms';

export function GymsPage() {
  const {
    gyms,
    gymOwners,
    loading,
    error,
    pagination,
    fetchGyms,
    fetchGymOwners,
    createGym,
    updateGym,
    deleteGym
  } = useGyms();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingGym, setEditingGym] = useState<Gym | null>(null);
  const [selectedOwner, setSelectedOwner] = useState<string>('');

  // Load data on mount and when search/pagination changes
  useEffect(() => {
    const params = {
      page: currentPage,
      limit: pageSize,
      ...(searchQuery && { search: searchQuery }),
      ...(selectedOwner && { ownerId: selectedOwner })
    };
    
    fetchGyms(params);
  }, [fetchGyms, currentPage, pageSize, searchQuery, selectedOwner]);

  // Load gym owners on mount
  useEffect(() => {
    fetchGymOwners();
  }, [fetchGymOwners]);

  // Handle search with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1); // Reset to first page on search
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedOwner]);

  // Handle create gym
  const handleCreateGym = () => {
    setEditingGym(null);
    setModalOpen(true);
  };

  // Handle edit gym
  const handleEditGym = (gym: Gym) => {
    setEditingGym(gym);
    setModalOpen(true);
  };

  // Handle save gym (create or update)
  const handleSaveGym = async (gymData: any) => {
    try {
      if (editingGym) {
        await updateGym(editingGym._id, gymData);
      } else {
        await createGym(gymData);
      }
      setModalOpen(false);
      setEditingGym(null);
    } catch (err) {
      // Error handling is done in the hook
    }
  };

  // Handle delete gym
  const handleDeleteGym = async (gym: Gym) => {
    if (window.confirm(`Are you sure you want to delete "${gym.name}"? This action cannot be undone.`)) {
      await deleteGym(gym._id);
    }
  };

  // Format owner name
  const formatOwnerName = (gym: Gym) => {
    if (gym.ownerId && typeof gym.ownerId === 'object') {
      return gym.ownerId.name || gym.ownerId.email || 'Unknown';
    }
    return 'Unassigned';
  };

  // Format subscription status
  const formatSubscriptionStatus = (gym: Gym) => {
    if (!gym.subscription) return 'None';
    
    const statusColors: Record<string, string> = {
      'active': 'green',
      'trial': 'blue',
      'inactive': 'gray',
      'suspended': 'red'
    };

    return (
      <Badge color={statusColors[gym.subscription.status] || 'gray'} size="sm">
        {gym.subscription.status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <AppLayout>
      <Stack gap="md">
        {/* Header */}
        <Card>
          <Group justify="space-between">
            <div>
              <Title order={2}>Gym Management</Title>
              <Text c="dimmed" size="sm">
                Manage gym locations and settings across your platform
              </Text>
            </div>
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleCreateGym}
            >
              Add Gym
            </Button>
          </Group>
        </Card>

        {/* Filters */}
        <Card>
          <Group>
            <TextInput
              placeholder="Search gyms..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Filter by owner"
              value={selectedOwner}
              onChange={(value) => setSelectedOwner(value || '')}
              data={[
                { value: '', label: 'All Owners' },
                ...gymOwners.map(owner => ({
                  value: owner._id,
                  label: `${owner.name} (${owner.email})`
                }))
              ]}
              clearable
              searchable
              style={{ minWidth: 200 }}
            />
            <Select
              placeholder="Per page"
              value={pageSize.toString()}
              onChange={(value) => setPageSize(parseInt(value || '25'))}
              data={[
                { value: '10', label: '10 per page' },
                { value: '25', label: '25 per page' },
                { value: '50', label: '50 per page' },
                { value: '100', label: '100 per page' }
              ]}
              style={{ minWidth: 130 }}
            />
          </Group>
        </Card>

        {/* Gyms Table */}
        <Card>
          {loading ? (
            <Center py="xl">
              <Loader size="md" />
            </Center>
          ) : gyms.length === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="md">
                <IconBuilding size={48} color="gray" />
                <Text c="dimmed">
                  {searchQuery || selectedOwner ? 'No gyms found matching your criteria' : 'No gyms created yet'}
                </Text>
                {!searchQuery && !selectedOwner && (
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={handleCreateGym}
                    variant="light"
                  >
                    Create First Gym
                  </Button>
                )}
              </Stack>
            </Center>
          ) : (
            <Table>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Gym Name</Table.Th>
                  <Table.Th>Owner</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Members</Table.Th>
                  <Table.Th>Subscription</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th width={80}>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {gyms.map((gym) => (
                  <Table.Tr key={gym._id}>
                    <Table.Td>
                      <div>
                        <Text fw={500}>{gym.name}</Text>
                        {gym.description && (
                          <Text size="sm" c="dimmed" truncate="end">
                            {gym.description}
                          </Text>
                        )}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <div>
                        <Text size="sm">{formatOwnerName(gym)}</Text>
                        {gym.ownerId && typeof gym.ownerId === 'object' && (
                          <Text size="xs" c="dimmed">
                            {gym.ownerId.email}
                          </Text>
                        )}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <div>
                        {gym.address ? (
                          <>
                            <Text size="sm">
                              {gym.address.city}, {gym.address.state}
                            </Text>
                            <Text size="xs" c="dimmed">
                              {gym.locations.length} location{gym.locations.length !== 1 ? 's' : ''}
                            </Text>
                          </>
                        ) : (
                          <Text size="sm" c="dimmed">No address</Text>
                        )}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <IconUsers size={14} />
                        <Text size="sm">{gym.statistics.totalMembers}</Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {formatSubscriptionStatus(gym)}
                    </Table.Td>
                    <Table.Td>
                      <Badge 
                        color={gym.isActive ? 'green' : 'gray'} 
                        variant="light"
                        size="sm"
                      >
                        {gym.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={160}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={() => {
                              notifications.show({
                                title: 'Coming Soon',
                                message: 'Gym details view will be implemented',
                                color: 'blue'
                              });
                            }}
                          >
                            View Details
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => handleEditGym(gym)}
                          >
                            Edit Gym
                          </Menu.Item>
                          <Menu.Divider />
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDeleteGym(gym)}
                          >
                            Delete Gym
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                Showing {(currentPage - 1) * pageSize + 1} to{' '}
                {Math.min(currentPage * pageSize, pagination.total)} of{' '}
                {pagination.total} gyms
              </Text>
              <Pagination
                value={currentPage}
                onChange={setCurrentPage}
                total={pagination.totalPages}
                size="sm"
              />
            </Group>
          )}
        </Card>
      </Stack>

      {/* Gym Modal */}
      <GymModal
        opened={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingGym(null);
        }}
        onSave={handleSaveGym}
        gym={editingGym}
        gymOwners={gymOwners}
        loading={loading}
      />
    </AppLayout>
  );
}
