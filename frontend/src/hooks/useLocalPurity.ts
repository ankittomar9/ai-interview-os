import { useState, useEffect, useMemo } from 'react';
import type { ModelProvider } from '../types';
import { fetchPurityStatus } from '../services/api';

interface UseLocalPurityProps {
  provider?: ModelProvider;
  apiKey?: string;
}

export interface LocalPurityStatus {
  isLocal: boolean;
  message: string;
  egressCount: number;
}

export function useLocalPurity({ provider, apiKey }: UseLocalPurityProps = {}): LocalPurityStatus {
  const isLocalProvider = useMemo(() => {
    return provider === 'OLLAMA' || !apiKey || apiKey.trim() === '';
  }, [provider, apiKey]);

  const [backendPurity, setBackendPurity] = useState<{ isLocal: boolean; cloudCallCount: number } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const checkPurity = async () => {
      try {
        const res = await fetchPurityStatus();
        if (isMounted && res) {
          setBackendPurity({
            isLocal: res.isLocal,
            cloudCallCount: res.cloudCallCount
          });
        }
      } catch {
        // Backend optional or offline; fall back to client heuristics
      }
    };

    checkPurity();
    const timer = setInterval(checkPurity, 15000);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, []);

  return useMemo(() => {
    if (backendPurity && backendPurity.cloudCallCount > 0) {
      return {
        isLocal: false,
        message: `☁️ ${backendPurity.cloudCallCount} Cloud Calls`,
        egressCount: backendPurity.cloudCallCount
      };
    }

    return {
      isLocal: isLocalProvider,
      message: isLocalProvider
        ? '🔒 100% Local — Nothing leaves your machine'
        : '☁️ Cloud Connected',
      egressCount: isLocalProvider ? 0 : 1
    };
  }, [isLocalProvider, backendPurity]);
}
