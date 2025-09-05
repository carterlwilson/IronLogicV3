import { useState, useCallback } from 'react';
import { usersApi, type CreateUserData, type UpdateUserData, type UsersQueryParams } from '../lib/users-api';
import type { User } from '../types/auth';
import { notifications } from '@mantine/notifications';

// Helper to generate temporary IDs for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create optimistic user from create data
const createOptimisticUser = (userData: CreateUserData): User => {
  const user: User = {
    _id: generateTempId(),
    name: userData.name,
    email: userData.email,
    userType: userData.userType,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Only add gymId if it exists
  if (userData.gymId) {
    user.gymId = {
      _id: userData.gymId,
      name: 'Loading...',
      location: 'Loading...'
    };
  }

  return user;
};

interface UsersState {
  users: User[];
  totalUsers: number;
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
}

export const useUsers = () => {
  const [state, setState] = useState<UsersState>({
    users: [],
    totalUsers: 0,
    loading: false,
    error: null,
    pagination: null
  });

  const fetchUsers = useCallback(async (params: UsersQueryParams = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await usersApi.getUsers(params);
      setState(prev => ({
        ...prev,
        users: response.data.users,
        totalUsers: response.data.pagination.total,
        pagination: response.data.pagination,
        loading: false
      }));
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to fetch users';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
    }
  }, []);

  const createUser = useCallback(async (userData: CreateUserData) => {
    // Create optimistic user and add it immediately
    const optimisticUser = createOptimisticUser(userData);
    setState(prev => ({ 
      ...prev, 
      users: [optimisticUser, ...prev.users],
      totalUsers: prev.totalUsers + 1
    }));
    
    try {
      const response = await usersApi.createUser(userData);
      notifications.show({
        title: 'Success',
        message: 'User created successfully',
        color: 'green'
      });
      
      // Replace optimistic user with real data from server
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user._id === optimisticUser._id ? response.data.user : user
        )
      }));
      
      return true;
    } catch (error: any) {
      // Remove optimistic user on error
      setState(prev => ({
        ...prev,
        users: prev.users.filter(user => user._id !== optimisticUser._id),
        totalUsers: prev.totalUsers - 1
      }));
      
      const errorMessage = error.response?.data?.message || 'Failed to create user';
      setState(prev => ({ ...prev, error: errorMessage }));
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      return false;
    }
  }, []);

  const updateUser = useCallback(async (id: string, userData: UpdateUserData) => {
    // Find current user to store for rollback
    const currentUser = state.users.find(user => user._id === id);
    if (!currentUser) return false;

    // Apply optimistic update immediately
    setState(prev => ({
      ...prev,
      users: prev.users.map(user => {
        if (user._id === id) {
          const updatedUser = {
            ...user,
            // Only update fields that are provided
            ...(userData.name && { name: userData.name }),
            ...(userData.email && { email: userData.email }),
            ...(userData.userType && { userType: userData.userType }),
            ...(userData.isActive !== undefined && { isActive: userData.isActive }),
            updatedAt: new Date().toISOString()
          };

          // Handle gymId updates carefully
          if (userData.gymId !== undefined) {
            if (userData.gymId) {
              updatedUser.gymId = {
                _id: userData.gymId,
                name: user.gymId?.name || 'Loading...',
                location: user.gymId?.location || 'Loading...'
              };
            } else {
              // Remove gymId if set to undefined/null
              delete updatedUser.gymId;
            }
          }

          return updatedUser;
        }
        return user;
      })
    }));
    
    try {
      const response = await usersApi.updateUser(id, userData);
      notifications.show({
        title: 'Success',
        message: 'User updated successfully',
        color: 'green'
      });
      
      // Replace optimistic update with real data from server
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user._id === id ? response.data.user : user
        )
      }));
      
      return true;
    } catch (error: any) {
      // Rollback optimistic update on error
      setState(prev => ({
        ...prev,
        users: prev.users.map(user => 
          user._id === id ? currentUser : user
        )
      }));
      
      const errorMessage = error.response?.data?.message || 'Failed to update user';
      setState(prev => ({ ...prev, error: errorMessage }));
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      return false;
    }
  }, [state.users]);

  const deleteUser = useCallback(async (id: string) => {
    // Find current user to store for rollback
    const currentUser = state.users.find(user => user._id === id);
    if (!currentUser) return false;

    // Remove user optimistically
    setState(prev => ({
      ...prev,
      users: prev.users.filter(user => user._id !== id),
      totalUsers: prev.totalUsers - 1
    }));
    
    try {
      await usersApi.deleteUser(id);
      notifications.show({
        title: 'Success',
        message: 'User deleted successfully',
        color: 'green'
      });
      
      // User is already removed, no need to update state again
      return true;
    } catch (error: any) {
      // Restore user on error
      setState(prev => ({
        ...prev,
        users: [...prev.users, currentUser].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ),
        totalUsers: prev.totalUsers + 1
      }));
      
      const errorMessage = error.response?.data?.message || 'Failed to delete user';
      setState(prev => ({ ...prev, error: errorMessage }));
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      return false;
    }
  }, [state.users]);

  const resetUserPassword = useCallback(async (id: string, newPassword: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await usersApi.resetUserPassword(id, newPassword);
      notifications.show({
        title: 'Success',
        message: 'Password reset successfully',
        color: 'green'
      });
      setState(prev => ({ ...prev, loading: false }));
      return true;
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Failed to reset password';
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false
      }));
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      return false;
    }
  }, []);

  return {
    ...state,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    refetch: fetchUsers
  };
};