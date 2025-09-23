import { api } from './api';
import type { BenchmarkTemplate } from '../types/benchmarks';

// Core Client interfaces matching backend models
export interface Client {
  _id: string;
  userId: string;
  gymId: string;
  personalInfo: {
    dateOfBirth?: string;
    phone?: string;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    fitnessGoals?: string[];
    medicalConditions?: string[];
    preferences?: {
      preferredCoaches?: string[];
      workoutTimes?: string[];
      notificationPreferences?: {
        email: boolean;
        sms: boolean;
        push: boolean;
      };
    };
  };
  membershipInfo: {
    joinDate: string;
    membershipType?: string;
    isActive: boolean;
    freezeHistory?: Array<{
      startDate: string;
      endDate?: string;
      reason?: string;
    }>;
  };
  currentProgram?: {
    programId: string;
    startDate: string;
    currentWeek: number;
    currentDay: number;
    completedDays: number[];
    notes?: string;
  };
  activeBenchmarks: ClientBenchmark[];
  coachAssignments?: Array<{
    coachId: string;
    assignedDate: string;
    isActive: boolean;
    specialization?: string;
  }>;
  createdAt: string;
  updatedAt: string;
  // Populated fields (when requested)
  user?: {
    _id: string;
    name: string;
    email: string;
    userType: string;
    isActive: boolean;
  };
  gym?: {
    _id: string;
    name: string;
    location?: any;
  };
  program?: {
    _id: string;
    name: string;
    description?: string;
    blocks?: any[];
  };
  benchmarkTemplates?: BenchmarkTemplate[];
}

export interface ClientBenchmark {
  templateId: string;
  currentValue?: {
    weight?: number;
    time?: number;
    reps?: number;
    distance?: number;
  };
  lastUpdated?: string;
  targetValue?: {
    weight?: number;
    time?: number;
    reps?: number;
    distance?: number;
  };
  notes?: string;
  // Populated field
  template?: BenchmarkTemplate;
}

export interface ClientBenchmarkHistory {
  _id: string;
  clientId: string;
  templateId: string;
  value: {
    weight?: number;
    time?: number;
    reps?: number;
    distance?: number;
  };
  notes?: string;
  recordedAt: string;
  recordedBy: string;
  isActive: boolean;
  replacedBy?: string;
  createdAt: string;
  updatedAt: string;
  // Populated fields
  template?: BenchmarkTemplate;
  recordedByUser?: {
    _id: string;
    name: string;
    email: string;
  };
}

export interface ClientProgramProgress {
  programId: string;
  startDate: string;
  currentWeek: number;
  currentDay: number;
  completedDays: number[];
  notes?: string;
  // Populated field
  program?: {
    _id: string;
    name: string;
    description?: string;
    blocks?: any[];
  };
}

// API request parameter interfaces
export interface ClientsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  membershipStatus?: 'active' | 'inactive';
  membershipType?: string;
  gymId?: string;
  sort?: string;
}

export interface ClientBenchmarksQueryParams {
  page?: number;
  limit?: number;
  templateId?: string;
}

export interface UpdateClientData {
  personalInfo?: Partial<Client['personalInfo']>;
  membershipInfo?: Partial<Client['membershipInfo']>;
  currentProgram?: Partial<Client['currentProgram']>;
  activeBenchmarks?: ClientBenchmark[];
  coachAssignments?: Client['coachAssignments'];
  notes?: string;
}

export interface AddClientBenchmarkData {
  templateId: string;
  value: {
    weight?: number;
    time?: number;
    reps?: number;
    distance?: number;
  };
  notes?: string;
}

export interface UpdateClientBenchmarkData {
  value?: {
    weight?: number;
    time?: number;
    reps?: number;
    distance?: number;
  };
  notes?: string;
}

export interface ReplaceClientBenchmarkData {
  value: {
    weight?: number;
    time?: number;
    reps?: number;
    distance?: number;
  };
  notes?: string;
}

export interface UpdateProgramProgressData {
  currentWeek?: number;
  currentDay?: number;
  completedDays?: number[];
  notes?: string;
}

// API response interfaces
export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ClientsListResponse {
  success: boolean;
  data: {
    clients: Client[];
    pagination: PaginationInfo;
  };
}

export interface ClientResponse {
  success: boolean;
  data: {
    client: Client;
  };
  message?: string;
}

export interface ClientBenchmarksResponse {
  success: boolean;
  data: {
    benchmarks: ClientBenchmarkHistory[];
    pagination: PaginationInfo;
  };
}

export interface ClientBenchmarkResponse {
  success: boolean;
  data: {
    benchmark: ClientBenchmarkHistory;
  };
  message?: string;
}

