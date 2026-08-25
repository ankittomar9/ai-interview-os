import React, { useState, useRef } from 'react';
import type { DifficultyLevel, InterviewTrack, ModelProvider } from '../types';
import { getStoredApiKey, setStoredApiKey, uploadResumeFile, uploadResumeText } from '../services/api';
import {
  Sparkles,
  ArrowRight,
  Upload,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Code2,
  Binary,
  Layers,
  Users2,
  Database,
  Loader2,
  ChevronDown
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
    mode?: 'INTERVIEW' | 'PLAYGROUND';
  }) => void;
  isLoading: boolean;
  onOpenCatalog?: () => void;
}

interface TrackOption {
  track: InterviewTrack;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const TRACKS: TrackOption[] = [
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

export const SetupScreen: React.FC<Props> = ({ onStart, isLoading, onOpenCatalog }) => {
  const [mode, setMode] = useState<'INTERVIEW' | 'PLAYGROUND'>(() => {
    return (localStorage.getItem('app.mode') as 'INTERVIEW' | 'PLAYGROUND') || 'INTERVIEW';
  });

  const handleModeChange = (newMode: 'INTERVIEW' | 'PLAYGROUND') => {
    setMode(newMode);
    localStorage.setItem('app.mode', newMode);
  };

  const [candidateName, setCandidateName] = useState('');
  const [candidateId, setCandidateId] = useState('candidate-01');
  const [isIdManuallyEdited, setIsIdManuallyEdited] = useState(false);
  const [roleTitle, setRoleTitle] = useState('');
  const [track, setTrack] = useState<InterviewTrack>('ALGORITHMS_DATA_STRUCTURES');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MID');
  const [targetCompany, setTargetCompany] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [provider, setProvider] = useState<ModelProvider>('GEMINI');
  const [apiKey, setApiKey] = useState(getStoredApiKey('GEMINI'));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const nameInputRef = useRef<HTMLInputElement>(null);
  const roleInputRef = useRef<HTMLInputElement>(null);

  // Resume Ingestion State
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

  // AI Assistant Drawer
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
    if (fieldErrors.candidateName && name.trim()) {
      setFieldErrors((prev) => ({ ...prev, candidateName: '' }));
    }
    if (!isIdManuallyEdited) {
      const slug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setCandidateId(slug || 'candidate-01');
    }
  };

  const handleRoleTitleChange = (role: string) => {
    setRoleTitle(role);
    if (fieldErrors.roleTitle && role.trim()) {
      setFieldErrors((prev) => ({ ...prev, roleTitle: '' }));
    }
  };

  const handleProviderChange = (newProvider: ModelProvider) => {
    setProvider(newProvider);
    setApiKey(getStoredApiKey(newProvider));
  };

  // Resume File Upload
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

  // Resume Text Paste Ingest
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const isPlayground = mode === 'PLAYGROUND';
    const errors: { [key: string]: string } = {};
    if (!isPlayground && !candidateName.trim()) {
      errors.candidateName = 'Candidate name is required';
    }
    if (!isPlayground && !roleTitle.trim()) {
      errors.roleTitle = 'Target role title is required';
    }
    if (!track) {
      errors.track = 'Assessment track is required';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      if (errors.candidateName) {
        nameInputRef.current?.focus();
      } else if (errors.roleTitle) {
        roleInputRef.current?.focus();
      }
      setErrorMessage('Please fill in all required fields before launching.');
      return;
    }

    const effectiveRole = isPlayground ? (roleTitle.trim() || 'Software Engineer') : roleTitle.trim();
    const effectiveCandidateId = isPlayground ? 'practitioner-01' : (candidateId || 'candidate-01');

    onStart({
      candidateId: effectiveCandidateId,
      roleTitle: effectiveRole,
      track,
      difficulty,
      targetCompany: isPlayground ? '' : targetCompany.trim(),
      jobDescription: isPlayground ? '' : jobDescription.trim(),
      provider,
      apiKey: apiKey.trim(),
      mode
    });
  };

