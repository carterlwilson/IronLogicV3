import { api } from './api';

// Address interface
export interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
}

// Operating hours interface
export interface OperatingHours {
  monday?: { open?: string; close?: string; };
  tuesday?: { open?: string; close?: string; };
  wednesday?: { open?: string; close?: string; };
  thursday?: { open?: string; close?: string; };
  friday?: { open?: string; close?: string; };
  saturday?: { open?: string; close?: string; };
  sunday?: { open?: string; close?: string; };
}

// Location interface
export interface Location {
  locationId: string;
  name: string;
  address?: Address;
  capacity?: number;
  amenities?: string[];
  operatingHours?: OperatingHours;
  isActive: boolean;
  createdAt?: string;
}

// Gym interface
export interface Gym {
  _id: string;
  name: string;
  ownerId: {
    _id: string;
    name: string;
    email: string;
  } | null;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: Address;
  locations: Location[];
  settings: {
    timezone?: string;
    currency?: string;
    membershipTypes?: string[];
    classCapacityDefault?: number;
    bookingWindowDays?: number;
    cancellationPolicy?: {
      enabled: boolean;
      hoursBefore: number;
      penaltyType?: 'none' | 'fee' | 'credit_loss';
      penaltyAmount?: number;
    };
  };
  statistics: {
    coachCount: number;
    clientCount: number;
    totalMembers: number;
    activePrograms: number;
    lastUpdated?: string;
  };
  subscription?: {
    plan: string;
    status: string;
    startDate?: string;
    endDate?: string;
    maxMembers?: number;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Create gym data interface
export interface CreateGymData {
  name: string;
  ownerId?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: Address;
  settings?: {
    timezone?: string;
    currency?: string;
    membershipTypes?: string[];
    classCapacityDefault?: number;
    bookingWindowDays?: number;
    cancellationPolicy?: {
      enabled: boolean;
      hoursBefore: number;
      penaltyType?: 'none' | 'fee' | 'credit_loss';
      penaltyAmount?: number;
    };
  };
}

// Update gym data interface
export interface UpdateGymData {
  name?: string;
  ownerId?: string;
  description?: string;
  phone?: string;
  email?: string;
  website?: string;
  address?: Address;
  locations?: Location[];
  settings?: {
    timezone?: string;
    currency?: string;
    membershipTypes?: string[];
    classCapacityDefault?: number;
    bookingWindowDays?: number;
    cancellationPolicy?: {
      enabled: boolean;
      hoursBefore: number;
      penaltyType?: 'none' | 'fee' | 'credit_loss';
      penaltyAmount?: number;
    };
  };
}

// API response interfaces
export interface GymsListResponse {
  success: boolean;
  data: {
    gyms: Gym[];
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

export interface GymResponse {
  success: boolean;
  data: {
    gym: Gym;
  };
}

export interface GymStatsResponse {
  success: boolean;
  data: {
    statistics: {
      coachCount: number;
      clientCount: number;
      totalMembers: number;
      activePrograms: number;
      lastUpdated: string;
    };
  };
}

// Query parameters interface
export interface GymsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sort?: string;
}

// API functions - matching exact server routes
export const gymsApi = {
  // GET /api/gyms - List gyms (admin: all, owner: their gym)
  getGyms: async (params: GymsQueryParams = {}): Promise<GymsListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await api.get(`/api/gyms?${queryParams.toString()}`);
    return response.data;
  },

  // GET /api/gyms/:id - Get single gym with locations
  getGym: async (id: string): Promise<GymResponse> => {
    const response = await api.get(`/api/gyms/${id}`);
    return response.data;
  },

  // POST /api/gyms - Create new gym (admin only)
  createGym: async (gymData: CreateGymData): Promise<GymResponse> => {
    const response = await api.post('/api/gyms', gymData);
    return response.data;
  },

  // PUT /api/gyms/:id - Update gym details
  updateGym: async (id: string, gymData: UpdateGymData): Promise<GymResponse> => {
    const response = await api.put(`/api/gyms/${id}`, gymData);
    return response.data;
  },

  // DELETE /api/gyms/:id - Soft delete gym (admin only)
  deleteGym: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/gyms/${id}`);
    return response.data;
  },

  // GET /api/gyms/:id/stats - Gym statistics
  getGymStats: async (id: string): Promise<GymStatsResponse> => {
    const response = await api.get(`/api/gyms/${id}/stats`);
    return response.data;
  }
};

// Helper API for getting gym owners (for dropdowns)
export interface GymOwner {
  _id: string;
  name: string;
  email: string;
}

export interface GymOwnersResponse {
  success: boolean;
  data: {
    users: GymOwner[];
  };
}

export const gymOwnersApi = {
  // Get gym owners for dropdown
  getGymOwners: async (): Promise<GymOwnersResponse> => {
    const response = await api.get('/api/users?userType=gym_owner&limit=100');
    return response.data;
  }
};