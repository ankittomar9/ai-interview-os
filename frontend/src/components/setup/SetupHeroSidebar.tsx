import React from "react";
import { Sparkles, CheckCircle2, Terminal, Cpu, Shield } from "lucide-react";

const LIFECYCLE_STAGES = [
  { num: "1", title: "Calibration & Role Fit", desc: "Identity & grounding" },
  { num: "2", title: "Domain Deep Dive", desc: "Core tech & theory" },
  { num: "3", title: "Sandbox Coding", desc: "Judge0 live testcases" },
  { num: "4", title: "System Architecture", desc: "Canvas & scalability" },
  { num: "5", title: "360° Diagnostic Report", desc: "Rubric hire decision" }
];

export const SetupHeroSidebar: React.FC = () => {
  return (
    <div className="lg:col-span-4 bg-elevated/60 border-b lg:border-b-0 lg:border-r border-border p-6 sm:p-8 flex flex-col justify-between space-y-6 select-none">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white leading-tight">AI Interview OS</h1>
              <span className="text-[10px] font-mono text-primary font-semibold">ENTERPRISE EVALUATION</span>
            </div>
          </div>
          <p className="text-xs text-text-3 leading-relaxed">
            Zero-Trust Autonomous Technical Assessment & Socratic Practice Arena
          </p>
        </div>

        <div className="space-y-2.5 pt-2 border-t border-border/60 text-xs">
          <div className="flex items-start gap-2 text-text-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>Autonomous Multi-Track Socratic Interviewing</span>
          </div>
          <div className="flex items-start gap-2 text-text-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>Real-time Multimodal Architecture & Sandbox Evaluation</span>
          </div>
          <div className="flex items-start gap-2 text-text-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>Zero-Trust Proctoring with Behavioral Biometrics</span>
          </div>
        </div>

        <div className="space-y-2 pt-2 border-t border-border/60">
          <span className="text-[10px] font-bold uppercase tracking-wider text-text-3 font-mono">
            Interview Lifecycle
          </span>
          <div className="space-y-2">
            {LIFECYCLE_STAGES.map((st) => (
              <div key={st.num} className="flex items-center gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-surface border border-border flex items-center justify-center font-mono text-[10px] text-primary font-bold">
                  {st.num}
                </span>
                <div className="min-w-0">
                  <p className="font-semibold text-text truncate">{st.title}</p>
                  <p className="text-[10px] text-text-3 truncate">{st.desc}</p>
                </div>
              </div>
            ))} 
          </div>
        </div>
      </div>

      <div className="p-3 rounded-xl bg-surface/80 border border-border space-y-1.5 text-[11px]">
        <div className="flex items-center justify-between text-text-3 font-mono text-[10px]">
          <span>ENGINE STATUS</span>
          <span className="text-emerald-500 flex items-center gap-1 font-bold">● LIVE</span>
        </div>
        <div className="space-y-1 text-text-2 font-mono text-[10px]">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1"><Terminal className="w-3 h-3 text-text-3" />Sandbox</span>
            <span className="text-text">Judge0 CE (Docker)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-text-3" />Intelligence</span>
            <span className="text-primary font-bold">Multi-Provider LLM</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-text-3" />Proctoring</span>
            <span className="text-text">Sentinel Biometrics</span>
          </div>
        </div>
      </div>
    </div>
  );
};