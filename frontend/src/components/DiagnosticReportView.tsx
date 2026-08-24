import React, { useState, useEffect } from 'react';
import type { DiagnosticReportResponse, DimensionScore } from '../types';
import { fetchSessionTranscript } from '../services/api';
import {
  CheckCircle2,
  AlertTriangle,
  Printer,
  RotateCcw,
  Download,
  MessageSquare,
  ShieldCheck,
  Brain,
  Code2,
  Layers,
  HelpCircle,
  Award
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
  const [activeTab, setActiveTab] = useState<'report' | 'transcript'>('report');
  const [transcriptData, setTranscriptData] = useState<{
    totalTurns?: number;
    candidateName?: string;
    transcript?: Array<{
      turnNumber?: number;
      senderRole: string;
      messageType: string;
      content: string;
      codeSnippet?: string;
      timestamp?: string;
    }>;
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
        .catch((err) => console.warn('Could not load transcript from MongoDB:', err));
    }
  }, [report.sessionId]);

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
    if (!transcriptData || !transcriptData.transcript) return;

    let content = `==========================================================\n`;
    content += `AI INTERVIEW OS - CANDIDATE TRANSCRIPT AUDIT LOG\n`;
    content += `==========================================================\n`;
    content += `Session ID: ${report.sessionId}\n`;
    content += `Candidate: ${transcriptData.candidateName || report.candidateId}\n`;
    content += `Target Role: ${report.roleTitle} (${report.difficulty})\n`;
    content += `Track: ${report.track}\n`;
    content += `Overall Score: ${report.overallScore}/100 [Verdict: ${report.verdict}]\n`;
    content += `Total Dialogue Turns: ${transcriptData.totalTurns || 0}\n`;
    content += `==========================================================\n\n`;

    transcriptData.transcript.forEach((turn, index: number) => {
      content += `[TURN #${turn.turnNumber || index + 1}] - ${turn.senderRole} (${turn.timestamp || 'N/A'})\n`;
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
          {transcriptData && (
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
              <span>Audited Transcript {transcriptData?.totalTurns ? `(${transcriptData.totalTurns} Turns)` : ''}</span>
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
        ) : (
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
              {transcriptData && transcriptData.transcript ? (
                transcriptData.transcript.map((turn, index: number) => (
                  <div
                    key={index}
                    className="border-b border-border/50 py-3 space-y-1.5 last:border-b-0"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-elevated border border-border text-text-2">
                          {turn.senderRole}
                        </span>
                        <span className="text-xs text-text-3">Turn #{turn.turnNumber || index + 1}</span>
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
        transcript={transcriptData?.transcript || []}
        stackAbove="none"
      />
    </div>
  );
};