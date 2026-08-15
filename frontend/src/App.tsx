import { useState, useEffect } from 'react';
import type { DiagnosticReportResponse, DifficultyLevel, GenerateQuestionResponse, InterviewTrack, ModelProvider } from './types';
import { createSession, generateDiagnosticReport, generateQuestion, startSession } from './services/api';
import { SetupScreen } from './components/SetupScreen';
import { PreInterviewChecklist } from './components/PreInterviewChecklist';
import { InterviewRoom } from './components/InterviewRoom';
import { DiagnosticReportView } from './components/DiagnosticReportView';
import { PhoneProctorView } from './components/PhoneProctorView';

type ViewState = 'SETUP' | 'CHECKLIST' | 'ROOM' | 'REPORT' | 'PHONE_PROCTOR';

export function App() {
  const [view, setView] = useState<ViewState>('SETUP');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [candidateId, setCandidateId] = useState('candidate-01');
  const [roleTitle, setRoleTitle] = useState('Senior Java Backend Engineer');
  const [question, setQuestion] = useState<GenerateQuestionResponse | null>(null);
  const [report, setReport] = useState<DiagnosticReportResponse | null>(null);
  const [provider, setProvider] = useState<ModelProvider>('OLLAMA');
  const [apiKey, setApiKey] = useState('');

  // Check if opened as mobile phone proctor URL: /phone-proctor?session=1
  useEffect(() => {
    const path = window.location.pathname;
    const params = new URLSearchParams(window.location.search);
    const sessionParam = params.get('session');

    if (path.includes('phone-proctor') || sessionParam) {
      const parsedId = sessionParam ? parseInt(sessionParam, 10) : 1;
      setSessionId(parsedId);
      setView('PHONE_PROCTOR');
    }
  }, []);

  const handleStartInterview = async (config: {
    candidateId: string;
    roleTitle: string;
    track: InterviewTrack;
    difficulty: DifficultyLevel;
    targetCompany: string;
    jobDescription: string;
    provider: ModelProvider;
    apiKey: string;
  }) => {
    setIsLoading(true);
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
        jobDescription: config.jobDescription
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
      setView('CHECKLIST');
    } catch (err: any) {
      alert(`Error starting session: ${err.message || 'Make sure all backend microservices are running.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!sessionId) return;
    try {
      const rep = await generateDiagnosticReport(sessionId);
      setReport(rep);
      setView('REPORT');
    } catch (err: any) {
      alert(`Failed to generate diagnostic report: ${err.message}`);
    }
  };

  // If mobile companion view
  if (view === 'PHONE_PROCTOR' && sessionId) {
    return <PhoneProctorView sessionId={sessionId} />;
  }

  return (
      <div>
        {view === 'SETUP' && (
            <SetupScreen onStart={handleStartInterview} isLoading={isLoading} />
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
                provider={provider}
                apiKey={apiKey}
                onFinish={handleFinishInterview}
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