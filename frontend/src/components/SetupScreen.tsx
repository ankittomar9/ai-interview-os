import React, { useState } from 'react';
import type { DifficultyLevel, InterviewTrack, ModelProvider } from '../types';
import { getStoredApiKey } from '../services/api';
import { IdentityGrid } from './setup/IdentityGrid';
import { TrackGrid } from './setup/TrackGrid';
import { ResumeSection } from './setup/ResumeSection';
import { ProviderSection } from './setup/ProviderSection';
import { Button } from './ui/Button';
import { Sparkles, Compass, Play, ShieldAlert } from 'lucide-react';
import { FloatingAiOrb } from './ai/FloatingAiOrb';
import { AiAssistantPanel } from './ai/AiAssistantPanel';

interface SetupScreenProps {
  onStart: (config: {
    candidateId: string;
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    targetCompany: string;
    jobDescription: string;
    provider: ModelProvider;
    apiKey: string;
    mode?: 'INTERVIEW' | 'PLAYGROUND';
  }) => void;
  isLoading: boolean;
  onOpenCatalog?: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStart,
  isLoading,
  onOpenCatalog
}) => {
  const [candidateId, setCandidateId] = useState('candidate-01');
  const [candidateName, setCandidateName] = useState('Ankit Singh Tomar');
  const [roleTitle, setRoleTitle] = useState('Senior Java Backend Engineer');
  const [targetCompany, setTargetCompany] = useState('Google');
  const [jobDescription, setJobDescription] = useState('');
  const [track, setTrack] = useState<InterviewTrack>('ALGORITHMS_DATA_STRUCTURES');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('SENIOR');
  const [sessionMode, setSessionMode] = useState<'INTERVIEW' | 'PLAYGROUND'>('INTERVIEW');

  const [provider, setProvider] = useState<ModelProvider>(() => {
    return (localStorage.getItem('app.provider') as ModelProvider) || 'GROQ';
  });

  const [apiKey, setApiKey] = useState(() => {
    const p = (localStorage.getItem('app.provider') as ModelProvider) || 'GROQ';
    return getStoredApiKey(p.toLowerCase());
  });

  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      candidateId,
      roleTitle,
      track,
      difficulty,
      targetCompany,
      jobDescription,
      provider,
      apiKey,
      mode: sessionMode
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-surface/60 border border-border rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl backdrop-blur-md">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-text">AI Interview OS</h1>
            </div>
            <p className="text-xs text-text-3">
              Zero-Trust Autonomous Technical Assessment &amp; Socratic Practice Arena
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-2 bg-elevated p-1 rounded-xl border border-border self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setSessionMode('INTERVIEW')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sessionMode === 'INTERVIEW'
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Proctored Interview</span>
            </button>
            <button
              type="button"
              onClick={() => setSessionMode('PLAYGROUND')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                sessionMode === 'PLAYGROUND'
                  ? 'bg-success text-white shadow-xs'
                  : 'text-text-3 hover:text-text'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Playground Practice</span>
            </button>
          </div>
        </div>

        {/* Configuration Sections Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1: Candidate Identity */}
          <IdentityGrid
            candidateId={candidateId}
            onChangeCandidateId={setCandidateId}
            candidateName={candidateName}
            onChangeCandidateName={setCandidateName}
            roleTitle={roleTitle}
            onChangeRoleTitle={setRoleTitle}
            targetCompany={targetCompany}
            onChangeTargetCompany={setTargetCompany}
            jobDescription={jobDescription}
            onChangeJobDescription={setJobDescription}
          />

          {/* Section 2: Track & Difficulty Selection */}
          <TrackGrid
            selectedTrack={track}
            onSelectTrack={setTrack}
            selectedDifficulty={difficulty}
            onSelectDifficulty={setDifficulty}
          />

          {/* Section 3: Resume Grounding */}
          <ResumeSection
            candidateId={candidateId}
            candidateName={candidateName}
          />

          {/* Section 4: AI Intelligence Provider */}
          <ProviderSection
            selectedProvider={provider}
            onSelectProvider={setProvider}
            apiKey={apiKey}
            onChangeApiKey={setApiKey}
          />

          {/* Bottom Action Controls */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80">
            {onOpenCatalog && (
              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={onOpenCatalog}
                className="w-full sm:w-auto text-xs"
              >
                <Compass className="w-4 h-4 mr-1.5 text-primary" />
                <span>Browse Problem Catalog</span>
              </Button>
            )}

            <Button
              type="submit"
              variant={sessionMode === 'PLAYGROUND' ? 'primary' : 'primary'}
              size="md"
              loading={isLoading}
              className="w-full sm:w-auto px-6 text-xs font-bold"
            >
              <span>{sessionMode === 'PLAYGROUND' ? 'Launch Practice Arena' : 'Initialize Proctored Assessment'}</span>
            </Button>
          </div>
        </form>
      </div>

      {/* Floating AI Orb */}
      <FloatingAiOrb
        isOpen={isAiPanelOpen}
        onToggle={() => setIsAiPanelOpen(!isAiPanelOpen)}
        isAiSpeaking={false}
        sessionMode={sessionMode}
      />

      {/* AI Assistant Info Panel */}
      <AiAssistantPanel
        open={isAiPanelOpen}
        onClose={() => setIsAiPanelOpen(false)}
        mode="intro"
      />
    </div>
  );
};
