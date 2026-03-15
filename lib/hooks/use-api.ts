import { useState, useEffect, useCallback, useRef } from "react";
import { useAppStore } from "@/lib/stores/app-store";

interface UseApiOptions {
  enabled?: boolean;
  cacheKey?: string;
  cacheTime?: number;
  retryCount?: number;
  retryDelay?: number;
  onSuccess?: (data: unknown) => void;
  onError?: (error: Error) => void;
}

interface UseApiResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  mutate: (newData: T) => void;
}

export function useApi<T = unknown>(
  url: string,
  options: UseApiOptions = {},
): UseApiResult<T> {
  const {
    enabled = true,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retryCount = 2,
    retryDelay = 1000,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const {
    getCacheData,
    setCacheData,
    setLoading: setGlobalLoading,
  } = useAppStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchData = useCallback(
    async (retries = 0): Promise<void> => {
      if (!enabled) return;

      // Check cache first
      if (cacheKey) {
        const cachedData = getCacheData(cacheKey, cacheTime) as T;
        if (cachedData) {
          setData(cachedData);
          return;
        }
      }

      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        setLoading(true);
        setError(null);

        if (cacheKey) {
          setGlobalLoading(cacheKey, true);
        }

        const response = await fetch(url, {
          signal: abortControllerRef.current.signal,
          headers: {
            "Content-Type": "application/json",
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        setData(result);

        // Cache the result
        if (cacheKey) {
          setCacheData(cacheKey, result);
        }

        onSuccess?.(result);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          return; // Request was cancelled
        }

        const error = err instanceof Error ? err : new Error("Unknown error");

        // Retry logic
        if (retries < retryCount) {
          retryTimeoutRef.current = setTimeout(
            () => {
              fetchData(retries + 1);
            },
            retryDelay * Math.pow(2, retries),
          ); // Exponential backoff
          return;
        }

        setError(error);
        onError?.(error);
      } finally {
        setLoading(false);

        if (cacheKey) {
          setGlobalLoading(cacheKey, false);
        }
      }
    },
    [
      url,
      enabled,
      cacheKey,
      cacheTime,
      retryCount,
      retryDelay,
      getCacheData,
      setCacheData,
      setGlobalLoading,
      onSuccess,
      onError,
    ],
  );

  const mutate = useCallback(
    (newData: T) => {
      setData(newData);

      if (cacheKey) {
        setCacheData(cacheKey, newData);
      }
    },
    [cacheKey, setCacheData],
  );

  useEffect(() => {
    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    mutate,
  };
}

// Specialized hook for paginated data
interface UsePaginatedApiOptions extends UseApiOptions {
  page?: number;
  limit?: number;
  filters?: Record<string, string>;
}

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function usePaginatedApi<T = unknown>(
  baseUrl: string,
  options: UsePaginatedApiOptions = {},
): UseApiResult<PaginatedResult<T>> {
  const { page = 1, limit = 50, filters = {}, ...apiOptions } = options;

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...filters,
  });

  const url = `${baseUrl}?${params.toString()}`;
  const cacheKey = apiOptions.cacheKey
    ? `${apiOptions.cacheKey}-${params.toString()}`
    : undefined;

  return useApi<PaginatedResult<T>>(url, {
    ...apiOptions,
    cacheKey,
  });
}

// Hook for mutations (POST, PUT, DELETE)
interface UseMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
  onSettled?: (
    data: TData | null,
    error: Error | null,
    variables: TVariables,
  ) => void;
}

interface UseMutationResult<TData, TVariables> {
  mutate: (variables: TVariables) => Promise<TData>;
  loading: boolean;
  error: Error | null;
  data: TData | null;
}

export function useMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseMutationOptions<TData, TVariables> = {},
): UseMutationResult<TData, TVariables> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);

  const { onSuccess, onError, onSettled } = options;

  const mutate = useCallback(
    async (variables: TVariables): Promise<TData> => {
      try {
        setLoading(true);
        setError(null);

        const result = await mutationFn(variables);

        setData(result);
        onSuccess?.(result, variables);

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error("Unknown error");
        setError(error);
        onError?.(error, variables);
        throw error;
      } finally {
        setLoading(false);
        onSettled?.(data, error, variables);
      }
    },
    [mutationFn, onSuccess, onError, onSettled, data, error],
  );

  return {
    mutate,
    loading,
    error,
    data,
  };
}
