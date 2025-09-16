import { useState, useCallback } from 'react';
import { weeklySchedulesApi, type WeeklySchedulesQueryParams, type CreateWeeklyScheduleData, type UpdateWeeklyScheduleData, type EnrollClientData } from '../lib/weekly-schedules-api';
import type { WeeklySchedule, ScheduleStats } from '../types/schedules';

interface UseWeeklySchedulesReturn {
  weeklySchedules: WeeklySchedule[];
  scheduleStats: ScheduleStats | null;
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  fetchWeeklySchedules: (params?: WeeklySchedulesQueryParams) => Promise<void>;
  getWeeklySchedule: (id: string) => Promise<WeeklySchedule>;
  createWeeklySchedule: (scheduleData: CreateWeeklyScheduleData) => Promise<WeeklySchedule>;
  updateWeeklySchedule: (id: string, scheduleData: UpdateWeeklyScheduleData) => Promise<WeeklySchedule>;
  deleteWeeklySchedule: (id: string) => Promise<void>;
  enrollClient: (scheduleId: string, timeslotId: string, enrollmentData: EnrollClientData) => Promise<WeeklySchedule>;
  cancelEnrollment: (scheduleId: string, timeslotId: string, clientId: string) => Promise<WeeklySchedule>;
  fetchScheduleStats: () => Promise<void>;
}

export function useWeeklySchedules(): UseWeeklySchedulesReturn {
  const [weeklySchedules, setWeeklySchedules] = useState<WeeklySchedule[]>([]);
  const [scheduleStats, setScheduleStats] = useState<ScheduleStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const fetchWeeklySchedules = useCallback(async (params: WeeklySchedulesQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weeklySchedulesApi.getWeeklySchedules(params);
      
      if (response.success) {
        setWeeklySchedules(response.data);
        setPagination(response.pagination);
      } else {
        setError('Failed to fetch weekly schedules');
      }
    } catch (err) {
      console.error('Error fetching weekly schedules:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const getWeeklySchedule = useCallback(async (id: string): Promise<WeeklySchedule> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weeklySchedulesApi.getWeeklySchedule(id);
      
      if (response.success) {
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to fetch weekly schedule');
      }
    } catch (err) {
      console.error('Error fetching weekly schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createWeeklySchedule = useCallback(async (scheduleData: CreateWeeklyScheduleData): Promise<WeeklySchedule> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weeklySchedulesApi.createWeeklySchedule(scheduleData);
      
      if (response.success) {
        // Refresh the list to include the new schedule
        await fetchWeeklySchedules();
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to create weekly schedule');
      }
    } catch (err) {
      console.error('Error creating weekly schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchWeeklySchedules]);

  const updateWeeklySchedule = useCallback(async (id: string, scheduleData: UpdateWeeklyScheduleData): Promise<WeeklySchedule> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weeklySchedulesApi.updateWeeklySchedule(id, scheduleData);
      
      if (response.success) {
        // Update the schedule in the local state
        setWeeklySchedules(prev => 
          prev.map(schedule => 
            schedule._id === id ? response.data : schedule
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to update weekly schedule');
      }
    } catch (err) {
      console.error('Error updating weekly schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteWeeklySchedule = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weeklySchedulesApi.deleteWeeklySchedule(id);
      
      if (response.success) {
        // Remove the schedule from the local state
        setWeeklySchedules(prev => prev.filter(schedule => schedule._id !== id));
      } else {
        throw new Error(response.message || 'Failed to delete weekly schedule');
      }
    } catch (err) {
      console.error('Error deleting weekly schedule:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const enrollClient = useCallback(async (scheduleId: string, timeslotId: string, enrollmentData: EnrollClientData): Promise<WeeklySchedule> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weeklySchedulesApi.enrollClient(scheduleId, timeslotId, enrollmentData);
      
      if (response.success) {
        // Update the schedule in the local state
        setWeeklySchedules(prev => 
          prev.map(schedule => 
            schedule._id === scheduleId ? response.data : schedule
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to enroll client');
      }
    } catch (err) {
      console.error('Error enrolling client:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelEnrollment = useCallback(async (scheduleId: string, timeslotId: string, clientId: string): Promise<WeeklySchedule> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weeklySchedulesApi.cancelEnrollment(scheduleId, timeslotId, clientId);
      
      if (response.success) {
        // Update the schedule in the local state
        setWeeklySchedules(prev => 
          prev.map(schedule => 
            schedule._id === scheduleId ? response.data : schedule
          )
        );
        return response.data;
      } else {
        throw new Error(response.message || 'Failed to cancel enrollment');
      }
    } catch (err) {
      console.error('Error cancelling enrollment:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchScheduleStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await weeklySchedulesApi.getScheduleStats();
      
      if (response.success) {
        setScheduleStats(response.data);
      } else {
        setError('Failed to fetch schedule statistics');
      }
    } catch (err) {
      console.error('Error fetching schedule stats:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    weeklySchedules,
    scheduleStats,
    loading,
    error,
    pagination,
    fetchWeeklySchedules,
    getWeeklySchedule,
    createWeeklySchedule,
    updateWeeklySchedule,
    deleteWeeklySchedule,
    enrollClient,
    cancelEnrollment,
    fetchScheduleStats
  };
}