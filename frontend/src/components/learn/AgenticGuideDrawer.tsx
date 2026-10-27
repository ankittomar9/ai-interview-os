import React from 'react';
import {
  X,
  Compass,
  Cpu,
  ShieldCheck,
  Flame,
  Bug,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Sparkles
} from 'lucide-react';

export interface GuideArchetype {
  id: string;
  number: number;
  title: string;
  focus: string;
  description: string;
  judgedOn: string;
  practiceQuestions: Array<{
    slug: string;
    title: string;
    difficulty: 'MEDIUM' | 'HARD';
  }>;
  references: Array<{
    label: string;
    url: string;
  }>;
}

export const AGENTIC_GUIDE_ARCHETYPES: GuideArchetype[] = [
  {
    id: 'mcp-server-tools',
    number: 1,
    title: 'Tool & MCP Server Implementation',
    focus: 'Building robust interfaces for probabilistic callers',
    description:
      'You are given a backend domain service and an LLM client; you must expose it as tools.',
    judgedOn:
      'A strict JSON schema contract (tools/list), correct JSON-RPC tools/call execution, sanitization of untrusted arguments, and structured error responses that let the model self-correct instead of crashing the loop.',
    practiceQuestions: [
      {
        slug: 'agentic-mcp-order-service',
        title: 'Build an MCP Tool Server for Customer Order Status',
        difficulty: 'MEDIUM'
      }
    ],
    references: [
      {
        label: 'Model Context Protocol — Documentation',
        url: 'https://modelcontextprotocol.io/'
      },
      {
        label: 'MCP: Build a Server (Quickstart)',
        url: 'https://modelcontextprotocol.io/quickstart/server'
      }
    ]
  },
  {
    id: 'debugging-hallucinations-injections',
    number: 2,
    title: 'Debugging Hallucinations & Prompt Injection',
    focus: 'Sanitizing context boundaries & bounding tool arguments',
    description:
      'You are given a pre-wired agent loop failing in production: it invents entity IDs that do not exist, or gets hijacked by untrusted text embedded in the data it reads (indirect prompt injection).',
    judgedOn:
      'Isolating the root cause (underspecified tool schemas, un-bracketed untrusted content reaching the prompt), then adding deterministic pre-execution guardrails — schema clamps, parameter bounds, content delimiting.',
    practiceQuestions: [
      {
        slug: 'agentic-debug-hallucinating-agent',
        title: 'Debug Hallucinating Tool Calls and Indirect Prompt Injection',
        difficulty: 'HARD'
      }
    ],
    references: [
      {
        label: 'Anthropic: Effective Context Engineering for AI Agents',
        url: 'https://www.anthropic.com/research/effective-context-engineering-for-ai-agents'
      }
    ]
  },
  {
    id: 'subagent-architecture-guardrails',
    number: 3,
    title: 'Sub-Agent Architecture & Guardrails',
    focus: 'State-graph orchestration, cryptographic identity & scoped permissions',
    description:
      'A design round: multiple autonomous agents, shared state, and destructive actions across distributed systems.',
    judgedOn:
      'State-graph design (persistence, rollback checkpoints), human-in-the-loop approval gates for irreversible steps, loop-breakers against infinite recursion, and identity — each sub-agent carries scoped, cryptographically verifiable permissions so a compromised sub-agent cannot forge the parent authority.',
    practiceQuestions: [
      {
        slug: 'agentic-design-subagent-guardrails',
        title: 'Design Cryptographic Identity and Scoped Permissions for Sub-Agents',
        difficulty: 'HARD'
      }
    ],
    references: [
      {
        label: 'Anthropic: Building Effective Agents',
        url: 'https://www.anthropic.com/research/building-effective-agents'
      },
      {
        label: '12-Factor Agents (HumanLayer)',
        url: 'https://github.com/humanlayer/12-factor-agents'
      },
      {
        label: 'LangGraph (LangChain) — Agent Graphs & State Machines',
        url: 'https://github.com/langchain-ai/langgraph'
      }
    ]
  },
  {
    id: 'production-incident-ops',
    number: 4,
    title: 'Production Incident Ops',
    focus: 'Resilience under agent fanout & asynchronous race conditions',
    description:
      'The agentic track converges with classical incident response when the system under load or failure is driven by agent fanout, stampedes, or deadlock cascades.',
    judgedOn:
      'Symptom → hypothesis → evidence discipline under time pressure, producing a durable fix and root-cause postmortem rather than a hotfix that regresses.',
    practiceQuestions: [
      {
        slug: 'incident-cache-stampede-thundering-herd',
        title: 'Incident: Cache Stampede and Database Saturation on Flash Sale Key Expiry',
        difficulty: 'HARD'
      },
      {
        slug: 'incident-db-connection-pool-exhaustion',
        title: 'Incident: Database Connection Pool Exhaustion Under Load',
        difficulty: 'MEDIUM'
      },
      {
        slug: 'incident-deadlock-distributed-locks',
        title: 'Incident: Distributed Deadlock in Checkout Pipeline',
        difficulty: 'HARD'
      }
    ],
    references: [
      {
        label: 'Chip Huyen: dotagents — AI Agents Resources',
        url: 'https://huyenchip.com/dotagents/'
      }
    ]
  }
];

