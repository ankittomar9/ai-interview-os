/**
 * SPEC-PLAN-2 A1: Speech salvage deduplication and merging utility.
 * Merges pending speech and interim continuation without fragment duplication.
 */
export function mergeSalvageText(pending: string, interim: string): string {
  const p = (pending || '').trim();
  const i = (interim || '').trim();

  if (!p) return i;
  if (!i) return p;

  const pLower = p.toLowerCase();
  const iLower = i.toLowerCase();

  // 1. Identical match or pending already ends with interim
  if (pLower === iLower || pLower.endsWith(iLower)) {
    return p;
  }

  // 2. Interim already starts with pending
  if (iLower.startsWith(pLower)) {
    return i;
  }

  // 3. Word-level suffix-prefix overlap deduplication
  const pWords = p.split(/\s+/);
  const iWords = i.split(/\s+/);

  const maxOverlap = Math.min(pWords.length, iWords.length);
  for (let len = maxOverlap; len > 0; len--) {
    const pSuffix = pWords.slice(pWords.length - len).map(normalizeWord).join(' ');
    const iPrefix = iWords.slice(0, len).map(normalizeWord).join(' ');

    if (pSuffix === iPrefix && pSuffix.length > 0) {
      const nonOverlappingInterim = iWords.slice(len).join(' ');
      return nonOverlappingInterim ? `${p} ${nonOverlappingInterim}` : p;
    }
  }

  return `${p} ${i}`;
}

function normalizeWord(word: string): string {
  return word.toLowerCase().replace(/[^\w\s]/g, '');
}
