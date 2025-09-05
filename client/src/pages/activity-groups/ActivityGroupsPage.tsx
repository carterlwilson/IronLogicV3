import { useEffect } from 'react';
import { AppLayout } from '../../components/layout/AppLayout.tsx';
import { ActivityGroupsTable } from '../../components/activity-groups/ActivityGroupsTable.tsx';
import { useActivityGroups } from '../../hooks/useActivityGroups.ts';
import type { ActivityGroup } from '../../types/activities.ts';

export function ActivityGroupsPage() {
  const { 
    activityGroups, 
    loading, 
    fetchActivityGroups, 
    createActivityGroup, 
    updateActivityGroup, 
    deleteActivityGroup 
  } = useActivityGroups();

  useEffect(() => {
    const loadData = async () => {
      await fetchActivityGroups();
    };
    
    loadData();
  }, []); // Empty dependency array for initial load only

  const handleAddActivityGroup = () => {
    // TODO: Open create activity group modal
    console.log('Add activity group');
  };

  const handleEditActivityGroup = (activityGroup: ActivityGroup) => {
    // TODO: Open edit activity group modal
    console.log('Edit activity group:', activityGroup);
  };

  const handleDeleteActivityGroup = (activityGroup: ActivityGroup) => {
    // TODO: Implement delete confirmation and logic
    console.log('Delete activity group:', activityGroup);
  };

  const handleViewActivityGroup = (activityGroup: ActivityGroup) => {
    // TODO: Open view activity group modal
    console.log('View activity group:', activityGroup);
  };

  return (
    <AppLayout>
      <ActivityGroupsTable
        activityGroups={activityGroups}
        loading={loading}
        onAddActivityGroup={handleAddActivityGroup}
        onEditActivityGroup={handleEditActivityGroup}
        onDeleteActivityGroup={handleDeleteActivityGroup}
        onViewActivityGroup={handleViewActivityGroup}
      />
    </AppLayout>
  );
}
