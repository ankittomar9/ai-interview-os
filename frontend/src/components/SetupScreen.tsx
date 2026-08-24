import React, { useState } from 'react';
import type { DifficultyLevel, InterviewTrack, ModelProvider } from '../types';
import { getStoredApiKey, setStoredApiKey, uploadResumeFile, uploadResumeText } from '../services/api';
import {
  Sparkles,
  Key,
  ArrowRight,
  ShieldCheck,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Binary,
  Layers,
  Users2,
  Building2,
  Briefcase,
  Database,
  X
} from 'lucide-react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Input } from './ui/Input';
import { Textarea } from './ui/Textarea';
import { SegmentedControl } from './ui/SegmentedControl';
import { TrackCard } from './ui/TrackCard';
import { Chip } from './ui/Chip';
import { FloatingAiOrb } from './ai/FloatingAiOrb';
import { AiAssistantPanel } from './ai/AiAssistantPanel';

interface Props {
  onStart: (config: {
    candidateId: string;
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    targetCompany: string;
    jobDescription: string;
    provider: ModelProvider;
    apiKey: string;
  }) => void;
  isLoading: boolean;
}

const TRACKS: Array<{
  track: InterviewTrack;
  title: string;
  description: string;
  icon: React.ReactNode;
}> = [
  {
    track: 'ALGORITHMS_DATA_STRUCTURES',
    title: 'Algorithms & Data Structures (DSA)',
    description: 'LeetCode-style algorithms, time/space complexity, stdin/stdout sandbox.',
    icon: <Binary className="w-5 h-5 text-primary-2" />
  },
  {
    track: 'SQL',
    title: 'SQL & Database Engineering',
    description: 'Queries, joins, indexing & optimization scenarios. Dialogue-based; live SQL sandbox ships in a later milestone.',
    icon: <Database className="w-5 h-5 text-sky-400" />
  },
  {
    track: 'SPRING_LLD',
    title: 'Spring Boot LLD Projects',
    description: 'Multi-file Spring Boot projects in a real VS Code workspace + Maven tests.',
    icon: <Code2 className="w-5 h-5 text-emerald-400" />
  },
  {
    track: 'SYSTEM_DESIGN',
    title: 'High-Level System Design (HLD)',
    description: 'Architecture whiteboard with capacity math + vision evaluation.',
    icon: <Layers className="w-5 h-5 text-amber-400" />
  },
  {
    track: 'BEHAVIORAL_STAR',
    title: 'Behavioral & Leadership',
    description: 'STAR scenarios, tradeoffs, conflict resolution.',
    icon: <Users2 className="w-5 h-5 text-pink-400" />
  },
  {
    track: 'RESUME_BASED',
    title: 'Others (Resume-Based)',
    description: 'Non-tech/managerial. AI generates questions grounded in YOUR resume using a frontier model.',
    icon: <Sparkles className="w-5 h-5 text-purple-400" />
  }
];

