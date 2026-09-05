import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Cpu, Key, Zap } from 'lucide-react';
import type { ModelProvider } from '../../types';
import { getStoredApiKey, setStoredApiKey, fetchProvidersStatus, type ProviderStatusItem } from '../../services/api';

interface ProviderOption {
  provider: ModelProvider;
  name: string;
  desc: string;
  recommended?: boolean;
}

const PROVIDERS: ProviderOption[] = [
  {
    provider: 'GROQ',
    name: 'Groq Cloud',
    desc: 'Ultra-low latency conversational dialogue + Whisper speech-to-text.',
    recommended: true
  },
  {
    provider: 'GEMINI',
    name: 'Google Gemini',
    desc: 'Native multimodal vision architecture evaluation & rubric synthesis.'
  },
  {
    provider: 'OPENAI',
    name: 'Frontier (OpenAI / GLM compatible)',
    desc: 'Highest quality interviewer. Compatible with OpenAI, GLM, and OpenRouter.'
  },
  {
    provider: 'OLLAMA',
    name: 'Ollama (Local)',
    desc: 'Air-gapped local model inference running directly on host machine.'
  }
];

interface ProviderSectionProps {
  selectedProvider: ModelProvider;
  onSelectProvider: (provider: ModelProvider) => void;
  apiKey: string;
  onChangeApiKey: (key: string) => void;
}

export const ProviderSection: React.FC<ProviderSectionProps> = ({
  selectedProvider,
  onSelectProvider,
  apiKey,
  onChangeApiKey
}) => {
  const [providersStatus, setProvidersStatus] = useState<ProviderStatusItem[] | null>(null);
  const [orchestratorDown, setOrchestratorDown] = useState(false);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadProvidersStatus = useCallback(async (byokKey?: string, targetProvider?: string) => {
    try {
      const data = await fetchProvidersStatus(byokKey, targetProvider);
      setProvidersStatus(data);
      setOrchestratorDown(false);
    } catch {
      setOrchestratorDown(true);
    }
  }, []);

  useEffect(() => {
    void loadProvidersStatus();
    const interval = setInterval(() => {
      void loadProvidersStatus();
    }, 60000);
    return () => clearInterval(interval);
  }, [loadProvidersStatus]);

  const handleProviderClick = (prov: ModelProvider) => {
    onSelectProvider(prov);
    localStorage.setItem('app.provider', prov);
    const stored = getStoredApiKey(prov.toLowerCase());
    onChangeApiKey(stored);
    if (stored && stored.trim().length >= 20) {
      void loadProvidersStatus(stored.trim(), prov);
    }
  };

  const handleKeyInput = (val: string) => {
    onChangeApiKey(val);
    setStoredApiKey(selectedProvider.toLowerCase(), val);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (val.trim().length >= 20) {
      debounceTimerRef.current = setTimeout(() => {
        void loadProvidersStatus(val.trim(), selectedProvider);
      }, 800);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-text flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-primary" />
          <span>Frontier AI Intelligence Engine</span>
        </label>
        <span className="text-[10px] text-text-3 font-mono">Zero-Retention BYOK</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {PROVIDERS.map((p) => {
          const isSelected = selectedProvider === p.provider;
          const prov = providersStatus?.find((ps) => ps.provider === p.provider);
          return (
            <div
              key={p.provider}
              onClick={() => handleProviderClick(p.provider)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-primary/10 border-primary shadow-xs ring-1 ring-primary/40'
                  : 'bg-surface border-border hover:bg-elevated/40'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-text">{p.name}</span>
                  {p.recommended && (
                    <span className="px-1.5 py-0.2 rounded text-[9px] bg-success/15 text-success border border-success/30 font-semibold flex items-center gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      Fast
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-text-3 leading-relaxed">{p.desc}</p>
              </div>

              <div className="mt-2 pt-1 border-t border-border/60 flex items-center justify-between text-[10px] text-text-3 font-mono">
                <span>Status</span>
                {orchestratorDown ? (
                  <span className="text-text-3 truncate">◌ UNKNOWN — orchestrator down</span>
                ) : !providersStatus ? (
                  <span className="text-text-3">◌ UNKNOWN (probing)</span>
                ) : prov && prov.state === 'READY' ? (
                  <span className="text-success font-semibold truncate flex items-center gap-1">● {prov.state === 'READY' ? `READY · ${prov.configuredModel || ''}` : ''}</span>
                ) : prov?.state === 'NOT_CONFIGURED' ? (
                  <span className="text-text-3 font-semibold">○ NOT CONFIGURED</span>
                ) : prov?.state === 'UNREACHABLE' ? (
                  <span className="text-danger font-semibold truncate" title={prov?.reason || undefined}>● UNREACHABLE</span>
                ) : (
                  <span className="text-danger font-semibold truncate" title={prov?.reason || undefined}>● ERROR: {prov?.reason || 'Failed'}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedProvider !== 'OLLAMA' && (
        <div className="p-3 bg-surface border border-border rounded-xl space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-text flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-primary" />
              <span>{selectedProvider} API Key</span>
            </label>
            <span className="text-[10px] text-text-3">Stored locally in browser</span>
          </div>

          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleKeyInput(e.target.value)}
            placeholder={selectedProvider === 'OPENAI' ? 'Paste your OpenAI or compatible API key (sk-...)' : `Paste your ${selectedProvider} API key (e.g. gsk_...)`}
            className="w-full bg-elevated border border-border rounded-lg px-3 py-2 text-xs text-text focus:outline-none focus:border-primary font-mono"
          />
        </div>
      )}
    </div>
  );
};