export interface ClientProgramProgressResponse {
  success: boolean;
  data: {
    programProgress: ClientProgramProgress | null;
    message?: string;
  };
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

// Clients API functions
export const clientsApi = {
  // Get clients with filtering and pagination
  getClients: async (params: ClientsQueryParams = {}): Promise<ClientsListResponse> => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/clients?${searchParams.toString()}`);
    return response.data;
  },

  // Get single client by ID with full profile
  getClient: async (id: string): Promise<ClientResponse> => {
    const response = await api.get(`/api/clients/${id}`);
    return response.data;
  },

  // Update client profile
  updateClient: async (id: string, clientData: UpdateClientData): Promise<ClientResponse> => {
    const response = await api.put(`/api/clients/${id}`, clientData);
    return response.data;
  },

  // Get client's benchmark history
  getClientBenchmarks: async (id: string, params: ClientBenchmarksQueryParams = {}): Promise<ClientBenchmarksResponse> => {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, value.toString());
      }
    });

    const response = await api.get(`/api/clients/${id}/benchmarks?${searchParams.toString()}`);
    return response.data;
  },

  // Add new benchmark for client
  addClientBenchmark: async (id: string, benchmarkData: AddClientBenchmarkData): Promise<ClientBenchmarkResponse> => {
    const response = await api.post(`/api/clients/${id}/benchmarks`, benchmarkData);
    return response.data;
  },

  // Update existing benchmark (24-hour rule applies)
  updateClientBenchmark: async (
    id: string,
    benchmarkId: string,
    benchmarkData: UpdateClientBenchmarkData
  ): Promise<ClientBenchmarkResponse> => {
    const response = await api.put(`/api/clients/${id}/benchmarks/${benchmarkId}`, benchmarkData);
    return response.data;
  },

  // Replace old benchmark with new one (after 24-hour window)
  replaceClientBenchmark: async (
    id: string,
    benchmarkId: string,
    benchmarkData: ReplaceClientBenchmarkData
  ): Promise<ClientBenchmarkResponse> => {
    const response = await api.post(`/api/clients/${id}/benchmarks/${benchmarkId}/replace`, benchmarkData);
    return response.data;
  },

  // Get client's current program progress
  getClientProgramProgress: async (id: string): Promise<ClientProgramProgressResponse> => {
    const response = await api.get(`/api/clients/${id}/program-progress`);
    return response.data;
  },

  // Update client's program progress
  updateClientProgramProgress: async (
    id: string,
    progressData: UpdateProgramProgressData
  ): Promise<ClientProgramProgressResponse> => {
    const response = await api.put(`/api/clients/${id}/program-progress`, progressData);
    return response.data;
  }
};

// Helper functions for client data manipulation
export const clientHelpers = {
  // Check if benchmark can be edited (24-hour rule)
  canEditBenchmark: (benchmark: ClientBenchmarkHistory): boolean => {
    const hoursSinceCreation = (Date.now() - new Date(benchmark.recordedAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 24;
  },

  // Format benchmark value for display
  formatBenchmarkValue: (value: ClientBenchmarkHistory['value'], template?: BenchmarkTemplate): string => {
    if (!template) return 'N/A';

    switch (template.type) {
      case 'weight':
        return value.weight ? `${value.weight} ${template.unit}` : 'N/A';
      case 'time':
        return value.time ? `${value.time} ${template.unit}` : 'N/A';
      case 'reps':
        return value.reps ? `${value.reps} ${template.unit}` : 'N/A';
      default:
        return 'N/A';
    }
  },

  // Calculate program completion percentage
  calculateProgramCompletion: (currentProgram?: ClientProgramProgress): number => {
    if (!currentProgram || !currentProgram.program?.blocks) return 0;

    const totalDays = currentProgram.program.blocks.reduce((total, block) => {
      return total + (block.weeks?.length || 0) * 7; // Assuming 7 days per week
    }, 0);

    if (totalDays === 0) return 0;

    const completedDays = currentProgram.completedDays.length;
    return Math.round((completedDays / totalDays) * 100);
  },

  // Get client's active status
  isClientActive: (client: Client): boolean => {
    return client.membershipInfo.isActive && client.user?.isActive !== false;
  },

  // Get client's display name
  getClientDisplayName: (client: Client): string => {
    if (client.user?.name) {
      return client.user.name;
    }
    return client.user?.email || 'Unknown Client';
  },

  // Filter benchmarks by template type
  filterBenchmarksByType: (
    benchmarks: ClientBenchmarkHistory[],
    type: BenchmarkTemplate['type']
  ): ClientBenchmarkHistory[] => {
    return benchmarks.filter(b => b.template?.type === type);
  },

  // Get latest benchmark for template
  getLatestBenchmark: (
    benchmarks: ClientBenchmarkHistory[],
    templateId: string
  ): ClientBenchmarkHistory | undefined => {
    return benchmarks
      .filter(b => b.templateId === templateId && b.isActive)
      .sort((a, b) => new Date(b.recordedAt).getTime() - new Date(a.recordedAt).getTime())[0];
  }
};