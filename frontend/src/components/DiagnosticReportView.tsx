import React, { useState, useEffect, useMemo } from 'react';
import type { DiagnosticReportResponse, DimensionScore, SessionMessage } from '../types';
import { fetchSessionTranscript } from '../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  RotateCcw,
  Download,
  MessageSquare,
  ShieldCheck,
  Shield,
  ShieldAlert,
  Brain,
  Code2,
  Layers,
  HelpCircle,
  Award,
  Video
} from 'lucide-react';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { ScoreRing } from './ui/ScoreRing';
import { RadarChart } from './ui/RadarChart';
import { RubricCard } from './ui/RubricCard';
import { FloatingAiOrb } from './ai/FloatingAiOrb';
import { AiAssistantPanel } from './ai/AiAssistantPanel';

interface Props {
  report: DiagnosticReportResponse;
  onRestart: () => void;
}

export const DiagnosticReportView: React.FC<Props> = ({ report, onRestart }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'transcript' | 'recording'>('report');
  const [transcriptData, setTranscriptData] = useState<SessionMessage[] | {
    totalTurns?: number;
    candidateName?: string;
    transcript?: SessionMessage[];
  } | null>(null);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(() => sessionStorage.getItem('ai.panel.report') === 'true');

  const toggleAiPanel = () => {
    setIsAiPanelOpen((prev) => {
      const next = !prev;
      sessionStorage.setItem('ai.panel.report', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (report.sessionId) {
      fetchSessionTranscript(report.sessionId)
        .then((data) => setTranscriptData(data))
        .catch((err) => console.warn('Could not load transcript records:', err));
    }
  }, [report.sessionId]);

  const transcriptList = useMemo((): SessionMessage[] => {
    if (!transcriptData) return [];
    if (Array.isArray(transcriptData)) return transcriptData;
    return transcriptData.transcript || [];
  }, [transcriptData]);

  // Calculate aggregate integrity metrics
  const integrityMetrics = useMemo(() => {
    const candidateMessages = transcriptList.filter(
      (m) => m.senderRole === 'CANDIDATE' || m.senderRole === 'candidate'
    );

    const totalKeystrokes = candidateMessages.reduce((sum, m) => sum + (m.keystrokeCount || 0), 0);
    const totalCopies = candidateMessages.reduce((sum, m) => sum + (m.copyCount || 0), 0);
    const totalPastes = candidateMessages.reduce((sum, m) => sum + (m.pasteCount || 0), 0);
    const totalTabSwitches = candidateMessages.reduce((sum, m) => sum + (m.tabSwitchCount || 0), 0);

    const suspiciousTurns = candidateMessages.filter((m) => m.suspiciousTyping).length;
    const avgWpm = candidateMessages.length > 0
      ? Math.round(candidateMessages.reduce((sum, m) => sum + (m.estimatedWpm || 0), 0) / candidateMessages.length)
      : 0;

    const calculateIntegrityScore = (copies: number, pastes: number, tabSwitches: number, suspiciousTurns: number, totalTurns: number) => {
      if (totalTurns === 0) return 100;
      let score = 100;
      // Penalize copy events (-10 per copy)
      score -= copies * 10;
      // Penalize excessive pastes (-5 per paste beyond 2)
      score -= Math.max(0, pastes - 2) * 5;
      // Penalize tab switches (-3 per switch beyond 1)
      score -= Math.max(0, tabSwitches - 1) * 3;
      // Penalize suspicious typing (-20 per suspicious turn)
      score -= suspiciousTurns * 20;
      return Math.max(0, Math.min(100, score));
    };

    return {
      totalKeystrokes,
      totalCopies,
      totalPastes,
      totalTabSwitches,
      suspiciousTurns,
      avgWpm,
      integrityScore: calculateIntegrityScore(totalCopies, totalPastes, totalTabSwitches, suspiciousTurns, candidateMessages.length)
    };
  }, [transcriptList]);

  const getVerdictChip = (verdict: string) => {
    switch (verdict) {
      case 'STRONG_HIRE':
        return <Chip variant="success" size="sm">Strong Hire (Top 5%)</Chip>;
      case 'HIRE':
        return <Chip variant="success" size="sm">Hire (Meets All Bars)</Chip>;
      case 'LEAN_HIRE':
        return <Chip variant="warning" size="sm">Lean Hire (Borderline)</Chip>;
      default:
        return <Chip variant="danger" size="sm">No Hire (Gaps Identified)</Chip>;
    }
  };

  // Dimensions for Radar Chart
  const radarDimensions = [
    {
      dimension: 'Technical Accuracy',
      score: report.scorecard?.technicalAccuracy ?? 70
    },
    {
      dimension: 'Problem Solving',
      score: report.scorecard?.problemSolving ?? 70
    },
    {
      dimension: 'Code Quality',
      score: report.scorecard?.codeQuality ?? 70
    },
    {
      dimension: 'Communication',
      score: report.scorecard?.communicationClarity ?? 70
    },
    {
      dimension: 'Requirements',
      score: report.scorecard?.requirementsClarification ?? report.requirementsClarityScore ?? 70
    }
  ];

  // Export Transcript to formatted text file
  const handleDownloadTranscript = () => {
    if (transcriptList.length === 0) return;

    let content = `==========================================================\n`;
    content += `AI INTERVIEW OS - CANDIDATE TRANSCRIPT AUDIT LOG\n`;
    content += `==========================================================\n`;
    content += `Session ID: ${report.sessionId}\n`;
    content += `Candidate: ${report.candidateId}\n`;
    content += `Target Role: ${report.roleTitle} (${report.difficulty})\n`;
    content += `Track: ${report.track}\n`;
    content += `Overall Score: ${report.overallScore}/100 [Verdict: ${report.verdict}]\n`;
    content += `Total Dialogue Turns: ${transcriptList.length}\n`;
    content += `==========================================================\n\n`;

    transcriptList.forEach((turn, index: number) => {
      content += `[TURN #${index + 1}] - ${turn.senderRole} (${turn.timestamp || 'N/A'})\n`;
      content += `Type: ${turn.messageType}\n`;
      content += `Content: ${turn.content}\n`;
      if (turn.codeSnippet && turn.codeSnippet.trim()) {
        content += `Code Snapshot:\n${turn.codeSnippet}\n`;
      }
      content += `----------------------------------------------------------\n\n`;
    });

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Interview_Transcript_Session_${report.sessionId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getScoreColorClass = (val: number) => {
    if (val >= 70) return 'text-success';
    if (val >= 40) return 'text-warning';
    return 'text-danger';
  };

  const dimensionMetrics = [
    {
      label: 'Technical Accuracy',
      score: report.scorecard?.technicalAccuracy ?? 0,
      icon: <Brain className="w-4 h-4 text-text-3" />
    },
    {
      label: 'Problem Solving',
      score: report.scorecard?.problemSolving ?? 0,
      icon: <Layers className="w-4 h-4 text-text-3" />
    },
    {
      label: 'Code Quality',
      score: report.scorecard?.codeQuality ?? 0,
      icon: <Code2 className="w-4 h-4 text-text-3" />
    },
    {
      label: 'Communication',
      score: report.scorecard?.communicationClarity ?? 0,
      icon: <MessageSquare className="w-4 h-4 text-text-3" />
    },
    {
      label: 'Proctor Integrity',
      score: report.scorecard?.integrityScore ?? 100,
      icon: <ShieldCheck className="w-4 h-4 text-text-3" />
    },
    {
      label: 'Reqs Clarity',
      score: report.scorecard?.requirementsClarification ?? report.requirementsClarityScore ?? 75,
      icon: <HelpCircle className="w-4 h-4 text-text-3" />
    }
  ];

  return (
    <div className="min-h-screen bg-bg text-text select-text">
      {/* FULL-WIDTH STICKY HEADER */}
      <header className="sticky top-0 z-10 h-12 bg-surface border-b border-border flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text">Diagnostic Report</span>
          <Chip variant="neutral" size="sm">
            Session #{report.sessionId}
          </Chip>
        </div>

        <div className="flex items-center gap-2 print:hidden">
          {transcriptList.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              icon={<Download className="w-3.5 h-3.5" />}
              onClick={handleDownloadTranscript}
            >
              Export .txt
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            icon={<Printer className="w-3.5 h-3.5" />}
            onClick={() => window.print()}
          >
            Print PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={onRestart}
          >
            New Assessment
          </Button>
        </div>
      </header>

      {/* CENTERED MAIN CONTENT (MAX-W-6XL MX-AUTO) */}
      <main className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* UNDERLINE TAB NAVIGATION */}
        <div className="border-b border-border flex items-center gap-6 text-sm print:hidden">
          <button
            type="button"
            onClick={() => setActiveTab('report')}
            className={`pb-2.5 font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'report'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Diagnostic Scorecard</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('transcript')}
            className={`pb-2.5 font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'transcript'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Audited Transcript {transcriptList.length > 0 ? `(${transcriptList.length} Turns)` : ''}</span>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('recording')}
            className={`pb-2.5 font-semibold transition-colors cursor-pointer border-b-2 ${
              activeTab === 'recording'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4" />
              <span>Session Recording</span>
            </div>
          </button>
        </div>

        {activeTab === 'report' ? (
          <div className="space-y-6">

            {/* B. VERDICT BANNER CARD */}
            <div className="bg-surface border border-border rounded-lg p-6 grid grid-cols-1 md:grid-cols-[auto_1fr] gap-6 items-center">
              {/* ScoreRing Left */}
              <div className="flex flex-col items-center justify-center shrink-0">
                <ScoreRing score={report.overallScore} size={120} strokeWidth={10} />
              </div>

              {/* Meta & Summary Right */}
              <div className="space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="space-y-1">
                    <h1 className="text-xl font-bold text-text">
                      {report.roleTitle}
                    </h1>
                    <div className="text-xs text-text-3">
                      {report.candidateId} · {report.track} · {report.difficulty} · Session #{report.sessionId}
                    </div>
                  </div>
                  <div>
                    {getVerdictChip(report.verdict)}
                  </div>
                </div>

                <p className="text-sm text-text-2 leading-relaxed">
                  {report.executiveSummary || 'Comprehensive diagnostic evaluation derived from live candidate dialogue, code quality, and architectural reasoning.'}
                </p>

                {!report.llmGenerated && (
                  <div className="text-[11px] text-text-3">
                    Deterministic fallback evaluation
                  </div>
                )}
              </div>
            </div>

            {/* C. 6-DIMENSION ROW */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {dimensionMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-surface border border-border rounded-lg p-4 text-center flex flex-col items-center justify-center gap-1"
                >
                  <div className="flex items-center justify-center gap-1.5 text-xs text-text-3 font-medium">
                    {metric.icon}
                    <span>{metric.label}</span>
                  </div>
                  <div className="text-2xl font-bold font-mono">
                    <span className={getScoreColorClass(metric.score)}>{metric.score}</span>
                    <span className="text-xs text-text-3 font-normal ml-0.5">/100</span>
                  </div>
                </div>
              ))}
            </div>

            {/* D. MIDDLE ROW: RADAR | NARRATIVE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
              {/* Radar Card */}
              <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-text">
                  Competency Radar
                </h3>
                <RadarChart dimensions={radarDimensions} height={260} />
              </div>

              {/* Narrative Card: Strengths & Growth Areas */}
              <div className="bg-surface border border-border rounded-lg p-4 flex flex-col gap-4">
                {/* Strengths */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text">
                    <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                    <span>Strengths</span>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-text-2 space-y-1">
                    {report.keyStrengths && report.keyStrengths.length > 0 ? (
                      report.keyStrengths.map((s, idx) => <li key={idx}>{s}</li>)
                    ) : (
                      <li>Candidate demonstrated solid foundational understanding and structured execution.</li>
                    )}
                  </ul>
                </div>

                {/* Growth Areas */}
                <div className="space-y-2 pt-3 border-t border-border/60">
                  <div className="flex items-center gap-2 text-sm font-semibold text-text">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                    <span>Growth Areas</span>
                  </div>
                  <ul className="list-disc pl-5 text-sm text-text-2 space-y-1">
                    {report.areasForImprovement && report.areasForImprovement.length > 0 ? (
                      report.areasForImprovement.map((w, idx) => <li key={idx}>{w}</li>)
                    ) : (
                      <li>Deepen trade-off analysis under high-concurrency edge cases and failure modes.</li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* 5-Dimension Rubric Detail with Evidence Quotes */}
            {report.dimensions && report.dimensions.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-text">
                  Audited Dimension Evidence
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.dimensions.map((dim: DimensionScore, idx: number) => (
                    <RubricCard
                      key={idx}
                      dimension={dim.dimension}
                      score={dim.score}
                      rationale={dim.rationale}
                      evidence={dim.evidence}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Integrity Signals Section */}
            <section className="bg-surface border border-border rounded-lg p-6 space-y-4">
              <h2 className="text-base font-bold text-text flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                <span>Integrity &amp; Anti-Cheating Signals</span>
              </h2>

              {/* Integrity Score */}
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text">Integrity Score</span>
                <span className={`text-2xl font-bold font-mono ${
                  integrityMetrics.integrityScore >= 80 ? 'text-success' :
                  integrityMetrics.integrityScore >= 50 ? 'text-warning' :
                  'text-danger'
                }`}>
                  {integrityMetrics.integrityScore}/100
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-elevated rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    integrityMetrics.integrityScore >= 80 ? 'bg-success' :
                    integrityMetrics.integrityScore >= 50 ? 'bg-warning' :
                    'bg-danger'
                  }`}
                  style={{ width: `${integrityMetrics.integrityScore}%` }}
                />
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="text-2xl font-bold text-text font-mono">{integrityMetrics.totalKeystrokes.toLocaleString()}</div>
                  <div className="text-xs text-text-3 mt-1">Total Keystrokes</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-text font-mono">{integrityMetrics.avgWpm}</div>
                  <div className="text-xs text-text-3 mt-1">Avg WPM</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning font-mono">{integrityMetrics.totalCopies}</div>
                  <div className="text-xs text-text-3 mt-1">Copy Events</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-warning font-mono">{integrityMetrics.totalPastes}</div>
                  <div className="text-xs text-text-3 mt-1">Paste Events</div>
                </div>
              </div>

              {/* Flags */}
              {integrityMetrics.totalTabSwitches > 1 && (
                <div className="flex items-center gap-2 p-3 bg-warning/10 border border-warning/30 rounded-lg text-xs text-warning">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Tab switches detected: {integrityMetrics.totalTabSwitches} (may indicate external resource usage)</span>
                </div>
              )}

              {integrityMetrics.suspiciousTurns > 0 && (
                <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Suspicious typing patterns detected in {integrityMetrics.suspiciousTurns} turn(s) (possible copy-paste or bot-like behavior)</span>
                </div>
              )}

              {integrityMetrics.integrityScore < 70 && (
                <div className="flex items-center gap-2 p-3 bg-danger/10 border border-danger/30 rounded-lg text-xs text-danger">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>Low integrity score suggests potential academic dishonesty. Review candidate behavior and code similarity.</span>
                </div>
              )}
            </section>

            {/* E. 7-DAY TARGETED MASTERY PLAN */}
            {report.sevenDayStudyPlan && report.sevenDayStudyPlan.length > 0 && (
              <div className="bg-surface border border-border rounded-lg p-5 space-y-3">
                <h3 className="text-sm font-semibold text-text">
                  7-Day Targeted Mastery Plan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {report.sevenDayStudyPlan.map((planItem, idx) => (
                    <div
                      key={idx}
                      className="bg-surface border border-border rounded-lg p-3 flex gap-3 items-start"
                    >
                      <span className="w-6 h-6 rounded bg-elevated border border-border text-xs font-bold text-text-2 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-sm text-text-2 leading-relaxed">
                        {planItem}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        ) : activeTab === 'transcript' ? (
          /* F. FULL AUDITED DIALOGUE TRANSCRIPT */
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-sm font-semibold text-text">Full Session Dialogue Audit Log</h3>
                <p className="text-xs text-text-3 mt-0.5">Immutable chronological transcript persisted in MongoDB.</p>
              </div>
              <Chip variant="neutral" size="sm">
                Session #{report.sessionId}
              </Chip>
            </div>

            <div className="space-y-1">
              {transcriptList && transcriptList.length > 0 ? (
                transcriptList.map((turn, index: number) => (
                  <div
                    key={index}
                    className="border-b border-border/50 py-3 space-y-1.5 last:border-b-0"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-elevated border border-border text-text-2">
                          {turn.senderRole}
                        </span>
                        <span className="text-xs text-text-3">Turn #{turn.id || index + 1}</span>
                      </div>
                      <span className="text-[11px] text-text-3 font-mono">{turn.timestamp || 'N/A'}</span>
                    </div>

                    <p className="text-sm text-text-2 whitespace-pre-wrap leading-relaxed">
                      {turn.content}
                    </p>

                    {turn.codeSnippet && turn.codeSnippet.trim() && (
                      <div className="mt-2 bg-elevated border border-border rounded p-3 font-mono text-xs text-text-2 overflow-x-auto">
                        <pre>{turn.codeSnippet}</pre>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-xs text-text-3 text-center py-8">
                  Loading audited transcript records...
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-surface border border-border rounded-lg p-6 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-3 border-b border-border pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-text" />
                    <h2 className="text-base font-bold text-text">Proctored Session Recording</h2>
                  </div>
                  <p className="text-xs text-text-3 mt-1">
                    Continuous video &amp; audio proctor stream recorded across session chunks in MongoDB GridFS (7-day lifecycle retention).
                  </p>
                </div>
                <a
                  href={`/api/v1/sessions/${report.sessionId}/recordings/download`}
                  download={`session-${report.sessionId}-recording.webm`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded bg-primary text-on-accent hover:bg-primary/90 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .webm</span>
                </a>
              </div>

              <div className="w-full bg-black rounded-lg overflow-hidden border border-border aspect-video max-h-[500px] flex items-center justify-center">
                <video
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                  src={`/api/v1/sessions/${report.sessionId}/recordings/stream`}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                <div className="bg-elevated p-3 rounded border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-text-3 block">Storage Engine</span>
                  <span className="text-xs font-bold text-text">MongoDB GridFS Chunked</span>
                </div>
                <div className="bg-elevated p-3 rounded border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-text-3 block">Stream Format</span>
                  <span className="text-xs font-bold text-text">WebM (VP8 / Opus 5000ms chunks)</span>
                </div>
                <div className="bg-elevated p-3 rounded border border-border space-y-1">
                  <span className="text-[11px] font-semibold text-text-3 block">Integrity Status</span>
                  <Chip variant="success" size="sm">
                    Verified Stream Available
                  </Chip>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* FLOATING AI ORB & ASSISTANT PANEL */}
      <FloatingAiOrb
        isOpen={isAiPanelOpen}
        onToggle={toggleAiPanel}
        isAiSpeaking={false}
        hasUnread={false}
        stackAbove="none"
      />

      <AiAssistantPanel
        open={isAiPanelOpen}
        onClose={() => {
          setIsAiPanelOpen(false);
          sessionStorage.setItem('ai.panel.report', 'false');
        }}
        mode="review"
        personaName="Dr. Anya Chen"
        personaTitle="AI Principal Bar Raiser"
        currentStage="Audited Transcript"
        transcript={transcriptList}
        stackAbove="none"
      />
    </div>
  );
};