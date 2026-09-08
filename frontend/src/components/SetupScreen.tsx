import React, { useState, useEffect } from "react";
import type { DifficultyLevel, InterviewTrack, ModelProvider, CustomDomainConfig } from "../types";
import {
  getStoredApiKey,
  getCandidateProfile,
  saveCandidateProfile,
  uploadProfileResume,
  uploadProfileResumeText,
  type CandidateProfile
} from "../services/api";
import { SetupHeroSidebar } from "./setup/SetupHeroSidebar";
import { IdentityGrid } from "./setup/IdentityGrid";
import { TrackGrid } from "./setup/TrackGrid";
import { SettingsDrawer } from "./setup/SettingsDrawer";
import { Button } from "./ui/Button";
import { ThemeToggle } from "./ui/ThemeToggle";
import {
  Compass,
  Play,
  ShieldAlert,
  Award,
  TrendingUp,
  BookOpen,
  Settings,
  UserCheck,
  FileText,
  Upload,
  CheckCircle2,
  X
} from "lucide-react";
import { FloatingAiOrb } from "./ai/FloatingAiOrb";
import { AiAssistantPanel } from "./ai/AiAssistantPanel";
import { ProgressChart } from "./ProgressChart";
import { calculateCustomTotal, CUSTOM_PRESETS } from "../lib/plan-presets";

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
    planSource?: "SETUP_SELECTION" | "RESUME_INFERRED_CONFIRMED";
    customDomains?: CustomDomainConfig[];
    persona?: "TECH" | "NON_TECH";
  }) => void;
  isLoading: boolean;
  onOpenCatalog?: () => void;
  onNavigateToLearn?: () => void;
}

