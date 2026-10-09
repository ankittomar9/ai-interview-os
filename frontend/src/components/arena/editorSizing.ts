export type EditorSize = 'split' | 'expanded' | 'fullscreen';

export const getEditorSizingStorageKey = (screenKey: string): string =>
  `interviewos.editorSizing.${screenKey}`;

export function getStoredEditorSize(screenKey: string): EditorSize {
  if (typeof window === 'undefined' || !window.localStorage) return 'split';
  try {
    const stored = window.localStorage.getItem(getEditorSizingStorageKey(screenKey));
    if (stored === 'split' || stored === 'expanded' || stored === 'fullscreen') {
      return stored;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'split';
}

export function setStoredEditorSize(screenKey: string, size: EditorSize): void {
  if (typeof window === 'undefined' || !window.localStorage) return;
  try {
    window.localStorage.setItem(getEditorSizingStorageKey(screenKey), size);
  } catch {
    // Ignore storage access errors
  }
}

export function getNextEditorSize(current: EditorSize): EditorSize {
  switch (current) {
    case 'split':
      return 'expanded';
    case 'expanded':
      return 'fullscreen';
    case 'fullscreen':
      return 'split';
    default:
      return 'split';
  }
}

export function getEditorSizeTooltip(size: EditorSize): string {
  switch (size) {
    case 'split':
      return 'Expand Editor (collapse testcases)';
    case 'expanded':
      return 'Fullscreen Editor (Zen mode)';
    case 'fullscreen':
      return 'Restore Split View';
    default:
      return 'Cycle Editor Size';
  }
}

export function getEditorSizeLabel(size: EditorSize): string {
  switch (size) {
    case 'split':
      return 'Split';
    case 'expanded':
      return 'Expanded';
    case 'fullscreen':
      return 'Fullscreen';
    default:
      return 'Split';
  }
}
