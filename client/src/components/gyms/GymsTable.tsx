'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  TextInput,
  Button,
  Stack,
  Grid,
  Pagination,
  Loader,
  Center,
  Alert,
  Anchor,
  Paper,
  Divider,
  Avatar
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import {
  IconSearch,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconBuilding,
  IconUsers,
  IconPhone,
  IconMail,
  IconWorld,
  IconMapPin,
  IconAlertCircle
} from '@tabler/icons-react';
import { useAuth } from '../../lib/auth-context';
import { useGyms } from '../../hooks/useGyms';
import type { Gym } from '../../lib/gyms-api';

interface GymsTableProps {
  onAddGym: () => void;
  onEditGym: (gym: Gym) => void;
  onDeleteGym: (gym: Gym) => void;
  onViewGym: (gym: Gym) => void;
}

export function GymsTable({
  onAddGym,
  onEditGym,
  onDeleteGym,
  onViewGym
}: GymsTableProps) {
  const { user } = useAuth();
  const { gyms, loading, error, pagination, fetchGyms } = useGyms();
  
  // State for search and pagination
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [debouncedSearch] = useDebouncedValue(search, 300);

  // Load gyms on component mount and when search/page changes
  useEffect(() => {
    fetchGyms({
      page: currentPage,
      limit: 12, // Show 12 cards per page
      ...(debouncedSearch && { search: debouncedSearch }),
      sort: '-createdAt'
    });
  }, [fetchGyms, currentPage, debouncedSearch]);

  // Handle search change
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Format address for display
  const formatAddress = (gym: Gym): string => {
    if (!gym.address) return 'No address';
    const { street, city, state, zipCode } = gym.address;
    const parts = [street, city, state, zipCode].filter(Boolean);
    return parts.length > 0 ? parts.join(', ') : 'No address';
  };

  // Get status badge color based on subscription status
  const getStatusBadge = (gym: Gym) => {
    if (!gym.subscription) {
      return <Badge color="gray" variant="light" size="sm">No Subscription</Badge>;
    }
    
    const statusColors = {
      active: 'green',
      trial: 'blue',
      expired: 'red',
      cancelled: 'orange'
    };
    
    return (
      <Badge 
        color={statusColors[gym.subscription.status as keyof typeof statusColors] || 'gray'} 
        variant="light" 
        size="sm"
      >
        {gym.subscription.status.charAt(0).toUpperCase() + gym.subscription.status.slice(1)}
      </Badge>
    );
  };

  // Check if user can perform admin actions
  const canPerformAdminActions = user?.userType === 'admin';
  const canEditGym = (gym: Gym) => {
    return user?.userType === 'admin' || (user?.userType === 'gym_owner' && gym.ownerId?._id === user._id);
  };

  if (loading && gyms.length === 0) {
    return (
      <Center h={400}>
        <Loader color="blue" size="lg" />
      </Center>
    );
  }

  if (error && gyms.length === 0) {
    return (
      <Alert
        icon={<IconAlertCircle size="1rem" />}
        title="Error loading gyms"
        color="red"
      >
        {error}
      </Alert>
    );
  }

  return (
    <Stack gap="lg">
      {/* Header with search and add button */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={600}>Gym Management</Text>
          <Text size="sm" c="dimmed">
            {pagination?.total || 0} gyms total
          </Text>
        </div>
        
        <Group gap="md">
          <TextInput
            placeholder="Search gyms..."
            leftSection={<IconSearch size="1rem" />}
            value={search}
            onChange={(e) => handleSearchChange(e.currentTarget.value)}
            w={300}
          />
          
          {canPerformAdminActions && (
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={onAddGym}
              color="blue"
            >
              Add Gym
            </Button>
          )}
        </Group>
      </Group>

      {/* Loading overlay */}
      {loading && (
        <Center>
          <Loader color="blue" size="sm" />
        </Center>
      )}

      {/* Gyms grid */}
      {gyms.length === 0 && !loading ? (
        <Paper p="xl" ta="center">
          <IconBuilding size="3rem" style={{ opacity: 0.3 }} />
          <Text size="lg" fw={500} mt="md">No gyms found</Text>
          <Text size="sm" c="dimmed">
            {search ? 'Try adjusting your search criteria' : 'Get started by adding your first gym'}
          </Text>
          {canPerformAdminActions && !search && (
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={onAddGym}
              mt="md"
              variant="light"
            >
              Add Gym
            </Button>
          )}
        </Paper>
      ) : (
        <Grid>
          {(gyms || []).map((gym) => (
            <Grid.Col key={gym._id} span={{ base: 12, sm: 6, lg: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder h="100%">
                <Stack gap="md" h="100%">
                  {/* Header */}
                  <Group justify="space-between" align="flex-start">
                    <div style={{ flex: 1 }}>
                      <Group align="center" gap="xs" mb="xs">
                        <IconBuilding size="1.2rem" color="var(--mantine-color-blue-6)" />
                        <Text fw={600} size="lg" lineClamp={1}>
                          {gym.name}
                        </Text>
                      </Group>
                      {getStatusBadge(gym)}
                    </div>
                    
                    <Menu shadow="md" width={200} position="bottom-end">
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray">
                          <IconDots size="1rem" />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEye size="1rem" />}
                          onClick={() => onViewGym(gym)}
                        >
                          View Details
                        </Menu.Item>
                        
                        {canEditGym(gym) && (
                          <Menu.Item
                            leftSection={<IconEdit size="1rem" />}
                            onClick={() => onEditGym(gym)}
                          >
                            Edit Gym
                          </Menu.Item>
                        )}
                        
                        {canPerformAdminActions && (
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={() => onDeleteGym(gym)}
                          >
                            Delete Gym
                          </Menu.Item>
                        )}
                      </Menu.Dropdown>
                    </Menu>
                  </Group>

                  {/* Description */}
                  {gym.description && (
                    <Text size="sm" c="dimmed" lineClamp={2}>
                      {gym.description}
                    </Text>
                  )}

                  {/* Contact info */}
                  <Stack gap="xs">
                    {gym.email && (
                      <Group gap="xs" align="center">
                        <IconMail size="0.9rem" color="var(--mantine-color-gray-6)" />
                        <Anchor href={`mailto:${gym.email}`} size="sm" lineClamp={1}>
                          {gym.email}
                        </Anchor>
                      </Group>
                    )}
                    
                    {gym.phone && (
                      <Group gap="xs" align="center">
                        <IconPhone size="0.9rem" color="var(--mantine-color-gray-6)" />
                        <Anchor href={`tel:${gym.phone}`} size="sm">
                          {gym.phone}
                        </Anchor>
                      </Group>
                    )}
                    
                    {gym.website && (
                      <Group gap="xs" align="center">
                        <IconWorld size="0.9rem" color="var(--mantine-color-gray-6)" />
                        <Anchor href={gym.website} target="_blank" size="sm" lineClamp={1}>
                          {gym.website.replace(/^https?:\/\//, '')}
                        </Anchor>
                      </Group>
                    )}
                    
                    <Group gap="xs" align="flex-start">
                      <IconMapPin size="0.9rem" color="var(--mantine-color-gray-6)" style={{ marginTop: 2 }} />
                      <Text size="sm" c="dimmed" lineClamp={2}>
                        {formatAddress(gym)}
                      </Text>
                    </Group>
                  </Stack>

                  {/* Owner info */}
                  {gym.ownerId ? (
                    <Group gap="xs" align="center">
                      <Avatar size="sm" color="blue">
                        {gym.ownerId.name.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500} lineClamp={1}>
                          {gym.ownerId.name}
                        </Text>
                        <Text size="xs" c="dimmed" lineClamp={1}>
                          Owner • {gym.ownerId.email}
                        </Text>
                      </div>
                    </Group>
                  ) : (
                    <Group gap="xs" align="center">
                      <Avatar size="sm" color="gray">
                        ?
                      </Avatar>
                      <div>
                        <Text size="sm" fw={500} c="dimmed">
                          No Owner Assigned
                        </Text>
                        <Text size="xs" c="dimmed">
                          Owner pending assignment
                        </Text>
                      </div>
                    </Group>
                  )}

                  <Divider />

                  {/* Statistics */}
                  <Group justify="space-between" mt="auto">
                    <div>
                      <Group gap="xs" align="center">
                        <IconUsers size="0.9rem" color="var(--mantine-color-blue-6)" />
                        <Text size="sm" fw={500}>
                          {gym.statistics.totalMembers}
                        </Text>
                      </Group>
                      <Text size="xs" c="dimmed">Total Members</Text>
                    </div>
                    
                    <div>
                      <Text size="sm" fw={500} ta="center">
                        {gym.statistics.coachCount}
                      </Text>
                      <Text size="xs" c="dimmed">Coaches</Text>
                    </div>
                    
                    <div>
                      <Text size="sm" fw={500} ta="center">
                        {gym.locations.filter(loc => loc.isActive).length}
                      </Text>
                      <Text size="xs" c="dimmed">Locations</Text>
                    </div>
                  </Group>
                </Stack>
              </Card>
            </Grid.Col>
          ))}
        </Grid>
      )}

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Group justify="center" mt="lg">
          <Pagination
            value={currentPage}
            onChange={handlePageChange}
            total={pagination.totalPages}
            size="sm"
          />
        </Group>
      )}
    </Stack>
  );
}