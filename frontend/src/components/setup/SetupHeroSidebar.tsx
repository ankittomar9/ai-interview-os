import React from "react";
import { Sparkles, CheckCircle2 } from "lucide-react";
import { SystemStatusPill } from "./SystemStatusPill";

const LIFECYCLE_STAGES = [
  { num: "1", title: "Calibration & Role Fit", desc: "Identity & grounding" },
  { num: "2", title: "Domain Deep Dive", desc: "Core tech & theory" },
  { num: "3", title: "Sandbox Coding", desc: "Judge0 live testcases" },
  { num: "4", title: "System Architecture", desc: "Canvas & scalability" },
  { num: "5", title: "360° Diagnostic Report", desc: "Rubric hire decision" }
];

export const SetupHeroSidebar: React.FC = () => {
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

        {/* Status Pill (P3) */}
        <div className="pt-2 border-t border-sidebar-accent/60 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-wider text-sidebar-text-3 font-mono">
            SYSTEM STATUS
          </span>
          <SystemStatusPill />
        </div>
      </div>

      <div className="flex-1" />
    </div>
  );
};
