import { useCallback, useRef } from 'react';
import { fetchWithTimeout, withRetry } from '@/lib/fetchWithTimeout';
import { toast } from 'sonner';

interface ApiCallOptions {
  /** Timeout in ms (default 15000) */
  timeoutMs?: number;
  /** Number of retries (default 0 for user-initiated, 2 for background) */
  retries?: number;
  /** Base delay for retry backoff in ms */
  baseDelay?: number;
  /** AbortSignal to chain */
  signal?: AbortSignal;
  /** Show error toast on failure (default true) */
  showErrorToast?: boolean;
}

/**
 * Hook that provides a resilient fetch wrapper with timeout, retry, and error handling.
 * Use for all raw fetch calls to edge functions.
 */
export function useApiCall() {
  const inflightRef = useRef<Map<string, Promise<Response>>>(new Map());

  const callApi = useCallback(async (
    url: string,
    init?: RequestInit,
    options?: ApiCallOptions
  ): Promise<Response> => {
    const {
      timeoutMs = 15000,
      retries = 0,
      baseDelay = 1000,
      signal,
      showErrorToast = true,
    } = options || {};

    const fn = () => fetchWithTimeout(url, {
      ...init,
      timeoutMs,
      signal,
    });

    try {
      if (retries > 0) {
        return await withRetry(fn, retries, baseDelay);
      }
      return await fn();
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      
      if (showErrorToast) {
        const message = err?.message || 'Request failed';
        if (message.includes('timed out')) {
          toast.error('Request timed out. Please try again.');
        }
      }
      throw err;
    }
  }, []);

  return { callApi };
}
