import { useEffect } from 'react';

export const LEAVE_WARNING_MESSAGE = 'You are leaving an active interview session. Progress will still be recorded.';

export function isLeaveGuardActive(
  sessionMode?: string,
  sessionStatus?: string,
  isArenaMounted = true
): boolean {
  return sessionMode === 'INTERVIEW' && sessionStatus === 'IN_PROGRESS' && isArenaMounted;
}

export function useLeaveGuard(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = LEAVE_WARNING_MESSAGE;
      return LEAVE_WARNING_MESSAGE;
    };

    const handlePopState = () => {
      const leave = window.confirm(LEAVE_WARNING_MESSAGE);
      if (!leave) {
        try {
          window.history.pushState(null, '', window.location.href);
        } catch {}
      }
    };

    try {
      window.history.pushState(null, '', window.location.href);
    } catch {}

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [enabled]);
}
