/**
 * SPEC-008: Client Telemetry Echo Logger (src/lib/clientLogger.ts)
 * 
 * Non-negotiables:
 * - 50-event ring buffer (evicts oldest on overflow)
 * - 10-second periodic flush
 * - 64 KB JSON payload byte cap
 * - Banned-key stripping (code, transcript, resume, explanation, answer, apiKey)
 * - Silent drop-on-failure: never throws, never logs errors about its own failures
 * - Truncation: msg <= 200 chars, ctx values stringified & truncated
 */

export interface ClientLogEvent {
  ts: string;
  level: 'info' | 'warn' | 'error';
  tag: string;
  msg: string;
  sessionId?: number | null;
  mode?: string;
  ctx?: Record<string, unknown>;
}

export const ALLOWED_TAGS = new Set([
  'TIMER_TRANSITION',
  'TIMER_EXTEND_BLOCKED',
  'SECTION_HANDOFF',
  'EMPTY_TRACK_STATE',
  'RECORDER_ERROR',
  'MONACO_ERROR',
  'PROVIDER_ERROR',
  'WINDOW_ERROR',
  'UNHANDLED_REJECTION',
]);

const BANNED_KEYS = new Set([
  'code',
  'transcript',
  'resume',
  'explanation',
  'answer',
  'apikey',
]);

export const MAX_BUFFER_SIZE = 50;
export const MAX_PAYLOAD_BYTES = 64 * 1024; // 64 KB
export const FLUSH_INTERVAL_MS = 10000; // 10s

let buffer: ClientLogEvent[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let currentSessionId: number | null = null;
let currentMode: string | undefined = undefined;
let isInitialized = false;

export function sanitizeContext(ctx?: Record<string, unknown>): Record<string, unknown> | undefined {
  if (!ctx || typeof ctx !== 'object') return undefined;
  const sanitized: Record<string, unknown> = {};

  for (const [key, val] of Object.entries(ctx)) {
    if (BANNED_KEYS.has(key.toLowerCase())) continue;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      const nested: Record<string, unknown> = {};
      for (const [nKey, nVal] of Object.entries(val as Record<string, unknown>)) {
        if (BANNED_KEYS.has(nKey.toLowerCase())) continue;
        nested[nKey] = typeof nVal === 'string' ? nVal.slice(0, 200) : nVal;
      }
      sanitized[key] = nested;
    } else {
      sanitized[key] = typeof val === 'string' ? val.slice(0, 200) : val;
    }
  }

  return sanitized;
}

export function setTelemetryContext(sessionId?: number | null, mode?: string): void {
  if (sessionId !== undefined) currentSessionId = sessionId;
  if (mode !== undefined) currentMode = mode;
}

export function getBuffer(): readonly ClientLogEvent[] {
  return buffer;
}

export function clearBuffer(): void {
  buffer = [];
}

export function isDevEnvironment(): boolean {
  try {
    const gProcess = (globalThis as any).process;
    if (gProcess && gProcess.env?.NODE_ENV !== 'production') {
      return true;
    }
    if (typeof import.meta !== 'undefined' && (import.meta as any).env?.DEV) {
      return true;
    }
  } catch (_) {}
  return false;
}

function normalizeLogArgs(
  arg1: string,
  arg2?: string | Record<string, unknown>,
  ctx?: Record<string, unknown>
): { tag: string; msg: string; context?: Record<string, unknown> } {
  if (typeof arg2 === 'string') {
    return {
      tag: arg1,
      msg: arg2.slice(0, 200),
      context: sanitizeContext(ctx),
    };
  }

  // Single string passed, e.g. clientLog.warn('TIMER_EXTEND_BLOCKED mode=INTERVIEW')
  const tag = arg1.split(' ')[0] || 'GENERAL';
  return {
    tag,
    msg: arg1.slice(0, 200),
    context: sanitizeContext(typeof arg2 === 'object' ? arg2 : ctx),
  };
}

let isFlushScheduled = false;

