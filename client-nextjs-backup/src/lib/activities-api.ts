import { api } from './api';
import { ActivityTemplate, ActivityGroup } from '../../../shared/src/types';

// API request/response interfaces
export interface ActivitiesQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  type?: 'primary lift' | 'accessory lift' | 'conditioning' | 'diagnostic';
  activityGroupId?: string; // Filter by activity group ID
  gymId?: string;
}

export interface CreateActivityData {
  name: string;
  gymId?: string; // ID of the gym this activity belongs to
  activityGroupId: string; // ID of the activity group
  benchmarkTemplateId?: string | null; // ID of the benchmark template for intensity calculations
  type: 'primary lift' | 'accessory lift' | 'conditioning' | 'diagnostic';
  description?: string | undefined;
  instructions?: string | undefined;
}

export interface UpdateActivityData {
  name?: string;
  activityGroupId?: string; // ID of the activity group
  benchmarkTemplateId?: string | null; // ID of the benchmark template for intensity calculations
  type?: 'primary lift' | 'accessory lift' | 'conditioning' | 'diagnostic';
  description?: string | undefined;
  instructions?: string | undefined;
}

export interface ActivitiesListResponse {
  success: boolean;
  data: {
    activities: ActivityTemplate[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  };
}

export interface ActivityResponse {
  success: boolean;
  data: {
    activity: ActivityTemplate;
  };
  message?: string;
}

export interface ActivityGroupsResponse {
  success: boolean;
  data: {
    groups: ActivityGroup[];
  };
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

// Activities API functions
export const activitiesApi = {
  // Get activities with filtering and pagination
  getActivities: async (params: ActivitiesQueryParams = {}): Promise<ActivitiesListResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          value.forEach(v => searchParams.append(key, v.toString()));
        } else {
          searchParams.append(key, value.toString());
        }
      }
    });

    const response = await api.get(`/api/activities?${searchParams.toString()}`);
    return response.data;
  },

  // Get single activity by ID
  getActivity: async (id: string): Promise<ActivityResponse> => {
    const response = await api.get(`/api/activities/${id}`);
    return response.data;
  },

  // Create new activity
  createActivity: async (activityData: CreateActivityData): Promise<ActivityResponse> => {
    const response = await api.post('/api/activities', activityData);
    return response.data;
  },

  // Update existing activity
  updateActivity: async (id: string, activityData: UpdateActivityData): Promise<ActivityResponse> => {
    const response = await api.put(`/api/activities/${id}`, activityData);
    return response.data;
  },

  // Delete activity (soft delete)
  deleteActivity: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/activities/${id}`);
    return response.data;
  },

  // Get activity groups
  getActivityGroups: async (gymId?: string): Promise<ActivityGroupsResponse> => {
    const params = gymId ? `?gymId=${gymId}` : '';
    const response = await api.get(`/api/activity-groups${params}`);
    return response.data;
  }
};

// Export types for use in components
export type { ActivityTemplate, ActivityGroup };