export interface NavigationGateResult {
  allowed: boolean;
  isLocked: boolean;
  isReviewing: boolean;
  reason?: string;
  tooltip?: string;
}

export function evaluateNavigationGate(
  targetIndex: number,
  activeIndex: number,
  isPlayground = false,
  currentRoundLabel = 'current round'
): NavigationGateResult {
  if (isPlayground) {
    return { allowed: true, isLocked: false, isReviewing: false };
  }
  if (targetIndex <= activeIndex) {
    return {
      allowed: true,
      isLocked: false,
      isReviewing: targetIndex < activeIndex,
      tooltip: targetIndex < activeIndex ? 'Reviewing — round closed' : undefined
    };
  }
  if (targetIndex === activeIndex + 1) {
    return { allowed: true, isLocked: false, isReviewing: false };
  }
  return {
    allowed: false,
    isLocked: true,
    isReviewing: false,
    reason: `Finish ${currentRoundLabel} first — or end the round early`,
    tooltip: `Finish ${currentRoundLabel} first — or end the round early`
  };
}

export function canNavigateToSection(
  targetIndex: number,
  activeIndex: number,
  isPlayground = false
): boolean {
  return evaluateNavigationGate(targetIndex, activeIndex, isPlayground).allowed;
}

export function assertCanNavigate(
  targetIndex: number,
  activeIndex: number,
  isPlayground = false
): void {
  const res = evaluateNavigationGate(targetIndex, activeIndex, isPlayground);
  if (!res.allowed) {
    throw new Error(res.reason || 'Navigation locked');
  }
}
