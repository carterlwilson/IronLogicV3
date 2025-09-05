'use client';

import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { 
  activityGroupsApi, 
  type CreateActivityGroupData,
  type UpdateActivityGroupData
} from '../lib/activity-groups-api';
import { type ActivityGroup } from '../types/activities'

// Helper to generate temporary IDs for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create optimistic activity group from create data
const createOptimisticActivityGroup = (groupData: CreateActivityGroupData): ActivityGroup => {
  return {
    _id: generateTempId(),
    name: groupData.name,
    gymId: groupData.gymId || null,
    description: groupData.description,
    count: 0,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
};

interface UseActivityGroupsReturn {
  // Data
  activityGroups: ActivityGroup[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchActivityGroups: (gymId?: string) => Promise<void>;
  createActivityGroup: (groupData: CreateActivityGroupData) => Promise<boolean>;
  updateActivityGroup: (id: string, groupData: UpdateActivityGroupData) => Promise<boolean>;
  deleteActivityGroup: (id: string) => Promise<boolean>;
  getActivityGroup: (id: string) => Promise<ActivityGroup | null>;
}

export function useActivityGroups(): UseActivityGroupsReturn {
  const [activityGroups, setActivityGroups] = useState<ActivityGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch activity groups with optional gym filtering
  const fetchActivityGroups = useCallback(async (gymId?: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await activityGroupsApi.getActivityGroups(gymId);
      console.log('groups', response);
      if (response.success) {
        setActivityGroups(response.data.activityGroups);
      } else {
        throw new Error('Failed to fetch activity groups');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch activity groups';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Create new activity group with optimistic loading
  const createActivityGroup = useCallback(async (groupData: CreateActivityGroupData): Promise<boolean> => {
    // Create optimistic activity group and add it immediately
    const optimisticGroup = createOptimisticActivityGroup(groupData);
    setActivityGroups(prev => [optimisticGroup, ...prev]);

    try {
      setError(null);
      
      const response = await activityGroupsApi.createActivityGroup(groupData);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Activity group created successfully',
          color: 'green',
        });
        
        // Replace optimistic group with real data from server
        setActivityGroups(prev => prev.map(group => 
          group._id === optimisticGroup._id ? response.data.activityGroup : group
        ));
        
        return true;
      } else {
        throw new Error('Failed to create activity group');
      }
    } catch (err: any) {
      // Remove optimistic group on error
      setActivityGroups(prev => prev.filter(group => group._id !== optimisticGroup._id));
      
      const message = err.response?.data?.message || err.message || 'Failed to create activity group';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, []);

  // Update existing activity group with optimistic loading
  const updateActivityGroup = useCallback(async (id: string, groupData: UpdateActivityGroupData): Promise<boolean> => {
    // Find current group to store for rollback
    const currentGroup = activityGroups.find(group => group._id === id);
    if (!currentGroup) return false;

    // Apply optimistic update immediately
    setActivityGroups(prev => prev.map(group => {
      if (group._id === id) {
        return {
          ...group,
          // Only update fields that are provided
          ...(groupData.name && { name: groupData.name }),
          ...(groupData.description !== undefined && { description: groupData.description }),
          updatedAt: new Date().toISOString()
        };
      }
      return group;
    }));

    try {
      setError(null);
      
      const response = await activityGroupsApi.updateActivityGroup(id, groupData);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Activity group updated successfully',
          color: 'green',
        });
        
        // Replace optimistic update with real data from server
        setActivityGroups(prev => prev.map(group => 
          group._id === id ? response.data.activityGroup : group
        ));
        
        return true;
      } else {
        throw new Error('Failed to update activity group');
      }
    } catch (err: any) {
      // Rollback optimistic update on error
      setActivityGroups(prev => prev.map(group => 
        group._id === id ? currentGroup : group
      ));
      
      const message = err.response?.data?.message || err.message || 'Failed to update activity group';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [activityGroups]);

  // Delete activity group with optimistic loading
  const deleteActivityGroup = useCallback(async (id: string): Promise<boolean> => {
    // Find current group to store for rollback
    const currentGroup = activityGroups.find(group => group._id === id);
    if (!currentGroup) return false;

    // Remove group optimistically
    setActivityGroups(prev => prev.filter(group => group._id !== id));

    try {
      setError(null);
      
      const response = await activityGroupsApi.deleteActivityGroup(id);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Activity group deleted successfully',
          color: 'green',
        });
        
        // Group is already removed, no need to update state again
        return true;
      } else {
        throw new Error('Failed to delete activity group');
      }
    } catch (err: any) {
      // Restore group on error
      setActivityGroups(prev => {
        // Add back in original position (or at the end if we can't determine position)
        const groupExists = prev.some(group => group._id === id);
        if (!groupExists) {
          return [...prev, currentGroup].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return prev;
      });
      
      const message = err.response?.data?.message || err.message || 'Failed to delete activity group';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [activityGroups]);

  // Get single activity group by ID
  const getActivityGroup = useCallback(async (id: string): Promise<ActivityGroup | null> => {
    try {
      setError(null);
      
      const response = await activityGroupsApi.getActivityGroup(id);
      
      if (response.success) {
        return response.data.activityGroup;
      } else {
        throw new Error('Failed to fetch activity group');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch activity group';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return null;
    }
  }, []);

  return {
    // Data
    activityGroups,
    loading,
    error,

    // Actions
    fetchActivityGroups,
    createActivityGroup,
    updateActivityGroup,
    deleteActivityGroup,
    getActivityGroup,
  };
}