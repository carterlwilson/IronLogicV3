import { api } from './api';
import type { ScheduleTemplate } from '../types/schedules';

// API request interfaces
export interface ScheduleTemplatesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  includeStats?: boolean;
  coachId?: string;
  locationId?: string;
  programId?: string;
}

export interface CreateScheduleTemplateData {
  name: string;
  description?: string;
  assignedCoachId?: string;
  timeslots: CreateTimeslotData[];
}

export interface CreateTimeslotData {
  dayOfWeek: number; // 1-7 (Monday-Sunday)
  startTime: string; // "09:00" format
  endTime: string;   // "10:00" format
  location: string;
  coachId?: string;
  maxCapacity: number;
  className?: string;
  notes?: string;
}

export interface UpdateScheduleTemplateData {
  name?: string;
  description?: string;
  assignedCoachId?: string;
  timeslots?: CreateTimeslotData[];
}

// API response interfaces
export interface ScheduleTemplatesListResponse {
  success: boolean;
  data: {
    templates: ScheduleTemplate[];
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

export interface ScheduleTemplateResponse {
  success: boolean;
  data: ScheduleTemplate;
  message?: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

// Schedule Templates API functions
export const scheduleTemplatesApi = {
  // Get schedule templates with filtering and pagination
  getScheduleTemplates: async (params: ScheduleTemplatesQueryParams = {}): Promise<ScheduleTemplatesListResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/schedule-templates?${searchParams.toString()}`);
    return response.data;
  },

  // Get single schedule template by ID
  getScheduleTemplate: async (id: string): Promise<ScheduleTemplateResponse> => {
    const response = await api.get(`/api/schedule-templates/${id}`);
    return response.data;
  },

  // Create new schedule template
  createScheduleTemplate: async (templateData: CreateScheduleTemplateData): Promise<ScheduleTemplateResponse> => {
    const response = await api.post('/api/schedule-templates', templateData);
    return response.data;
  },

  // Update existing schedule template
  updateScheduleTemplate: async (id: string, templateData: UpdateScheduleTemplateData): Promise<ScheduleTemplateResponse> => {
    const response = await api.put(`/api/schedule-templates/${id}`, templateData);
    return response.data;
  },

  // Delete schedule template
  deleteScheduleTemplate: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/schedule-templates/${id}`);
    return response.data;
  },

};