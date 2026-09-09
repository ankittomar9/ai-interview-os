import React from 'react';
import type { GenerateQuestionResponse } from '../../../types';
import { EmbeddedWorkspace } from '../../workspace/EmbeddedWorkspace';
import { Lock } from 'lucide-react';

interface LldScreenProps {
  sessionId: number;
  question: GenerateQuestionResponse;
  onSubmitProject: (summary?: string) => Promise<void>;
  isApproachGateLocked?: boolean;
}

export const LldScreen: React.FC<LldScreenProps> = ({
  sessionId,
  question,
  onSubmitProject,
  isApproachGateLocked
}) => {
  const problemSlug = question.problemSlug || question.slug || 'lld-service';
  const problemTitle = question.title || 'Spring Boot Microservice Architecture';

  return (
    <div className="flex-1 flex flex-col h-full w-full overflow-hidden bg-bg relative">
      <EmbeddedWorkspace
        key={problemSlug}
        sessionId={sessionId}
        problemSlug={problemSlug}
        problemTitle={problemTitle}
        starterFiles={question.starterFiles || {}}
        editablePaths={question.editablePaths || []}
        onSubmitProject={(summary) => void onSubmitProject(summary)}
        isApproachGateLocked={isApproachGateLocked}
      />
      {isApproachGateLocked && (
        <div
          data-testid="approach-gate-overlay"
          className="absolute inset-0 bg-surface/80 backdrop-blur-[2px] z-20 flex items-center justify-center p-6 text-center pointer-events-none"
        >
          <div className="max-w-md p-5 rounded-lg bg-surface border border-border shadow-xl pointer-events-auto">
            <div className="flex items-center justify-center gap-2 mb-2 text-primary font-semibold text-sm">
              <Lock className="w-4 h-4 text-primary" />
              <span>Approach Gate</span>
            </div>
            <p className="text-xs text-text-2 leading-relaxed">
              Approach gate — explain your approach in the chat; the editor unlocks once the interviewer agrees.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
