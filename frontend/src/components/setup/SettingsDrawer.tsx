import React, { useEffect } from 'react';
import { X, Settings, ShieldCheck } from 'lucide-react';
import type { ModelProvider } from '../../types';
import { ProviderSection } from './ProviderSection';

export interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedProvider: ModelProvider;
  onSelectProvider: (provider: ModelProvider) => void;
  apiKey: string;
  onChangeApiKey: (key: string) => void;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({
  isOpen,
  onClose,
  selectedProvider,
  onSelectProvider,
  apiKey,
  onChangeApiKey
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 cursor-pointer"
        onClick={onClose}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-surface border-l border-border shadow-2xl flex flex-col justify-between overflow-y-auto transform transition ease-in-out duration-300 p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Settings className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text">Platform Settings</h3>
                <p className="text-[11px] text-text-3">Intelligence engines &amp; BYOK keys</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer"
              title="Close settings"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 space-y-6">
            <div className="p-3 rounded-lg bg-elevated border border-border text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-text">
                <ShieldCheck className="w-4 h-4 text-success" />
                <span>Zero-Retention Privacy</span>
              </div>
              <p className="text-text-3 text-[11px] leading-relaxed">
                API keys are stored strictly in your local browser storage. They are never logged or persisted on the backend servers.
              </p>
            </div>

            <ProviderSection
              selectedProvider={selectedProvider}
              onSelectProvider={onSelectProvider}
              apiKey={apiKey}
              onChangeApiKey={onChangeApiKey}
            />
          </div>

          {/* Footer */}
          <div className="pt-4 border-t border-border flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-primary text-on-accent text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
