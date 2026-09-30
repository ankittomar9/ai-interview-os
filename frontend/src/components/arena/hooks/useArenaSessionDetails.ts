import { useState, useEffect, useCallback } from 'react';
import type { SectionGate, SessionPlan } from '../../../types';
import { getSession, getSessionResume } from '../../../services/api';
import { useLeaveGuard, isLeaveGuardActive } from '../../../hooks/useLeaveGuard';

interface UseArenaSessionDetailsProps {
  sessionId: number;
  sessionMode: 'INTERVIEW' | 'PLAYGROUND';
  plan?: SessionPlan;
}

export function useArenaSessionDetails({
  sessionId,
  sessionMode,
  plan
}: UseArenaSessionDetailsProps) {
  const isPlayground = sessionMode === 'PLAYGROUND';

  const [sectionGates, setSectionGates] = useState<SectionGate[]>(() => {
    if (isPlayground || !plan?.sections) return [];
    return plan.sections.map((s, idx) => ({
      index: idx,
      sectionType: s.sectionType,
      gateStatus:
        s.sectionType === 'DSA' || s.sectionType === 'LLD' || s.sectionType === 'SQL'
          ? 'LOCKED'
          : 'OPEN'
    }));
  });

  const [targetCompany, setTargetCompany] = useState<string | undefined>(undefined);
  const [jobDescription, setJobDescription] = useState<string | undefined>(undefined);
  const [resumeSummary, setResumeSummary] = useState<string | undefined>(undefined);
  const [sessionStatus, setSessionStatus] = useState<string>('IN_PROGRESS');

  useLeaveGuard(isLeaveGuardActive(sessionMode, sessionStatus, true));

  useEffect(() => {
    if (sessionId) {
      getSession(sessionId)
        .then((res) => {
          if (res.sectionGates && res.sectionGates.length > 0) {
            setSectionGates(res.sectionGates);
          }
          if (res.status) setSessionStatus(res.status);
          if (res.targetCompany) setTargetCompany(res.targetCompany);
          if (res.jobDescription) setJobDescription(res.jobDescription);
        })
        .catch((err) => console.warn('[ArenaRoom] Failed to fetch session:', err));

      getSessionResume(sessionId)
        .then((resDoc) => {
          if (resDoc?.summary) {
            setResumeSummary(resDoc.summary);
          }
        })
        .catch((err) => console.warn('[ArenaRoom] Failed to fetch session resume:', err));
    }
  }, [sessionId]);

  const handleAiTurnCompleted = useCallback(async () => {
    if (!isPlayground && sessionId) {
      try {
        const updated = await getSession(sessionId);
        if (updated.sectionGates && updated.sectionGates.length > 0) {
          setSectionGates(updated.sectionGates);
        }
      } catch (err) {
        console.warn('[ArenaRoom] Failed to refresh session gates after AI turn:', err);
      }
    }
  }, [isPlayground, sessionId]);

  return {
    sectionGates,
    targetCompany,
    jobDescription,
    resumeSummary,
    handleAiTurnCompleted
  };
}
