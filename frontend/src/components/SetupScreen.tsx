import React, { useState } from "react";
import type { DifficultyLevel, InterviewTrack, ModelProvider } from "../types";
import { getStoredApiKey } from "../services/api";
import { SetupHeroSidebar } from "./setup/SetupHeroSidebar";
import { IdentityGrid } from "./setup/IdentityGrid";
import { TrackGrid } from "./setup/TrackGrid";
import { ResumeSection } from "./setup/ResumeSection";
import { ProviderSection } from "./setup/ProviderSection";
import { Button } from "./ui/Button";
import { Compass, Play, ShieldAlert } from "lucide-react";
import { FloatingAiOrb } from "./ai/FloatingAiOrb";
import { AiAssistantPanel } from "./ai/AiAssistantPanel";

interface SetupScreenProps {
  onStart: (config: {
    candidateId: string;
    candidateName?: string;
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    targetCompany: string;
    jobDescription: string;
    provider: ModelProvider;
    apiKey: string;
    mode?: "INTERVIEW" | "PLAYGROUND";
  }) => void;
  isLoading: boolean;
  onOpenCatalog?: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStart,
  isLoading,
  onOpenCatalog
}) => {
  const [candidateId, setCandidateId] = useState("candidate-01");
  const [candidateName, setCandidateName] = useState("Ankit Singh Tomar");
  const [roleTitle, setRoleTitle] = useState("Senior Java Backend Engineer");
  const [targetCompany, setTargetCompany] = useState("Google");
  const [jobDescription, setJobDescription] = useState("");
  const [track, setTrack] = useState<InterviewTrack>("ALGORITHMS_DATA_STRUCTURES");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("SENIOR");
  const [sessionMode, setSessionMode] = useState<"INTERVIEW" | "PLAYGROUND">("INTERVIEW");

  const [provider, setProvider] = useState<ModelProvider>(() => {
    return (localStorage.getItem("app.provider") as ModelProvider) || "GROQ";
  });

  const [apiKey, setApiKey] = useState(() => {
    const p = (localStorage.getItem("app.provider") as ModelProvider) || "GROQ";
    return getStoredApiKey(p.toLowerCase());
  });

  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({
      candidateId,
      candidateName,
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
      <div className="w-full max-w-6xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] backdrop-blur-md">
        {/* Left Dark Sidebar */}
        <SetupHeroSidebar />

        {/* Right Light Form Panel */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          {/* Top Full-Width Segmented Mode Switcher */}
          <div className="grid grid-cols-2 gap-2 bg-elevated p-1.5 rounded-xl border border-border">
            <button
              type="button"
              onClick={() => setSessionMode("INTERVIEW")}
              className={"flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer " + (sessionMode === "INTERVIEW" ? "bg-primary text-on-accent shadow-sm" : "text-text-3 hover:text-text")}
            >
              <ShieldAlert className="w-4 h-4" />
              <span>Proctored Interview</span>
            </button>
            <button
              type="button"
              onClick={() => setSessionMode("PLAYGROUND")}
              className={"flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer " + (sessionMode === "PLAYGROUND" ? "bg-success text-on-accent shadow-sm" : "text-text-3 hover:text-text")}
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Playground Practice</span>
            </button>
          </div>

          {/* Form Sections */}
          <form onSubmit={handleSubmit} className="space-y-6">
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

            <TrackGrid
              selectedTrack={track}
              onSelectTrack={setTrack}
              selectedDifficulty={difficulty}
              onSelectDifficulty={setDifficulty}
            />

            <ResumeSection
              candidateId={candidateId}
              candidateName={candidateName}
              onResumeUploaded={(resume) => {
                if (resume.candidateName && (!candidateName || candidateName === "Candidate" || candidateName === "Ankit Singh Tomar")) {
                  setCandidateName(resume.candidateName);
                }
                if (resume.inferredRoleLevel) {
                  const level = resume.inferredRoleLevel.toUpperCase() as DifficultyLevel;
                  if (['JUNIOR', 'MID', 'SENIOR', 'STAFF'].includes(level)) {
                    setDifficulty(level);
                  }
                }
              }}
            />

            <ProviderSection
              selectedProvider={provider}
              onSelectProvider={setProvider}
              apiKey={apiKey}
              onChangeApiKey={setApiKey}
            />

            {/* Action Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80">
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
                variant="primary"
                size="md"
                loading={isLoading}
                className="w-full sm:w-auto px-6 text-xs font-bold ml-auto"
              >
                <span>{sessionMode === "PLAYGROUND" ? "Launch Practice Arena" : "Initialize Proctored Assessment"}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>

      <FloatingAiOrb
        isOpen={isAiPanelOpen}
        onToggle={() => setIsAiPanelOpen(!isAiPanelOpen)}
        isAiSpeaking={false}
        sessionMode={sessionMode}
      />

      <AiAssistantPanel
        open={isAiPanelOpen}
        onClose={() => setIsAiPanelOpen(false)}
        mode="intro"
      />
    </div>
  );
};