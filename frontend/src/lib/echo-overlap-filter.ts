/**
 * Pure word 5-gram overlap filter for detecting acoustic echo contamination in candidate turns.
 * SPEC-008 AC-1.1:
 * - Pure candidate text -> keep (false)
 * - Verbatim AI-reply substring -> drop (true)
 * - Partial overlap < 60% -> keep (false)
 * - Quoted short phrase < 8 words -> keep (false)
 */

export function extractWords(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function extract5Grams(words: string[]): string[] {
  if (words.length < 5) return [];
  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - 5; i++) {
    ngrams.push(words.slice(i, i + 5).join(' '));
  }
  return ngrams;
}

export function calculate5GramOverlapRatio(candidateText: string, referenceText: string): number {
  const candidateWords = extractWords(candidateText);
  if (candidateWords.length < 5) return 0;

  const candidate5Grams = extract5Grams(candidateWords);
  if (candidate5Grams.length === 0) return 0;

  const refWords = extractWords(referenceText);
  if (refWords.length < 5) return 0;

  const ref5GramsSet = new Set(extract5Grams(refWords));
  let matchCount = 0;

  for (const gram of candidate5Grams) {
    if (ref5GramsSet.has(gram)) {
      matchCount++;
    }
  }

  return matchCount / candidate5Grams.length;
}

export function isEchoOverlap(
  candidateText: string,
  referenceText: string,
  minWords = 8,
  threshold = 0.6
): boolean {
  if (!candidateText || !referenceText) return false;

  const candidateWords = extractWords(candidateText);
  if (candidateWords.length < minWords) {
    return false;
  }

  const ratio = calculate5GramOverlapRatio(candidateText, referenceText);
  return ratio >= threshold;
}
