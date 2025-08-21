'use client';

import { useState, useEffect, useCallback } from 'react';
import { Stack, Container, Title, Text, Group, Button, LoadingOverlay } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../../lib/auth-context';
import { useActivityGroups } from '../../hooks/useActivityGroups';
import { ActivityGroupsTable } from '../../components/activity-groups/ActivityGroupsTable';
import { AddActivityGroupModal } from '../../components/activity-groups/AddActivityGroupModal';
import { EditActivityGroupModal } from '../../components/activity-groups/EditActivityGroupModal';
import { DeleteActivityGroupModal } from '../../components/activity-groups/DeleteActivityGroupModal';
import { ActivityGroup, CreateActivityGroupData, UpdateActivityGroupData } from '../../lib/activity-groups-api';
import { AppLayout } from '../../components/layout/AppLayout';

export default function ActivityGroupsPage() {
  const { user } = useAuth();
  const {
    activityGroups,
    loading,
    error,
    fetchActivityGroups,
    createActivityGroup,
    updateActivityGroup,
    deleteActivityGroup
  } = useActivityGroups();

  // Modal states
  const [addModalOpened, setAddModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<ActivityGroup | null>(null);

  // Fetch activity groups on component mount
  useEffect(() => {
    if (user) {
      const gymId = user.userType === 'admin' ? undefined : (user.gymId ? String(user.gymId) : undefined);
      fetchActivityGroups(gymId);
    }
  }, [user, fetchActivityGroups]);

  // Handle create activity group
  const handleCreateActivityGroup = useCallback(async (groupData: CreateActivityGroupData): Promise<boolean> => {
    const success = await createActivityGroup(groupData);
    if (success) {
      setAddModalOpened(false);
    }
    return success;
  }, [createActivityGroup]);

  // Handle edit activity group
  const handleEditActivityGroup = useCallback(async (id: string, groupData: UpdateActivityGroupData): Promise<boolean> => {
    const success = await updateActivityGroup(id, groupData);
    if (success) {
      setEditModalOpened(false);
      setSelectedGroup(null);
    }
    return success;
  }, [updateActivityGroup]);

  // Handle delete activity group
  const handleDeleteActivityGroup = useCallback(async (): Promise<boolean> => {
    if (!selectedGroup) return false;
    
    const success = await deleteActivityGroup(selectedGroup._id);
    if (success) {
      setDeleteModalOpened(false);
      setSelectedGroup(null);
    }
    return success;
  }, [selectedGroup, deleteActivityGroup]);

  // Handle edit button click
  const handleEditClick = useCallback((group: ActivityGroup) => {
    setSelectedGroup(group);
    setEditModalOpened(true);
  }, []);

  // Handle delete button click
  const handleDeleteClick = useCallback((group: ActivityGroup) => {
    setSelectedGroup(group);
    setDeleteModalOpened(true);
  }, []);

  // Handle modal close
  const handleCloseModals = useCallback(() => {
    setAddModalOpened(false);
    setEditModalOpened(false);
    setDeleteModalOpened(false);
    setSelectedGroup(null);
  }, []);

  // Check if user can create activity groups
  const canCreateGroups = user?.userType === 'admin' || user?.userType === 'gym_owner' || user?.userType === 'coach';

  if (!user) {
    return (
      <Container>
        <LoadingOverlay visible={true} />
      </Container>
    );
  }

  return (
    <AppLayout>
      <Container fluid>
        <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={1}>Activity Groups</Title>
            <Text c="dimmed" size="sm">
              Manage activity groups for categorizing workout activities
            </Text>
          </div>
          
          {canCreateGroups && (
            <Button
              leftSection={<IconPlus size="1rem" />}
              onClick={() => setAddModalOpened(true)}
            >
              Add Group
            </Button>
          )}
        </Group>

        {/* Error Display */}
        {error && (
          <Text c="red" size="sm">
            Error: {error}
          </Text>
        )}

        {/* Activity Groups Table */}
        <ActivityGroupsTable
          activityGroups={activityGroups}
          loading={loading}
          onEdit={canCreateGroups ? handleEditClick : undefined}
          onDelete={canCreateGroups ? handleDeleteClick : undefined}
          onAdd={canCreateGroups ? () => setAddModalOpened(true) : undefined}
        />

        {/* Add Activity Group Modal */}
        <AddActivityGroupModal
          opened={addModalOpened}
          onClose={handleCloseModals}
          onSubmit={handleCreateActivityGroup}
          loading={loading}
        />

        {/* Edit Activity Group Modal */}
        <EditActivityGroupModal
          opened={editModalOpened}
          onClose={handleCloseModals}
          onSubmit={handleEditActivityGroup}
          activityGroup={selectedGroup}
          loading={loading}
        />

        {/* Delete Activity Group Modal */}
        <DeleteActivityGroupModal
          opened={deleteModalOpened}
          onClose={handleCloseModals}
          onConfirm={handleDeleteActivityGroup}
          activityGroup={selectedGroup}
          loading={loading}
        />
        </Stack>
      </Container>
    </AppLayout>
  );
}