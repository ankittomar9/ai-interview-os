export interface EngineCap {
  ready?: boolean;
  state?: 'ONLINE' | 'STARTING' | 'DOWN' | string;
  detail?: string | null;
}

export interface SystemCapabilitiesData {
  engines?: {
    dsa?: EngineCap;
    lld?: EngineCap;
    sql?: EngineCap;
    [k: string]: EngineCap | undefined;
  };
  services?: Record<string, boolean>;
  checkedAt?: string;
}

export interface ProviderStatusItem {
  provider: string;
  state: 'READY' | 'NOT_CONFIGURED' | 'ERROR' | 'UNREACHABLE' | string;
  configuredModel?: string;
}

export function computeSandboxStatus(engines?: SystemCapabilitiesData['engines']) {
  if (!engines) return { state: 'DOWN' as const, detail: 'Engines offline' };
  const { dsa, lld, sql } = engines;
  if (dsa?.state === 'DOWN' || lld?.state === 'DOWN' || sql?.state === 'DOWN') {
    const detail = dsa?.state === 'DOWN' ? dsa.detail : (lld?.state === 'DOWN' ? lld.detail : sql?.detail);
    return { state: 'DOWN' as const, detail: detail || 'Sandbox engine offline' };
  }
  if (dsa?.state === 'STARTING' || lld?.state === 'STARTING' || sql?.state === 'STARTING') {
    return { state: 'STARTING' as const, detail: 'Engines starting…' };
  }
  if (dsa?.ready && lld?.ready && sql?.ready) {
    return { state: 'ONLINE' as const, detail: 'Judge0, LLD, SQL active' };
  }
  return { state: 'DOWN' as const, detail: 'Engines offline' };
}

export function computeIntelligenceStatus(orchestratorOnline?: boolean, providers?: ProviderStatusItem[] | null) {
  if (orchestratorOnline === false) {
    return { state: 'DOWN' as const, text: 'Orchestrator DOWN', detail: 'start ai-orchestrator-service' };
  }
  if (!providers) {
    return { state: 'CHECKING' as const, text: '◌ checking', detail: '' };
  }
  const readyCount = providers.filter(p => p.state === 'READY').length;
  const totalCount = providers.length;
  const state: 'ONLINE' | 'DOWN' = readyCount > 0 ? 'ONLINE' : 'DOWN';
  return { state, text: `${readyCount}/${totalCount} providers ready`, detail: '' };
}

export function computeDataStatus(services?: Record<string, boolean>) {
  if (!services) return 'DOWN' as const;
  const count = (services.postgres ? 1 : 0) + (services.mongo ? 1 : 0) + (services.eureka ? 1 : 0);
  if (count === 3) return 'ONLINE' as const;
  if (count > 0) return 'DEGRADED' as const;
  return 'DOWN' as const;
}

export function computeOverallStatus(
  backendConnected: boolean,
  sandboxState: 'ONLINE' | 'STARTING' | 'DOWN',
  intelligenceState: 'ONLINE' | 'DOWN' | 'CHECKING',
  dataState: 'ONLINE' | 'DEGRADED' | 'DOWN'
): 'ONLINE' | 'DEGRADED' | 'OFFLINE' {
  if (!backendConnected) return 'OFFLINE';
  if (sandboxState === 'ONLINE' && intelligenceState === 'ONLINE' && dataState === 'ONLINE') return 'ONLINE';
  return 'DEGRADED';
}
