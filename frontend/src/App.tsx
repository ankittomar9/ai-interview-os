import { useState } from 'react';
import { Sparkles, Loader2, Award } from 'lucide-react';
import type { DiagnosticReportResponse, DifficultyLevel, GenerateQuestionResponse, InterviewTrack, ModelProvider } from './types';
import { createSession, generateDiagnosticReport, generateQuestion, startSession } from './services/api';
import { SetupScreen } from './components/SetupScreen';
import { PreInterviewChecklist } from './components/PreInterviewChecklist';
import { InterviewRoom } from './components/InterviewRoom';
import { DiagnosticReportView } from './components/DiagnosticReportView';
import { PhoneProctorView } from './components/PhoneProctorView';
import { QuestionCatalog } from './components/QuestionCatalog';
import { PracticeSummary } from './components/PracticeSummary';
import { Toaster } from './components/ui/Toaster';

type ViewState = 'SETUP' | 'CHECKLIST' | 'ROOM' | 'REPORT' | 'PHONE_PROCTOR' | 'PRACTICE_SUMMARY';

export function App() {
  const [sessionId, setSessionId] = useState<number | null>(() => {
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');
    if (window.location.pathname.includes('phone-proctor') || sessionParam) {
      return sessionParam ? parseInt(sessionParam, 10) : 1;
    }
    return null;
  });

  const [view, setView] = useState<ViewState>(() => {
    const params = new URLSearchParams(window.location.search);
    if (window.location.pathname.includes('phone-proctor') || params.get('session')) {
      return 'PHONE_PROCTOR';
    }
    return 'SETUP';
  });

  const [sessionMode, setSessionMode] = useState<'INTERVIEW' | 'PLAYGROUND'>('INTERVIEW');
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [playlistQuestions, setPlaylistQuestions] = useState<GenerateQuestionResponse[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [candidateId, setCandidateId] = useState('candidate-01');
  const [roleTitle, setRoleTitle] = useState('Senior Java Backend Engineer');
  const [question, setQuestion] = useState<GenerateQuestionResponse | null>(null);
  const [report, setReport] = useState<DiagnosticReportResponse | null>(null);
  const [provider, setProvider] = useState<ModelProvider>('GEMINI');
  const [apiKey, setApiKey] = useState('');

  const handleStartInterview = async (config: {
    candidateId: string;
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    targetCompany: string;
    jobDescription: string;
    provider: ModelProvider;
    apiKey: string;
    mode?: 'INTERVIEW' | 'PLAYGROUND';
  }) => {
    setIsLoading(true);
    const chosenMode = config.mode || 'INTERVIEW';
    setSessionMode(chosenMode);
    setCandidateId(config.candidateId);
    setRoleTitle(config.roleTitle);
    setProvider(config.provider);
    setApiKey(config.apiKey);

    try {
      const session = await createSession({
        candidateId: config.candidateId,
        roleTitle: config.roleTitle,
        track: config.track,
        difficulty: config.difficulty,
        targetCompany: config.targetCompany,
        jobDescription: config.jobDescription,
        mode: chosenMode
      });
      setSessionId(session.id);
      await startSession(session.id);

      const q = await generateQuestion({
        roleTitle: config.roleTitle,
        track: config.track,
        difficulty: config.difficulty,
        jobDescription: config.jobDescription,
        modelProvider: config.provider,
        apiKey: config.apiKey
      });

      setQuestion(q);
      setPlaylistQuestions([q]);

      if (chosenMode === 'PLAYGROUND') {
        // Spec: Skip PreInterviewChecklist in Playground mode
        setView('ROOM');
      } else {
        setView('CHECKLIST');
      }
    } catch (err: any) {
      alert(`Error starting session: ${err.message || 'Make sure all backend microservices are running.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLaunchPlaylist = async (selectedQuestions: GenerateQuestionResponse[]) => {
    if (!selectedQuestions || selectedQuestions.length === 0) return;
    setIsLoading(true);
    setIsCatalogOpen(false);
    setSessionMode('PLAYGROUND');

    const firstQ = selectedQuestions[0];
    const track = firstQ.track || 'ALGORITHMS_DATA_STRUCTURES';
    const difficulty = (firstQ.difficulty?.toUpperCase() as DifficultyLevel) || 'MID';

    try {
      const session = await createSession({
        candidateId: 'practitioner-01',
        roleTitle: `${firstQ.track} Practice Playlist`,
        track,
        difficulty,
        mode: 'PLAYGROUND'
      });
      setSessionId(session.id);
      await startSession(session.id);

      setQuestion(firstQ);
      setPlaylistQuestions(selectedQuestions);
      setView('ROOM');
    } catch (err: any) {
      alert(`Error launching practice playlist: ${err.message || 'Backend service unreachable.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!sessionId) return;

    if (sessionMode === 'PLAYGROUND') {
      setView('PRACTICE_SUMMARY');
      return;
    }

    setIsGeneratingReport(true);
    try {
      const rep = await generateDiagnosticReport(sessionId);
      setReport(rep);
      setView('REPORT');
    } catch (err: any) {
      alert(`Failed to generate diagnostic report: ${err.message}`);
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // If mobile companion view
  if (view === 'PHONE_PROCTOR' && sessionId) {
    return <PhoneProctorView sessionId={sessionId} />;
  }

  return (
    <div className="relative">
      <Toaster />

      {/* FULL-SCREEN REPORT GENERATION OVERLAY */}
      {isGeneratingReport && (
        <div className="fixed inset-0 z-50 bg-bg/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center select-none animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 shadow-lg shadow-primary/10 relative">
            <Award className="w-8 h-8 text-primary animate-pulse" />
            <Sparkles className="w-4 h-4 text-warning absolute -top-1 -right-1 animate-bounce" />
          </div>

          <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
            Synthesizing 360° Diagnostic Report
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          </h2>
          <p className="text-xs text-text-3 max-w-md mb-6 leading-relaxed">
            Auditing conversation transcript, code executions, and evaluating multi-dimensional rubric with Bar Raiser criteria...
          </p>

          <div className="w-64 bg-elevated rounded-full h-1.5 overflow-hidden border border-border">
            <div className="h-full bg-gradient-to-r from-primary via-primary-2 to-sky-400 rounded-full animate-pulse w-3/4" />
          </div>
          <span className="text-[11px] font-mono text-text-3 mt-3">Evaluating 5 competency dimensions &amp; generating 7-day study plan</span>
        </div>
      )}

      {/* QUESTION CATALOG MODAL */}
      {isCatalogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
          <div className="bg-surface border border-border rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <QuestionCatalog
              onSelectQuestions={handleLaunchPlaylist}
              onClose={() => setIsCatalogOpen(false)}
            />
          </div>
        </div>
      )}

      {view === 'SETUP' && (
        <SetupScreen
          onStart={handleStartInterview}
          isLoading={isLoading}
          onOpenCatalog={() => setIsCatalogOpen(true)}
        />
      )}

      {view === 'CHECKLIST' && sessionId && (
        <PreInterviewChecklist
          sessionId={sessionId}
          candidateId={candidateId}
          roleTitle={roleTitle}
          onProceed={() => setView('ROOM')}
        />
      )}

      {view === 'ROOM' && sessionId && question && (
        <InterviewRoom
          sessionId={sessionId}
          question={question}
          initialQuestionsList={playlistQuestions}
          provider={provider}
          apiKey={apiKey}
          sessionMode={sessionMode}
          onFinish={handleFinishInterview}
        />
      )}

      {view === 'PRACTICE_SUMMARY' && (
        <PracticeSummary
          questions={playlistQuestions}
          onReturnHome={() => setView('SETUP')}
          onBrowseCatalog={() => {
            setView('SETUP');
            setIsCatalogOpen(true);
          }}
        />
      )}

      {view === 'REPORT' && report && (
        <DiagnosticReportView
          report={report}
          onRestart={() => setView('SETUP')}
        />
      )}
    </div>
  );
}

export default App;
