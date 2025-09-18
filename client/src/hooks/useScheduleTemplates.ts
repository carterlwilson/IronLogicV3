import { useState, useCallback } from 'react';
import { scheduleTemplatesApi, type ScheduleTemplatesQueryParams, type CreateScheduleTemplateData, type UpdateScheduleTemplateData } from '../lib/schedule-templates-api';
import type { ScheduleTemplate } from '../types/schedules';

interface UseScheduleTemplatesReturn {
  scheduleTemplates: ScheduleTemplate[];
  loading: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null;
  fetchScheduleTemplates: (params?: ScheduleTemplatesQueryParams) => Promise<void>;
  createScheduleTemplate: (templateData: CreateScheduleTemplateData) => Promise<ScheduleTemplate>;
  updateScheduleTemplate: (id: string, templateData: UpdateScheduleTemplateData) => Promise<ScheduleTemplate>;
  deleteScheduleTemplate: (id: string) => Promise<void>;
}

export function useScheduleTemplates(): UseScheduleTemplatesReturn {
  const [scheduleTemplates, setScheduleTemplates] = useState<ScheduleTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    page: number;
    limit: number;
    total: number;
    pages: number;
  } | null>(null);

  const fetchScheduleTemplates = useCallback(async (params: ScheduleTemplatesQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await scheduleTemplatesApi.getScheduleTemplates(params);
      
      if (response.success) {
        setScheduleTemplates(response.data.templates);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
      } else {
        setError('Failed to fetch schedule templates');
      }
    } catch (err) {
      console.error('Error fetching schedule templates:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createScheduleTemplate = useCallback(async (templateData: CreateScheduleTemplateData): Promise<ScheduleTemplate> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await scheduleTemplatesApi.createScheduleTemplate(templateData);
      
      if (response.success) {
        // Refresh the list to include the new template
        await fetchScheduleTemplates();
        return response.data.template;
      } else {
        throw new Error(response.message || 'Failed to create schedule template');
      }
    } catch (err) {
      console.error('Error creating schedule template:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fetchScheduleTemplates]);

  const updateScheduleTemplate = useCallback(async (id: string, templateData: UpdateScheduleTemplateData): Promise<ScheduleTemplate> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await scheduleTemplatesApi.updateScheduleTemplate(id, templateData);
      
      if (response.success) {
        // Update the template in the local state
        setScheduleTemplates(prev =>
          prev.map(template =>
            template._id === id ? response.data.template : template
          )
        );
        return response.data.template;
      } else {
        throw new Error(response.message || 'Failed to update schedule template');
      }
    } catch (err) {
      console.error('Error updating schedule template:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteScheduleTemplate = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await scheduleTemplatesApi.deleteScheduleTemplate(id);
      
      if (response.success) {
        // Remove the template from the local state
        setScheduleTemplates(prev => prev.filter(template => template._id !== id));
      } else {
        throw new Error(response.message || 'Failed to delete schedule template');
      }
    } catch (err) {
      console.error('Error deleting schedule template:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);


  return {
    scheduleTemplates,
    loading,
    error,
    pagination,
    fetchScheduleTemplates,
    createScheduleTemplate,
    updateScheduleTemplate,
    deleteScheduleTemplate
  };
}