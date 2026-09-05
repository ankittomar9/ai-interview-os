import React, { useEffect, useState } from 'react';
import type { GenerateQuestionResponse, ModelProvider } from '../../../types';
import { BehavioralStudio } from '../../behavioral/BehavioralStudio';
import { getSessionResume } from '../../../services/api';

interface ResumeScreenProps {
  sessionId: number;
  initialQuestion?: GenerateQuestionResponse;
  provider: ModelProvider;
  apiKey: string;
  isPlayground?: boolean;
  onFinish: () => void;
  candidateName?: string;
  resumeSummary?: string;
  resumeText?: string;
}

export const ResumeScreen: React.FC<ResumeScreenProps> = ({
  sessionId,
  initialQuestion,
  provider,
  apiKey,
  isPlayground = false,
  onFinish,
  candidateName,
  resumeSummary,
  resumeText
}) => {
  const [activeResumeSummary, setActiveResumeSummary] = useState<string>(resumeSummary || '');
  const [activeResumeText, setActiveResumeText] = useState<string>(resumeText || '');

  useEffect(() => {
    if (!activeResumeSummary && !activeResumeText && sessionId) {
      getSessionResume(sessionId)
        .then((doc) => {
          if (doc) {
            if (doc.rawText) setActiveResumeText(doc.rawText);
            const summary = doc.projectExperiences && doc.projectExperiences.length > 0
              ? `Key projects: ${doc.projectExperiences.join(', ')}. Skills: ${doc.skills?.join(', ') || 'N/A'}`
              : (doc.skills?.join(', ') || '');
            if (summary) setActiveResumeSummary(summary);
          }
        })
        .catch(() => {});
    }
  }, [sessionId, activeResumeSummary, activeResumeText]);

  return (
    <BehavioralStudio
      sessionId={sessionId}
      track="RESUME_BASED"
      difficulty={initialQuestion?.difficulty || 'SENIOR'}
      roleTitle="Senior Software Engineer & Architect"
      isPlayground={isPlayground}
      provider={provider}
      apiKey={apiKey}
      initialQuestion={initialQuestion}
      candidateName={candidateName}
      onFinish={onFinish}
      resumeSummary={activeResumeSummary}
      resumeText={activeResumeText}
    />
  );
};
