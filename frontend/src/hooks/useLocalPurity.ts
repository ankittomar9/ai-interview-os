import { useMemo } from 'react';
import type { ModelProvider } from '../types';

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
  return useMemo(() => {
    // Provider is Ollama or local inference server, or no cloud keys present
    const isLocalProvider = provider === 'OLLAMA' || !apiKey || apiKey.trim() === '';
    return {
      isLocal: isLocalProvider,
      message: isLocalProvider
        ? '🔒 100% Local — Nothing leaves your machine'
        : '☁️ Cloud Connected',
      egressCount: isLocalProvider ? 0 : 1
    };
  }, [provider, apiKey]);
}
