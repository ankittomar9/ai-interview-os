import React from "react";
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider } from "../../types";
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
  onFinish = () => {},
  candidateName,
  onSelectTrack,
  onBrowseCatalog
}) => {
  const renderScreen = () => {
    // 1. BEHAVIORAL STAR Track — Always bypass EmptyTrackState
    if (track === "BEHAVIORAL_STAR") {
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
    }

    // 2. RESUME BASED Track — Always bypass EmptyTrackState
    if (track === "RESUME_BASED") {
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
    }

    // Empty state applies strictly to DSA, SQL, LLD, HLD
    if (questionsCount === 0) {
      return (
        <EmptyTrackState
          track={track}
          onSelectTrack={onSelectTrack}
          onBrowseCatalog={onBrowseCatalog}
        />
      );
    }

    // 3. SQL Track
    if (track === "SQL") {
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
        />
      );
    }

    // 4. LLD Track
    if (track === "SPRING_LLD" || (question.starterFiles && Object.keys(question.starterFiles).length > 0)) {
      return (
        <LldScreen
          sessionId={sessionId}
          question={question}
          onSubmitProject={onSubmitSolution}
        />
      );
    }

    // 5. HLD System Design Track
    if (track === "SYSTEM_DESIGN") {
      return (
        <HldScreen
          sessionId={sessionId}
          question={question}
          provider={provider}
          apiKey={apiKey}
        />
      );
    }

    // 6. Default DSA Track
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
      />
    );
  };

  return <ScreenErrorBoundary>{renderScreen()}</ScreenErrorBoundary>;
};