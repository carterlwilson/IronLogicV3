'use client';

import { useState, useEffect } from 'react';
import {
  Container,
  Stack,
  Title,
  Button,
  Group,
  Text,
  Card,
  Badge,
  Grid,
  TextInput,
  Select,
  Pagination,
  ActionIcon,
  Menu,
  Loader,
  Center
} from '@mantine/core';
import {
  IconPlus,
  IconSearch,
  IconDots,
  IconEdit,
  IconCopy,
  IconTrash,
  IconEye
} from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { Link, useNavigate } from 'react-router-dom';
import { AppLayout } from '../../components/layout/AppLayout';
import { useAuth } from '../../lib/auth-context';
import { useWorkoutPrograms } from '../../hooks/useWorkoutPrograms';
import type { WorkoutProgram } from '../../types/index';

export function ProgramsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [isTemplate, setIsTemplate] = useState<string>('');
  
  const {
    programs,
    loading,
    error,
    pagination,
    fetchPrograms,
    deleteProgram,
    copyProgram
  } = useWorkoutPrograms();

  // Fetch programs on component mount and when filters change
  useEffect(() => {
    fetchPrograms({
      page,
      limit: 12,
      search: search || undefined,
      isTemplate: isTemplate ? isTemplate === 'true' : undefined,
    });
  }, [page, search, isTemplate, fetchPrograms]);

  const handleDelete = async (program: WorkoutProgram) => {
    if (window.confirm(`Are you sure you want to delete "${program.name}"?`)) {
      const success = await deleteProgram(program._id.toString());
      if (success) {
        notifications.show({
          title: 'Success',
          message: 'Program deleted successfully',
          color: 'green',
        });
      }
    }
  };

  const handleCopy = async (program: WorkoutProgram) => {
    const newName = prompt(`Enter name for copy of "${program.name}":`, `${program.name} (Copy)`);
    if (newName && newName.trim()) {
      const success = await copyProgram(program._id.toString(), {
        name: newName.trim(),
        isTemplate: false
      });
      if (success) {
        notifications.show({
          title: 'Success', 
          message: 'Program copied successfully',
          color: 'green',
        });
      }
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getRoleSpecificContent = () => {
    switch (user?.userType) {
      case 'admin':
        return {
          title: 'All Workout Programs',
          description: 'Manage workout programs across all gyms and locations.',
          badge: { label: 'Admin Access', color: 'red' }
        };
      case 'gym_owner':
        return {
          title: 'Gym Workout Programs',
          description: 'Manage workout programs for your gym and coaches.',
          badge: { label: 'Gym Owner Access', color: 'blue' }
        };
      case 'coach':
        return {
          title: 'My Workout Programs',
          description: 'Create and manage your workout programs for clients.',
          badge: { label: 'Coach Access', color: 'green' }
        };
      default:
        return {
          title: 'Workout Programs',
          description: 'Workout program management.',
          badge: { label: 'User Access', color: 'gray' }
        };
    }
  };

  const content = getRoleSpecificContent();

  if (loading && (programs || []).length === 0) {
    return (
      <AppLayout>
        <Container size="lg">
          <Center h={200}>
            <Loader size="lg" />
          </Center>
        </Container>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Container size="lg">
        <Stack gap="lg">
          {/* Header */}
          <Group justify="space-between">
            <div>
              <Title order={2}>{content.title}</Title>
              <Badge {...content.badge} mb="sm">
                {content.badge.label}
              </Badge>
              <Text c="dimmed">
                {content.description}
              </Text>
            </div>
            <Button 
              leftSection={<IconPlus size="1rem" />}
              component={Link}
              to="/programs/builder"
            >
              Create Program
            </Button>
          </Group>

          {/* Filters */}
          <Card withBorder p="md">
            <Group gap="md">
              <TextInput
                placeholder="Search programs..."
                leftSection={<IconSearch size="1rem" />}
                value={search}
                onChange={(event) => setSearch(event.currentTarget.value)}
                style={{ flex: 1 }}
              />
              <Select
                placeholder="All types"
                data={[
                  { value: '', label: 'All Programs' },
                  { value: 'false', label: 'Active Programs' },
                  { value: 'true', label: 'Templates' }
                ]}
                value={isTemplate}
                onChange={(value) => setIsTemplate(value || '')}
                w={200}
              />
            </Group>
          </Card>

          {/* Error State */}
          {error && (
            <Card withBorder p="md" bg="red.0">
              <Text c="red" size="sm">
                {error}
              </Text>
            </Card>
          )}

          {/* Programs Grid */}
          {(programs || []).length === 0 && !loading ? (
            <Card withBorder p="xl">
              <Stack align="center" gap="md">
                <Text size="lg" fw={500}>No programs found</Text>
                <Text c="dimmed" ta="center">
                  {search ? 
                    'Try adjusting your search terms or filters.' :
                    'Get started by creating your first workout program.'
                  }
                </Text>
                <Button 
                  leftSection={<IconPlus size="1rem" />}
                  component={Link}
                  to="/programs/builder"
                >
                  Create Program
                </Button>
              </Stack>
            </Card>
          ) : (
            <Grid>
              {(programs || []).map((program) => (
                <Grid.Col key={program._id.toString()} span={{ base: 12, sm: 6, lg: 4 }}>
                  <Card withBorder p="md" h="100%">
                    <Stack gap="sm" h="100%">
                      {/* Header */}
                      <Group justify="space-between" align="flex-start">
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Text fw={600} size="lg" lineClamp={2}>
                            {program.name}
                          </Text>
                          <Group gap="xs" mt="xs">
                            <Badge
                              size="sm"
                              color={program.isTemplate ? 'blue' : 'green'}
                              variant="light"
                            >
                              {program.isTemplate ? 'Template' : 'Program'}
                            </Badge>
                            <Badge
                              size="sm"
                              color="gray"
                              variant="light"
                            >
                              {program.durationWeeks} weeks
                            </Badge>
                          </Group>
                        </div>
                        
                        <Menu shadow="md" width={200}>
                          <Menu.Target>
                            <ActionIcon variant="subtle" size="sm">
                              <IconDots size="1rem" />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEye size="1rem" />}
                              onClick={() => navigate(`/programs/${program._id}/view`)}
                            >
                              View
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconEdit size="1rem" />}
                              onClick={() => navigate(`/programs/builder?id=${program._id}`)}
                            >
                              Edit
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconCopy size="1rem" />}
                              onClick={() => handleCopy(program)}
                            >
                              Copy
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              color="red"
                              leftSection={<IconTrash size="1rem" />}
                              onClick={() => handleDelete(program)}
                            >
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>

                      {/* Description */}
                      <Text size="sm" c="dimmed" lineClamp={3} style={{ flex: 1 }}>
                        {program.description || 'No description provided'}
                      </Text>

                      {/* Stats */}
                      <Stack gap="xs">
                        <Group gap="md">
                          <div>
                            <Text size="xs" c="dimmed">Blocks</Text>
                            <Text size="sm" fw={500}>
                              {program.blocks?.length || 0}
                            </Text>
                          </div>
                          <div>
                            <Text size="xs" c="dimmed">Total Activities</Text>
                            <Text size="sm" fw={500}>
                              {program.blocks?.reduce((total, block) => {
                                return total + (block.weeks?.reduce((weekTotal, week) => {
                                  return weekTotal + (week.days?.reduce((dayTotal, day) => {
                                    return dayTotal + (day.activities?.length || 0);
                                  }, 0) || 0);
                                }, 0) || 0);
                              }, 0) || 0}
                            </Text>
                          </div>
                        </Group>

                        <Group justify="space-between">
                          <Text size="xs" c="dimmed">
                            Version {program.version}
                          </Text>
                          <Text size="xs" c="dimmed">
                            Updated {formatDate(program.updatedAt.toString())}
                          </Text>
                        </Group>
                      </Stack>
                    </Stack>
                  </Card>
                </Grid.Col>
              ))}
            </Grid>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <Group justify="center">
              <Pagination
                total={pagination.totalPages}
                value={pagination.page}
                onChange={setPage}
                size="sm"
              />
            </Group>
          )}
        </Stack>
      </Container>
    </AppLayout>
  );
}