'use client';

import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { 
  gymsApi, 
  gymOwnersApi,
  Gym, 
  CreateGymData, 
  UpdateGymData, 
  GymsQueryParams,
  GymOwner 
} from '../lib/gyms-api';

// Helper to generate temporary IDs for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create optimistic gym from create data
const createOptimisticGym = (gymData: CreateGymData): Gym => {
  const gym: Gym = {
    _id: generateTempId(),
    name: gymData.name,
    ownerId: gymData.ownerId ? {
      _id: gymData.ownerId,
      name: 'Loading...',
      email: 'Loading...'
    } : null,
    description: gymData.description || '',
    phone: gymData.phone || '',
    email: gymData.email || '',
    website: gymData.website || '',
    locations: [],
    settings: {
      timezone: gymData.settings?.timezone || 'America/New_York',
      currency: gymData.settings?.currency || 'USD',
      membershipTypes: gymData.settings?.membershipTypes || ['Monthly', 'Annual'],
      classCapacityDefault: gymData.settings?.classCapacityDefault || 20,
      bookingWindowDays: gymData.settings?.bookingWindowDays || 7,
      cancellationPolicy: gymData.settings?.cancellationPolicy || {
        enabled: true,
        hoursBefore: 24,
        penaltyType: 'none',
        penaltyAmount: 0
      }
    },
    statistics: {
      coachCount: 0,
      clientCount: 0,
      totalMembers: 0,
      activePrograms: 0,
      lastUpdated: new Date().toISOString()
    },
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Only add address if it exists
  if (gymData.address) {
    gym.address = gymData.address;
  }

  return gym;
};

interface UseGymsReturn {
  // Data
  gyms: Gym[];
  gymOwners: GymOwner[];
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
  fetchGyms: (params?: GymsQueryParams) => Promise<void>;
  fetchGymOwners: () => Promise<void>;
  createGym: (gymData: CreateGymData) => Promise<boolean>;
  updateGym: (id: string, gymData: UpdateGymData) => Promise<boolean>;
  deleteGym: (id: string) => Promise<boolean>;
  getGymStats: (id: string) => Promise<any>;
}

export function useGyms(): UseGymsReturn {
  const [gyms, setGyms] = useState<Gym[]>([]);
  const [gymOwners, setGymOwners] = useState<GymOwner[]>([]);
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

  // Fetch gyms with optional parameters
  const fetchGyms = useCallback(async (params: GymsQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await gymsApi.getGyms(params);
      
      if (response.success) {
        setGyms(response.data.gyms);
        setPagination(response.data.pagination);
      } else {
        throw new Error('Failed to fetch gyms');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch gyms';
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

  // Fetch gym owners for dropdowns
  const fetchGymOwners = useCallback(async () => {
    try {
      setError(null);
      
      const response = await gymOwnersApi.getGymOwners();
      
      if (response.success) {
        setGymOwners(response.data.users);
      } else {
        throw new Error('Failed to fetch gym owners');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch gym owners';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
    }
  }, []);

  // Create new gym with optimistic loading
  const createGym = useCallback(async (gymData: CreateGymData): Promise<boolean> => {
    // Create optimistic gym and add it immediately
    const optimisticGym = createOptimisticGym(gymData);
    setGyms(prev => [optimisticGym, ...prev]);

    try {
      setError(null);
      
      const response = await gymsApi.createGym(gymData);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Gym created successfully',
          color: 'green',
        });
        
        // Replace optimistic gym with real data from server
        setGyms(prev => prev.map(gym => 
          gym._id === optimisticGym._id ? response.data.gym : gym
        ));
        
        return true;
      } else {
        throw new Error('Failed to create gym');
      }
    } catch (err: any) {
      // Remove optimistic gym on error
      setGyms(prev => prev.filter(gym => gym._id !== optimisticGym._id));
      
      const message = err.response?.data?.message || err.message || 'Failed to create gym';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, []);

  // Update existing gym with optimistic loading
  const updateGym = useCallback(async (id: string, gymData: UpdateGymData): Promise<boolean> => {
    // Find current gym to store for rollback
    const currentGym = gyms.find(gym => gym._id === id);
    if (!currentGym) return false;

    // Apply optimistic update immediately
    setGyms(prev => prev.map(gym => {
      if (gym._id === id) {
        return {
          ...gym,
          // Only update fields that are provided
          ...(gymData.name && { name: gymData.name }),
          ...(gymData.ownerId !== undefined && { 
            ownerId: gymData.ownerId ? {
              _id: gymData.ownerId,
              name: gym.ownerId?.name || 'Loading...',
              email: gym.ownerId?.email || 'Loading...'
            } : null
          }),
          ...(gymData.description !== undefined && { description: gymData.description }),
          ...(gymData.phone !== undefined && { phone: gymData.phone }),
          ...(gymData.email !== undefined && { email: gymData.email }),
          ...(gymData.website !== undefined && { website: gymData.website }),
          // Handle nested address updates
          ...(gymData.address && { 
            address: gym.address ? { ...gym.address, ...gymData.address } : gymData.address 
          }),
          // Handle nested settings updates
          ...(gymData.settings && { 
            settings: { ...gym.settings, ...gymData.settings } 
          }),
          updatedAt: new Date().toISOString()
        };
      }
      return gym;
    }));

    try {
      setError(null);
      
      const response = await gymsApi.updateGym(id, gymData);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Gym updated successfully',
          color: 'green',
        });
        
        // Replace optimistic update with real data from server
        setGyms(prev => prev.map(gym => 
          gym._id === id ? response.data.gym : gym
        ));
        
        return true;
      } else {
        throw new Error('Failed to update gym');
      }
    } catch (err: any) {
      // Rollback optimistic update on error
      setGyms(prev => prev.map(gym => 
        gym._id === id ? currentGym : gym
      ));
      
      const message = err.response?.data?.message || err.message || 'Failed to update gym';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [gyms]);

  // Delete gym with optimistic loading
  const deleteGym = useCallback(async (id: string): Promise<boolean> => {
    // Find current gym to store for rollback
    const currentGym = gyms.find(gym => gym._id === id);
    if (!currentGym) return false;

    // Remove gym optimistically
    setGyms(prev => prev.filter(gym => gym._id !== id));

    try {
      setError(null);
      
      const response = await gymsApi.deleteGym(id);
      
      if (response.success) {
        notifications.show({
          title: 'Success',
          message: 'Gym deleted successfully',
          color: 'green',
        });
        
        // Gym is already removed, no need to update state again
        return true;
      } else {
        throw new Error('Failed to delete gym');
      }
    } catch (err: any) {
      // Restore gym on error
      setGyms(prev => {
        // Add back in original position (or at the end if we can't determine position)
        const gymExists = prev.some(gym => gym._id === id);
        if (!gymExists) {
          return [...prev, currentGym].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return prev;
      });
      
      const message = err.response?.data?.message || err.message || 'Failed to delete gym';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [gyms]);

  // Get gym statistics
  const getGymStats = useCallback(async (id: string) => {
    try {
      setError(null);
      
      const response = await gymsApi.getGymStats(id);
      
      if (response.success) {
        return response.data.statistics;
      } else {
        throw new Error('Failed to fetch gym statistics');
      }
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch gym statistics';
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
    gyms,
    gymOwners,
    loading,
    error,
    pagination,

    // Actions
    fetchGyms,
    fetchGymOwners,
    createGym,
    updateGym,
    deleteGym,
    getGymStats,
  };
}