function scheduleFlush(): void {
  if (isFlushScheduled) return;
  isFlushScheduled = true;
  queueMicrotask(() => {
    isFlushScheduled = false;
    flush().catch(() => {});
  });
}

function pushEvent(level: 'info' | 'warn' | 'error', tag: string, msg: string, context?: Record<string, unknown>): void {
  // Tag allowlist enforcement
  const isDev = isDevEnvironment();
  if (!isDev && currentMode === 'INTERVIEW' && !ALLOWED_TAGS.has(tag)) {
    return; // Dropped in interview mode if not allowlisted
  }

  const event: ClientLogEvent = {
    ts: new Date().toISOString(),
    level,
    tag,
    msg,
    sessionId: currentSessionId,
    mode: currentMode,
    ctx: context,
  };

  // Ring buffer eviction if full
  if (buffer.length >= MAX_BUFFER_SIZE) {
    buffer.shift();
  }
  buffer.push(event);

  if (buffer.length >= MAX_BUFFER_SIZE) {
    scheduleFlush();
  }
}

export function preparePayload(events: ClientLogEvent[]): { events: ClientLogEvent[] } {
  let batch = events;
  const encoder = new TextEncoder();
  let json = JSON.stringify({ events: batch });

  while (batch.length > 0 && encoder.encode(json).length > MAX_PAYLOAD_BYTES) {
    batch = batch.slice(0, batch.length - 1);
    json = JSON.stringify({ events: batch });
  }

  return { events: batch };
}

export async function flush(): Promise<void> {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);
  const payload = preparePayload(batch);
  if (payload.events.length === 0) return;

  try {
    const fetchFn = typeof fetch !== 'undefined' ? fetch : (globalThis as any).fetch;
    if (!fetchFn) return;
    await fetchFn('/api/v1/telemetry/client-logs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch (_) {
    // Silent buffer drop per SPEC-008 Non-Negotiables
  }
}

export const clientLog = {
  info(arg1: string, arg2?: string | Record<string, unknown>, ctx?: Record<string, unknown>) {
    const { tag, msg, context } = normalizeLogArgs(arg1, arg2, ctx);
    pushEvent('info', tag, msg, context);
  },
  warn(arg1: string, arg2?: string | Record<string, unknown>, ctx?: Record<string, unknown>) {
    const { tag, msg, context } = normalizeLogArgs(arg1, arg2, ctx);
    pushEvent('warn', tag, msg, context);
  },
  error(arg1: string, arg2?: string | Record<string, unknown>, ctx?: Record<string, unknown>) {
    const { tag, msg, context } = normalizeLogArgs(arg1, arg2, ctx);
    pushEvent('error', tag, msg, context);
  },
  setSession: setTelemetryContext,
  flush,
  clear: clearBuffer,
};

export function startFlushInterval(): void {
  if (flushTimer) return;
  flushTimer = setInterval(() => {
    flush().catch(() => {});
  }, FLUSH_INTERVAL_MS);
}

export function stopFlushInterval(): void {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

export function initClientLogger(): void {
  if (isInitialized) return;
  isInitialized = true;

  if (typeof window !== 'undefined') {
    window.addEventListener('error', (event) => {
      const msg = event.message || 'Window error';
      const topStack = event.error?.stack ? event.error.stack.split('\n')[1]?.trim() : '';
      const formatted = topStack ? `${msg} | ${topStack}`.slice(0, 200) : msg.slice(0, 200);
      clientLog.error('WINDOW_ERROR', formatted);
    });

    window.addEventListener('unhandledrejection', (event) => {
      const reason = (event as any).reason;
      const msg = typeof reason === 'string' ? reason : (reason?.message || 'Unhandled rejection');
      const topStack = reason?.stack ? reason.stack.split('\n')[1]?.trim() : '';
      const formatted = topStack ? `${msg} | ${topStack}`.slice(0, 200) : msg.slice(0, 200);
      clientLog.error('UNHANDLED_REJECTION', formatted);
    });
  }

  startFlushInterval();
}
