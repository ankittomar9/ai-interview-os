import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import type { GenerateQuestionResponse, InterviewTrack, ModelProvider, SessionPlan } from '../../types';
import { isApproachGateLocked } from '../../lib/approachGate';
import { useSessionCatalog } from './hooks/useSessionCatalog';
import { ArenaShell } from './ArenaShell';
import { ShareLostOverlay } from '../ShareLostOverlay';
import { clearVerificationStreams } from '../../services/verificationStreams';
import { getPersona } from '../../lib/personas';
import { buildNavSections } from '../../lib/plan-navigation';
import { getSubmissions } from '../../lib/submissions';
import { listQuestions } from '../../services/api';
import { useArenaCodeSession } from './hooks/useArenaCodeSession';
import { useArenaSessionDetails } from './hooks/useArenaSessionDetails';
import { useArenaNavigation } from './hooks/useArenaNavigation';
import { useArenaEngines } from './hooks/useArenaEngines';
import { buildArenaShellProps } from './hooks/useArenaShellProps';

export function ensureDsaMethodSignatureBoilerplate(
  rawStarter?: string,
  slug?: string,
  track?: string
): string {
  if (track === 'SQL') {
    return rawStarter && rawStarter.trim() ? rawStarter : '-- Write your SQL query below\nSELECT 1;';
  }
  const trimmed = (rawStarter || '').trim();
  const s = (slug || '').toLowerCase();

  let requiredMethodName = 'solve';
  let methodStub = `    public static String solve(String input) {\n        // TODO: write your solution here\n        return "";\n    }\n`;
  let defaultFull = `import java.util.*;\n\npublic class Main {\n    public static String solve(String input) {\n        // TODO: write your solution here\n        return "";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        String input = sc.hasNextLine() ? sc.nextLine() : "";\n        System.out.println(solve(input));\n    }\n}\n`;

  if (s.includes('reverse') && s.includes('string')) {
    requiredMethodName = 'reverseString';
    methodStub = `    public static String reverseString(String s) {\n        // TODO: write your solution here\n        return "";\n    }\n`;
    defaultFull = `import java.util.Scanner;\n\npublic class Main {\n    public static String reverseString(String s) {\n        // TODO: write your solution here\n        return "";\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            System.out.println(reverseString(sc.nextLine()));\n        }\n    }\n}\n`;
  } else if (s.includes('longest-substring')) {
    requiredMethodName = 'lengthOfLongestSubstring';
    methodStub = `    public static int lengthOfLongestSubstring(String s) {\n        // TODO: write your solution here\n        return 0;\n    }\n`;
    defaultFull = `import java.util.*;\n\npublic class Main {\n    public static int lengthOfLongestSubstring(String s) {\n        // TODO: write your solution here\n        return 0;\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextLine()) {\n            System.out.println(0);\n            return;\n        }\n        System.out.println(lengthOfLongestSubstring(sc.nextLine()));\n    }\n}\n`;
  } else if (s.includes('two-sum')) {
    requiredMethodName = 'twoSum';
    methodStub = `    public static int[] twoSum(int[] nums, int target) {\n        // TODO: write your solution here\n        return new int[]{0, 0};\n    }\n`;
    defaultFull = `import java.util.*;\n\npublic class Main {\n    public static int twoSum(int[] nums, int target) {\n        // TODO: write your solution here\n        return new int[]{0, 0};\n    }\n\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (!sc.hasNextInt()) return;\n        int n = sc.nextInt();\n        int target = sc.nextInt();\n        int[] nums = new int[n];\n        for (int i = 0; i < n; i++) nums[i] = sc.nextInt();\n        int[] ans = twoSum(nums, target);\n        System.out.println(ans[0] + " " + ans[1]);\n    }\n}\n`;
  }

  if (!trimmed || trimmed.startsWith('// No starter code shipped')) {
    return defaultFull;
  }

  if (trimmed.includes(requiredMethodName)) {
    return rawStarter!;
  }

  const mainClassIdx = rawStarter!.indexOf('class Main');
  if (mainClassIdx !== -1) {
    const braceIdx = rawStarter!.indexOf('{', mainClassIdx);
    if (braceIdx !== -1) {
      return rawStarter!.slice(0, braceIdx + 1) + '\n' + methodStub + rawStarter!.slice(braceIdx + 1);
    }
  }

  return rawStarter!;
}