  // Keyboard navigation for Track radio group
  const handleTrackKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (currentIdx + 1) % TRACKS.length;
      setTrack(TRACKS[nextIdx].track);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (currentIdx - 1 + TRACKS.length) % TRACKS.length;
      setTrack(TRACKS[prevIdx].track);
    }
  };

  // Keyboard navigation for Seniority radio group
  const handleSeniorityKeyDown = (e: React.KeyboardEvent, currentIdx: number) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIdx = (currentIdx + 1) % SENIORITY_OPTIONS.length;
      setDifficulty(SENIORITY_OPTIONS[nextIdx].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIdx = (currentIdx - 1 + SENIORITY_OPTIONS.length) % SENIORITY_OPTIONS.length;
      setDifficulty(SENIORITY_OPTIONS[prevIdx].value);
    }
  };

  const isFormValid = mode === 'PLAYGROUND'
    ? !!track
    : (candidateName.trim().length > 0 && roleTitle.trim().length > 0 && !!track);

  return (
    <div className="min-h-screen bg-slate-50 grid place-items-center p-4 sm:p-8 select-text font-sans">
      <div className="max-w-6xl w-full flex flex-col lg:flex-row lg:min-h-[850px] bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden">
        
        {/* =========================================================================
            LEFT COLUMN: Dark Studio Sidebar (w-full lg:w-1/3 bg-slate-900)
           ========================================================================= */}
        <aside className="w-full lg:w-1/3 bg-slate-900 p-8 lg:p-10 flex flex-col justify-between text-slate-300">
          <div>
            {/* Logo row */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white leading-tight">AI Interview OS</h1>
                <p className="text-xs text-slate-400 font-medium">Honest Evaluation Studio</p>
              </div>
            </div>

            {/* Paragraph */}
            <p className="text-sm text-slate-400 leading-relaxed mb-8">
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
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="text-sm text-slate-300 leading-relaxed">
                    <strong className="text-white">{item.title}:</strong> {item.desc}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* mt-auto block: Lifecycle timeline + Engine card */}
          <div className="mt-auto pt-8 border-t border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">
              Interview Lifecycle
            </h3>
            <div className="relative pl-6 space-y-5">
              <div className="absolute left-2.5 top-1 bottom-1 w-px bg-slate-800" />
              {[
                { label: 'Setup & Track Selection', state: 'completed' },
                { label: 'System & Proctor Check', state: 'current' },
                { label: 'AI Technical Assessment', state: 'upcoming' },
                { label: '360° Diagnostic Report', state: 'upcoming' }
              ].map((step, idx) => (
                <div key={idx} className="relative flex items-center gap-3">
                  <div
                    className={`w-5 h-5 rounded-full ring-4 ring-slate-900 flex items-center justify-center shrink-0 transition-all ${
                      step.state === 'completed'
                        ? 'bg-emerald-500 text-white'
                        : step.state === 'current'
                        ? 'bg-indigo-600 ring-indigo-950 text-white'
                        : 'bg-slate-800'
                    }`}
                  />
                  <span
                    className={`text-sm font-medium ${
                      step.state === 'upcoming'
                        ? 'text-slate-500'
                        : step.state === 'current'
                        ? 'text-white font-semibold'
                        : 'text-slate-300'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Engine status card */}
            <div className="mt-6 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
                  AI Engine Status
                </span>
                <span className="text-xs font-medium text-emerald-400">Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold text-slate-200">
                  {provider === 'GEMINI' ? 'Gemini 2.5 Flash' : provider === 'GROQ' ? 'Groq Whisper + Llama' : provider}
                </span>
              </div>
              <div className="text-[10px] uppercase text-slate-500 mt-1 font-mono tracking-wider">
                Ultra-Low Latency Dialogue Engine
              </div>
            </div>
          </div>
        </aside>

        {/* =========================================================================
            RIGHT COLUMN: Light Candidate Setup Form (flex-1 bg-white p-8 lg:p-10)
           ========================================================================= */}
        <div className="flex-1 p-8 lg:p-10 overflow-y-auto bg-white">
          <div className="max-w-2xl mx-auto">
            {/* Mode Selector Segmented Pill */}
            <div className="mb-6">
              <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200" role="tablist" aria-label="Assessment Mode">
                <button
                  type="button"
                  onClick={() => handleModeChange('INTERVIEW')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'INTERVIEW'
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  role="tab"
                  aria-selected={mode === 'INTERVIEW'}
                >
                  <span className="text-base">🎯</span>
                  <span>Interview Mode</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('PLAYGROUND')}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    mode === 'PLAYGROUND'
                      ? 'bg-white text-indigo-600 shadow-sm border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                  role="tab"
                  aria-selected={mode === 'PLAYGROUND'}
                >
                  <span className="text-base">🧪</span>
                  <span>Playground Mode</span>
                </button>
              </div>
            </div>

            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                {mode === 'PLAYGROUND' ? 'Playground Practice Arena' : 'Candidate Setup'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {mode === 'PLAYGROUND'
                  ? 'Unproctored practice with full hint reveals, read-only solutions, and coaching dialogue.'
                  : 'Enter candidate details and customize the formal evaluation track.'}
              </p>
            </div>

            <form onSubmit={handleSubmit}>

              {/* 1. Identity Grid (2 cols) - Only in INTERVIEW mode */}
              {mode === 'INTERVIEW' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                  {/* Candidate Full Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Candidate Name *
                    </label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      required={mode === 'INTERVIEW'}
                      placeholder="e.g. Ankit Singh Tomar"
                      value={candidateName}
                      onChange={(e) => handleCandidateNameChange(e.target.value)}
                      className={`w-full h-10 bg-slate-50 border rounded-lg px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                        fieldErrors.candidateName ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {fieldErrors.candidateName && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.candidateName}</p>
                    )}
                  </div>

                  {/* Candidate ID Slug with 'id-' affix */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Candidate ID
                    </label>
                    <div className="flex items-center h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 focus-within:ring-2 focus-within:ring-indigo-500/20 focus-within:border-indigo-500 transition-all">
                      <span className="text-slate-400 text-sm font-mono select-none mr-1.5">id-</span>
                      <input
                        type="text"
                        value={candidateId.replace(/^id-/, '')}
                        onChange={(e) => {
                          const raw = e.target.value.replace(/^id-/, '');
                          setCandidateId(raw);
                          setIsIdManuallyEdited(true);
                        }}
                        placeholder="candidate-01"
                        className="flex-1 bg-transparent border-0 text-sm text-slate-900 font-mono focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                  </div>

                  {/* Target Role Title */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Target Role Title *
                    </label>
                    <input
                      ref={roleInputRef}
                      type="text"
                      required={mode === 'INTERVIEW'}
                      placeholder="e.g. Senior Java Backend Engineer"
                      value={roleTitle}
                      onChange={(e) => handleRoleTitleChange(e.target.value)}
                      className={`w-full h-10 bg-slate-50 border rounded-lg px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all ${
                        fieldErrors.roleTitle ? 'border-red-500' : 'border-slate-200'
                      }`}
                    />
                    {fieldErrors.roleTitle && (
                      <p className="text-xs text-red-600 mt-1">{fieldErrors.roleTitle}</p>
                    )}
                  </div>

                  {/* Target Company */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                      Target Company (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Google, Stripe, Netflix"
                      value={targetCompany}
                      onChange={(e) => setTargetCompany(e.target.value)}
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* AI Model Provider & Key Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">

                {/* AI Model Provider */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    AI Model Provider
                  </label>
                  <div className="relative">
                    <select
                      value={provider}
                      onChange={(e) => handleProviderChange(e.target.value as ModelProvider)}
                      className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 pr-8 text-sm text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                    >
                      <option value="GEMINI">Google Gemini (Default)</option>
                      <option value="GROQ">Groq (Ultra-Low Latency)</option>
                      <option value="OPENAI">OpenAI (GPT-4o)</option>
                      <option value="OLLAMA">Ollama (Local Offline)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                </div>

                {/* API Key */}
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                    {provider} API Key (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder={provider === 'OLLAMA' ? 'http://localhost:11434' : 'Enter API key or leave blank...'}
                    value={apiKey}
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setStoredApiKey(provider, e.target.value);
                    }}
                    className="w-full h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 text-sm text-slate-900 font-mono placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                  />
                </div>
              </div>

              {/* 2. Assessment Track (3-col Grid) */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider">
                    {mode === 'PLAYGROUND' ? 'Practice Track *' : 'Assessment Track *'}
                  </label>
                  {onOpenCatalog && (
                    <button
                      type="button"
                      onClick={onOpenCatalog}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Browse Full Question Catalog</span>
                    </button>
                  )}
                </div>
                <div
                  role="radiogroup"
                  aria-label="Assessment Track"
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 items-stretch"
                >
                  {TRACKS.map((t, idx) => {
                    const isSelected = track === t.track;
                    return (
                      <button
                        key={t.track}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onKeyDown={(e) => handleTrackKeyDown(e, idx)}
                        onClick={() => {
                          setTrack(t.track);
                          if (fieldErrors.track) setFieldErrors((prev) => ({ ...prev, track: '' }));
                        }}
                        className={`p-4 text-left rounded-xl h-full flex flex-col justify-between transition-all cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          isSelected
                            ? 'border-2 border-indigo-600 bg-indigo-50/50 shadow-xs'
                            : 'border border-slate-200 hover:border-slate-300 bg-slate-50'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className={isSelected ? 'text-indigo-600' : 'text-slate-500'}>
                              {t.icon}
                            </span>
                            <span className={`text-sm font-bold ${
                              isSelected ? 'text-indigo-600' : 'text-slate-900'
                            }`}>
                              {t.title}
                            </span>
                          </div>
                          <p className={`text-[10px] leading-snug line-clamp-2 mt-1 ${
                            isSelected ? 'text-indigo-900/80 font-medium' : 'text-slate-500'
                          }`}>
                            {t.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Track Honesty / Coaching Badges */}
                {track === 'RESUME_BASED' && (
                  <div className="flex flex-col gap-1.5 p-3 rounded-lg bg-slate-50 border border-slate-200 mt-3">
                    <div className="flex items-center gap-2">
                      <Chip variant="neutral" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-indigo-600" />}>
                        Frontier-model question generation
                      </Chip>
                    </div>
                    {provider === 'OLLAMA' && (
                      <p className="text-xs text-amber-700 flex items-center gap-1.5 mt-0.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>Recommend a frontier key (Gemini/OpenAI) for optimal resume-grounded questions</span>
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* 3. Seniority Level Segmented Control */}
              <div className="mb-8">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-4">
                  Seniority Level
                </label>
                <div
                  role="radiogroup"
                  aria-label="Seniority Level"
                  className="flex p-1 bg-slate-100 rounded-lg w-max max-w-full overflow-x-auto"
                >
                  {SENIORITY_OPTIONS.map((opt, idx) => {
                    const isSelected = difficulty === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        tabIndex={isSelected ? 0 : -1}
                        onKeyDown={(e) => handleSeniorityKeyDown(e, idx)}
                        onClick={() => setDifficulty(opt.value)}
                        className={`px-4 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
                          isSelected
                            ? 'bg-white text-slate-900 shadow-sm font-bold'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 4. Resume Ingestion Pipeline */}
              <div className="mb-8 p-6 bg-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Resume Ingestion (Optional)
                    </span>
                  </div>

                  {/* Pill Toggle UPLOAD / PASTE */}
                  <div className="flex bg-slate-200/80 rounded-md p-0.5" role="tablist">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={resumeMode === 'upload'}
                      onClick={() => setResumeMode('upload')}
                      className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        resumeMode === 'upload'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Upload
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={resumeMode === 'paste'}
                      onClick={() => setResumeMode('paste')}
                      className={`px-3 py-1 rounded text-[10px] font-bold tracking-wider uppercase transition-all cursor-pointer ${
                        resumeMode === 'paste'
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Paste
                    </button>
                  </div>
                </div>

                {resumeMode === 'upload' ? (
                  <label className="border-2 border-dashed border-slate-200 hover:border-slate-400 bg-white rounded-xl p-8 text-center flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors block">
                    <Upload className="w-8 h-8 text-slate-400 mb-1" />
                    <span className="text-sm font-medium text-slate-700">
                      {isParsingResume
                        ? 'Extracting candidate skills & experience...'
                        : 'Drop your resume here or click to browse'}
                    </span>
                    <span className="text-xs text-slate-400">
                      PDF, DOCX, TXT up to 10MB
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
                  <div className="space-y-3">
                    <textarea
                      placeholder="Paste resume content, work history, tech stack, and key project bullets..."
                      rows={4}
                      value={pastedResumeText}
                      onChange={(e) => setPastedResumeText(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y"
                    />
                    <button
                      type="button"
                      onClick={handleTextIngest}
                      disabled={!pastedResumeText.trim() || isParsingResume}
                      className="px-4 py-2 rounded-lg bg-slate-200 text-slate-800 text-xs font-semibold hover:bg-slate-300 disabled:opacity-50 cursor-pointer transition-colors"
                    >
                      {isParsingResume ? 'Extracting...' : 'Extract Resume Signals'}
                    </button>
                  </div>
                )}

                {/* Extracted Skills Chips Row */}
                {parsedResumeData && parsedResumeData.skills.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-slate-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                      <CheckCircle2 className="w-4 h-4" />
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

              {/* 5. Job Description & Focus Areas */}
              <div className="mb-8">
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                  Job Description & Focus Areas (Optional)
                </label>
                <textarea
                  placeholder="Paste key responsibilities, specific topics, or architectures to emphasize..."
                  rows={3}
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-y"
                />
              </div>

              {/* Error summary */}
              {errorMessage && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600 font-medium">
                  {errorMessage}
                </div>
              )}

              {/* 6. Submit Button */}
              <button
                type="submit"
                disabled={!isFormValid || isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-600/20 transition-all active:scale-[0.98] group cursor-pointer flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>{mode === 'PLAYGROUND' ? 'Entering Playground Arena...' : 'Launching Technical Assessment...'}</span>
                  </>
                ) : (
                  <>
                    <span>{mode === 'PLAYGROUND' ? 'Enter Playground Arena' : 'Launch Technical Assessment'}</span>
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
