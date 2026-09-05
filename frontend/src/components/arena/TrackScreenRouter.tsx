import React from "react";
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider, SectionType } from "../../types";
import { IntroScreen } from "./screens/IntroScreen";
import { DsaScreen } from "./screens/DsaScreen";
import { SqlScreen } from "./screens/SqlScreen";
import { LldScreen } from "./screens/LldScreen";
import { HldScreen } from "./screens/HldScreen";
import { BehavioralScreen } from "./screens/BehavioralScreen";
import { ResumeScreen } from "./screens/ResumeScreen";
import { EmptyTrackState } from "./EmptyTrackState";
import { ScreenErrorBoundary } from "./ScreenErrorBoundary";
import type { ExecutionResult } from "../ide/TestcasePanel";

interface TrackScreenRouterProps {
  sectionType?: SectionType;
  track: InterviewTrack;
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
  onSelectTrack?: (track: InterviewTrack) => void;
  onBrowseCatalog?: () => void;
}

export const TrackScreenRouter: React.FC<TrackScreenRouterProps> = ({
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
  onBrowseCatalog
}) => {
  const resolveSectionType = (): SectionType => {
    if (sectionType) return sectionType;
    switch (track) {
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
      default: return 'DSA';
    }
  };

  const effectiveSection = resolveSectionType();

  const renderScreen = () => {
    if (questionsCount === 0 && (effectiveSection === 'DSA' || effectiveSection === 'SQL' || effectiveSection === 'LLD' || effectiveSection === 'SYSTEM_DESIGN')) {
      return <EmptyTrackState track={track} onSelectTrack={onSelectTrack} onBrowseCatalog={onBrowseCatalog} />;
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
          />
        );

      case 'LLD':
        return (
          <LldScreen
            sessionId={sessionId}
            question={question}
            onSubmitProject={onSubmitSolution}
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
          />
        );

      default:
        return <EmptyTrackState track={track} onSelectTrack={onSelectTrack} onBrowseCatalog={onBrowseCatalog} />;
    }
  };

  return <ScreenErrorBoundary>{renderScreen()}</ScreenErrorBoundary>;
};