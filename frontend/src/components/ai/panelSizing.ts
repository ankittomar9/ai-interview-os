export type CoachPanelSize = 'normal' | 'wide' | 'fullscreen';

export const PANEL_SIZE_STORAGE_KEY = 'ai.coach.panelSize';

export function getStoredPanelSize(): CoachPanelSize {
  if (typeof window === 'undefined' || !window.localStorage) return 'normal';
  try {
    const stored = window.localStorage.getItem(PANEL_SIZE_STORAGE_KEY);
    if (stored === 'wide' || stored === 'fullscreen' || stored === 'normal') {
      return stored;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'normal';
}

export function setStoredPanelSize(size: CoachPanelSize): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(PANEL_SIZE_STORAGE_KEY, size);
  } catch {
    // Ignore storage access errors
  }
}

export function getNextPanelSize(current: CoachPanelSize): CoachPanelSize {
  switch (current) {
    case 'normal':
      return 'wide';
    case 'wide':
      return 'fullscreen';
    case 'fullscreen':
      return 'normal';
    default:
      return 'normal';
  }
}

export function panelSizeClass(state: CoachPanelSize): string {
  switch (state) {
    case 'wide':
      return 'w-[90vw] sm:w-[720px] max-w-[90vw] max-h-[88vh] h-[85vh]';
    case 'fullscreen':
      return 'fixed inset-4 sm:inset-6 w-auto h-auto max-w-none max-h-none z-50';
    case 'normal':
    default:
      return 'w-[360px] sm:w-[380px] max-h-[70vh]';
  }
}
