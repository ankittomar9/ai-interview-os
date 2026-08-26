import React from 'react';
import type { GenerateQuestionResponse, ModelProvider } from '../../../types';
import { HldWhiteboardCanvas } from '../../HldWhiteboardCanvas';

interface HldScreenProps {
  sessionId: number;
  question: GenerateQuestionResponse;
  provider: ModelProvider;
  apiKey: string;
}

export const HldScreen: React.FC<HldScreenProps> = ({
  sessionId,
  provider,
  apiKey
}) => {
  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-bg">
      <HldWhiteboardCanvas
        sessionId={sessionId}
        provider={provider}
        apiKey={apiKey}
      />
    </div>
  );
};
