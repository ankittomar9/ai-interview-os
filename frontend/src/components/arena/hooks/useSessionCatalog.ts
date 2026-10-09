import { useState, useEffect, useCallback, useMemo } from 'react';
import type { GenerateQuestionResponse, InterviewTrack } from '../../../types';
import { listQuestions } from '../../../services/api';
import type { QuestionStatus } from '../../ide/QuestionRail';

export interface UseSessionCatalogProps {
  defaultQuestion?: GenerateQuestionResponse;
  sectionQuestions?: GenerateQuestionResponse[][];
  activeSectionIndex?: number;
  playlistQuestions?: GenerateQuestionResponse[];
  track?: InterviewTrack | string;
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

export const BINDING_ERROR_QUESTION: GenerateQuestionResponse = {
  title: 'Question Binding Error',
  problemStatement: 'Error: Selected question index is out of bounds for the current section question list.',
  difficulty: 'MID',
  track: 'ALGORITHMS_DATA_STRUCTURES',
  starterCode: '',
  hints: [],
  evaluationCriteria: [],
  slug: 'binding-error',
  problemSlug: 'binding-error'
};

export function resolveSectionQuestions(
  sectionQuestions: GenerateQuestionResponse[][] | undefined | null,
  sectionIndex: number,
  isInterview: boolean = true
): GenerateQuestionResponse[] | null {
  if (isInterview && sectionQuestions) {
    if (sectionIndex < 0 || sectionIndex >= sectionQuestions.length) {
      return [];
    }
    return sectionQuestions[sectionIndex] || [];
  }
  return null;
}

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
    return resolveSectionQuestions(sectionQuestions, activeSectionIndex, isInterview);
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
    if (playlistQuestions && playlistQuestions.length > 0) {
      setQuestionsList(playlistQuestions);
      return;
    }

    let isCancelled = false;
    const fetchTrackCatalog = async () => {
      setIsLoadingQuestions(true);
      try {
        const fetched = await listQuestions({
          track: track === 'ALL' ? undefined : track,
          sessionMode,
          sessionId
        });
        if (isCancelled) return;
        if (Array.isArray(fetched) && fetched.length > 0) {
          const filtered = track === 'ALL' ? fetched : fetched.filter((q) => !q.track || q.track === track);
          if (filtered.length > 0) {
            setQuestionsList(filtered);
            const targetSlug = defaultQuestion?.problemSlug || defaultQuestion?.slug;
            if (targetSlug) {
              const targetIdx = filtered.findIndex((q) => (q.problemSlug === targetSlug || q.slug === targetSlug));
              if (targetIdx !== -1) {
                setActiveQuestionIndex(targetIdx);
                return;
              }
            }
            setActiveQuestionIndex(0);
            return;
          }
        }
        setQuestionsList(defaultQuestion && (track === 'ALL' || defaultQuestion.track === track) ? [defaultQuestion] : []);
        setActiveQuestionIndex(0);
      } catch (err) {
        console.warn(`[useSessionCatalog] Could not load catalog for track ${track}:`, err);
        setQuestionsList(defaultQuestion && (track === 'ALL' || defaultQuestion.track === track) ? [defaultQuestion] : []);
        setActiveQuestionIndex(0);
      } finally {
        if (!isCancelled) setIsLoadingQuestions(false);
      }
    };

    void fetchTrackCatalog();
    return () => {
      isCancelled = true;
    };
  }, [track, defaultQuestion, isInterview, playlistQuestions, sessionMode, sessionId, activeSectionList]);

  const effectiveQuestionsList = activeSectionList !== null ? activeSectionList : questionsList;

  // Derive activeQuestion: never silently fallback to another question or questionsList[0]
  const activeQuestion = useMemo(() => {
    if (effectiveQuestionsList.length > 0) {
      if (activeQuestionIndex >= 0 && activeQuestionIndex < effectiveQuestionsList.length) {
        return effectiveQuestionsList[activeQuestionIndex];
      }
      return {
        ...BINDING_ERROR_QUESTION,
        track: (track as InterviewTrack) || 'ALGORITHMS_DATA_STRUCTURES'
      };
    }
    if (activeSectionIndex === 0 && defaultQuestion && (track === 'ALL' || defaultQuestion.track === track)) {
      return defaultQuestion;
    }
    return {
      ...EMPTY_QUESTION,
      track: (track as InterviewTrack) || 'ALGORITHMS_DATA_STRUCTURES'
    };
  }, [effectiveQuestionsList, activeQuestionIndex, activeSectionIndex, defaultQuestion, track]);

  const selectQuestion = useCallback((index: number) => {
    if (index >= 0 && index < effectiveQuestionsList.length) {
      setActiveQuestionIndex(index);
    } else {
      console.warn(`[useSessionCatalog] Out-of-bounds selectQuestion call: index=${index}, listLength=${effectiveQuestionsList.length}`);
    }
  }, [effectiveQuestionsList.length]);

  const markQuestionStatus = useCallback((slug: string, status: QuestionStatus) => {
    setQuestionStatusMap((prev) => ({ ...prev, [slug]: status }));
  }, []);

  return {
    questionsList: effectiveQuestionsList,
    activeQuestion,
    activeQuestionIndex,
    isLoadingQuestions,
    questionStatusMap,
    selectQuestion,
    markQuestionStatus,
    setQuestionsList
  };
}
