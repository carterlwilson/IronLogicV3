'use client';

import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { 
  benchmarkTemplatesApi, 
  BenchmarkTemplate,
  CreateBenchmarkTemplateData, 
  UpdateBenchmarkTemplateData, 
  BenchmarkTemplatesQueryParams 
} from '../lib/benchmark-templates-api';

// Helper to generate temporary IDs for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create optimistic benchmark template from create data
const createOptimisticBenchmarkTemplate = (templateData: CreateBenchmarkTemplateData): BenchmarkTemplate => {
  const template: BenchmarkTemplate = {
    _id: generateTempId(),
    name: templateData.name,
    type: templateData.type,
    unit: templateData.unit,
    description: templateData.description,
    instructions: templateData.instructions,
    notes: templateData.notes,
    tags: templateData.tags || [],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Always include gymId for gym-scoped templates
  if (templateData.gymId) {
    template.gymId = templateData.gymId;
  }

  return template;
};

interface BenchmarkTag {
  tag: string;
  count: number;
}

interface UseBenchmarkTemplatesReturn {
  // Data
  benchmarkTemplates: BenchmarkTemplate[];
  tags: BenchmarkTag[];
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
  fetchBenchmarkTemplates: (params?: BenchmarkTemplatesQueryParams) => Promise<void>;
  fetchBenchmarkTags: (gymId?: string) => Promise<void>;
  createBenchmarkTemplate: (templateData: CreateBenchmarkTemplateData) => Promise<boolean>;
  updateBenchmarkTemplate: (id: string, templateData: UpdateBenchmarkTemplateData) => Promise<boolean>;
  deleteBenchmarkTemplate: (id: string) => Promise<boolean>;
  getBenchmarkTemplate: (id: string) => Promise<BenchmarkTemplate | null>;
}

export function useBenchmarkTemplates(): UseBenchmarkTemplatesReturn {
  const [benchmarkTemplates, setBenchmarkTemplates] = useState<BenchmarkTemplate[]>([]);
  const [tags, setTags] = useState<BenchmarkTag[]>([]);
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

  // Fetch benchmark templates with optional parameters
  const fetchBenchmarkTemplates = useCallback(async (params: BenchmarkTemplatesQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await benchmarkTemplatesApi.getBenchmarkTemplates(params);
      
      if (response.success) {
        setBenchmarkTemplates(response.data.benchmarkTemplates);
        setPagination(response.data.pagination);
      } else {
        throw new Error('Failed to fetch benchmark templates');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch benchmark templates';
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

  // Fetch benchmark tags
  const fetchBenchmarkTags = useCallback(async (gymId?: string) => {
    try {
      setError(null);
      
      const response = await benchmarkTemplatesApi.getBenchmarkTags(gymId);
      
      if (response.success) {
        setTags(response.data.tags);
      } else {
        throw new Error('Failed to fetch benchmark tags');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch benchmark tags';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  }, []);

  // Create new benchmark template with optimistic loading
  const createBenchmarkTemplate = useCallback(async (templateData: CreateBenchmarkTemplateData): Promise<boolean> => {
    // Create optimistic template and add it immediately
    const optimisticTemplate = createOptimisticBenchmarkTemplate(templateData);
    setBenchmarkTemplates(prev => [optimisticTemplate, ...prev]);

    try {
      setError(null);
      
      const response = await benchmarkTemplatesApi.createBenchmarkTemplate(templateData);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Benchmark template created successfully',
          color: 'green',
        });
        
        // Replace optimistic template with real data from server
        setBenchmarkTemplates(prev => prev.map(template => 
          template._id === optimisticTemplate._id ? response.data.benchmarkTemplate : template
        ));
        
        return true;
      } else {
        throw new Error('Failed to create benchmark template');
      }
    } catch (err: any) {
      // Remove optimistic template on error
      setBenchmarkTemplates(prev => prev.filter(template => template._id !== optimisticTemplate._id));
      
      const message = err.response?.data?.message || err.message || 'Failed to create benchmark template';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, []);

  // Update existing benchmark template with optimistic loading
  const updateBenchmarkTemplate = useCallback(async (id: string, templateData: UpdateBenchmarkTemplateData): Promise<boolean> => {
    // Find current template to store for rollback
    const currentTemplate = benchmarkTemplates.find(template => template._id === id);
    if (!currentTemplate) return false;

    // Apply optimistic update immediately
    setBenchmarkTemplates(prev => prev.map(template => {
      if (template._id === id) {
        return {
          ...template,
          // Only update fields that are provided
          ...(templateData.name && { name: templateData.name }),
          ...(templateData.type && { type: templateData.type }),
          ...(templateData.unit && { unit: templateData.unit }),
          ...(templateData.description !== undefined && { description: templateData.description }),
          ...(templateData.instructions !== undefined && { instructions: templateData.instructions }),
          ...(templateData.notes !== undefined && { notes: templateData.notes }),
          ...(templateData.tags !== undefined && { tags: templateData.tags }),
          updatedAt: new Date().toISOString()
        };
      }
      return template;
    }));

    try {
      setError(null);
      
      const response = await benchmarkTemplatesApi.updateBenchmarkTemplate(id, templateData);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Benchmark template updated successfully',
          color: 'green',
        });
        
        // Replace optimistic update with real data from server
        setBenchmarkTemplates(prev => prev.map(template => 
          template._id === id ? response.data.benchmarkTemplate : template
        ));
        
        return true;
      } else {
        throw new Error('Failed to update benchmark template');
      }
    } catch (err: any) {
      // Rollback optimistic update on error
      setBenchmarkTemplates(prev => prev.map(template => 
        template._id === id ? currentTemplate : template
      ));
      
      const message = err.response?.data?.message || err.message || 'Failed to update benchmark template';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [benchmarkTemplates]);

  // Delete benchmark template with optimistic loading
  const deleteBenchmarkTemplate = useCallback(async (id: string): Promise<boolean> => {
    // Find current template to store for rollback
    const currentTemplate = benchmarkTemplates.find(template => template._id === id);
    if (!currentTemplate) return false;

    // Remove template optimistically
    setBenchmarkTemplates(prev => prev.filter(template => template._id !== id));

    try {
      setError(null);
      
      const response = await benchmarkTemplatesApi.deleteBenchmarkTemplate(id);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Benchmark template deleted successfully',
          color: 'green',
        });
        
        // Template is already removed, no need to update state again
        return true;
      } else {
        throw new Error('Failed to delete benchmark template');
      }
    } catch (err: any) {
      // Restore template on error
      setBenchmarkTemplates(prev => {
        // Add back in original position (or at the end if we can't determine position)
        const templateExists = prev.some(template => template._id === id);
        if (!templateExists) {
          return [...prev, currentTemplate].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return prev;
      });
      
      const message = err.response?.data?.message || err.message || 'Failed to delete benchmark template';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [benchmarkTemplates]);

  // Get single benchmark template by ID
  const getBenchmarkTemplate = useCallback(async (id: string): Promise<BenchmarkTemplate | null> => {
    try {
      setError(null);
      
      const response = await benchmarkTemplatesApi.getBenchmarkTemplate(id);
      
      if (response.success) {
        return response.data.benchmarkTemplate;
      } else {
        throw new Error('Failed to fetch benchmark template');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch benchmark template';
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
    benchmarkTemplates,
    tags,
    loading,
    error,
    pagination,

    // Actions
    fetchBenchmarkTemplates,
    fetchBenchmarkTags,
    createBenchmarkTemplate,
    updateBenchmarkTemplate,
    deleteBenchmarkTemplate,
    getBenchmarkTemplate,
  };
}