export function getSavedCodeForSlug(
  sessionId: number,
  slug: string,
  fallback: string
): { code: string; source: 'autosave' | 'submission' | 'starter' } {
  const autosaveKey = `editor.autosave.${sessionId}.${slug}`;
  try {
    const saved = typeof window !== 'undefined' ? window.localStorage?.getItem(autosaveKey) : null;
    if (saved && saved.trim() && !saved.startsWith('// No starter code shipped')) {
      return { code: saved, source: 'autosave' };
    }
  } catch {}

  try {
    const subs = getSubmissions(sessionId, slug);
    if (subs && subs.length > 0) {
      for (const s of subs) {
        if (s.codeSnippet && s.codeSnippet.trim() && !s.codeSnippet.startsWith('// No starter code shipped')) {
          return { code: s.codeSnippet, source: 'submission' };
        }
      }
    }
  } catch {}

  return { code: fallback, source: 'starter' };
}

interface ArenaRoomProps {
  sessionId: number;
  question: GenerateQuestionResponse;
  initialQuestionsList?: GenerateQuestionResponse[];
  sectionQuestions?: GenerateQuestionResponse[][];
  provider: ModelProvider;
  apiKey: string;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  candidateName?: string;
  plan?: SessionPlan;
  onFinish: () => void;
  onRegisterFinishRecorder?: (fn: () => Promise<void>) => void;
}

