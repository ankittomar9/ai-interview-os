import React from 'react';
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider } from '../../types';
import { DsaScreen } from './screens/DsaScreen';
import { EmptyTrackState } from './EmptyTrackState';
import { EmbeddedWorkspace } from '../workspace/EmbeddedWorkspace';
import { HldWhiteboardCanvas } from '../HldWhiteboardCanvas';
import type { ExecutionResult } from '../ide/TestcasePanel';

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
  onSubmitSolution: () => Promise<void>;
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  provider: ModelProvider;
  apiKey: string;
  isPlayground?: boolean;
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
  onSelectTrack,
  onBrowseCatalog
}) => {
  if (questionsCount === 0) {
    return (
      <EmptyTrackState
        track={track}
        onSelectTrack={onSelectTrack}
        onBrowseCatalog={onBrowseCatalog}
      />
    );
  }

  // LLD Track / Starter Files Workspace
  if (question.starterFiles && Object.keys(question.starterFiles).length > 0) {
    return (
      <EmbeddedWorkspace
        key={question.problemSlug || question.slug || 'lld-service'}
        sessionId={sessionId}
        problemSlug={question.problemSlug || question.slug || 'lld-service'}
        problemTitle={question.title || 'Spring Boot Microservice'}
        starterFiles={question.starterFiles}
        editablePaths={question.editablePaths || []}
        onSubmitProject={() => void onSubmitSolution()}
      />
    );
  }

  // HLD Track (mapped to SYSTEM_DESIGN)
  if (track === 'SYSTEM_DESIGN') {
    return (
      <HldWhiteboardCanvas
        sessionId={sessionId}
        provider={provider}
        apiKey={apiKey}
      />
    );
  }

  // Default DSA / SQL Screen
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
