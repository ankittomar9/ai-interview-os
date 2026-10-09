import React, { useEffect } from "react";
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider, SectionType } from "../../types";
import { IntroScreen } from "./screens/IntroScreen";
import { DsaScreen } from "./screens/DsaScreen";
import { SqlScreen } from "./screens/SqlScreen";
import { LldScreen } from "./screens/LldScreen";
import { HldScreen } from "./screens/HldScreen";
import { BehavioralScreen } from "./screens/BehavioralScreen";
import { ResumeScreen } from "./screens/ResumeScreen";
import { EmptyTrackState } from "./EmptyTrackState";
import { SessionSectionFaultState } from "./SessionSectionFaultState";
import { ScreenErrorBoundary } from "./ScreenErrorBoundary";
import type { ExecutionResult } from "../ide/TestcasePanel";
import { clientLog } from "../../lib/clientLogger";

interface TrackScreenRouterProps {
  sectionType?: SectionType;
  sectionQuestions?: GenerateQuestionResponse[][];
  track: InterviewTrack | string;
  sessionId: number;
  question: GenerateQuestionResponse;
  questionsCount: number;
  code: string;
  onChangeCode: (val: string) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  onRunCode: () => Promise<void>;
  onSubmitSolution: (summary?: string) => Promise<void>;
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  provider: ModelProvider;
  apiKey: string;
  isPlayground?: boolean;
  onNextQuestion?: () => void;
  onNextStage?: () => void;
  onFinish?: () => void;
  candidateName?: string;
  onSelectTrack?: (track: InterviewTrack | string) => void;
  onBrowseCatalog?: () => void;
  isApproachGateLocked?: boolean;
  onRunAttempt?: () => void;
}

export const TrackScreenRouter: React.FC<TrackScreenRouterProps> = ({
  sectionType,
  sectionQuestions: _sectionQuestions,
  track,
  sessionId,
  question,
  questionsCount,
  code,
  onChangeCode,
  language,
  onChangeLanguage,
  onRunCode,
  onSubmitSolution,
  isExecuting,
  executionResult,
  provider,
  apiKey,
  isPlayground,
  onNextQuestion,
  onNextStage,
  onFinish = () => {},
  candidateName,
  onSelectTrack,
  onBrowseCatalog,
  isApproachGateLocked,
  onRunAttempt
}) => {
  const resolveSectionType = (): SectionType => {
    if (!isPlayground && sectionType) return sectionType;
    const targetTrack = question?.track || track;
    switch (targetTrack) {
      case 'SQL': return 'SQL';
      case 'SPRING_LLD':
      case 'JAVA_SPRING_BOOT':
      case 'LLD_HLD': return 'LLD';
      case 'SYSTEM_DESIGN': return 'SYSTEM_DESIGN';
      case 'BEHAVIORAL_STAR': return 'BEHAVIORAL';
      case 'RESUME_BASED': return 'RESUME';
      case 'ALGORITHMS_DATA_STRUCTURES':
      case 'DSA_LLD':
      case 'DSA_LLD_HLD':
      case 'FULL_LOOP': return 'DSA';
      default: return sectionType || 'DSA';
    }
  };

  const effectiveSection = resolveSectionType();

  useEffect(() => {
    if (isPlayground && questionsCount === 0 && (effectiveSection === 'DSA' || effectiveSection === 'SQL' || effectiveSection === 'LLD' || effectiveSection === 'SYSTEM_DESIGN')) {
      clientLog.info('EMPTY_TRACK_STATE', `EmptyTrackState mounted for track=${track}`);
    }
  }, [isPlayground, questionsCount, effectiveSection, track]);

  const renderScreen = () => {
    if (questionsCount === 0 && (effectiveSection === 'DSA' || effectiveSection === 'SQL' || effectiveSection === 'LLD' || effectiveSection === 'SYSTEM_DESIGN')) {
      if (isPlayground) {
        return <EmptyTrackState track={track} onSelectTrack={onSelectTrack} onBrowseCatalog={onBrowseCatalog} />;
      }
      const hasAssignedQuestions = Boolean(
        _sectionQuestions && _sectionQuestions.some((sq) => sq && sq.length > 0)
      );
      return (
        <SessionSectionFaultState
          sectionType={effectiveSection}
          track={track}
          hasAssignedQuestions={hasAssignedQuestions}
        />
      );
    }

    switch (effectiveSection) {
      case 'INTRODUCTION':
        return <IntroScreen candidateName={candidateName} onNextStage={onNextStage} />;

      case 'BEHAVIORAL':
        return (
          <BehavioralScreen
            sessionId={sessionId}
            initialQuestion={question}
            provider={provider}
            apiKey={apiKey}
            isPlayground={isPlayground}
            onFinish={onFinish}
            candidateName={candidateName}
          />
        );

      case 'RESUME':
        return (
          <ResumeScreen
            sessionId={sessionId}
            initialQuestion={question}
            provider={provider}
            apiKey={apiKey}
            isPlayground={isPlayground}
            onFinish={onFinish}
            candidateName={candidateName}
          />
        );

      case 'SQL':
        return (
          <SqlScreen
            sessionId={sessionId}
            question={question}
            code={code}
            onChangeCode={onChangeCode}
            onRunCode={onRunCode}
            onSubmitSolution={onSubmitSolution}
            isExecuting={isExecuting}
            executionResult={executionResult}
            isPlayground={isPlayground}
            onNextQuestion={onNextQuestion}
            onNextStage={onNextStage}
            isApproachGateLocked={isApproachGateLocked}
          />
        );

      case 'LLD':
        return (
          <LldScreen
            sessionId={sessionId}
            question={question}
            onSubmitProject={onSubmitSolution}
            isApproachGateLocked={isApproachGateLocked}
            onRunAttempt={onRunAttempt}
          />
        );

      case 'SYSTEM_DESIGN':
        return (
          <HldScreen
            sessionId={sessionId}
            question={question}
            provider={provider}
            apiKey={apiKey}
          />
        );

      case 'DSA':
        return (
          <DsaScreen
            sessionId={sessionId}
            question={question}
            code={code}
            onChangeCode={onChangeCode}
            language={language}
            onChangeLanguage={onChangeLanguage}
            onRunCode={onRunCode}
            onSubmitSolution={onSubmitSolution}
            isExecuting={isExecuting}
            executionResult={executionResult}
            isPlayground={isPlayground}
            onNextQuestion={onNextQuestion}
            onNextStage={onNextStage}
            isApproachGateLocked={isApproachGateLocked}
          />
        );

      default:
        if (isPlayground) {
          return <EmptyTrackState track={track} onSelectTrack={onSelectTrack} onBrowseCatalog={onBrowseCatalog} />;
        }
        return (
          <SessionSectionFaultState
            sectionType={effectiveSection}
            track={track}
            hasAssignedQuestions={false}
          />
        );
    }
  };

  return <ScreenErrorBoundary>{renderScreen()}</ScreenErrorBoundary>;
};