export const SetupScreen: React.FC<Props> = ({ onStart, isLoading }) => {
  const [candidateName, setCandidateName] = useState('');
  const [candidateId, setCandidateId] = useState('candidate-01');
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [roleTitle, setRoleTitle] = useState('');
  const [track, setTrack] = useState<InterviewTrack>('ALGORITHMS_DATA_STRUCTURES');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('JUNIOR');
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [provider, setProvider] = useState<ModelProvider>('GEMINI');
  const [apiKey, setApiKey] = useState(getStoredApiKey('GEMINI'));
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(() => sessionStorage.getItem('ai.panel.setup') === 'true');

  const toggleAiPanel = () => {
    setIsAiPanelOpen((prev) => {
      const next = !prev;
      sessionStorage.setItem('ai.panel.setup', String(next));
      return next;
    });
  };

  const handleCandidateNameChange = (name: string) => {
    setCandidateName(name);
    if (!isIdManuallyEdited) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setCandidateId(slug || 'candidate-01');
    }
  };

  // --- Resume Ingestion State ---
  const [resumeMode, setResumeMode] = useState<'upload' | 'paste'>('upload');
  const [pastedResumeText, setPastedResumeText] = useState('');
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parsedResumeData, setParsedResumeData] = useState<{
    id: string;
    fileName: string;
    skills: string[];
    yearsOfExperience: number;
    summary: string;
  } | null>(null);

  const handleProviderChange = (newProvider: ModelProvider) => {
    setProvider(newProvider);
    setApiKey(getStoredApiKey(newProvider));
  };

  const handleSaveKey = () => {
    setStoredApiKey(provider, apiKey);
    setShowKeyModal(false);
  };

  // --- Resume File Upload Handler ---
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingResume(true);
    try {
      const result = await uploadResumeFile(file, candidateId, candidateName, `${roleTitle} Resume`);
      setParsedResumeData({
        id: result.id,
        fileName: result.fileName,
        skills: result.skills || [],
        yearsOfExperience: result.yearsOfExperience || 4,
        summary: result.summary || 'Resume parsed successfully.'
      });
      if (result.summary) {
        setJobDescription((prev) => `${prev}\n\n[Candidate Resume Context: ${result.summary}]`);
      }
    } catch (err) {
      console.error('Resume upload failed:', err);
      alert('Failed to parse resume file. Please ensure it is a valid PDF or text file.');
    } finally {
      setIsParsingResume(false);
    }
  };

  // --- Resume Text Paste Ingest Handler ---
  const handleTextIngest = async () => {
    if (!pastedResumeText.trim()) return;

    setIsParsingResume(true);
    try {
      const result = await uploadResumeText({
        candidateId,
        candidateName,
        resumeTitle: `${roleTitle} Profile`,
        resumeText: pastedResumeText
      });
      setParsedResumeData({
        id: result.id,
        fileName: result.fileName,
        skills: result.skills || [],
        yearsOfExperience: result.yearsOfExperience || 4,
        summary: result.summary || 'Pasted text parsed successfully.'
      });
      if (result.summary) {
        setJobDescription((prev) => `${prev}\n\n[Candidate Resume Context: ${result.summary}]`);
      }
    } catch (err) {
      console.error('Resume text parsing failed:', err);
    } finally {
      setIsParsingResume(false);
    }
  };

  const isFormValid = candidateName.trim().length > 0 && roleTitle.trim().length > 0 && !!track;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    onStart({
      candidateId: candidateId || 'candidate-01',
      roleTitle,
      track,
      difficulty,
      targetCompany,
      jobDescription,
      provider,
      apiKey
    });
  };

  return (
    <div className="min-h-screen bg-bg text-text py-10 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* LEFT COLUMN: Branding & System Value Props */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <Card padding="lg" variant="elevated" className="flex flex-col gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-primary-2 flex items-center justify-center shadow-md shadow-primary/30">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-white">AI Interview OS</h1>
                <p className="text-xs text-primary-2 font-medium">Honest Technical Evaluation</p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-sm text-text-2 leading-relaxed">
                Experience a production-grade, zero-fluff engineering interview powered by autonomous AI bar raisers, live code sandboxes, and structured rubric grading.
              </p>
            </div>

            {/* Feature Badges */}
            <div className="space-y-2.5 pt-2 border-t border-border">
              <div className="flex items-start gap-2.5 text-xs text-text-2">
                <ShieldCheck className="w-4 h-4 text-success shrink-0 mt-0.5" />
                <span><strong>No Canned Metrics:</strong> 5-dimension rubric backed by verbatim dialogue quotes.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-text-2">
                <Code2 className="w-4 h-4 text-primary-2 shrink-0 mt-0.5" />
                <span><strong>Real Sandbox Execution:</strong> Isolated Judge0 container test runner with Standard I/O.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-text-2">
                <Layers className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <span><strong>Interactive Whiteboard:</strong> High-Level System Design canvas evaluated in real-time.</span>
              </div>
            </div>

            {/* Interview Flow Stepper */}
            <div className="space-y-2 pt-3 border-t border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-text-3">Interview Flow</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center gap-1.5 p-2 rounded bg-surface border border-border text-text-2">
                  <span className="w-5 h-5 rounded-full bg-elevated border border-border flex items-center justify-center font-bold text-[10px] text-primary">1</span>
                  <span>Setup & Track</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded bg-surface border border-border text-text-2">
                  <span className="w-5 h-5 rounded-full bg-elevated border border-border flex items-center justify-center font-bold text-[10px] text-primary">2</span>
                  <span>System Verify</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded bg-surface border border-border text-text-2">
                  <span className="w-5 h-5 rounded-full bg-elevated border border-border flex items-center justify-center font-bold text-[10px] text-primary">3</span>
                  <span>AI Interview</span>
                </div>
                <div className="flex items-center gap-1.5 p-2 rounded bg-surface border border-border text-text-2">
                  <span className="w-5 h-5 rounded-full bg-elevated border border-border flex items-center justify-center font-bold text-[10px] text-primary">4</span>
                  <span>360° Report</span>
                </div>
              </div>
            </div>

            {/* BYOK Status Card */}
            <div className="p-3 bg-surface rounded-md border border-border flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Key className="w-4 h-4 text-text-3" />
                <span className="text-text-3">AI Engine:</span>
                <span className="font-bold text-text">{provider}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowKeyModal(true)}
              >
                Configure Keys
              </Button>
            </div>
          </Card>
        </div>

        {/* RIGHT COLUMN: Candidate Configuration Form */}
        <div className="lg:col-span-7">
          <Card padding="lg" variant="elevated">
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">Candidate Profile & Target Role</h2>
                <p className="text-xs text-text-3 mt-0.5">Enter candidate details and customize the evaluation track.</p>
              </div>

              {/* Candidate Name & Candidate ID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Candidate Full Name *"
                  placeholder="e.g. Ankit Singh Tomar"
                  value={candidateName}
                  onChange={(e) => handleCandidateNameChange(e.target.value)}
                  required
                />
                <Input
                  label="Candidate ID (System Slug)"
                  placeholder="e.g. candidate-01"
                  value={candidateId}
                  onChange={(e) => {
                    setIsIdManuallyEdited(true);
                    setCandidateId(e.target.value);
                  }}
                  hint="Used to identify transcripts & reports"
                />
              </div>

              {/* Target Role & Target Company */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Target Role Title *"
                  placeholder="e.g. Senior Java Backend Engineer"
                  value={roleTitle}
                  onChange={(e) => setRoleTitle(e.target.value)}
                  icon={<Briefcase className="w-4 h-4" />}
                  required
                />
                <Input
                  label="Target Company (Optional)"
                  placeholder="e.g. Amazon, Google, Stripe"
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  icon={<Building2 className="w-4 h-4" />}
                />
              </div>

              {/* Track Selection (6 Track Cards in 2x3 Grid) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-2 tracking-wide">
                  Interview Assessment Track *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TRACKS.map((t) => (
                    <TrackCard
                      key={t.track}
                      track={t.track}
                      title={t.title}
                      description={t.description}
                      icon={t.icon}
                      selected={track === t.track}
                      onClick={() => setTrack(t.track)}
                    />
                  ))}
                </div>

                {/* Track-Specific Honest Badges */}
                {track === 'RESUME_BASED' && (
                  <div className="flex flex-col gap-1.5 p-3 rounded-md bg-elevated border border-border mt-1">
                    <div className="flex items-center gap-2">
                      <Chip variant="primary" size="sm" icon={<Sparkles className="w-3.5 h-3.5" />}>
                        Frontier-model question generation
                      </Chip>
                    </div>
                    {provider === 'OLLAMA' && (
                      <p className="text-xs text-amber-400 flex items-center gap-1.5 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Recommend a frontier key (Gemini/OpenAI) for best resume-grounded questions</span>
                      </p>
                    )}
                  </div>
                )}

                {track === 'SQL' && (
                  <div className="p-3 rounded-md bg-elevated border border-border flex items-center gap-2 mt-1">
                    <Chip variant="neutral" size="sm" icon={<Database className="w-3.5 h-3.5" />}>
                      Sandbox: coming soon — dialogue assessment
                    </Chip>
                  </div>
                )}
              </div>

              {/* Seniority Level (Segmented Control) */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-text-2 tracking-wide">
                  Seniority Level
                </label>
                <SegmentedControl
                  options={[
                    { value: 'JUNIOR', label: 'Junior (0-2 YOE)' },
                    { value: 'MID', label: 'Mid-Level (3-5 YOE)' },
                    { value: 'SENIOR', label: 'Senior (5-8 YOE)' },
                    { value: 'STAFF', label: 'Staff / Lead (8+ YOE)' }
                  ]}
                  value={difficulty}
                  onChange={(val) => setDifficulty(val as DifficultyLevel)}
                />
              </div>

              {/* Resume Ingestion Pipeline */}
              <div className="p-4 bg-surface rounded-lg border border-border flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary-2" />
                    <span className="text-xs font-bold text-text">Resume Ingestion (Optional)</span>
                  </div>
                  <SegmentedControl
                    size="sm"
                    options={[
                      { value: 'upload', label: 'Upload File' },
                      { value: 'paste', label: 'Paste Text' }
                    ]}
                    value={resumeMode}
                    onChange={(val) => setResumeMode(val as 'upload' | 'paste')}
                  />
                </div>

                {resumeMode === 'upload' ? (
                  <label className="border-2 border-dashed border-border hover:border-primary/50 bg-elevated/40 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                    <Upload className="w-6 h-6 text-text-3" />
                    <span className="text-xs text-text-2 font-medium">
                      {isParsingResume ? 'Extracting candidate skills & experience...' : 'Drop your resume (PDF, TXT, DOCX) or click to browse'}
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.txt,.docx"
                      onChange={handleFileUpload}
                      className="hidden"
                      disabled={isParsingResume}
                    />
                  </label>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Textarea
                      placeholder="Paste resume content, work history, tech stack, and key project bullets..."
                      rows={3}
                      value={pastedResumeText}
                      onChange={(e) => setPastedResumeText(e.target.value)}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      onClick={handleTextIngest}
                      loading={isParsingResume}
                      disabled={!pastedResumeText.trim()}
                    >
                      Extract Resume Signals
                    </Button>
                  </div>
                )}

                {/* Extracted Skills Chips Row */}
                {parsedResumeData && parsedResumeData.skills.length > 0 && (
                  <div className="pt-2 border-t border-border flex flex-col gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-success">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{parsedResumeData.fileName} parsed ({parsedResumeData.yearsOfExperience} YOE detected):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedResumeData.skills.map((skill, idx) => (
                        <Chip key={idx} variant="primary" size="sm">
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Job Description & Custom Focus */}
              <Textarea
                label="Job Description & Focus Areas (Optional)"
                placeholder="Paste key responsibilities, specific topics, or architectures to emphasize..."
                rows={3}
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />

              {/* Launch Action Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={isLoading}
                disabled={!isFormValid}
                icon={<ArrowRight className="w-5 h-5" />}
                className="w-full mt-2"
              >
                {isLoading ? 'Synthesizing Problem & Initializing Sandbox...' : 'Launch Technical Assessment'}
              </Button>

            </form>
          </Card>
        </div>

      </div>

      {/* BYOK Settings Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <Card padding="lg" variant="elevated" className="w-full max-w-md flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div className="flex items-center gap-2 font-bold text-white">
                <Key className="w-4 h-4 text-primary-2" />
                <span>Bring Your Own Key (BYOK)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowKeyModal(false)}
                className="text-text-3 hover:text-text p-1 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold text-text-2">Model Provider</label>
              <SegmentedControl
                options={[
                  { value: 'GEMINI', label: 'Gemini' },
                  { value: 'GROQ', label: 'Groq' },
                  { value: 'OPENAI', label: 'OpenAI' },
                  { value: 'OLLAMA', label: 'Ollama' }
                ]}
                value={provider}
                onChange={(val) => handleProviderChange(val as ModelProvider)}
              />

              <Input
                label={`${provider} API Key`}
                type="password"
                placeholder={provider === 'OLLAMA' ? 'http://localhost:11434 (Optional)' : `Enter your ${provider} API key...`}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                hint="Keys are saved locally in your browser and never persisted on disk."
              />
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-border">
              <Button type="button" variant="ghost" onClick={() => setShowKeyModal(false)}>
                Cancel
              </Button>
              <Button type="button" variant="primary" onClick={handleSaveKey}>
                Save & Apply
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* FLOATING AI ORB & ASSISTANT PANEL */}
      <FloatingAiOrb
        isOpen={isAiPanelOpen}
        onToggle={toggleAiPanel}
        isAiSpeaking={false}
        hasUnread={false}
        stackAbove="none"
      />

      <AiAssistantPanel
        open={isAiPanelOpen}
        onClose={() => {
          setIsAiPanelOpen(false);
          sessionStorage.setItem('ai.panel.setup', 'false');
        }}
        mode="intro"
        personaName="Dr. Anya Chen"
        personaTitle="AI Principal Bar Raiser"
        currentStage="Setup & Role Fit"
        stackAbove="none"
      />
    </div>
  );
};