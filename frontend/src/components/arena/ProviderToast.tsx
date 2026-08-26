import React from 'react';
import { AlertTriangle, RefreshCw, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../ui/Button';
import type { ProviderErrorState } from './hooks/useDialogue';

interface ProviderToastProps {
  error: ProviderErrorState;
  onRetry?: () => void;
  onOpenSettings?: () => void;
  onClose?: () => void;
}

export const ProviderToast: React.FC<ProviderToastProps> = ({
  error,
  onRetry,
  onOpenSettings,
  onClose
}) => (
  <div className="absolute top-14 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-surface/95 border border-danger/40 rounded-xl shadow-xl backdrop-blur-md text-xs">
    <AlertTriangle className="w-4 h-4 text-danger shrink-0" />
    <div className="flex items-center gap-1.5">
      <span className="font-semibold text-danger">{error.label}:</span>
      <span className="text-text-3">Deterministic offline coach active.</span>
    </div>
    <div className="flex items-center gap-2 ml-2">
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="h-6 text-[11px] px-2">
          <RefreshCw className="w-3 h-3 mr-1" />
          Retry
        </Button>
      )}
      {onOpenSettings && (
        <Button variant="primary" size="sm" onClick={onOpenSettings} className="h-6 text-[11px] px-2">
          <SlidersHorizontal className="w-3 h-3 mr-1" />
          Switch Provider
        </Button>
      )}
      {onClose && (
        <button type="button" onClick={onClose} className="text-text-3 hover:text-text p-1 cursor-pointer">
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  </div>
);
