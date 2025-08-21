import { api } from './api';

export interface User {
  _id: string;
  name: string;
  email: string;
  userType: 'admin' | 'gym_owner' | 'coach' | 'client';
  gymId?: {
    _id: string;
    name: string;
    location: string;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  userType: 'admin' | 'gym_owner' | 'coach' | 'client';
  gymId?: string;
  clientProfile?: {
    personalInfo?: any;
    membershipType?: string;
  };
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  userType?: 'admin' | 'gym_owner' | 'coach' | 'client';
  gymId?: string;
  isActive?: boolean;
  clientProfile?: {
    personalInfo?: any;
    membershipType?: string;
  };
}

export interface UsersListResponse {
  success: boolean;
  data: {
    users: User[];
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

export interface UserResponse {
  success: boolean;
  data: {
    user: User;
    clientProfile?: any;
  };
}

export interface UsersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  userType?: string;
  gymId?: string;
  sort?: string;
}

export const usersApi = {
  // Get users list
  getUsers: async (params: UsersQueryParams = {}): Promise<UsersListResponse> => {
    const queryParams = new URLSearchParams();
    
    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.search) queryParams.append('search', params.search);
    if (params.userType) queryParams.append('userType', params.userType);
    if (params.gymId) queryParams.append('gymId', params.gymId);
    if (params.sort) queryParams.append('sort', params.sort);

    const response = await api.get(`/api/users?${queryParams.toString()}`);
    return response.data;
  },

  // Get single user
  getUser: async (id: string): Promise<UserResponse> => {
    const response = await api.get(`/api/users/${id}`);
    return response.data;
  },

  // Create new user
  createUser: async (userData: CreateUserData): Promise<UserResponse> => {
    const response = await api.post('/api/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id: string, userData: UpdateUserData): Promise<UserResponse> => {
    const response = await api.put(`/api/users/${id}`, userData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/api/users/${id}`);
    return response.data;
  },

  // Reset user password
  resetUserPassword: async (id: string, newPassword: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post(`/api/users/${id}/reset-password`, { newPassword });
    return response.data;
  }
};

// Gym API for dropdown options
export interface Gym {
  _id: string;
  name: string;
  ownerId: string;
  isActive: boolean;
}

export interface GymsListResponse {
  success: boolean;
  data: {
    gyms: Gym[];
    pagination: any;
  };
}

export const gymsApi = {
  // Get gyms list for dropdowns
  getGyms: async (): Promise<GymsListResponse> => {
    const response = await api.get('/api/gyms?limit=100');
    return response.data;
  }
};