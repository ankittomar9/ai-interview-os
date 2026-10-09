import React, { useEffect } from "react";
import type { GenerateQuestionResponse, ModelProvider, SectionType } from "../../types";
import { resolveSectionType, type ResolveSectionTypeArgs, type TrackKey } from "./ArenaShellTypes";
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

export { resolveSectionType, type ResolveSectionTypeArgs };

interface TrackScreenRouterProps {
  sectionType?: SectionType;
  sectionQuestions?: GenerateQuestionResponse[][];
  track: TrackKey;
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
  onSelectTrack?: (track: TrackKey) => void;
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
  const effectiveSection = resolveSectionType({
    sectionType,
    track,
    questionTrack: question?.track,
    isPlayground
  });

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