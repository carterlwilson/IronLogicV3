import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {
            refreshToken,
          });

          const { accessToken, refreshToken: newRefreshToken } = response.data.data;
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);
          
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  userType: 'admin' | 'gym_owner' | 'coach' | 'client';
  gymId?: string | undefined;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: User;
    accessToken: string;
    refreshToken: string;
    expiresIn: string;
  };
  errors?: string[];
}

export interface User {
  _id: string;
  email: string;
  name: string;
  userType: 'admin' | 'gym_owner' | 'coach' | 'client';
  gymId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export const authApi = {
  login: (data: LoginData) => 
    api.post<AuthResponse>('/api/auth/login', data),
  
  register: (data: RegisterData) => 
    api.post<AuthResponse>('/api/auth/register', data),
  
  logout: (refreshToken: string) => 
    api.post('/api/auth/logout', { refreshToken }),
  
  forgotPassword: (email: string) => 
    api.post('/api/auth/forgot-password', { email }),
  
  resetPassword: (token: string, password: string) => 
    api.post('/api/auth/reset-password', { token, password }),
  
  me: () => 
    api.get<{ success: boolean; data: { user: User } }>('/api/auth/me'),
  
  validatePassword: (password: string) => 
    api.post<{ success: boolean; data: { isValid: boolean; errors: string[] } }>('/api/auth/validate-password', { password }),
};