/**
 * Pure URL routing helpers for Session & Room navigation (SPEC-007 §3 F-3).
 */

export function buildRoomUrl(sessionId: number | string): string {
  return `/session/${sessionId}`;
}

export function resolvePopStateView(
  pathname: string,
  activeSessionId?: number | null
): 'ROOM' | 'DASHBOARD' | 'LEARN' | 'SETUP' {
  if (pathname.startsWith('/session/')) {
    return activeSessionId ? 'ROOM' : 'SETUP';
  }
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard')) {
    return 'DASHBOARD';
  }
  if (pathname === '/learn' || pathname.startsWith('/learn')) {
    return 'LEARN';
  }
  return 'SETUP';
}
