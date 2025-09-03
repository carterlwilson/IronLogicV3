'use client';

import { useState, useEffect, useCallback } from 'react';
import { Container, Stack, Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';
import { useAuth } from '../../lib/auth-context';
import { useActivities } from '../../hooks/useActivities';
import { useGyms } from '../../hooks/useGyms';
import { useBenchmarkTemplates } from '../../hooks/useBenchmarkTemplates';
import { ActivityTemplate, ActivitiesQueryParams } from '../../lib/activities-api';
import { ActivitiesTable } from '../../components/activities/ActivitiesTable';
import { AddActivityModal } from '../../components/activities/AddActivityModal';
import { EditActivityModal } from '../../components/activities/EditActivityModal';
import { DeleteActivityModal } from '../../components/activities/DeleteActivityModal';
import { ViewActivityModal } from '../../components/activities/ViewActivityModal';
import { AppLayout } from '../../components/layout/AppLayout';

export default function ActivitiesPage() {
  const { user, loading: authLoading } = useAuth();
  const { gyms, fetchGyms } = useGyms();
  const { benchmarkTemplates, fetchBenchmarkTemplates } = useBenchmarkTemplates();
  
  const {
    activities,
    activityGroups,
    loading,
    pagination,
    fetchActivities,
    fetchActivityGroups,
    createActivity,
    updateActivity,
    deleteActivity
  } = useActivities();

  // Modal states
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityTemplate | null>(null);

  // Current search/filter parameters
  const [currentParams, setCurrentParams] = useState<ActivitiesQueryParams>({
    page: 1,
    limit: 10,
    sort: 'name'
  });

  // Check if user has access to activities management
  const hasAccess = user && ['admin', 'gym_owner', 'coach'].includes(user.userType);

  // Load data when component mounts or user changes
  useEffect(() => {
    if (hasAccess) {
      fetchActivities(currentParams);
      fetchActivityGroups(user.userType === 'admin' ? undefined : (user.gymId ? String(user.gymId) : undefined));
      fetchBenchmarkTemplates({ page: 1, limit: 1000 }); // Load all benchmark templates
      
      // Load gyms if user is admin (needed for gym selection)
      if (user.userType === 'admin') {
        fetchGyms();
      }
    }
  }, [user, hasAccess, fetchActivities, fetchActivityGroups, fetchBenchmarkTemplates, fetchGyms]);

  // Handle search/filter changes
  const handleSearch = useCallback((filters: any) => {
    const newParams: ActivitiesQueryParams = {
      page: 1, // Reset to first page when searching
      limit: 10,
      sort: 'name',
      ...filters
    };
    setCurrentParams(newParams);
    fetchActivities(newParams);
  }, [fetchActivities]);

  // Handle page changes
  const handlePageChange = useCallback((page: number) => {
    setCurrentParams(prev => {
      const newParams = { ...prev, page };
      fetchActivities(newParams);
      return newParams;
    });
  }, [fetchActivities]);

  // Handle add activity
  const handleAddActivity = () => {
    setAddModalOpen(true);
  };

  // Handle edit activity
  const handleEditActivity = (activity: ActivityTemplate) => {
    setSelectedActivity(activity);
    setEditModalOpen(true);
  };

  // Handle delete activity
  const handleDeleteActivity = (activity: ActivityTemplate) => {
    setSelectedActivity(activity);
    setDeleteModalOpen(true);
  };

  // Handle view activity
  const handleViewActivity = (activity: ActivityTemplate) => {
    setSelectedActivity(activity);
    setViewModalOpen(true);
  };

  // Create gym options for admin users
  const gymOptions = gyms.map(gym => ({
    value: gym._id,
    label: gym.name
  }));

  // Show loading state during auth
  if (authLoading) {
    return null;
  }

  // Show access denied for unauthorized users
  if (!hasAccess) {
    return (
      <Container size="lg" py="xl">
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Access Denied"
          color="red"
          variant="light"
        >
          You don't have permission to access activity templates management.
          Only admins, gym owners, and coaches can manage activity templates.
        </Alert>
      </Container>
    );
  }

  return (
    <AppLayout>
      <Container size="xl" py="md">
        <Stack gap="lg">
          <ActivitiesTable
            activities={activities}
            activityGroups={activityGroups}
            loading={loading}
            pagination={pagination}
            onSearch={handleSearch}
            onPageChange={handlePageChange}
            onAddActivity={handleAddActivity}
            onEditActivity={handleEditActivity}
            onDeleteActivity={handleDeleteActivity}
            onViewActivity={handleViewActivity}
          />

          {/* Add Activity Modal */}
          <AddActivityModal
            opened={addModalOpen}
            onClose={() => setAddModalOpen(false)}
            onSubmit={createActivity}
            activityGroups={activityGroups}
            benchmarkTemplates={benchmarkTemplates as any}
            gymOptions={gymOptions}
            loading={loading}
          />

          {/* Edit Activity Modal */}
          <EditActivityModal
            opened={editModalOpen}
            onClose={() => {
              setEditModalOpen(false);
              setSelectedActivity(null);
            }}
            onSubmit={updateActivity}
            activity={selectedActivity}
            activityGroups={activityGroups}
            benchmarkTemplates={benchmarkTemplates as any}
            loading={loading}
          />

          {/* Delete Activity Modal */}
          <DeleteActivityModal
            opened={deleteModalOpen}
            onClose={() => {
              setDeleteModalOpen(false);
              setSelectedActivity(null);
            }}
            onConfirm={deleteActivity}
            activity={selectedActivity}
            loading={loading}
          />

          {/* View Activity Modal */}
          <ViewActivityModal
            opened={viewModalOpen}
            onClose={() => {
              setViewModalOpen(false);
              setSelectedActivity(null);
            }}
            onEdit={handleEditActivity}
            activity={selectedActivity}
          />
        </Stack>
      </Container>
    </AppLayout>
  );
}