import { api } from './api';
import type { WeeklySchedule, ScheduleStats } from '../types/schedules';

// API request interfaces
export interface WeeklySchedulesQueryParams {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
  weekStart?: string; // ISO date string
  weekEnd?: string;   // ISO date string
  templateId?: string;
  coachId?: string;
}

export interface CreateWeeklyScheduleData {
  templateId: string;
  assignedCoachId?: string; // Optional coach override - if not provided, uses template's assignedCoachId
  notes?: string;
}

export interface UpdateWeeklyScheduleData {
  notes?: string;
  status?: 'draft' | 'published' | 'active' | 'completed' | 'cancelled';
  assignedCoachId?: string;
  timeslots?: Array<{
    timeslotId: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    location: string;
    coachId?: string;
    maxCapacity: number;
    className?: string;
    notes?: string;
    isActive: boolean;
  }>;
}

export interface EnrollClientData {
  clientId: string;
  notes?: string;
}

// API response interfaces
export interface WeeklySchedulesListResponse {
  success: boolean;
  data: WeeklySchedule[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface WeeklyScheduleResponse {
  success: boolean;
  data: WeeklySchedule;
  message?: string;
}

export interface ScheduleStatsResponse {
  success: boolean;
  data: ScheduleStats;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

// Weekly Schedules API functions
export const weeklySchedulesApi = {
  // Get weekly schedules with filtering and pagination
  getWeeklySchedules: async (params: WeeklySchedulesQueryParams = {}): Promise<WeeklySchedulesListResponse> => {
    const searchParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/weekly-schedules?${searchParams.toString()}`);
    return response.data;
  },

  // Get single weekly schedule by ID
  getWeeklySchedule: async (id: string): Promise<WeeklyScheduleResponse> => {
    const response = await api.get(`/api/weekly-schedules/${id}`);
    return response.data;
  },

  // Create new weekly schedule from template
  createWeeklySchedule: async (scheduleData: CreateWeeklyScheduleData): Promise<WeeklyScheduleResponse> => {
    const response = await api.post('/api/weekly-schedules', scheduleData);
    return response.data;
  },

  // Update existing weekly schedule
  updateWeeklySchedule: async (id: string, scheduleData: UpdateWeeklyScheduleData): Promise<WeeklyScheduleResponse> => {
    const response = await api.put(`/api/weekly-schedules/${id}`, scheduleData);
    return response.data;
  },

  // Delete weekly schedule
  deleteWeeklySchedule: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/weekly-schedules/${id}`);
    return response.data;
  },

  // Enroll client in timeslot
  enrollClient: async (scheduleId: string, timeslotId: string, enrollmentData: EnrollClientData): Promise<WeeklyScheduleResponse> => {
    const response = await api.post(`/api/weekly-schedules/${scheduleId}/timeslots/${timeslotId}/enroll`, enrollmentData);
    return response.data;
  },

  // Cancel client enrollment
  cancelEnrollment: async (scheduleId: string, timeslotId: string, clientId: string): Promise<WeeklyScheduleResponse> => {
    const response = await api.delete(`/api/weekly-schedules/${scheduleId}/timeslots/${timeslotId}/clients/${clientId}`);
    return response.data;
  },

  // Get schedule statistics for dashboard
  getScheduleStats: async (): Promise<ScheduleStatsResponse> => {
    const response = await api.get('/api/weekly-schedules/stats');
    return response.data;
  }
};