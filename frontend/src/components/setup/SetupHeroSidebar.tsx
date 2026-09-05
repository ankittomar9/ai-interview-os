import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, CheckCircle2, Terminal, Cpu, Shield, Database } from "lucide-react";
import {
  computeSandboxStatus,
  computeIntelligenceStatus,
  computeDataStatus,
  computeOverallStatus,
  type SystemCapabilitiesData,
  type ProviderStatusItem
} from "../../lib/systemStatusAggregate";

const LIFECYCLE_STAGES = [
  { num: "1", title: "Calibration & Role Fit", desc: "Identity & grounding" },
  { num: "2", title: "Domain Deep Dive", desc: "Core tech & theory" },
  { num: "3", title: "Sandbox Coding", desc: "Judge0 live testcases" },
  { num: "4", title: "System Architecture", desc: "Canvas & scalability" },
  { num: "5", title: "360° Diagnostic Report", desc: "Rubric hire decision" }
];

export const SetupHeroSidebar: React.FC = () => {
  const [capabilities, setCapabilities] = useState<SystemCapabilitiesData | null>(null);
  const [providers, setProviders] = useState<ProviderStatusItem[] | null>(null);
  const [backendOk, setBackendOk] = useState(false);

  const fetchStatus = useCallback(async () => {
    const host = window.location.hostname || "localhost";
    try {
      const capResp = await fetch(`http://${host}:8080/api/v1/system/capabilities`);
      if (capResp.ok) {
        setCapabilities(await capResp.json());
        setBackendOk(true);
      } else {
        setBackendOk(false);
      }
    } catch {
      setBackendOk(false);
    }

    try {
      const provResp = await fetch(`http://${host}:8082/api/v1/ai/providers/status`);
      if (provResp.ok) {
        setProviders(await provResp.json());
      }
    } catch {
      // Orchestrator failure leaves providers as null
    }
  }, []);

  useEffect(() => {
    void fetchStatus();
    const timer = setInterval(() => { void fetchStatus(); }, 60000);
    return () => clearInterval(timer);
  }, [fetchStatus]);

  const sandbox = computeSandboxStatus(capabilities?.engines);
  const intelligence = computeIntelligenceStatus(capabilities?.services?.orchestrator, providers);
  const proctorOnline = Boolean(capabilities?.services?.proctor);
  const dataStatus = computeDataStatus(capabilities?.services);
  const overall = computeOverallStatus(backendOk, sandbox.state, intelligence.state, dataStatus);
  const checkedTime = capabilities?.checkedAt ? new Date(capabilities.checkedAt).toLocaleTimeString() : "";

  return (
    <div className="lg:col-span-4 bg-sidebar-bg border-b lg:border-b-0 lg:border-r border-sidebar-accent p-6 sm:p-8 flex flex-col space-y-6 select-none">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-sidebar-text-2 leading-tight">AI Interview OS</h1>
              <span className="text-[10px] font-mono text-primary font-semibold">ENTERPRISE EVALUATION</span>
            </div>
          </div>
          <p className="text-xs text-sidebar-text-3 leading-relaxed">
            Zero-Trust Autonomous Technical Assessment & Socratic Practice Arena
          </p>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-sidebar-accent/60 text-xs">
          <div className="flex items-start gap-2 text-sidebar-text">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>Autonomous Multi-Track Socratic Interviewing</span>
          </div>
          <div className="flex items-start gap-2 text-sidebar-text">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>Real-time Multimodal Architecture & Sandbox Evaluation</span>
          </div>
          <div className="flex items-start gap-2 text-sidebar-text">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>Zero-Trust Proctoring with Behavioral Biometrics</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-sidebar-accent/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-text-3 font-mono">
            Interview Lifecycle
          </span>
          <div className="space-y-2">
            {LIFECYCLE_STAGES.map((st) => (
              <div key={st.num} className="flex items-center gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-sidebar-accent border border-sidebar-accent flex items-center justify-center font-mono text-[10px] text-primary font-bold">
                  {st.num}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-sidebar-text-2 truncate">{st.title}</p>
                  <p className="text-[10px] text-sidebar-text-3 truncate">{st.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* SYSTEM STATUS live panel directly below Lifecycle (D1) */}
        <div className="p-3.5 rounded-xl bg-sidebar-accent/80 border border-sidebar-accent space-y-2 text-[11px]">
          <div className="flex items-center justify-between text-sidebar-text-3 font-mono text-[10px]">
            <span className="font-bold tracking-wider">SYSTEM STATUS</span>
            {!backendOk ? (
              <span className="text-sidebar-text-3 font-semibold">OFFLINE — backend unreachable</span>
            ) : (
              <span className="flex items-center gap-1 font-semibold">
                <span className={overall === 'ONLINE' ? 'text-success' : 'text-warning'}>
                  ● {overall}
                </span>
                {checkedTime && <span className="text-sidebar-text-3 font-normal">· {checkedTime}</span>}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-sidebar-text font-mono text-[10px]">
            {/* Sandbox */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sidebar-text-3">
                <Terminal className="w-3 h-3" />Sandbox
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${!backendOk ? 'bg-sidebar-text-3' : (sandbox.state === 'ONLINE' ? 'bg-success' : sandbox.state === 'STARTING' ? 'bg-warning' : 'bg-danger')}`} />
                <span className={!backendOk ? 'text-sidebar-text-3' : (sandbox.state === 'ONLINE' ? 'text-sidebar-text-2' : sandbox.state === 'STARTING' ? 'text-warning' : 'text-danger')}>
                  {backendOk ? sandbox.state : 'OFFLINE'}
                </span>
              </span>
            </div>
            {sandbox.state === 'DOWN' && sandbox.detail && backendOk && (
              <p className="text-[9px] text-danger truncate pl-4.5">{sandbox.detail}</p>
            )}

            {/* Intelligence */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sidebar-text-3">
                <Cpu className="w-3 h-3" />Intelligence
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${!backendOk ? 'bg-sidebar-text-3' : (intelligence.state === 'ONLINE' ? 'bg-success' : intelligence.state === 'CHECKING' ? 'bg-sidebar-text-3' : 'bg-danger')}`} />
                <span className={!backendOk ? 'text-sidebar-text-3' : (intelligence.state === 'ONLINE' ? 'text-sidebar-text-2' : intelligence.state === 'CHECKING' ? 'text-sidebar-text-3' : 'text-danger')}>
                  {backendOk ? intelligence.text : 'OFFLINE'}
                </span>
              </span>
            </div>

            {/* Proctoring */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sidebar-text-3">
                <Shield className="w-3 h-3" />Proctoring
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${!backendOk ? 'bg-sidebar-text-3' : (proctorOnline ? 'bg-success' : 'bg-danger')}`} />
                <span className={!backendOk ? 'text-sidebar-text-3' : (proctorOnline ? 'text-sidebar-text-2' : 'text-danger')}>
                  {backendOk ? (proctorOnline ? 'ONLINE' : 'DOWN') : 'OFFLINE'}
                </span>
              </span>
            </div>

            {/* Data */}
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-sidebar-text-3">
                <Database className="w-3 h-3" />Data
              </span>
              <span className="flex items-center gap-1 font-medium">
                <span className={`w-1.5 h-1.5 rounded-full ${!backendOk ? 'bg-sidebar-text-3' : (dataStatus === 'ONLINE' ? 'bg-success' : dataStatus === 'DEGRADED' ? 'bg-warning' : 'bg-danger')}`} />
                <span className={!backendOk ? 'text-sidebar-text-3' : (dataStatus === 'ONLINE' ? 'text-sidebar-text-2' : dataStatus === 'DEGRADED' ? 'text-warning' : 'text-danger')}>
                  {backendOk ? dataStatus : 'OFFLINE'}
                </span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1" />
    </div>
  );
};
