import { api } from './api';
import { WorkoutProgram } from '../../../shared/src/types';

// API request/response types
export interface WorkoutProgramsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isTemplate?: boolean;
  gymId?: string;
  sort?: string;
}

export interface WorkoutProgramsResponse {
  programs: WorkoutProgram[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface CreateWorkoutProgramData {
  name: string;
  description?: string;
  isTemplate?: boolean;
  gymId?: string;
  blocks?: any[];
}

export interface UpdateWorkoutProgramData extends Partial<CreateWorkoutProgramData> {
  durationWeeks?: number;
  blocks?: any[];
  version?: number;
}

export interface CopyWorkoutProgramData {
  name: string;
  description?: string;
  isTemplate?: boolean;
}

// API Functions
export const getWorkoutPrograms = async (params: WorkoutProgramsQueryParams = {}): Promise<WorkoutProgramsResponse> => {
  const queryParams = new URLSearchParams();
  
  if (params.page) queryParams.append('page', params.page.toString());
  if (params.limit) queryParams.append('limit', params.limit.toString());
  if (params.search) queryParams.append('search', params.search);
  if (params.isTemplate !== undefined) queryParams.append('isTemplate', params.isTemplate.toString());
  if (params.gymId) queryParams.append('gymId', params.gymId);
  if (params.sort) queryParams.append('sort', params.sort);

  const response = await api.get(`/api/workout-programs?${queryParams.toString()}`);
  return response.data;
};

export const getWorkoutProgram = async (id: string): Promise<WorkoutProgram> => {
  const response = await api.get(`/api/workout-programs/${id}`);
  return response.data;
};

export const createWorkoutProgram = async (data: CreateWorkoutProgramData): Promise<WorkoutProgram> => {
  const response = await api.post('/api/workout-programs', data);
  return response.data;
};

export const updateWorkoutProgram = async (id: string, data: UpdateWorkoutProgramData): Promise<WorkoutProgram> => {
  const response = await api.put(`/api/workout-programs/${id}`, data);
  return response.data;
};

export const deleteWorkoutProgram = async (id: string): Promise<void> => {
  await api.delete(`/api/workout-programs/${id}`);
};

export const copyWorkoutProgram = async (id: string, data: CopyWorkoutProgramData): Promise<WorkoutProgram> => {
  const response = await api.post(`/api/workout-programs/${id}/copy`, data);
  return response.data;
};

export const getWorkoutProgramVolume = async (id: string): Promise<any> => {
  const response = await api.get(`/api/workout-programs/${id}/volume`);
  return response.data;
};

// Export types for use in components
export type {
  WorkoutProgram,
  WorkoutProgramsQueryParams,
  WorkoutProgramsResponse,
  CreateWorkoutProgramData,
  UpdateWorkoutProgramData,
  CopyWorkoutProgramData,
};