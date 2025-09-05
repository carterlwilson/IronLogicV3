import { useEffect, useCallback, useState } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { ActivitiesTable } from '../../components/activities/ActivitiesTable.tsx';
import { AddActivityModal } from '../../components/activities/AddActivityModal.tsx';
import { EditActivityModal } from '../../components/activities/EditActivityModal.tsx';
import { ViewActivityModal } from '../../components/activities/ViewActivityModal.tsx';
import { DeleteActivityModal } from '../../components/activities/DeleteActivityModal.tsx';
import { useActivities } from '../../hooks/useActivities.ts';
import { useActivityGroups } from '../../hooks/useActivityGroups.ts';
import { useBenchmarkTemplates } from '../../hooks/useBenchmarkTemplates.ts';
import type { ActivityTemplate } from '../../types/activities.ts';
import type { CreateActivityData, UpdateActivityData } from '../../lib/activities-api.ts';

export function ActivitiesPage() {
  const { 
    activities, 
    loading, 
    pagination,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity
  } = useActivities();
  
  const { activityGroups, fetchActivityGroups } = useActivityGroups();
  const { benchmarkTemplates, fetchBenchmarkTemplates } = useBenchmarkTemplates();
  
  // Modal state management
  const [modals, setModals] = useState({
    add: false,
    edit: false,
    view: false,
    delete: false
  });
  const [selectedActivity, setSelectedActivity] = useState<ActivityTemplate | null>(null);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchActivities({ page: 1, limit: 50 }),
        fetchActivityGroups(),
        fetchBenchmarkTemplates()
      ]);
    };
    
    loadData();
  }, []); // Empty dependency array for initial load only

  const handleSearch = useCallback(async (filters: Record<string, any>) => {
    await fetchActivities({ ...filters, page: 1, limit: 50 });
  }, [fetchActivities]);

  const handlePageChange = useCallback(async (page: number) => {
    await fetchActivities({ page, limit: 50 });
  }, [fetchActivities]);

  // Modal handlers
  const handleAddActivity = () => {
    setModals(prev => ({ ...prev, add: true }));
  };

  const handleEditActivity = (activity: ActivityTemplate) => {
    setSelectedActivity(activity);
    setModals(prev => ({ ...prev, edit: true }));
  };

  const handleDeleteActivity = (activity: ActivityTemplate) => {
    setSelectedActivity(activity);
    setModals(prev => ({ ...prev, delete: true }));
  };

  const handleViewActivity = (activity: ActivityTemplate) => {
    setSelectedActivity(activity);
    setModals(prev => ({ ...prev, view: true }));
  };
  
  // Modal close handler
  const closeModal = (modalType: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
    if (modalType !== 'add') {
      setSelectedActivity(null);
    }
  };
  
  // API handlers
  const handleCreateActivity = async (activityData: CreateActivityData): Promise<boolean> => {
    const success = await createActivity(activityData);
    if (success) {
      await fetchActivities({ page: 1, limit: 50 }); // Refresh list
    }
    return success;
  };
  
  const handleUpdateActivity = async (activityData: UpdateActivityData): Promise<boolean> => {
    if (!selectedActivity) return false;
    const success = await updateActivity(selectedActivity._id, activityData);
    if (success) {
      await fetchActivities({ page: 1, limit: 50 }); // Refresh list
    }
    return success;
  };
  
  const handleConfirmDelete = async (): Promise<boolean> => {
    if (!selectedActivity) return false;
    const success = await deleteActivity(selectedActivity._id);
    if (success) {
      await fetchActivities({ page: 1, limit: 50 }); // Refresh list
    }
    return success;
  };

  return (
    <AppLayout>
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
        opened={modals.add}
        onClose={() => closeModal('add')}
        onSubmit={handleCreateActivity}
        activityGroups={activityGroups || []}
        benchmarkTemplates={benchmarkTemplates}
        loading={loading}
      />
      
      {/* Edit Activity Modal */}
      {selectedActivity && (
        <EditActivityModal
          opened={modals.edit}
          onClose={() => closeModal('edit')}
          onSubmit={handleUpdateActivity}
          activity={selectedActivity}
          activityGroups={activityGroups || []}
          benchmarkTemplates={benchmarkTemplates}
          loading={loading}
        />
      )}
      
      {/* View Activity Modal */}
      {selectedActivity && (
        <ViewActivityModal
          opened={modals.view}
          onClose={() => closeModal('view')}
          activity={selectedActivity}
        />
      )}
      
      {/* Delete Activity Modal */}
      {selectedActivity && (
        <DeleteActivityModal
          opened={modals.delete}
          onClose={() => closeModal('delete')}
          onConfirm={handleConfirmDelete}
          activity={selectedActivity}
          loading={loading}
        />
      )}
    </AppLayout>
  );
}
