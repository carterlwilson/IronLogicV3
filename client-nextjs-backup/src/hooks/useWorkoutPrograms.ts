'use client';

import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import {
  getWorkoutPrograms,
  getWorkoutProgram,
  createWorkoutProgram,
  updateWorkoutProgram,
  deleteWorkoutProgram,
  copyWorkoutProgram,
  WorkoutProgramsQueryParams,
  CreateWorkoutProgramData,
  UpdateWorkoutProgramData,
  CopyWorkoutProgramData
} from '../lib/workout-programs-api';
import { WorkoutProgram } from '../../../shared/src/types';


// Helper to generate temporary IDs for optimistic updates
const generateTempId = () => `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to create optimistic program from create data
const createOptimisticProgram = (programData: CreateWorkoutProgramData): WorkoutProgram => {
  return {
    _id: generateTempId(),
    name: programData.name,
    gymId: programData.gymId || '',
    description: programData.description,
    blocks: programData.blocks || [],
    durationWeeks: 0,
    isActive: true,
    isTemplate: programData.isTemplate || false,
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
    parentProgramId: undefined
  } as WorkoutProgram;
};

interface UseWorkoutProgramsReturn {
  // Data
  programs: WorkoutProgram[];
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
  fetchPrograms: (params?: WorkoutProgramsQueryParams) => Promise<void>;
  createProgram: (programData: CreateWorkoutProgramData) => Promise<boolean>;
  updateProgram: (id: string, programData: UpdateWorkoutProgramData) => Promise<boolean>;
  deleteProgram: (id: string) => Promise<boolean>;
  copyProgram: (id: string, copyData: CopyWorkoutProgramData) => Promise<boolean>;
  getProgram: (id: string) => Promise<WorkoutProgram | null>;
}


export function useWorkoutPrograms(): UseWorkoutProgramsReturn {
  const [programs, setPrograms] = useState<WorkoutProgram[]>([]);
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

  // Fetch workout programs with optional parameters
  const fetchPrograms = useCallback(async (params: WorkoutProgramsQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getWorkoutPrograms(params);
      
      setPrograms(response.programs);
      setPagination({
        page: response.page,
        limit: params.limit || 12,
        total: response.total,
        totalPages: response.totalPages,
        hasNextPage: response.hasNextPage,
        hasPrevPage: response.hasPrevPage
      });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch workout programs';
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

  // Create new workout program with optimistic loading
  const createProgram = useCallback(async (programData: CreateWorkoutProgramData): Promise<boolean> => {
    // Create optimistic program and add it immediately
    const optimisticProgram = createOptimisticProgram(programData);
    setPrograms(prev => [optimisticProgram, ...prev]);

    try {
      setError(null);
      
      const newProgram = await createWorkoutProgram(programData);
      
      notifications.show({
        title: 'Success',
        message: 'Workout program created successfully',
        color: 'green',
      });
      
      // Replace optimistic program with real data from server
      setPrograms(prev => prev.map(program => 
        program._id === optimisticProgram._id ? newProgram : program
      ));
      
      return true;
    } catch (err: any) {
      // Remove optimistic program on error
      setPrograms(prev => prev.filter(program => program._id !== optimisticProgram._id));
      
      const message = err.response?.data?.message || err.message || 'Failed to create workout program';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, []);

  // Update existing workout program with optimistic loading
  const updateProgram = useCallback(async (id: string, programData: UpdateWorkoutProgramData): Promise<boolean> => {
    // Find current program to store for rollback
    const currentProgram = programs.find(program => program._id.toString() === id);
    if (!currentProgram) return false;

    // Apply optimistic update immediately
    setPrograms(prev => prev.map(program => {
      if (program._id.toString() === id) {
        return {
          ...program,
          ...(programData.name && { name: programData.name }),
          ...(programData.description !== undefined && { description: programData.description }),
          ...(programData.isTemplate !== undefined && { isTemplate: programData.isTemplate }),
          ...(programData.blocks && { blocks: programData.blocks }),
          updatedAt: new Date(),
          version: program.version + 1
        };
      }
      return program;
    }));

    try {
      setError(null);
      
      const updatedProgram = await updateWorkoutProgram(id, programData);
      
      notifications.show({
        title: 'Success',
        message: 'Workout program updated successfully',
        color: 'green',
      });
      
      // Replace optimistic update with real data from server
      setPrograms(prev => prev.map(program => 
        program._id.toString() === id ? updatedProgram : program
      ));
      
      return true;
    } catch (err: any) {
      // Rollback optimistic update on error
      setPrograms(prev => prev.map(program => 
        program._id.toString() === id ? currentProgram : program
      ));
      
      const message = err.response?.data?.message || err.message || 'Failed to update workout program';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [programs]);

  // Delete workout program with optimistic loading
  const deleteProgram = useCallback(async (id: string): Promise<boolean> => {
    // Find current program to store for rollback
    const currentProgram = programs.find(program => program._id.toString() === id);
    if (!currentProgram) return false;

    // Remove program optimistically
    setPrograms(prev => prev.filter(program => program._id.toString() !== id));

    try {
      setError(null);
      
      await deleteWorkoutProgram(id);
      
      notifications.show({
        title: 'Success',
        message: 'Workout program deleted successfully',
        color: 'green',
      });
      
      // Program is already removed, no need to update state again
      return true;
    } catch (err: any) {
      // Restore program on error
      setPrograms(prev => {
        // Add back in original position
        const programExists = prev.some(program => program._id.toString() === id);
        if (!programExists) {
          return [...prev, currentProgram].sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        }
        return prev;
      });
      
      const message = err.response?.data?.message || err.message || 'Failed to delete workout program';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, [programs]);

  // Copy workout program
  const copyProgram = useCallback(async (id: string, copyData: CopyWorkoutProgramData): Promise<boolean> => {
    try {
      setError(null);
      
      const copiedProgram = await copyWorkoutProgram(id, copyData);
      
      notifications.show({
        title: 'Success',
        message: 'Workout program copied successfully',
        color: 'green',
      });
      
      // Add copied program to the list
      setPrograms(prev => [copiedProgram, ...prev]);
      
      return true;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to copy workout program';
      setError(message);
      notifications.show({
        title: 'Error',
        message,
        color: 'red',
      });
      return false;
    }
  }, []);

  // Get single workout program by ID
  const getProgram = useCallback(async (id: string): Promise<WorkoutProgram | null> => {
    try {
      setError(null);
      
      const program = await getWorkoutProgram(id);
      
      return program;
    } catch (err: any) {
      const message = err.response?.data?.message || err.message || 'Failed to fetch workout program';
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
    programs,
    loading,
    error,
    pagination,

    // Actions
    fetchPrograms,
    createProgram,
    updateProgram,
    deleteProgram,
    copyProgram,
    getProgram,
  };
}