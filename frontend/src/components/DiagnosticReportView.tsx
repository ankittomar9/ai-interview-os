import React, { useState, useEffect } from 'react';
import type { DiagnosticReportResponse, DimensionScore } from '../types';
import { fetchSessionTranscript } from '../services/api';
import {
  Award,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Printer,
  RotateCcw,
  Download,
  MessageSquare,
  Sparkles,
  ShieldCheck,
  Brain,
  Code2,
  Layers,
  HelpCircle
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Chip } from './ui/Chip';
import { ScoreRing } from './ui/ScoreRing';
import { RadarChart } from './ui/RadarChart';
import { RubricCard } from './ui/RubricCard';

interface Props {
  report: DiagnosticReportResponse;
  onRestart: () => void;
}

export const DiagnosticReportView: React.FC<Props> = ({ report, onRestart }) => {
  const [activeTab, setActiveTab] = useState<'report' | 'transcript'>('report');
  const [transcriptData, setTranscriptData] = useState<any | null>(null);

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
        return <Chip variant="success" size="md">Strong Hire (Top 5%)</Chip>;
      case 'HIRE':
        return <Chip variant="primary" size="md">Hire (Meets All Bars)</Chip>;
      case 'LEAN_HIRE':
        return <Chip variant="warning" size="md">Lean Hire (Borderline)</Chip>;
      default:
        return <Chip variant="danger" size="md">No Hire (Gaps Identified)</Chip>;
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

    transcriptData.transcript.forEach((turn: any, index: number) => {
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

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 select-text space-y-6">

      {/* Top Action Bar */}
      <div className="no-print flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button
            variant={activeTab === 'report' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Award className="w-4 h-4" />}
            onClick={() => setActiveTab('report')}
          >
            360° Diagnostic Scorecard
          </Button>
          <Button
            variant={activeTab === 'transcript' ? 'primary' : 'secondary'}
            size="sm"
            icon={<MessageSquare className="w-4 h-4" />}
            onClick={() => setActiveTab('transcript')}
          >
            Audited Dialogue Transcript ({transcriptData?.totalTurns || 0} Turns)
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {transcriptData && (
            <Button
              variant="secondary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
              onClick={handleDownloadTranscript}
            >
              Export Transcript (.txt)
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            icon={<Printer className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Print PDF
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<RotateCcw className="w-4 h-4" />}
            onClick={onRestart}
          >
            New Assessment
          </Button>
        </div>
      </div>

      {activeTab === 'report' ? (
        <div className="space-y-6">

          {/* Header Card: ScoreRing + Executive Summary + Verdict */}
          <Card padding="lg" variant="elevated" className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            {/* Left: Overall Score Gauge */}
            <div className="md:col-span-4 flex flex-col items-center justify-center p-2 border-b md:border-b-0 md:border-r border-border">
              <ScoreRing score={report.overallScore} size={140} strokeWidth={12} />
              <div className="mt-3 flex flex-col items-center gap-1">
                {getVerdictChip(report.verdict)}
                <div className="mt-1">
                  {report.llmGenerated ? (
                    <Chip variant="primary" size="sm" icon={<Sparkles className="w-3 h-3" />}>
                      Evaluated by LLM Rubric
                    </Chip>
                  ) : (
                    <Chip variant="neutral" size="sm">
                      Deterministic Fallback Score
                    </Chip>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Meta & Executive Summary */}
            <div className="md:col-span-8 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-extrabold text-white tracking-tight">
                    {report.roleTitle}
                  </h2>
                  <p className="text-xs text-text-3 mt-0.5">
                    Candidate: <strong className="text-text">{report.candidateId}</strong> • Track: <strong className="text-text">{report.track}</strong> • Level: <strong className="text-text">{report.difficulty}</strong>
                  </p>
                </div>
                <div className="text-xs text-text-3 font-mono">
                  Session #{report.sessionId}
                </div>
              </div>

              <p className="text-xs text-text-2 leading-relaxed bg-surface p-3.5 rounded-lg border border-border">
                {report.executiveSummary || 'Comprehensive diagnostic summary derived from live dialogue, sandbox test executions, and candidate reasoning.'}
              </p>
            </div>
          </Card>

          {/* 6-Metric Score Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              {
                label: 'Technical Accuracy',
                score: report.scorecard?.technicalAccuracy ?? 0,
                icon: <Brain className="w-4 h-4 text-primary-2" />
              },
              {
                label: 'Problem Solving',
                score: report.scorecard?.problemSolving ?? 0,
                icon: <Layers className="w-4 h-4 text-sky-400" />
              },
              {
                label: 'Code Quality',
                score: report.scorecard?.codeQuality ?? 0,
                icon: <Code2 className="w-4 h-4 text-emerald-400" />
              },
              {
                label: 'Communication',
                score: report.scorecard?.communicationClarity ?? 0,
                icon: <MessageSquare className="w-4 h-4 text-purple-400" />
              },
              {
                label: 'Proctor Integrity',
                score: report.scorecard?.integrityScore ?? 100,
                icon: <ShieldCheck className="w-4 h-4 text-success" />
              },
              {
                label: 'Reqs Clarity',
                score: report.scorecard?.requirementsClarification ?? report.requirementsClarityScore ?? 75,
                icon: <HelpCircle className="w-4 h-4 text-warning" />
              }
            ].map((metric, i) => (
              <Card key={i} padding="sm" variant="default" className="flex flex-col gap-1.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] text-text-3 font-semibold truncate">
                  {metric.icon}
                  <span>{metric.label}</span>
                </div>
                <span className="text-lg font-black font-mono text-white">
                  {metric.score}<span className="text-xs text-text-3 font-normal">/100</span>
                </span>
              </Card>
            ))}
          </div>

          {/* Visual Radar Chart + Strengths & Areas for Focus */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Radar Chart */}
            <Card padding="md" variant="elevated" className="lg:col-span-5 flex flex-col gap-2">
              <h3 className="text-xs font-bold text-text-3 uppercase tracking-wider">
                Competency Radar Analysis
              </h3>
              <RadarChart dimensions={radarDimensions} height={240} />
            </Card>

            {/* Strengths & Weaknesses */}
            <div className="lg:col-span-7 space-y-4">
              {/* Key Strengths */}
              <Card padding="md" variant="elevated" className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-success uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Demonstrated Strengths</span>
                </div>
                <ul className="space-y-1.5 text-xs text-text-2 list-disc list-inside">
                  {report.keyStrengths && report.keyStrengths.length > 0 ? (
                    report.keyStrengths.map((s, idx) => <li key={idx}>{s}</li>)
                  ) : (
                    <li>Candidate demonstrated solid foundational understanding and structured execution.</li>
                  )}
                </ul>
              </Card>

              {/* Areas for Focus */}
              <Card padding="md" variant="elevated" className="space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-warning uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Growth Areas & Gaps Identified</span>
                </div>
                <ul className="space-y-1.5 text-xs text-text-2 list-disc list-inside">
                  {report.areasForImprovement && report.areasForImprovement.length > 0 ? (
                    report.areasForImprovement.map((w, idx) => <li key={idx}>{w}</li>)
                  ) : (
                    <li>Deepen trade-off analysis under high-concurrency edge cases and failure modes.</li>
                  )}
                </ul>
              </Card>
            </div>
          </div>

          {/* 5-Dimension Rubric Detail with Verbatim Evidence Quotes */}
          {report.dimensions && report.dimensions.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-2" />
                <span>Audited Dimension Evidence & Rationales</span>
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

          {/* 7-Day Targeted Study Plan */}
          {report.sevenDayStudyPlan && report.sevenDayStudyPlan.length > 0 && (
            <Card padding="lg" variant="elevated" className="space-y-3">
              <div className="flex items-center gap-2 text-sm font-bold text-primary-2 uppercase tracking-wider">
                <Calendar className="w-4 h-4" />
                <span>7-Day Targeted Mastery Plan</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {report.sevenDayStudyPlan.map((planItem, idx) => (
                  <div key={idx} className="bg-surface border border-border p-3 rounded-lg flex items-start gap-2.5 text-xs">
                    <span className="w-5 h-5 rounded-full bg-primary/20 text-primary-2 font-mono font-bold flex items-center justify-center shrink-0 text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="text-text-2 leading-snug">{planItem}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

        </div>
      ) : (
        /* Full Audited Dialogue Transcript */
        <Card padding="lg" variant="elevated" className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Full Session Dialogue Audit Log</h3>
              <p className="text-xs text-text-3">Immutable chronological transcript persisted in MongoDB.</p>
            </div>
            <Chip variant="primary" size="sm">
              Session #{report.sessionId}
            </Chip>
          </div>

          <div className="space-y-3">
            {transcriptData && transcriptData.transcript ? (
              transcriptData.transcript.map((turn: any, index: number) => (
                <div
                  key={index}
                  className={`p-3.5 rounded-lg border text-xs leading-relaxed space-y-1.5 ${
                    turn.senderRole === 'CANDIDATE'
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-surface border-border'
                  }`}
                >
                  <div className="flex justify-between items-center text-[11px] font-bold text-primary-2">
                    <span>Turn #{turn.turnNumber || index + 1} • {turn.senderRole}</span>
                    <span className="text-text-3 font-normal">{turn.timestamp || 'N/A'}</span>
                  </div>

                  <p className="text-text whitespace-pre-wrap">
                    {turn.content}
                  </p>

                  {turn.codeSnippet && turn.codeSnippet.trim() && (
                    <div className="mt-2 bg-elevated border border-border-subtle rounded p-2.5 font-mono text-[11px] text-text-2 overflow-x-auto">
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
        </Card>
      )}

    </div>
  );
};