export const SetupScreen: React.FC<SetupScreenProps> = ({
  onStart,
  isLoading,
  onOpenCatalog,
  onNavigateToLearn
}) => {
  const [candidateId, setCandidateId] = useState("candidate-01");
  const [candidateName, setCandidateName] = useState("Ankit Singh Tomar");
  const [roleTitle, setRoleTitle] = useState("Senior Java Backend Engineer");
  const [targetCompany, setTargetCompany] = useState("Google");
  const [jobDescription, setJobDescription] = useState("");
  const [persona, setPersona] = useState<"TECH" | "NON_TECH">("TECH");
  const [track, setTrack] = useState<InterviewTrack>("ALGORITHMS_DATA_STRUCTURES");
  const [difficulty, setDifficulty] = useState<DifficultyLevel>("SENIOR");
  const [suggestedDifficulty] = useState<DifficultyLevel | null>(null);
  const [suggestedExperienceYears] = useState<number | null>(null);
  const [isDifficultyOverridden, setIsDifficultyOverridden] = useState(false);
  const [planSource, setPlanSource] = useState<"SETUP_SELECTION" | "RESUME_INFERRED_CONFIRMED">("SETUP_SELECTION");
  const [sessionMode, setSessionMode] = useState<"INTERVIEW" | "PLAYGROUND">("INTERVIEW");
  const [customDomains, setCustomDomains] = useState<CustomDomainConfig[]>(() =>
    CUSTOM_PRESETS.DSA_HLD.map((item) => ({ ...item }))
  );

  const [provider, setProvider] = useState<ModelProvider>(() => {
    return (localStorage.getItem("app.provider") as ModelProvider) || "GROQ";
  });

  const [apiKey, setApiKey] = useState(() => {
    const p = (localStorage.getItem("app.provider") as ModelProvider) || "GROQ";
    return getStoredApiKey(p.toLowerCase());
  });

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [profile, setProfile] = useState<CandidateProfile | null>(null);
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [resumeTab, setResumeTab] = useState<'upload' | 'text'>('upload');
  const [resumeText, setResumeText] = useState('');
  const [isUploadingResume, setIsUploadingResume] = useState(false);
  const [resumeUploadMessage, setResumeUploadMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    getCandidateProfile('local')
      .then((data) => {
        if (!isMounted || !data) return;
        setProfile(data);
        if (data.fullName && data.fullName.trim()) {
          setCandidateName(data.fullName.trim());
        }
        if (data.targetRole && data.targetRole.trim()) {
          setRoleTitle(data.targetRole.trim());
        }
        if (data.targetCompany && data.targetCompany.trim()) {
          setTargetCompany(data.targetCompany.trim());
        }
        if (data.jobDescription && data.jobDescription.trim()) {
          setJobDescription(data.jobDescription.trim());
        }
        if (data.persona === 'NON_TECH' || data.persona === 'TECH') {
          setPersona(data.persona);
        }
      })
      .catch((err) => {
        console.warn('Could not load candidate profile:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleResumeFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingResume(true);
    setResumeUploadMessage(null);
    try {
      const updated = await uploadProfileResume(file, candidateId || 'local');
      setProfile(updated);
      setResumeUploadMessage('Resume uploaded and attached to profile.');
      setTimeout(() => {
        setIsResumeModalOpen(false);
        setResumeUploadMessage(null);
      }, 1200);
    } catch (err: any) {
      setResumeUploadMessage(err?.message || 'Failed to upload resume file.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleResumeTextSubmit = async () => {
    if (!resumeText.trim()) return;
    setIsUploadingResume(true);
    setResumeUploadMessage(null);
    try {
      const updated = await uploadProfileResumeText(resumeText.trim(), candidateId || 'local');
      setProfile(updated);
      setResumeUploadMessage('Resume text saved to profile.');
      setTimeout(() => {
        setIsResumeModalOpen(false);
        setResumeUploadMessage(null);
      }, 1200);
    } catch (err: any) {
      setResumeUploadMessage(err?.message || 'Failed to save resume text.');
    } finally {
      setIsUploadingResume(false);
    }
  };

  const handleSelectDifficulty = (diff: DifficultyLevel) => {
    setDifficulty(diff);
    setIsDifficultyOverridden(true);
    setPlanSource("SETUP_SELECTION");
  };

  const handlePersonaChange = (newPersona: "TECH" | "NON_TECH") => {
    setPersona(newPersona);
    setErrorMessage(null);
    if (newPersona === "NON_TECH") {
      if (track !== "RESUME_BASED" && track !== "CUSTOM") {
        setTrack("RESUME_BASED");
      }
      if (track === "CUSTOM") {
        setCustomDomains([{ domain: "RESUME_BASED", durationMinutes: 30 }]);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!candidateName.trim()) {
      setErrorMessage("Candidate full name is required.");
      return;
    }

    if (!track) {
      setErrorMessage("Please select an evaluation track.");
      return;
    }

    if (track === "CUSTOM") {
      if (!customDomains || customDomains.length === 0) {
        setErrorMessage("Please select at least one domain for your custom interview.");
        return;
      }
      const total = calculateCustomTotal(customDomains);
      if (total > 120) {
        setErrorMessage(`Total custom interview duration (${total} min) cannot exceed 120 minutes.`);
        return;
      }
    }

    // Save updated profile metadata in the background (SPEC P4)
    saveCandidateProfile({
      userId: candidateId || 'local',
      fullName: candidateName,
      targetRole: roleTitle,
      targetCompany: targetCompany,
      jobDescription: jobDescription,
      persona: persona
    }).catch((err) => console.warn('Could not persist profile update:', err));

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
      mode: sessionMode,
      planSource,
      customDomains: track === "CUSTOM" ? customDomains : undefined,
      persona
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="w-full max-w-6xl bg-surface border border-border rounded-2xl shadow-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px] backdrop-blur-md">
        {/* Left Dark Sidebar */}
        <SetupHeroSidebar />

        {/* Right Light Form Panel */}
        <div className="lg:col-span-8 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto space-y-6">
          {/* Top Header Row: Segmented Mode Switcher + Settings Drawer Toggle + Theme Toggle */}
          <div className="flex items-center gap-3">
            <div className="flex-1 grid grid-cols-2 gap-2 bg-elevated p-1.5 rounded-xl border border-border">
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

            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-lg bg-surface border border-border text-text-3 hover:text-text hover:bg-elevated transition-colors cursor-pointer flex items-center gap-1.5 text-xs font-semibold"
              title="Intelligence Provider & BYOK Settings"
            >
              <Settings className="w-4 h-4 text-primary" />
              <span className="hidden sm:inline">Settings</span>
            </button>

            <ThemeToggle size="md" />
          </div>

          {/* Form Sections */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMessage && (
              <div className="p-3 rounded-lg bg-danger/10 border border-danger/40 text-danger text-xs font-medium flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Stored Candidate Profile Banner */}
            {profile && (profile.fullName || profile.hasResume || profile.targetRole) && (
              <div className="p-3.5 rounded-xl bg-primary/5 border border-primary/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-text flex items-center gap-1.5 flex-wrap">
                      <span className="text-text-3">Stored profile:</span>
                      <span className="text-primary font-bold">{candidateName || profile.fullName}</span>
                      {roleTitle && <span className="text-text-2 font-medium">• {roleTitle}</span>}
                      {targetCompany && <span className="text-text-3">• {targetCompany}</span>}
                    </div>
                    <div className="text-[11px] text-text-3 flex items-center gap-2 mt-0.5">
                      <span className={profile.hasResume ? "text-success font-semibold flex items-center gap-1" : "text-text-3"}>
                        {profile.hasResume ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 inline" />
                            <span>Resume on file (auto-grounded)</span>
                          </>
                        ) : (
                          <span>No resume on file</span>
                        )}
                      </span>
                      <span>•</span>
                      <span className="font-mono text-[10px]">user: {profile.userId || 'local'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsResumeModalOpen(true)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-surface border border-border text-text hover:bg-elevated transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    <span>{profile.hasResume ? "Update Resume" : "Upload Resume"}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Identity Grid: Identifier, Full Name, Role, Company, JD (all optional except name + track) */}
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

            {/* 6 Track Cards + Persona Toggle + Custom Builder */}
            <TrackGrid
              selectedTrack={track}
              onSelectTrack={setTrack}
              selectedDifficulty={difficulty}
              onSelectDifficulty={handleSelectDifficulty}
              suggestedDifficulty={suggestedDifficulty}
              suggestedExperienceYears={suggestedExperienceYears}
              isDifficultyOverridden={isDifficultyOverridden}
              persona={persona}
              onChangePersona={handlePersonaChange}
              customDomains={customDomains}
              onChangeCustomDomains={setCustomDomains}
            />

            {/* Action Bar */}
            <div className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border/80">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {onNavigateToLearn ? (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onNavigateToLearn}
                    className="text-xs"
                  >
                    <BookOpen className="w-4 h-4 mr-1.5 text-primary" />
                    <span>Practice Center (/learn)</span>
                  </Button>
                ) : onOpenCatalog && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    onClick={onOpenCatalog}
                    className="text-xs"
                  >
                    <Compass className="w-4 h-4 mr-1.5 text-primary" />
                    <span>Catalog</span>
                  </Button>
                )}
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={() => setShowProgressModal(true)}
                  className="text-xs"
                >
                  <TrendingUp className="w-4 h-4 mr-1.5 text-success" />
                  <span>Progress Ledger</span>
                </Button>
              </div>

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

      {showProgressModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-text">Candidate Trajectory &amp; Growth</h2>
              </div>
              <button
                onClick={() => setShowProgressModal(false)}
                className="text-text-3 hover:text-text text-sm font-mono cursor-pointer"
              >
                ✕
              </button>
            </div>
            <ProgressChart candidateId={candidateId} track={track} />
            <div className="text-right">
              <Button size="sm" variant="secondary" onClick={() => setShowProgressModal(false)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Drawer (BYOK & Model Provider selection moved here from main screen) */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        selectedProvider={provider}
        onSelectProvider={setProvider}
        apiKey={apiKey}
        onChangeApiKey={setApiKey}
      />

      {/* Resume Management Modal (P4) */}
      {isResumeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-surface border border-border rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-sm font-bold text-text">Candidate Resume &amp; Grounding</h2>
              </div>
              <button
                onClick={() => {
                  setIsResumeModalOpen(false);
                  setResumeUploadMessage(null);
                }}
                className="text-text-3 hover:text-text cursor-pointer p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2 bg-elevated p-1 rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setResumeTab('upload')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  resumeTab === 'upload' ? 'bg-primary text-on-accent shadow-xs' : 'text-text-3 hover:text-text'
                }`}
              >
                Upload File (PDF/TXT)
              </button>
              <button
                type="button"
                onClick={() => setResumeTab('text')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  resumeTab === 'text' ? 'bg-primary text-on-accent shadow-xs' : 'text-text-3 hover:text-text'
                }`}
              >
                Paste Resume Text
              </button>
            </div>

            {resumeUploadMessage && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/30 text-xs font-medium text-text flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                <span>{resumeUploadMessage}</span>
              </div>
            )}

            {resumeTab === 'upload' ? (
              <div className="border-2 border-dashed border-border hover:border-primary rounded-xl p-6 text-center space-y-3 transition-colors">
                <Upload className="w-8 h-8 text-primary mx-auto" />
                <div>
                  <label className="text-xs font-semibold text-primary cursor-pointer hover:underline block">
                    <span>Click to select PDF or text resume</span>
                    <input
                      type="file"
                      accept=".pdf,.txt,.md"
                      onChange={handleResumeFileUpload}
                      disabled={isUploadingResume}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-text-3 mt-1">Supported formats: PDF, Plain Text (.txt), Markdown</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <textarea
                  rows={6}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste candidate resume text or experience highlights here..."
                  className="w-full bg-elevated border border-border rounded-lg p-3 text-xs text-text focus:outline-none focus:border-primary font-mono resize-none"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  loading={isUploadingResume}
                  onClick={handleResumeTextSubmit}
                  disabled={!resumeText.trim()}
                  className="w-full text-xs font-semibold"
                >
                  Save Resume to Profile
                </Button>
              </div>
            )}

            <div className="text-right pt-2 border-t border-border">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => {
                  setIsResumeModalOpen(false);
                  setResumeUploadMessage(null);
                }}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

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
