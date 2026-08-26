import React from 'react';
import type { GenerateQuestionResponse, ModelProvider } from '../../../types';
import { BehavioralStudio } from '../../behavioral/BehavioralStudio';

interface BehavioralScreenProps {
  sessionId: number;
  initialQuestion?: GenerateQuestionResponse;
  provider: ModelProvider;
  apiKey: string;
  isPlayground?: boolean;
  onFinish: () => void;
  candidateName?: string;
}

export const BehavioralScreen: React.FC<BehavioralScreenProps> = ({
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
      track="BEHAVIORAL_STAR"
      difficulty={initialQuestion?.difficulty || 'SENIOR'}
      roleTitle="Engineering Lead & Systems Architect"
      isPlayground={isPlayground}
      provider={provider}
      apiKey={apiKey}
      initialQuestion={initialQuestion}
      candidateName={candidateName}
      onFinish={onFinish}
    />
  );
};
