'use client';

import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { ActivityTemplate, ActivityGroup } from '../types/activities';
import { 
  activitiesApi,
  type CreateActivityData,
  type UpdateActivityData,
  type ActivitiesQueryParams
} from '../lib/activities-api';

// Helper to generate temporary IDs for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create optimistic activity from create data
const createOptimisticActivity = (activityData: CreateActivityData): ActivityTemplate => {
  const activity: ActivityTemplate = {
    _id: generateTempId(),
    gymId: activityData.gymId && activityData.gymId !== 'global' ? activityData.gymId : null,
    name: activityData.name,
    type: activityData.type,
    description: activityData.description,
    notes: activityData.notes,
    activityGroupId: activityData.activityGroupId,
    activityGroupName: 'Loading...', // Placeholder - will be updated when real data comes back
    benchmarkTemplateId: activityData.benchmarkTemplateId || null,
    benchmarkTemplateName: null, // Will be populated by server
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  return activity;
};

interface UseActivitiesReturn {
  // Data
  activities: ActivityTemplate[];
  activityGroups: ActivityGroup[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null;

  // Actions
  fetchActivities: (params?: ActivitiesQueryParams) => Promise<void>;
  fetchActivityGroups: (gymId?: string) => Promise<void>;
  createActivity: (activityData: CreateActivityData) => Promise<boolean>;
  updateActivity: (id: string, activityData: UpdateActivityData) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;
  getActivity: (id: string) => Promise<ActivityTemplate | null>;
}

export function useActivities(): UseActivitiesReturn {
  const [activities, setActivities] = useState<ActivityTemplate[]>([]);
  const [activityGroups, setActivityGroups] = useState<ActivityGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  } | null>(null);

  // Fetch activities with optional parameters
  const fetchActivities = useCallback(async (params: ActivitiesQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await activitiesApi.getActivities(params);

      if (response.success) {
        setActivities(response.data.activities);
        setPagination(response.data.pagination);
      } else {
        throw new Error('Failed to fetch activities');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch activities';
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

  // Fetch activity groups
  const fetchActivityGroups = useCallback(async (gymId?: string) => {
    try {
      setError(null);
      
      const response = await activitiesApi.getActivityGroups(gymId);
      
      if (response.success) {
        setActivityGroups(response.data.groups);
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
    }
  }, []);

  // Create new activity with optimistic loading
  const createActivity = useCallback(async (activityData: CreateActivityData): Promise<boolean> => {
    // Create optimistic activity and add it immediately
    const optimisticActivity = createOptimisticActivity(activityData);
    setActivities(prev => [optimisticActivity, ...prev]);

    try {
      setError(null);
      
      const response = await activitiesApi.createActivity(activityData);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Activity created successfully',
          color: 'green',
        });
        
        // Replace optimistic activity with real data from server
        setActivities(prev => prev.map(activity => 
          activity._id === optimisticActivity._id ? response.data.activity : activity
        ));
        
        return true;
      } else {
        throw new Error('Failed to create activity');
      }
    } catch (err: any) {
      // Remove optimistic activity on error
      setActivities(prev => prev.filter(activity => activity._id !== optimisticActivity._id));
      
      const message = err.response?.data?.message || err.message || 'Failed to create activity';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, []);

  // Update existing activity with optimistic loading
  const updateActivity = useCallback(async (id: string, activityData: UpdateActivityData): Promise<boolean> => {
    // Find current activity to store for rollback
    const currentActivity = activities.find(activity => activity._id === id);
    if (!currentActivity) return false;

    // Apply optimistic update immediately
    setActivities(prev => prev.map(activity => {
      if (activity._id === id) {
        return {
          ...activity,
          // Only update fields that are provided
          ...(activityData.name && { name: activityData.name }),
          ...(activityData.activityGroupId && { activityGroupId: activityData.activityGroupId }),
          ...(activityData.type && { type: activityData.type }),
          ...(activityData.description !== undefined && { description: activityData.description }),
          ...(activityData.notes !== undefined && { notes: activityData.notes }),
          updatedAt: new Date().toISOString()
        };
      }
      return activity;
    }));

    try {
      setError(null);
      
      const response = await activitiesApi.updateActivity(id, activityData);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Activity updated successfully',
          color: 'green',
        });
        
        // Replace optimistic update with real data from server
        setActivities(prev => prev.map(activity => 
          activity._id === id ? response.data.activity : activity
        ));
        
        return true;
      } else {
        throw new Error('Failed to update activity');
      }
    } catch (err: any) {
      // Rollback optimistic update on error
      setActivities(prev => prev.map(activity => 
        activity._id === id ? currentActivity : activity
      ));
      
      const message = err.response?.data?.message || err.message || 'Failed to update activity';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [activities]);

  // Delete activity with optimistic loading
  const deleteActivity = useCallback(async (id: string): Promise<boolean> => {
    // Find current activity to store for rollback
    const currentActivity = activities.find(activity => activity._id === id);
    if (!currentActivity) return false;

    // Remove activity optimistically
    setActivities(prev => prev.filter(activity => activity._id !== id));

    try {
      setError(null);
      
      const response = await activitiesApi.deleteActivity(id);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Activity deleted successfully',
          color: 'green',
        });
        
        // Activity is already removed, no need to update state again
        return true;
      } else {
        throw new Error('Failed to delete activity');
      }
    } catch (err: any) {
      // Restore activity on error
      setActivities(prev => {
        // Add back in original position (or at the end if we can't determine position)
        const activityExists = prev.some(activity => activity._id === id);
        if (!activityExists) {
          return [...prev, currentActivity].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return prev;
      });
      
      const message = err.response?.data?.message || err.message || 'Failed to delete activity';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [activities]);

  // Get single activity by ID
  const getActivity = useCallback(async (id: string): Promise<ActivityTemplate | null> => {
    try {
      setError(null);
      
      const response = await activitiesApi.getActivity(id);
      
      if (response.success) {
        return response.data.activity;
      } else {
        throw new Error('Failed to fetch activity');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch activity';
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
    activities,
    activityGroups,
    loading,
    error,
    pagination,

    // Actions
    fetchActivities,
    fetchActivityGroups,
    createActivity,
    updateActivity,
    deleteActivity,
    getActivity,
  };
}