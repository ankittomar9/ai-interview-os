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

export type PillStatus = 'ONLINE' | 'CHECKING…' | 'DEGRADED' | 'OFFLINE';

export interface PillEvaluation {
  status: PillStatus;
  failingServices: string[];
  tooltipLines: string[];
}

/**
 * Evaluates core platform services and returns a single status pill state
 * along with one-line-per-service failing diagnostics.
 *
 * Core microservices:
 * - questionBank (Question Bank Service)
 * - postgres (PostgreSQL DB)
 * - mongo (MongoDB Storage)
 * - orchestrator (AI Orchestrator Service)
 * - proctor (Proctor Sentinel Service)
 *
 * Core execution engines:
 * - dsa (Judge0 CE execution engine)
 * - lld (Docker LLD runner)
 * - sql (Docker PostgreSQL runner)
 */
export function computePillStatus({
  isChecking = false,
  backendOk,
  capabilities
}: {
  isChecking?: boolean;
  backendOk: boolean;
  capabilities?: SystemCapabilitiesData | null;
}): PillEvaluation {
  if (isChecking && !capabilities && !backendOk) {
    return {
      status: 'CHECKING…',
      failingServices: [],
      tooltipLines: ['Checking system capabilities…']
    };
  }

  if (!backendOk || !capabilities) {
    return {
      status: isChecking ? 'CHECKING…' : 'OFFLINE',
      failingServices: ['API Gateway'],
      tooltipLines: ['API Gateway / Backend unreachable (http://localhost:8080)']
    };
  }

  const failingServices: string[] = [];
  const tooltipLines: string[] = [];

  // Core microservices evaluation
  const services = capabilities.services || {};

  if (services.questionBank !== true) {
    failingServices.push('Question Bank Service');
    tooltipLines.push('Question Bank Service unreachable');
  }

  if (services.postgres !== true) {
    failingServices.push('PostgreSQL Database');
    tooltipLines.push('PostgreSQL Database down');
  }

  if (services.mongo !== true) {
    failingServices.push('MongoDB Storage');
    tooltipLines.push('MongoDB Storage down');
  }

  if (services.orchestrator !== true) {
    failingServices.push('AI Orchestrator Service');
    tooltipLines.push('AI Orchestrator Service down');
  }

  if (services.proctor !== true) {
    failingServices.push('Proctor Sentinel Service');
    tooltipLines.push('Proctor Sentinel Service down');
  }

  // Core sandbox engines evaluation
  const engines = capabilities.engines || {};

  if (!engines.dsa || !engines.dsa.ready || engines.dsa.state === 'DOWN') {
    failingServices.push('DSA Sandbox (Judge0)');
    tooltipLines.push(`DSA Sandbox (Judge0): ${engines.dsa?.detail || 'unreachable'}`);
  }

  if (!engines.lld || !engines.lld.ready || engines.lld.state === 'DOWN') {
    failingServices.push('LLD Sandbox (Docker)');
    tooltipLines.push(`LLD Sandbox (Docker): ${engines.lld?.detail || 'unavailable'}`);
  }

  if (!engines.sql || !engines.sql.ready || engines.sql.state === 'DOWN') {
    failingServices.push('SQL Sandbox (PostgreSQL)');
    tooltipLines.push(`SQL Sandbox: ${engines.sql?.detail || 'unavailable'}`);
  }

  if (failingServices.length > 0) {
    return {
      status: isChecking ? 'CHECKING…' : 'DEGRADED',
      failingServices,
      tooltipLines
    };
  }

  return {
    status: isChecking ? 'CHECKING…' : 'ONLINE',
    failingServices: [],
    tooltipLines: ['All core services healthy (Judge0, PostgreSQL, MongoDB, Orchestrator, Question Bank, Proctor)']
  };
}
