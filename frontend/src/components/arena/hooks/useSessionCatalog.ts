import { useState, useEffect, useCallback } from 'react';
import type { GenerateQuestionResponse, InterviewTrack } from '../../../types';
import { listQuestions } from '../../../services/api';
import type { QuestionStatus } from '../../ide/QuestionRail';

interface UseSessionCatalogProps {
  initialQuestion: GenerateQuestionResponse;
  initialQuestionsList?: GenerateQuestionResponse[];
  track?: InterviewTrack;
}

export function useSessionCatalog({
  initialQuestion,
  initialQuestionsList,
  track
}: UseSessionCatalogProps) {
  const [questionsList, setQuestionsList] = useState<GenerateQuestionResponse[]>(() => {
    if (initialQuestionsList && initialQuestionsList.length > 0) {
      return initialQuestionsList;
    }
    return [initialQuestion];
  });

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionStatusMap, setQuestionStatusMap] = useState<Record<string, QuestionStatus>>(() => ({
    [initialQuestion.slug || 'current']: 'UNTOUCHED'
  }));

  const activeQuestion = questionsList[activeQuestionIndex] || initialQuestion;

  useEffect(() => {
    if (!track) return;
    let isCancelled = false;

    const fetchTrackCatalog = async () => {
      setIsLoadingQuestions(true);
      try {
        const fetched = await listQuestions({ track });
        if (isCancelled) return;

        if (Array.isArray(fetched) && fetched.length > 0) {
          const filtered = fetched.filter((q) => !q.track || q.track === track);
          if (filtered.length > 0) {
            setQuestionsList(filtered);
            const foundIdx = filtered.findIndex((q) => q.slug === initialQuestion.slug);
            setActiveQuestionIndex(foundIdx >= 0 ? foundIdx : 0);
            return;
          }
        }

        if (initialQuestion.track === track) {
          setQuestionsList([initialQuestion]);
        } else {
          setQuestionsList([]);
        }
      } catch (err) {
        console.warn(`[useSessionCatalog] Could not load catalog for track ${track}:`, err);
        if (initialQuestion.track === track) {
          setQuestionsList([initialQuestion]);
        } else {
          setQuestionsList([]);
        }
      } finally {
        if (!isCancelled) setIsLoadingQuestions(false);
      }
    };

    void fetchTrackCatalog();

    return () => {
      isCancelled = true;
    };
  }, [track, initialQuestion]);

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
