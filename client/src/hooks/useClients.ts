import { useState, useCallback, useEffect, useRef } from 'react';
import {
  clientsApi,
  type Client,
  type ClientBenchmark,
  type ClientBenchmarkHistory,
  type ClientProgramProgress,
  type ClientsQueryParams,
  type ClientBenchmarksQueryParams,
  type UpdateClientData,
  type AddClientBenchmarkData,
  type UpdateClientBenchmarkData,
  type ReplaceClientBenchmarkData,
  type UpdateProgramProgressData,
  type ClientsListResponse,
  type ClientResponse,
  type ClientBenchmarksResponse,
  type ClientProgramProgressResponse,
  clientHelpers
} from '../lib/clients-api';

// Pagination interface
interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

// ============================
// 1. useClients() - Main client list management
// ============================
interface UseClientsReturn {
  clients: Client[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  fetchClients: (params?: ClientsQueryParams) => Promise<void>;
  refreshClients: () => Promise<void>;
  searchClients: (searchTerm: string) => void;
  filterClients: (filters: Partial<ClientsQueryParams>) => void;
  clearFilters: () => void;
}

export function useClients(): UseClientsReturn {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentParams, setCurrentParams] = useState<ClientsQueryParams>({});

  // Debounce search
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const fetchClients = useCallback(async (params: ClientsQueryParams = {}) => {
    try {
      setLoading(true);
      setError(null);

      const response: ClientsListResponse = await clientsApi.getClients(params);

      if (response.success) {
        setClients(response.data.clients);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
        setCurrentParams(params);
      } else {
        setError(response.message || 'Failed to fetch clients');
      }
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshClients = useCallback(async () => {
    return fetchClients(currentParams);
  }, [fetchClients, currentParams]);

  const searchClients = useCallback((searchTerm: string) => {
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search for 300ms
    searchTimeoutRef.current = setTimeout(() => {
      const newParams = { ...currentParams, search: searchTerm, page: 1 };
      fetchClients(newParams);
    }, 300);
  }, [fetchClients, currentParams]);

  const filterClients = useCallback((filters: Partial<ClientsQueryParams>) => {
    const newParams = { ...currentParams, ...filters, page: 1 };
    fetchClients(newParams);
  }, [fetchClients, currentParams]);

  const clearFilters = useCallback(() => {
    fetchClients({});
  }, [fetchClients]);

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    clients,
    loading,
    error,
    pagination,
    fetchClients,
    refreshClients,
    searchClients,
    filterClients,
    clearFilters
  };
}

// ============================
// 2. useClient(clientId) - Individual client management
// ============================
interface UseClientReturn {
  client: Client | null;
  loading: boolean;
  error: string | null;
  fetchClient: () => Promise<void>;
  updateClient: (data: UpdateClientData) => Promise<Client>;
  refreshClient: () => Promise<void>;
}

export function useClient(clientId: string | undefined): UseClientReturn {
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchClient = useCallback(async () => {
    if (!clientId) {
      setError('Client ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: ClientResponse = await clientsApi.getClient(clientId);

      if (response.success) {
        setClient(response.data.client);
      } else {
        setError(response.message || 'Failed to fetch client');
      }
    } catch (err) {
      console.error('Error fetching client:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const updateClient = useCallback(async (data: UpdateClientData): Promise<Client> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const previousClient = client;
      if (client) {
        setClient({ ...client, ...data } as Client);
      }

      const response: ClientResponse = await clientsApi.updateClient(clientId, data);

      if (response.success) {
        setClient(response.data.client);
        return response.data.client;
      } else {
        // Revert optimistic update on error
        setClient(previousClient);
        throw new Error(response.message || 'Failed to update client');
      }
    } catch (err) {
      // Revert optimistic update on error
      setClient(client);
      console.error('Error updating client:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId, client]);

  const refreshClient = useCallback(async () => {
    return fetchClient();
  }, [fetchClient]);

  // Auto-fetch when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchClient();
    } else {
      setClient(null);
      setError(null);
    }
  }, [clientId, fetchClient]);

  return {
    client,
    loading,
    error,
    fetchClient,
    updateClient,
    refreshClient
  };
}

// ============================
// 3. useClientBenchmarks(clientId) - Benchmark management
// ============================
interface UseClientBenchmarksReturn {
  benchmarks: ClientBenchmarkHistory[];
  loading: boolean;
  error: string | null;
  pagination: Pagination | null;
  fetchBenchmarks: (params?: ClientBenchmarksQueryParams) => Promise<void>;
  addBenchmark: (data: AddClientBenchmarkData) => Promise<ClientBenchmarkHistory>;
  updateBenchmark: (benchmarkId: string, data: UpdateClientBenchmarkData) => Promise<ClientBenchmarkHistory>;
  replaceBenchmark: (benchmarkId: string, data: ReplaceClientBenchmarkData) => Promise<ClientBenchmarkHistory>;
  refreshBenchmarks: () => Promise<void>;
  canEditBenchmark: (benchmark: ClientBenchmarkHistory) => boolean;
  getLatestBenchmark: (templateId: string) => ClientBenchmarkHistory | undefined;
}

export function useClientBenchmarks(clientId: string | undefined): UseClientBenchmarksReturn {
  const [benchmarks, setBenchmarks] = useState<ClientBenchmarkHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [currentParams, setCurrentParams] = useState<ClientBenchmarksQueryParams>({});

  const fetchBenchmarks = useCallback(async (params: ClientBenchmarksQueryParams = {}) => {
    if (!clientId) {
      setError('Client ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: ClientBenchmarksResponse = await clientsApi.getClientBenchmarks(clientId, params);

      if (response.success) {
        setBenchmarks(response.data.benchmarks);
        if (response.data.pagination) {
          setPagination(response.data.pagination);
        }
        setCurrentParams(params);
      } else {
        setError(response.message || 'Failed to fetch benchmarks');
      }
    } catch (err) {
      console.error('Error fetching benchmarks:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const addBenchmark = useCallback(async (data: AddClientBenchmarkData): Promise<ClientBenchmarkHistory> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await clientsApi.addClientBenchmark(clientId, data);

      if (response.success) {
        // Add the new benchmark to the list
        setBenchmarks(prev => [response.data.benchmark, ...prev]);
        return response.data.benchmark;
      } else {
        throw new Error(response.message || 'Failed to add benchmark');
      }
    } catch (err) {
      console.error('Error adding benchmark:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const updateBenchmark = useCallback(async (
    benchmarkId: string,
    data: UpdateClientBenchmarkData
  ): Promise<ClientBenchmarkHistory> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const previousBenchmarks = benchmarks;
      setBenchmarks(prev =>
        prev.map(benchmark =>
          benchmark._id === benchmarkId
            ? { ...benchmark, ...data, lastModified: new Date().toISOString() }
            : benchmark
        )
      );

      const response = await clientsApi.updateClientBenchmark(clientId, benchmarkId, data);

      if (response.success) {
        // Update with server response
        setBenchmarks(prev =>
          prev.map(benchmark =>
            benchmark._id === benchmarkId ? response.data.benchmark : benchmark
          )
        );
        return response.data.benchmark;
      } else {
        // Revert optimistic update on error
        setBenchmarks(previousBenchmarks);
        throw new Error(response.message || 'Failed to update benchmark');
      }
    } catch (err) {
      // Revert optimistic update on error
      setBenchmarks(benchmarks);
      console.error('Error updating benchmark:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId, benchmarks]);

  const replaceBenchmark = useCallback(async (
    benchmarkId: string,
    data: ReplaceClientBenchmarkData
  ): Promise<ClientBenchmarkHistory> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      const response = await clientsApi.replaceClientBenchmark(clientId, benchmarkId, data);

      if (response.success) {
        // Add the new benchmark and deactivate the old one
        setBenchmarks(prev => [
          response.data.benchmark,
          ...prev.map(benchmark =>
            benchmark._id === benchmarkId
              ? { ...benchmark, isActive: false }
              : benchmark
          )
        ]);
        return response.data.benchmark;
      } else {
        throw new Error(response.message || 'Failed to replace benchmark');
      }
    } catch (err) {
      console.error('Error replacing benchmark:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const refreshBenchmarks = useCallback(async () => {
    return fetchBenchmarks(currentParams);
  }, [fetchBenchmarks, currentParams]);

  const canEditBenchmark = useCallback((benchmark: ClientBenchmarkHistory): boolean => {
    return clientHelpers.canEditBenchmark(benchmark);
  }, []);

  const getLatestBenchmark = useCallback((templateId: string): ClientBenchmarkHistory | undefined => {
    return clientHelpers.getLatestBenchmark(benchmarks, templateId);
  }, [benchmarks]);

  // Auto-fetch when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchBenchmarks();
    } else {
      setBenchmarks([]);
      setError(null);
    }
  }, [clientId, fetchBenchmarks]);

  return {
    benchmarks,
    loading,
    error,
    pagination,
    fetchBenchmarks,
    addBenchmark,
    updateBenchmark,
    replaceBenchmark,
    refreshBenchmarks,
    canEditBenchmark,
    getLatestBenchmark
  };
}

// ============================
// 4. useClientProgramProgress(clientId) - Program progress
// ============================
interface UseClientProgramProgressReturn {
  progress: ClientProgramProgress | null;
  loading: boolean;
  error: string | null;
  fetchProgress: () => Promise<void>;
  updateProgress: (data: UpdateProgramProgressData) => Promise<ClientProgramProgress>;
  refreshProgress: () => Promise<void>;
  calculateCompletion: () => number;
}

export function useClientProgramProgress(clientId: string | undefined): UseClientProgramProgressReturn {
  const [progress, setProgress] = useState<ClientProgramProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchProgress = useCallback(async () => {
    if (!clientId) {
      setError('Client ID is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response: ClientProgramProgressResponse = await clientsApi.getClientProgramProgress(clientId);

      if (response.success) {
        setProgress(response.data.progress);
      } else {
        setError(response.message || 'Failed to fetch program progress');
      }
    } catch (err) {
      console.error('Error fetching program progress:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  const updateProgress = useCallback(async (data: UpdateProgramProgressData): Promise<ClientProgramProgress> => {
    if (!clientId) {
      throw new Error('Client ID is required');
    }

    try {
      setLoading(true);
      setError(null);

      // Optimistic update
      const previousProgress = progress;
      if (progress) {
        setProgress({ ...progress, ...data } as ClientProgramProgress);
      }

      const response: ClientProgramProgressResponse = await clientsApi.updateClientProgramProgress(clientId, data);

      if (response.success) {
        setProgress(response.data.progress);
        return response.data.progress;
      } else {
        // Revert optimistic update on error
        setProgress(previousProgress);
        throw new Error(response.message || 'Failed to update program progress');
      }
    } catch (err) {
      // Revert optimistic update on error
      setProgress(progress);
      console.error('Error updating program progress:', err);
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [clientId, progress]);

  const refreshProgress = useCallback(async () => {
    return fetchProgress();
  }, [fetchProgress]);

  const calculateCompletion = useCallback((): number => {
    return clientHelpers.calculateProgramCompletion(progress || undefined);
  }, [progress]);

  // Auto-fetch when clientId changes
  useEffect(() => {
    if (clientId) {
      fetchProgress();
    } else {
      setProgress(null);
      setError(null);
    }
  }, [clientId, fetchProgress]);

  return {
    progress,
    loading,
    error,
    fetchProgress,
    updateProgress,
    refreshProgress,
    calculateCompletion
  };
}

// ============================
// Additional helper hooks
// ============================

// Hook for client helpers (utility functions)
export function useClientHelpers() {
  return clientHelpers;
}