import React, { useState } from 'react';
import type { DifficultyLevel, InterviewTrack, ModelProvider } from '../types';
import { getStoredApiKey, setStoredApiKey, uploadResumeFile, uploadResumeText } from '../services/api';
import {
  Sparkles,
  Key,
  ArrowRight,
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
  Loader2
} from 'lucide-react';
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
    title: 'Algorithms & Data Structures',
    description: 'LeetCode-style algorithms, complexity math & Standard I/O sandbox.',
    icon: <Binary className="w-4 h-4" />
  },
  {
    track: 'SQL',
    title: 'SQL & Database Eng',
    description: 'Window functions, sessionization, joins & live PostgreSQL sandbox.',
    icon: <Database className="w-4 h-4" />
  },
  {
    track: 'SPRING_LLD',
    title: 'Spring Boot LLD Projects',
    description: 'Multi-file Spring Boot services in an isolated workspace + Maven tests.',
    icon: <Code2 className="w-4 h-4" />
  },
  {
    track: 'SYSTEM_DESIGN',
    title: 'High-Level System Design',
    description: 'Interactive architecture whiteboard canvas with multimodal AI evaluation.',
    icon: <Layers className="w-4 h-4" />
  },
  {
    track: 'BEHAVIORAL_STAR',
    title: 'Behavioral & Leadership',
    description: 'STAR structured scenarios, leadership dilemmas & tradeoff dialogue.',
    icon: <Users2 className="w-4 h-4" />
  },
  {
    track: 'RESUME_BASED',
    title: 'Others (Resume-Based)',
    description: 'Frontier AI generates personalized questions grounded in your resume.',
    icon: <Sparkles className="w-4 h-4" />
  }
];

