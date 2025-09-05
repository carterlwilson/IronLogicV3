import { api } from './api';

// Type definitions for benchmark templates
export interface BenchmarkTemplate {
  _id: string;
  name: string;
  gymId?: {
    _id: string;
    name: string;
  } | string | null;
  type: 'weight' | 'time' | 'reps';
  unit: 'lbs' | 'kg' | 'seconds' | 'reps';
  description?: string;
  instructions?: string;
  notes?: string;
  tags: string[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: {
    _id: string;
    name: string;
  };
}

// API request/response interfaces
export interface BenchmarkTemplatesQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  search?: string;
  type?: 'weight' | 'time' | 'reps';
  unit?: 'lbs' | 'kg' | 'seconds' | 'reps';
  tags?: string[];
  gymId?: string;
}

export interface CreateBenchmarkTemplateData {
  name: string;
  gymId?: string; // 'global' for global templates, specific gymId for gym templates
  type: 'weight' | 'time' | 'reps';
  unit: 'lbs' | 'kg' | 'seconds' | 'reps';
  description?: string;
  instructions?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateBenchmarkTemplateData {
  name?: string;
  type?: 'weight' | 'time' | 'reps';
  unit?: 'lbs' | 'kg' | 'seconds' | 'reps';
  description?: string;
  instructions?: string;
  notes?: string;
  tags?: string[];
}

export interface BenchmarkTemplatesListResponse {
  success: boolean;
  data: {
    benchmarkTemplates: BenchmarkTemplate[];
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

export interface BenchmarkTemplateResponse {
  success: boolean;
  data: {
    benchmarkTemplate: BenchmarkTemplate;
  };
  message?: string;
}

export interface BenchmarkTagsResponse {
  success: boolean;
  data: {
    tags: Array<{
      tag: string;
      count: number;
    }>;
  };
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

// Benchmark Templates API functions
export const benchmarkTemplatesApi = {
  // Get benchmark templates with filtering and pagination
  getBenchmarkTemplates: async (params: BenchmarkTemplatesQueryParams = {}): Promise<BenchmarkTemplatesListResponse> => {
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

    const response = await api.get(`/api/benchmark-templates?${searchParams.toString()}`);
    return response.data;
  },

  // Get single benchmark template by ID
  getBenchmarkTemplate: async (id: string): Promise<BenchmarkTemplateResponse> => {
    const response = await api.get(`/api/benchmark-templates/${id}`);
    return response.data;
  },

  // Create new benchmark template
  createBenchmarkTemplate: async (templateData: CreateBenchmarkTemplateData): Promise<BenchmarkTemplateResponse> => {
    const response = await api.post('/api/benchmark-templates', templateData);
    return response.data;
  },

  // Update existing benchmark template
  updateBenchmarkTemplate: async (id: string, templateData: UpdateBenchmarkTemplateData): Promise<BenchmarkTemplateResponse> => {
    const response = await api.put(`/api/benchmark-templates/${id}`, templateData);
    return response.data;
  },

  // Delete benchmark template
  deleteBenchmarkTemplate: async (id: string): Promise<ApiResponse> => {
    const response = await api.delete(`/api/benchmark-templates/${id}`);
    return response.data;
  },

  // Get benchmark tags
  getBenchmarkTags: async (gymId?: string): Promise<BenchmarkTagsResponse> => {
    const params = gymId ? `?gymId=${gymId}` : '';
    const response = await api.get(`/api/benchmark-templates/tags${params}`);
    return response.data;
  }
};

// Export types for use in components
export type { BenchmarkTemplate };