export const AGENTIC_GOOD_PRACTICES: string[] = [
  'Never say "the LLM will handle it" — enumerate failure modes at each boundary and give each one a deterministic guard.',
  'Design tool errors as informative data ("row 42 does not exist; valid ids are…") instead of uncaught exceptions, enabling autonomous self-correction.',
  'Delimit untrusted content explicitly with brackets/tags and treat any data retrieved from external sources as potential instruction injection.',
  'Add a loop-breaker, maximum step budget, and token ceiling to every autonomous cycle by default.',
  'Know when NOT to use an agent — a deterministic DAG or workflow beats an autonomous agent loop whenever steps and schemas are known.'
];

export interface AgenticGuideDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion?: (slug: string) => void;
}

export const AgenticGuideDrawer: React.FC<AgenticGuideDrawerProps> = ({
  isOpen,
  onClose,
  onSelectQuestion
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="agentic-guide-title"
    >
      <div className="flex-1 cursor-pointer" onClick={onClose} aria-hidden="true" />
      <div className="w-full max-w-2xl bg-surface border-l border-border h-full flex flex-col shadow-2xl overflow-hidden animate-slide-in-right">
        {/* Drawer Header */}
        <div className="p-5 border-b border-border flex items-center justify-between bg-elevated/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary border border-primary/20 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary font-mono bg-primary/10 px-2 py-0.5 rounded border border-primary/20">
                  LMS Guide
                </span>
                <span className="text-xs text-text-3 font-mono">Reference Architecture</span>
              </div>
              <h2 id="agentic-guide-title" className="text-base font-extrabold text-text truncate">
                How Agentic-Track Interviews Work
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer"
            aria-label="Close guide"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Section 1: The Core Doctrine */}
          <section className="p-4 sm:p-5 rounded-2xl bg-primary/5 border border-primary/20 space-y-3">
            <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>The Core Doctrine</span>
            </div>
            <h3 className="text-sm sm:text-base font-extrabold text-text">
              Controlling a Probabilistic Component with Deterministic Code
            </h3>
            <p className="text-xs text-text-2 leading-relaxed">
              Traditional tracks grade deterministic output: an algorithm passes or fails, a schema scales
              or does not. The agentic track grades a fundamentally different skill: you are never judged on
              whether the model &ldquo;is smart&rdquo; — you are judged on the <strong className="text-text font-bold">harness</strong> you
              engineer around it: tool schemas, input sanitization, error contracts, retry policies, and guardrails.
            </p>
            <p className="text-xs text-text-3 leading-relaxed">
              In an interview, you are handed a working system that fails under production conditions, and
              evaluated on whether you can isolate the failure mode in the interface between model and code,
              then repair it with deterministic software engineering.
            </p>
          </section>

          {/* Section 2: How It Differs From Known Tracks */}
          <section className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-3 font-mono flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-text-2" />
              <span>How It Differs From Tracks You Know</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl border border-border bg-surface space-y-1">
                <span className="font-bold text-text-2 block">DSA Track</span>
                <p className="text-[11px] text-text-3">
                  Write algorithmic logic with strict time/space complexity → deterministic pass/fail.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-border bg-surface space-y-1">
                <span className="font-bold text-text-2 block">System Design</span>
                <p className="text-[11px] text-text-3">
                  Architect distributed topologies → evaluate sharding, caching, and replication trade-offs.
                </p>
              </div>
              <div className="p-3 rounded-xl border border-primary/30 bg-primary/5 space-y-1">
                <span className="font-bold text-primary block">Agentic Track</span>
                <p className="text-[11px] text-text-2">
                  Build/repair a tool harness → contain probabilistic reasoning with deterministic boundary gates.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: The Four Archetypes */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-text-3 font-mono">
                The Four Interview Archetypes
              </h4>
              <span className="text-[11px] text-text-3 font-mono">4 Scenarios · Practice Linked</span>
            </div>

            <div className="space-y-4">
              {AGENTIC_GUIDE_ARCHETYPES.map((arch) => {
                const Icon =
                  arch.number === 1
                    ? Cpu
                    : arch.number === 2
                    ? Bug
                    : arch.number === 3
                    ? ShieldCheck
                    : Flame;

                return (
                  <div
                    key={arch.id}
                    className="p-4 rounded-xl border border-border bg-surface space-y-3 hover:border-border/80 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-lg bg-elevated text-primary shrink-0 border border-border">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-mono font-bold text-text-3 uppercase tracking-wider">
                            Archetype {arch.number}
                          </span>
                          <h5 className="text-sm font-bold text-text">{arch.title}</h5>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-elevated text-text-3 shrink-0">
                        {arch.focus}
                      </span>
                    </div>

                    <p className="text-xs text-text-2">{arch.description}</p>

                    <div className="p-3 rounded-lg bg-elevated/50 border border-border/50 text-[11px] space-y-1">
                      <span className="font-bold text-text-3 uppercase tracking-wider text-[10px]">
                        What the Interviewer Judges:
                      </span>
                      <p className="text-text-2">{arch.judgedOn}</p>
                    </div>

                    {/* Linked Practice Questions */}
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-text-3">
                        Curriculum Practice:
                      </span>
                      <div className="space-y-1.5">
                        {arch.practiceQuestions.map((q) => (
                          <div
                            key={q.slug}
                            className="flex items-center justify-between gap-2 p-2 rounded-lg bg-elevated border border-border text-xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                                  q.difficulty === 'HARD'
                                    ? 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                                    : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                }`}
                              >
                                {q.difficulty}
                              </span>
                              <span className="font-medium text-text truncate">{q.title}</span>
                            </div>
                            {onSelectQuestion && (
                              <button
                                type="button"
                                onClick={() => {
                                  onClose();
                                  onSelectQuestion(q.slug);
                                }}
                                className="text-[11px] font-bold text-primary hover:text-primary-hover flex items-center gap-1 shrink-0 cursor-pointer"
                              >
                                <span>Practice</span>
                                <ArrowRight className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Verified Reference Links */}
                    {arch.references.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {arch.references.map((ref, idx) => (
                          <a
                            key={idx}
                            href={ref.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-elevated/60 border border-border text-[11px] text-text-2 hover:text-primary hover:border-primary/40 transition-colors"
                          >
                            <span className="truncate max-w-xs">{ref.label}</span>
                            <ExternalLink className="w-3 h-3 text-text-3 shrink-0" />
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Section 4: What "Good" Looks Like to an Interviewer */}
          <section className="p-4 sm:p-5 rounded-2xl border border-border bg-elevated/40 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-text font-mono flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success" />
              <span>What &ldquo;Good&rdquo; Looks Like to an Interviewer</span>
            </h4>
            <div className="space-y-2 text-xs">
              {AGENTIC_GOOD_PRACTICES.map((tip, idx) => (
                <div key={idx} className="flex items-start gap-2.5">
                  <span className="font-mono text-primary font-bold text-[11px] shrink-0 mt-0.5">
                    0{idx + 1}.
                  </span>
                  <p className="text-text-2 leading-relaxed">{tip}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Drawer Footer */}
        <div className="p-4 border-t border-border bg-surface flex items-center justify-between text-xs text-text-3 shrink-0">
          <span className="font-mono text-[11px]">QB-49 · Practice Center LMS Reference</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-elevated border border-border text-text font-bold hover:bg-elevated/80 transition-colors cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
};
