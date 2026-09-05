import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GenerateQuestionResponse, InterviewTrack } from '../../../types';
import { listQuestions } from '../../../services/api';
import type { QuestionStatus } from '../../ide/QuestionRail';

export interface UseSessionCatalogProps {
  defaultQuestion?: GenerateQuestionResponse;
  sectionQuestions?: GenerateQuestionResponse[][];
  activeSectionIndex?: number;
  playlistQuestions?: GenerateQuestionResponse[];
  track?: InterviewTrack;
  sessionMode?: 'INTERVIEW' | 'PLAYGROUND';
  sessionId?: number;
}

const EMPTY_QUESTION: GenerateQuestionResponse = {
  title: 'No questions seeded',
  problemStatement: 'No questions seeded for this round in the session plan.',
  difficulty: 'MID',
  track: 'ALGORITHMS_DATA_STRUCTURES',
  starterCode: '',
  hints: [],
  evaluationCriteria: []
};

export function useSessionCatalog({
  defaultQuestion,
  sectionQuestions,
  activeSectionIndex = 0,
  playlistQuestions,
  track,
  sessionMode = 'INTERVIEW',
  sessionId
}: UseSessionCatalogProps) {
  const isInterview = sessionMode === 'INTERVIEW';
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);

  // Section-scoped question binding (D2): reset index on section change
  useEffect(() => {
    setActiveQuestionIndex(0);
  }, [activeSectionIndex]);

  const activeSectionList = useMemo(() => {
    if (isInterview && sectionQuestions) {
      return sectionQuestions[activeSectionIndex] || [];
    }
    return null;
  }, [isInterview, sectionQuestions, activeSectionIndex]);

  const [questionsList, setQuestionsList] = useState<GenerateQuestionResponse[]>(() => {
    if (isInterview && sectionQuestions) {
      return sectionQuestions[activeSectionIndex] || [];
    }
    if (playlistQuestions && playlistQuestions.length > 0) {
      return playlistQuestions;
    }
    return defaultQuestion ? [defaultQuestion] : [];
  });

  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionStatusMap, setQuestionStatusMap] = useState<Record<string, QuestionStatus>>(() => ({
    [defaultQuestion?.slug || 'current']: 'UNTOUCHED'
  }));

  useEffect(() => {
    if (activeSectionList !== null) {
      setQuestionsList(activeSectionList);
      return;
    }

    if (!track) return;
    if (isInterview && playlistQuestions && playlistQuestions.length > 0) {
      setQuestionsList(playlistQuestions);
      return;
    }

    let isCancelled = false;
    const fetchTrackCatalog = async () => {
      setIsLoadingQuestions(true);
      try {
        const fetched = await listQuestions({ track, sessionMode, sessionId });
        if (isCancelled) return;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const filtered = fetched.filter((q) => !q.track || q.track === track);
          if (filtered.length > 0) {
            setQuestionsList(filtered);
            return;
          }
        }
        setQuestionsList(defaultQuestion && defaultQuestion.track === track ? [defaultQuestion] : []);
      } catch (err) {
        console.warn(`[useSessionCatalog] Could not load catalog for track ${track}:`, err);
        setQuestionsList(defaultQuestion && defaultQuestion.track === track ? [defaultQuestion] : []);
      } finally {
        if (!isCancelled) setIsLoadingQuestions(false);
      }
    };

    void fetchTrackCatalog();
    return () => {
      isCancelled = true;
    };
  }, [track, defaultQuestion, isInterview, playlistQuestions, sessionMode, sessionId, activeSectionList]);

  // Derive activeQuestion: never fallback to another section's question
  const activeQuestion = useMemo(() => {
    if (questionsList.length > 0) {
      return questionsList[activeQuestionIndex] || questionsList[0];
    }
    if (activeSectionIndex === 0 && defaultQuestion) {
      return defaultQuestion;
    }
    return {
      ...EMPTY_QUESTION,
      track: track || 'ALGORITHMS_DATA_STRUCTURES'
    };
  }, [questionsList, activeQuestionIndex, activeSectionIndex, defaultQuestion, track]);

  const selectQuestion = useCallback((index: number) => {
    if (index >= 0 && index < questionsList.length) {
      setActiveQuestionIndex(index);
    }
  }, [questionsList.length]);

  const markQuestionStatus = useCallback((slug: string, status: QuestionStatus) => {
    setQuestionStatusMap((prev) => ({ ...prev, [slug]: status }));
  }, []);

  return {
    questionsList,
    activeQuestion,
    activeQuestionIndex,
    isLoadingQuestions,
    questionStatusMap,
    selectQuestion,
    markQuestionStatus,
    setQuestionsList
  };
}
