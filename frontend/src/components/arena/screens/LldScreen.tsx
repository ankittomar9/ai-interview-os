import React from 'react';
import type { GenerateQuestionResponse } from '../../../types';
import { EmbeddedWorkspace } from '../../workspace/EmbeddedWorkspace';

interface LldScreenProps {
  sessionId: number;
  question: GenerateQuestionResponse;
  onSubmitProject: (summary?: string) => Promise<void>;
}

export const LldScreen: React.FC<LldScreenProps> = ({
  sessionId,
  question,
  onSubmitProject
}) => {
  const problemSlug = question.problemSlug || question.slug || 'lld-service';
  const problemTitle = question.title || 'Spring Boot Microservice Architecture';

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-bg">
      <EmbeddedWorkspace
        key={problemSlug}
        sessionId={sessionId}
        problemSlug={problemSlug}
        problemTitle={problemTitle}
        starterFiles={question.starterFiles || {}}
        editablePaths={question.editablePaths || []}
        onSubmitProject={(summary) => void onSubmitProject(summary)}
      />
    </div>
  );
};
