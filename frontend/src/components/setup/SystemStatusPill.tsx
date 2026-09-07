import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  computePillStatus,
  type SystemCapabilitiesData,
  type PillStatus,
  type PillEvaluation
} from "../../lib/systemStatusAggregate";

interface SystemStatusPillProps {
  pollIntervalMs?: number;
  timeoutMs?: number;
  className?: string;
  onStatusChange?: (status: PillStatus) => void;
}

export const SystemStatusPill: React.FC<SystemStatusPillProps> = ({
  pollIntervalMs = 5000,
  timeoutMs = 3000,
  className = "",
  onStatusChange
}) => {
  const [capabilities, setCapabilities] = useState<SystemCapabilitiesData | null>(null);
  const [backendOk, setBackendOk] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [lastChecked, setLastChecked] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCapabilities = useCallback(async () => {
    // Cancel any previous in-flight probe to prevent overlapping requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsChecking(true);

    const timer = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    const host = window.location.hostname || "localhost";
    const port = window.location.port === "5173" || !window.location.port ? "8080" : window.location.port;

    try {
      const resp = await fetch(`http://${host}:${port}/api/v1/system/capabilities`, {
        signal: controller.signal
      });
      clearTimeout(timer);

      if (resp.ok) {
        const data: SystemCapabilitiesData = await resp.json();
        setCapabilities(data);
        setBackendOk(true);
        setLastChecked(new Date().toLocaleTimeString());
      } else {
        setBackendOk(false);
        setLastChecked(new Date().toLocaleTimeString());
      }
    } catch {
      clearTimeout(timer);
      setBackendOk(false);
      setLastChecked(new Date().toLocaleTimeString());
    } finally {
      setIsChecking(false);
    }
  }, [timeoutMs]);

  useEffect(() => {
    void fetchCapabilities();
    const interval = setInterval(() => {
      void fetchCapabilities();
    }, pollIntervalMs);

    return () => {
      clearInterval(interval);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCapabilities, pollIntervalMs]);

  const evalResult: PillEvaluation = computePillStatus({
    isChecking,
    backendOk,
    capabilities
  });

  useEffect(() => {
    onStatusChange?.(evalResult.status);
  }, [evalResult.status, onStatusChange]);

  // Pill styling based on state
  const pillTheme = {
    "ONLINE": {
      container: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/15",
      dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]",
      tooltipTitle: "System Status: Online",
      titleColor: "text-emerald-400"
    },
    "CHECKING…": {
      container: "bg-amber-500/10 text-amber-300 border-amber-500/30 hover:bg-amber-500/15",
      dot: "bg-amber-400 animate-pulse",
      tooltipTitle: "System Status: Checking…",
      titleColor: "text-amber-300"
    },
    "DEGRADED": {
      container: "bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25",
      dot: "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]",
      tooltipTitle: "System Status: Degraded",
      titleColor: "text-amber-400"
    },
    "OFFLINE": {
      container: "bg-rose-500/10 text-rose-400 border-rose-500/30 hover:bg-rose-500/15",
      dot: "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]",
      tooltipTitle: "System Status: Offline",
      titleColor: "text-rose-400"
    }
  }[evalResult.status];

  return (
    <div className={`relative group inline-block ${className}`} data-testid="system-status-container">
      {/* Pill Badge */}
      <button
        type="button"
        onClick={() => void fetchCapabilities()}
        title="Click to refresh system status"
        data-testid="system-status-pill"
        data-status={evalResult.status}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono font-semibold border transition-all duration-150 cursor-pointer select-none focus:outline-none focus:ring-1 focus:ring-primary ${pillTheme.container}`}
      >
        <span className={`w-2 h-2 rounded-full shrink-0 ${pillTheme.dot}`} />
        <span>{evalResult.status}</span>
      </button>

      {/* Tooltip on hover: lists failing services, one line each */}
      <div
        role="tooltip"
        data-testid="system-status-tooltip"
        className="absolute right-0 top-full mt-2 hidden group-hover:block z-50 pointer-events-none min-w-[240px] max-w-[340px]"
      >
        <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-lg p-2.5 shadow-2xl text-[11px] text-slate-200">
          <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-slate-800">
            <span className={`font-semibold font-mono text-[10px] uppercase tracking-wider ${pillTheme.titleColor}`}>
              {pillTheme.tooltipTitle}
            </span>
            {lastChecked && (
              <span className="text-[9px] text-slate-500 font-mono">
                {lastChecked}
              </span>
            )}
          </div>

          <div className="space-y-1">
            {evalResult.tooltipLines.map((line, idx) => (
              <div
                key={idx}
                data-testid="failing-service-item"
                className={`flex items-start gap-1.5 leading-snug ${
                  evalResult.status === "ONLINE"
                    ? "text-emerald-400"
                    : evalResult.status === "CHECKING…"
                    ? "text-amber-200"
                    : "text-rose-300"
                }`}
              >
                <span className="shrink-0 mt-0.5">•</span>
                <span className="break-words">{line}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 pt-1 border-t border-slate-800/80 text-[9px] text-slate-500 font-mono text-center">
            Click pill to re-check
          </div>
        </div>
      </div>
    </div>
  );
};