const SENIORITY_OPTIONS: Array<{ value: DifficultyLevel; label: string }> = [
  { value: 'JUNIOR', label: 'Junior (0-2 YOE)' },
  { value: 'MID', label: 'Mid-Level (3-5 YOE)' },
  { value: 'SENIOR', label: 'Senior (5-8 YOE)' },
  { value: 'STAFF', label: 'Staff / Lead (8+ YOE)' }
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
    if (!isFormValid || isLoading) return;

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
    <div className="min-h-screen bg-[var(--color-page-bg)] grid place-items-center p-4 sm:p-8 select-text font-sans">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row min-h-[850px] bg-white dark:bg-[#18181b] rounded-2xl border border-slate-200 dark:border-[#27272a] shadow-2xl overflow-hidden">
        
        {/* =========================================================================
            LEFT COLUMN: Dark Studio Sidebar (w-full lg:w-1/3)
           ========================================================================= */}
        <aside className="w-full lg:w-1/3 bg-[var(--color-sidebar-bg)] p-8 lg:p-10 flex flex-col justify-between text-slate-300">
          <div>
            {/* Logo + Product Name */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-[var(--color-accent)] rounded-xl flex items-center justify-center shadow-md shadow-indigo-900/40">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-none">AI Interview OS</h1>
                <span className="text-[11px] font-medium text-slate-400">Honest Evaluation Studio</span>
              </div>
            </div>

            {/* Product description */}
            <p className="text-[var(--color-sidebar-text)] text-sm leading-relaxed mb-8">
              Autonomous technical interview platform with live execution sandboxes, multi-file codebases, and verbatim rubric scoring.
            </p>

            {/* Feature bullets */}
            <div className="space-y-4 mb-8">
              {[
                { title: 'No Canned Metrics', desc: '5-dimension rubric backed by verbatim dialogue quotes.' },
                { title: 'Real Sandbox Execution', desc: 'Isolated container test runner with Standard I/O.' },
                { title: 'Interactive Architecture', desc: 'Multi-file workspaces and real-time whiteboard canvas.' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-[var(--color-active)] shrink-0 mt-0.5" />
                  <div className="text-xs text-[var(--color-sidebar-text-2)] leading-relaxed">
                    <strong className="text-white">{item.title}:</strong> {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Lifecycle Timeline & Engine Status */}
          <div className="pt-6 border-t border-[var(--color-sidebar-accent)]">
            <h3 className="text-[11px] font-bold uppercase tracking-widest text-[var(--color-sidebar-text-3)] mb-4">
              Interview Lifecycle
            </h3>
            <div className="relative pl-5 space-y-4">
              <div className="absolute left-2.5 top-1 bottom-1 w-px bg-[var(--color-sidebar-accent)]" />
              {[
                { label: 'Setup & Track Selection', state: 'completed' },
                { label: 'System & Proctor Check', state: 'current' },
                { label: 'AI Technical Assessment', state: 'upcoming' },
                { label: '360° Diagnostic Report', state: 'upcoming' }
              ].map((step, idx) => (
                <div key={idx} className="relative flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ring-4 ring-[var(--color-sidebar-bg)] shrink-0 transition-all ${
                      step.state === 'completed'
                        ? 'bg-[var(--color-active)]'
                        : step.state === 'current'
                        ? 'bg-[var(--color-accent)] ring-indigo-950'
                        : 'bg-[var(--color-sidebar-accent)]'
                    }`}
                  />
                  <span
                    className={`text-xs font-medium ${
                      step.state === 'upcoming'
                        ? 'text-[var(--color-sidebar-text-3)]'
                        : step.state === 'current'
                        ? 'text-white font-semibold'
                        : 'text-[var(--color-sidebar-text-2)]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Engine Status Card */}
            <div className="mt-6 p-3.5 bg-[var(--color-sidebar-accent)]/60 rounded-xl border border-[var(--color-sidebar-accent)]">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[var(--color-sidebar-text-3)]">
                  AI Engine Status
                </span>
                <span className="text-[10px] font-medium text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[var(--color-active)] animate-pulse" />
                <span className="text-xs font-semibold text-white">
                  {provider === 'GEMINI' ? 'Gemini 2.5 Flash' : provider === 'GROQ' ? 'Groq Whisper + Llama' : provider}
                </span>
              </div>
              <div className="text-[10px] text-[var(--color-sidebar-text-3)] mt-0.5">
                Ultra-Low Latency Dialogue Engine
              </div>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            RIGHT COLUMN: Light Candidate Setup Form (flex-1)
           ========================================================================= */}
        <div className="flex-1 p-6 sm:p-10 overflow-y-auto bg-white dark:bg-[#18181b]">
          <div className="max-w-2xl mx-auto">
            {/* Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Candidate Setup</h2>
              <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1">
                Enter candidate details and customize the evaluation track.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* 1. Identity Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Candidate Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Candidate Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ankit Singh Tomar"
                    value={candidateName}
                    onChange={(e) => handleCandidateNameChange(e.target.value)}
                    className="w-full h-9 bg-[var(--color-field-bg)] border border-[var(--color-field-border)] rounded-lg px-3 text-sm text-[var(--color-field-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all"
                  />
                </div>

                {/* Candidate ID Slug with 'id-' affix */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Candidate ID
                  </label>
                  <div className="flex items-center h-9 bg-[var(--color-field-bg)] border border-[var(--color-field-border)] rounded-lg px-3 focus-within:ring-2 focus-within:ring-[var(--color-accent)]/20 focus-within:border-[var(--color-accent)] transition-all">
                    <span className="text-slate-400 dark:text-zinc-500 text-xs font-mono select-none mr-1">id-</span>
                    <input
                      type="text"
                      value={candidateId.replace(/^id-/, '')}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/^id-/, '');
                        setCandidateId(raw);
                        setIsIdManuallyEdited(true);
                      }}
                      placeholder="candidate-01"
                      className="flex-1 bg-transparent border-0 text-sm text-[var(--color-field-text)] font-mono focus:outline-none"
                    />
                  </div>
                </div>

                {/* Target Role Title */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Target Role Title *
                  </label>
                  <div className="relative">
                    <Briefcase className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Senior Java Backend Engineer"
                      value={roleTitle}
                      onChange={(e) => setRoleTitle(e.target.value)}
                      className="w-full h-9 bg-[var(--color-field-bg)] border border-[var(--color-field-border)] rounded-lg pl-9 pr-3 text-sm text-[var(--color-field-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all"
                    />
                  </div>
                </div>

                {/* Target Company */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    Target Company (Optional)
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="e.g. Google, Stripe, Netflix"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="w-full h-9 bg-[var(--color-field-bg)] border border-[var(--color-field-border)] rounded-lg pl-9 pr-3 text-sm text-[var(--color-field-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* AI Model Provider & Key */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    AI Model Provider
                  </label>
                  <select
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
                    className="w-full h-9 bg-[var(--color-field-bg)] border border-[var(--color-field-border)] rounded-lg px-3 text-xs text-[var(--color-field-text)] font-medium focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all cursor-pointer"
                  >
                    <option value="GEMINI">Google Gemini (Default)</option>
                    <option value="GROQ">Groq (Ultra-Low Latency)</option>
                    <option value="OPENAI">OpenAI (GPT-4o)</option>
                    <option value="OLLAMA">Ollama (Local Offline)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                    {provider} API Key (Optional)
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <input
                      type="password"
                      placeholder={provider === 'OLLAMA' ? 'http://localhost:11434' : `Enter ${provider} API key...`}
                      value={apiKey}
                      onChange={(e) => {
                        setApiKey(e.target.value);
                        setStoredApiKey(provider, e.target.value);
                      }}
                      className="w-full h-9 bg-[var(--color-field-bg)] border border-[var(--color-field-border)] rounded-lg pl-9 pr-3 text-sm text-[var(--color-field-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Assessment Track Grid */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-3">
                  Assessment Track *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {TRACKS.map((t) => {
                    const isSelected = track === t.track;
                    return (
                      <button
                        key={t.track}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setTrack(t.track)}
                        className={`p-3.5 text-left rounded-xl h-full transition-all cursor-pointer flex flex-col justify-between ${
                          isSelected
                            ? 'border-2 border-[var(--color-accent)] bg-indigo-50/50 dark:bg-indigo-950/20 shadow-xs'
                            : 'border border-[var(--color-field-border)] hover:border-slate-300 dark:hover:border-zinc-700 bg-[var(--color-field-bg)]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={isSelected ? 'text-[var(--color-accent)]' : 'text-slate-500 dark:text-zinc-400'}>
                              {t.icon}
                            </span>
                            <span className={`text-xs font-bold ${
                              isSelected ? 'text-[var(--color-accent)]' : 'text-slate-900 dark:text-white'
                            }`}>
                              {t.title}
                            </span>
                          </div>
                          <p className={`text-[11px] leading-relaxed line-clamp-2 ${
                            isSelected ? 'text-indigo-900/80 dark:text-indigo-200' : 'text-slate-500 dark:text-zinc-400'
                          }`}>
                            {t.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Track Badges / Honesty Disclaimers */}
                {track === 'RESUME_BASED' && (
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 mt-2.5">
                    <div className="flex items-center gap-2">
                      <Chip variant="neutral" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}>
                        Frontier-model question generation
                      </Chip>
                    </div>
                    {provider === 'OLLAMA' && (
                      <p className="text-xs text-amber-600 flex items-center gap-1.5 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Recommend a frontier key (Gemini/OpenAI) for optimal resume-grounded questions</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Seniority Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-3">
                  Seniority Level
                </label>
                <div className="flex p-1 bg-slate-100 dark:bg-zinc-800 rounded-lg w-max max-w-full overflow-x-auto">
                  {SENIORITY_OPTIONS.map((opt) => {
                    const isSelected = difficulty === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        onClick={() => setDifficulty(opt.value)}
                        className={`px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer shrink-0 ${
                          isSelected
                            ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-xs font-bold'
                            : 'text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Resume Ingestion Pipeline */}
              <div className="p-4 bg-[var(--color-field-bg)] rounded-xl border border-[var(--color-field-border)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">Resume Ingestion (Optional)</span>
                  </div>
                  <div className="flex p-0.5 bg-slate-200/70 dark:bg-zinc-800 rounded-md text-xs">
                    <button
                      type="button"
                      onClick={() => setResumeMode('upload')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        resumeMode === 'upload'
                          ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setResumeMode('paste')}
                      className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                        resumeMode === 'paste'
                          ? 'bg-white dark:bg-zinc-900 text-slate-900 dark:text-white shadow-2xs font-bold'
                          : 'text-slate-500 hover:text-slate-900'
                      }`}
                    >
                      Paste Text
                    </button>
                  </div>
                </div>

                {resumeMode === 'upload' ? (
                  <label className="border-2 border-dashed border-[var(--color-field-border)] hover:border-slate-400 dark:hover:border-zinc-600 bg-white dark:bg-zinc-900 rounded-lg p-5 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors text-center">
                    <Upload className="w-5 h-5 text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-zinc-300 font-medium">
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
                  <div className="space-y-2">
                    <textarea
                      placeholder="Paste resume content, work history, tech stack, and key project bullets..."
                      rows={3}
                      value={pastedResumeText}
                      onChange={(e) => setPastedResumeText(e.target.value)}
                      className="w-full bg-white dark:bg-zinc-900 border border-[var(--color-field-border)] rounded-lg p-2.5 text-xs text-[var(--color-field-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all resize-y"
                    />
                    <button
                      type="button"
                      onClick={handleTextIngest}
                      disabled={!pastedResumeText.trim() || isParsingResume}
                      className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-zinc-800 text-slate-800 dark:text-zinc-200 text-xs font-semibold hover:bg-slate-300 dark:hover:bg-zinc-700 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {isParsingResume ? 'Extracting...' : 'Extract Resume Signals'}
                    </button>
                  </div>
                )}

                {/* Extracted Skills Chips Row */}
                {parsedResumeData && parsedResumeData.skills.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-zinc-800 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{parsedResumeData.fileName} parsed ({parsedResumeData.yearsOfExperience} YOE detected):</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {parsedResumeData.skills.map((skill, idx) => (
                        <Chip key={idx} variant="neutral" size="sm">
                          {skill}
                        </Chip>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 5. Job Description & Custom Focus */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-zinc-300 uppercase tracking-wider mb-2">
                  Job Description & Focus Areas (Optional)
                </label>
                <textarea
                  placeholder="Paste key responsibilities, specific topics, or architectures to emphasize..."
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-[var(--color-field-bg)] border border-[var(--color-field-border)] rounded-lg p-3 text-xs text-[var(--color-field-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:border-[var(--color-accent)] transition-all resize-y"
                />
              </div>

              {/* 6. Submit CTA */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.99] group cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Synthesizing Problem & Initializing Sandbox...</span>
                  </>
                ) : (
                  <>
                    <span>Launch Technical Assessment</span>
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </button>

            </form>
          </div>
        </div>

      </div>

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
