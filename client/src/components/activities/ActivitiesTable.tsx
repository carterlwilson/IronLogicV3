'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  Card,
  Stack,
  Group,
  Text,
  TextInput,
  Select,
  Button,
  Badge,
  ActionIcon,
  Menu,
  LoadingOverlay,
  Pagination,
  Paper,
  Center
} from '@mantine/core';
import {
  IconSearch,
  IconPlus,
  IconDots,
  IconEdit,
  IconTrash,
  IconEye,
  IconFilter,
  IconX
} from '@tabler/icons-react';
import { useDebouncedValue } from '@mantine/hooks';
import { type ActivityTemplate, type ActivityGroup } from '../../types/activities';
import { useAuth } from '../../lib/auth-context';

interface ActivitiesTableProps {
  activities: ActivityTemplate[];
  activityGroups: ActivityGroup[];
  loading: boolean;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;
  onSearch: (filters: any) => void;
  onPageChange: (page: number) => void;
  onAddActivity: () => void;
  onEditActivity: (activity: ActivityTemplate) => void;
  onDeleteActivity: (activity: ActivityTemplate) => void;
  onViewActivity: (activity: ActivityTemplate) => void;
}

export function ActivitiesTable({
  activities,
  activityGroups,
  loading,
  pagination,
  onSearch,
  onPageChange,
  onAddActivity,
  onEditActivity,
  onDeleteActivity,
  onViewActivity
}: ActivitiesTableProps) {
  const { user } = useAuth();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce search term
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
  
  // Extract unique options from activities
  const filterOptions = useMemo(() => {
    return {
      groups: activityGroups.map(group => ({ value: group._id, label: `${group.name} (${group.count} activities)` }))
    };
  }, [activityGroups]);
  
  // Effect to trigger search when filters change
  useEffect(() => {
    const filters: any = {};
    
    if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
    if (typeFilter) filters.type = typeFilter;
    if (groupFilter) filters.activityGroupId = groupFilter;
    
    onSearch(filters);
  }, [debouncedSearchTerm, typeFilter, groupFilter, onSearch]);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    setGroupFilter(null);
  };
  
  const hasActiveFilters = searchTerm || typeFilter || groupFilter;
  
  // Type badge color mapping
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'primary lift': return 'blue';
      case 'accessory lift': return 'indigo';
      case 'conditioning': return 'green';
      case 'diagnostic': return 'orange';
      default: return 'gray';
    }
  };
  
  // Check if user can perform actions
  const canPerformActions = user?.userType === 'admin' || user?.userType === 'gym_owner' || user?.userType === 'coach';
  
  if (loading && activities.length === 0) {
    return (
      <Card>
        <LoadingOverlay visible={true} />
        <div style={{ height: 400 }} />
      </Card>
    );
  }
  
  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={600}>Activity Templates</Text>
          <Text c="dimmed" size="sm">
            Manage workout activity templates
            {pagination && ` • ${pagination.total} total activities`}
          </Text>
        </div>
        
        {canPerformActions && (
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={onAddActivity}
          >
            Add Activity
          </Button>
        )}
      </Group>
      
      {/* Search and Filters */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group gap="md">
            <TextInput
              placeholder="Search activities..."
              leftSection={<IconSearch size="1rem" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            
            <Select
              placeholder="Type"
              data={[
                { value: 'primary lift', label: 'Primary Lift' },
                { value: 'accessory lift', label: 'Accessory Lift' },
                { value: 'conditioning', label: 'Conditioning' },
                { value: 'diagnostic', label: 'Diagnostic' }
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              clearable
              w={160}
            />
            
            <Button
              variant={showFilters ? 'filled' : 'light'}
              leftSection={<IconFilter size="1rem" />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            
            {hasActiveFilters && (
              <Button
                variant="light"
                color="gray"
                leftSection={<IconX size="1rem" />}
                onClick={clearFilters}
              >
                Clear
              </Button>
            )}
          </Group>
          
          {showFilters && (
            <Group gap="md">
              <Select
                placeholder="Activity Group"
                data={filterOptions.groups}
                value={groupFilter}
                onChange={setGroupFilter}
                clearable
                searchable
                w={200}
              />
              
            </Group>
          )}
        </Stack>
      </Paper>
      
      {/* Activities Table */}
      <Card>
        <LoadingOverlay visible={loading} />
        
        {activities.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Text size="lg" fw={500} c="dimmed">No activities found</Text>
              <Text size="sm" c="dimmed">
                {hasActiveFilters ? "Try adjusting your search criteria" : "Get started by creating your first activity template"}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Activity</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Group</Table.Th>
                <Table.Th>Benchmark</Table.Th>
                {canPerformActions && <Table.Th w={60}>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {activities.map((activity, index) => (
                <Table.Tr key={activity._id || `activity-${index}`}>
                  <Table.Td>
                    <div>
                      <Text fw={500} lineClamp={1}>{activity.name}</Text>
                      {activity.description && (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {activity.description}
                        </Text>
                      )}
                    </div>
                  </Table.Td>
                  
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={getTypeBadgeColor(activity.type)}
                      variant="light"
                    >
                      {activity.type}
                    </Badge>
                  </Table.Td>
                  
                  <Table.Td>
                    <Text size="sm">{activity.activityGroup?.name || 'Unknown'}</Text>
                  </Table.Td>
                  
                  <Table.Td>
                    {activity.benchmarkTemplateName ? (
                      <Text size="sm" fw={500} lineClamp={1}>
                        {activity.benchmarkTemplateName}
                      </Text>
                    ) : (
                      <Text size="sm" c="dimmed">
                        No benchmark
                      </Text>
                    )}
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
                          <Menu.Item
                            leftSection={<IconEye size="1rem" />}
                            onClick={() => onViewActivity(activity)}
                          >
                            View Details
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEdit size="1rem" />}
                            onClick={() => onEditActivity(activity)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={() => onDeleteActivity(activity)}
                          >
                            Delete
                          </Menu.Item>
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
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <Group justify="center">
          <Pagination
            total={pagination.totalPages}
            value={pagination.page}
            onChange={onPageChange}
            size="sm"
          />
        </Group>
      )}
    </Stack>
  );
}