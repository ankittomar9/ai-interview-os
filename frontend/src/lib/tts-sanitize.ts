/**
 * TTS Sanitizer for SpeechSynthesis
 * Strips emojis, pictographs, ZWJ sequences, variation selectors, skin tone modifiers,
 * markdown syntax chars, and code fences to ensure clean, natural speech audio.
 */

export function sanitizeTtsText(text: string): string {
  if (!text) return '';

  return text
    // 1. Remove code blocks completely (do not read raw code blocks out loud)
    .replace(/```[\s\S]*?```/g, ' ')
    // 2. Format Big-O complexity for clear speech pronunciation
    .replace(/\$?\bO\(\s*1\s*\)\$?/gi, 'O of 1')
    .replace(/\$?\bO\(\s*N\s*\\?log\s*N\s*\)\$?/gi, 'O of N log N')
    .replace(/\$?\bO\(\s*\\?log\s*N\s*\)\$?/gi, 'O of log N')
    .replace(/\$?\bO\(\s*N\^2\s*\)\$?/gi, 'O of N squared')
    .replace(/\$?\bO\(\s*N\^3\s*\)\$?/gi, 'O of N cubed')
    .replace(/\$?\bO\(\s*([A-Za-z0-9+\-*/\s]+)\s*\)\$?/g, 'O of $1')
    .replace(/\\log\b/g, 'log')
    .replace(/\\times\b/g, 'times')
    // 3. Clean markdown links: [link text](url) -> link text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // 4. Strip emoji / pictographic codepoints, flags, skin-tones
    // \p{Extended_Pictographic} covers modern emojis
    .replace(/\p{Extended_Pictographic}/gu, '')
    // Regional indicator symbols (flags: 1F1E6 - 1F1FF)
    .replace(/[\u{1F1E6}-\u{1F1FF}]/gu, '')
    // Skin tone modifiers (1F3FB - 1F3FF)
    .replace(/[\u{1F3FB}-\u{1F3FF}]/gu, '')
    // Variation selectors (FE00-FE0F) and zero-width/joiner characters (200B-200D, FEFF)
    .replace(/[\uFE00-\uFE0F\u200B-\u200D\uFEFF]/g, '')
    // 5. Strip markdown syntax symbols: *, #, `, _, ~, [, ], $, >, bullet points
    .replace(/[*#`_~\[\]$>]/g, '')
    // 6. Collapse whitespace and linebreaks into a single space
    .replace(/\s+/g, ' ')
    .trim();
}