export const ArenaRoom: React.FC<ArenaRoomProps> = ({
  sessionId,
  question: initialQuestion,
  initialQuestionsList,
  sectionQuestions,
  provider,
  apiKey,
  sessionMode = 'INTERVIEW',
  candidateName,
  plan,
  onFinish,
  onRegisterFinishRecorder
}) => {
  const isPlayground = sessionMode === 'PLAYGROUND';
  const persona = getPersona(isPlayground);
  const navSections = useMemo(() => buildNavSections(plan?.sections, initialQuestion.track), [plan?.sections, initialQuestion.track]);
  const [isShareLost, setIsShareLost] = useState(false);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState<string>(initialQuestion.track || 'ALGORITHMS_DATA_STRUCTURES');
  const [allCatalogQuestions, setAllCatalogQuestions] = useState<GenerateQuestionResponse[]>([]);

  useEffect(() => {
    let isCancelled = false;
    listQuestions({ sessionMode, sessionId })
      .then((qs) => {
        if (!isCancelled && Array.isArray(qs) && qs.length > 0) {
          setAllCatalogQuestions(qs);
        }
      })
      .catch((err) => {
        console.warn('[ArenaRoom] Failed to load catalog questions for menu:', err);
      });
    return () => {
      isCancelled = true;
    };
  }, [sessionMode, sessionId]);

  useEffect(() => () => { clearVerificationStreams(); }, []);

  const { sectionGates, targetCompany, jobDescription, resumeSummary, handleAiTurnCompleted } =
    useArenaSessionDetails({ sessionId, sessionMode, plan });

  const { questionsList, activeQuestion, activeQuestionIndex, questionStatusMap, selectQuestion, markQuestionStatus } =
    useSessionCatalog({
      defaultQuestion: initialQuestion,
      sectionQuestions,
      activeSectionIndex,
      playlistQuestions: (!isPlayground || currentTrack === initialQuestion.track) ? initialQuestionsList : undefined,
      track: currentTrack as InterviewTrack,
      sessionMode,
      sessionId
    });

  const activeSlug = activeQuestion.problemSlug || activeQuestion.slug || `q_${activeQuestionIndex}`;
  const fallbackStarter = ensureDsaMethodSignatureBoilerplate(activeQuestion.starterCode, activeSlug, activeQuestion.track);
  const { code, setCode } = useArenaCodeSession({ sessionId, activeSlug, fallbackStarter });
  const [language, setLanguage] = useState(initialQuestion.track === 'SQL' ? 'sql' : 'java');

  useEffect(() => {
    if (activeQuestion.track === 'SQL') {
      setLanguage('sql');
    } else if (activeQuestion.track === 'SPRING_LLD' || activeQuestion.track === 'ALGORITHMS_DATA_STRUCTURES') {
      if (language === 'sql') {
        setLanguage('java');
      }
    }
  }, [activeQuestion.track, activeQuestion.slug]);

  const sectionChangeHandlerRef = useRef<(idx: number, stage: any) => void>(() => {});

  const handleShareLost = useCallback(() => {
    if (!isPlayground) setIsShareLost(true);
  }, [isPlayground]);

  const engines = useArenaEngines({
    sessionId,
    provider,
    apiKey,
    sessionMode,
    candidateName,
    initialQuestion,
    activeQuestion,
    activeQuestionIndex,
    questionsList,
    fallbackStarter,
    code,
    language,
    plan,
    navSections,
    sectionGates,
    welcomeMessage: persona.welcomeMessage,
    jobDescription,
    targetCompany,
    resumeSummary,
    onShareLost: handleShareLost,
    onRegisterFinishRecorder,
    markQuestionStatus,
    handleAiTurnCompleted,
    onSectionChanged: (idx, stage) => sectionChangeHandlerRef.current(idx, stage),
    activeSectionIndex,
    onSectionIndexChange: setActiveSectionIndex
  });

  const nav = useArenaNavigation({
    sessionId,
    isPlayground,
    initialTrack: initialQuestion.track || 'ALGORITHMS_DATA_STRUCTURES',
    navSections,
    dialogue: engines.dialogue,
    activeQuestionIndex,
    questionsCount: questionsList.length,
    selectQuestion
  });
  sectionChangeHandlerRef.current = nav.handleSectionClick;

  const isGateLocked = isApproachGateLocked({
    sessionMode,
    sectionType: plan?.sections?.[activeSectionIndex]?.sectionType || navSections[activeSectionIndex]?.sectionType || initialQuestion.track,
    sectionIndex: activeSectionIndex,
    sectionGates
  });

  const handleSwitchTrack = useCallback((trackKey: string) => {
    if (!isPlayground) return;
    nav.setActiveTrack(trackKey as InterviewTrack);
    setCurrentTrack(trackKey);
  }, [isPlayground, nav]);

  const shellProps = buildArenaShellProps({
    sessionId,
    track: nav.activeTrack,
    sections: plan?.sections,
    activeSectionIndex,
    isApproachGateLocked: isGateLocked,
    sectionQuestions,
    onSectionClick: nav.handleSectionClick,
    onSwitchTrack: handleSwitchTrack,
    catalogQuestions: allCatalogQuestions,
    question: activeQuestion,
    onNextQuestion: nav.handleNextQuestion,
    onNextStage: nav.handleNextStage,
    questionsList,
    activeQuestionIndex,
    onSelectQuestion: (idx) => { selectQuestion(idx); },
    questionStatusMap,
    code,
    onChangeCode: setCode,
    language,
    onChangeLanguage: setLanguage,
    onRunCode: engines.handleRunCode,
    onSubmitSolution: engines.handleSubmitSolution,
    isExecuting: engines.isExecuting,
    executionResult: engines.executionResult,
    provider,
    apiKey,
    sessionMode,
    onFinish,
    engines,
    nav
  });

  return (
    <>
      {isShareLost && !isPlayground && (
        <ShareLostOverlay
          sessionId={sessionId}
          onRestored={(stream) => { engines.recorder.attachScreenStream(stream); setIsShareLost(false); }}
          onAborted={onFinish}
        />
      )}
      <ArenaShell {...shellProps} />
    </>
  );
};
