import { api } from './api';
import { ActivityGroup } from '../../../shared/src/types';

// API request/response interfaces
export interface CreateActivityGroupData {
  name: string;
  gymId?: string; // Optional - if not provided, creates global group (admin only)
  description?: string;
}

export interface UpdateActivityGroupData {
  name?: string;
  description?: string;
}

export interface ActivityGroupsListResponse {
  success: boolean;
  data: {
    activityGroups: ActivityGroup[];
  };
}

export interface ActivityGroupResponse {
  success: boolean;
  data: {
    activityGroup: ActivityGroup;
  };
  message?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

// Activity Groups API functions
export const activityGroupsApi = {
  // Get activity groups with optional gym filtering
  getActivityGroups: async (gymId?: string): Promise<ActivityGroupsListResponse> => {
    const params = gymId ? `?gymId=${gymId}` : '';
    const response = await api.get(`/api/activity-groups${params}`);
    return response.data;
  },

  // Get single activity group by ID
  getActivityGroup: async (id: string): Promise<ActivityGroupResponse> => {
    const response = await api.get(`/api/activity-groups/${id}`);
    return response.data;
  },

  // Create new activity group
  createActivityGroup: async (groupData: CreateActivityGroupData): Promise<ActivityGroupResponse> => {
    const response = await api.post('/api/activity-groups', groupData);
    return response.data;
  },

  // Update existing activity group
  updateActivityGroup: async (id: string, groupData: UpdateActivityGroupData): Promise<ActivityGroupResponse> => {
    const response = await api.put(`/api/activity-groups/${id}`, groupData);
    return response.data;
  },

  // Delete activity group (soft delete)
  deleteActivityGroup: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/activity-groups/${id}`);
    return response.data;
  }
};

// Export types for use in components
export type { ActivityGroup, CreateActivityGroupData, UpdateActivityGroupData };