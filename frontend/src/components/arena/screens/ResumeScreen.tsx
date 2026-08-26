import React from 'react';
import type { GenerateQuestionResponse, ModelProvider } from '../../../types';
import { BehavioralStudio } from '../../behavioral/BehavioralStudio';

interface ResumeScreenProps {
  sessionId: number;
  initialQuestion?: GenerateQuestionResponse;
  provider: ModelProvider;
  apiKey: string;
  isPlayground?: boolean;
  onFinish: () => void;
  candidateName?: string;
}

export const ResumeScreen: React.FC<ResumeScreenProps> = ({
  sessionId,
  initialQuestion,
  provider,
  apiKey,
  isPlayground = false,
  onFinish,
  candidateName
}) => {
  return (
    <BehavioralStudio
      sessionId={sessionId}
      track="RESUME_BASED"
      difficulty={initialQuestion?.difficulty || 'SENIOR'}
      roleTitle="Senior Backend & Distributed Systems Engineer"
      isPlayground={isPlayground}
      provider={provider}
      apiKey={apiKey}
      initialQuestion={initialQuestion}
      candidateName={candidateName}
      onFinish={onFinish}
    />
  );
};
