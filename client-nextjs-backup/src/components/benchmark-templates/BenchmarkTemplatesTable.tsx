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
  Center,
  MultiSelect
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
import { BenchmarkTemplate } from '../../lib/benchmark-templates-api';
import { useAuth } from '../../lib/auth-context';

interface BenchmarkTag {
  tag: string;
  count: number;
}

interface BenchmarkTemplatesTableProps {
  benchmarkTemplates: BenchmarkTemplate[];
  tags: BenchmarkTag[];
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
  onAddTemplate: () => void;
  onEditTemplate: (template: BenchmarkTemplate) => void;
  onDeleteTemplate: (template: BenchmarkTemplate) => void;
  onViewTemplate: (template: BenchmarkTemplate) => void;
}

export function BenchmarkTemplatesTable({
  benchmarkTemplates,
  tags,
  loading,
  pagination,
  onSearch,
  onPageChange,
  onAddTemplate,
  onEditTemplate,
  onDeleteTemplate,
  onViewTemplate
}: BenchmarkTemplatesTableProps) {
  const { user } = useAuth();
  
  // Search and filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [unitFilter, setUnitFilter] = useState<string | null>(null);
  const [tagsFilter, setTagsFilter] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // Debounce search term
  const [debouncedSearchTerm] = useDebouncedValue(searchTerm, 300);
  
  // Extract unique options from benchmark templates
  const filterOptions = useMemo(() => {
    return {
      tags: tags.map(tag => ({ value: tag.tag, label: `${tag.tag} (${tag.count})` }))
    };
  }, [tags]);
  
  // Effect to trigger search when filters change
  useEffect(() => {
    const filters: any = {};
    
    if (debouncedSearchTerm) filters.search = debouncedSearchTerm;
    if (typeFilter) filters.type = typeFilter;
    if (unitFilter) filters.unit = unitFilter;
    if (tagsFilter.length > 0) filters.tags = tagsFilter;
    
    onSearch(filters);
  }, [debouncedSearchTerm, typeFilter, unitFilter, tagsFilter, onSearch]);
  
  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setTypeFilter(null);
    setUnitFilter(null);
    setTagsFilter([]);
  };
  
  const hasActiveFilters = searchTerm || typeFilter || unitFilter || tagsFilter.length > 0;
  
  // Type badge color mapping
  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'weight': return 'blue';
      case 'time': return 'green';
      case 'reps': return 'orange';
      default: return 'gray';
    }
  };

  // Unit badge color mapping
  const getUnitBadgeColor = (unit: string) => {
    switch (unit) {
      case 'lbs': return 'blue';
      case 'kg': return 'indigo';
      case 'seconds': return 'green';
      case 'reps': return 'orange';
      default: return 'gray';
    }
  };
  
  // Check if user can perform actions
  const canPerformActions = user?.userType === 'admin' || user?.userType === 'gym_owner' || user?.userType === 'coach';
  
  if (loading && benchmarkTemplates.length === 0) {
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
          <Text size="xl" fw={600}>Benchmark Templates</Text>
          <Text c="dimmed" size="sm">
            Manage performance benchmark templates
            {pagination && ` • ${pagination.total} total templates`}
          </Text>
        </div>
        
        {canPerformActions && (
          <Button
            leftSection={<IconPlus size="1rem" />}
            onClick={onAddTemplate}
          >
            Add Template
          </Button>
        )}
      </Group>
      
      {/* Search and Filters */}
      <Paper p="md" withBorder>
        <Stack gap="md">
          <Group gap="md">
            <TextInput
              placeholder="Search templates..."
              leftSection={<IconSearch size="1rem" />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.currentTarget.value)}
              style={{ flex: 1 }}
            />
            
            <Select
              placeholder="Type"
              data={[
                { value: 'weight', label: 'Weight' },
                { value: 'time', label: 'Time' },
                { value: 'reps', label: 'Reps' }
              ]}
              value={typeFilter}
              onChange={setTypeFilter}
              clearable
              w={120}
            />
            
            <Select
              placeholder="Unit"
              data={[
                { value: 'lbs', label: 'lbs' },
                { value: 'kg', label: 'kg' },
                { value: 'seconds', label: 'seconds' },
                { value: 'reps', label: 'reps' }
              ]}
              value={unitFilter}
              onChange={setUnitFilter}
              clearable
              w={120}
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
              <MultiSelect
                placeholder="Tags"
                data={filterOptions.tags}
                value={tagsFilter}
                onChange={setTagsFilter}
                searchable
                clearable
                w={250}
                maxDropdownHeight={200}
              />
            </Group>
          )}
        </Stack>
      </Paper>
      
      {/* Benchmark Templates Table */}
      <Card>
        <LoadingOverlay visible={loading} />
        
        {benchmarkTemplates.length === 0 ? (
          <Center py="xl">
            <Stack align="center" gap="sm">
              <Text size="lg" fw={500} c="dimmed">No benchmark templates found</Text>
              <Text size="sm" c="dimmed">
                {hasActiveFilters ? "Try adjusting your search criteria" : "Get started by creating your first benchmark template"}
              </Text>
            </Stack>
          </Center>
        ) : (
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Template</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Unit</Table.Th>
                <Table.Th>Tags</Table.Th>
                {canPerformActions && <Table.Th w={60}>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {benchmarkTemplates.map((template) => (
                <Table.Tr key={template._id}>
                  <Table.Td>
                    <div>
                      <Text fw={500} lineClamp={1}>{template.name}</Text>
                      {template.description && (
                        <Text size="xs" c="dimmed" lineClamp={2}>
                          {template.description}
                        </Text>
                      )}
                    </div>
                  </Table.Td>
                  
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={getTypeBadgeColor(template.type)}
                      variant="light"
                    >
                      {template.type}
                    </Badge>
                  </Table.Td>
                  
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={getUnitBadgeColor(template.unit)}
                      variant="outline"
                    >
                      {template.unit}
                    </Badge>
                  </Table.Td>
                  
                  <Table.Td>
                    <Group gap="xs">
                      {template.tags.slice(0, 2).map((tag, index) => (
                        <Badge key={`${template._id}-${tag}-${index}`} size="xs" variant="dot">
                          {tag}
                        </Badge>
                      ))}
                      {template.tags.length > 2 && (
                        <Badge size="xs" variant="light" color="gray">
                          +{template.tags.length - 2}
                        </Badge>
                      )}
                    </Group>
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
                            onClick={() => onViewTemplate(template)}
                          >
                            View Details
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEdit size="1rem" />}
                            onClick={() => onEditTemplate(template)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size="1rem" />}
                            color="red"
                            onClick={() => onDeleteTemplate(template)}
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