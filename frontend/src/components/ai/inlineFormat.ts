export type InlineSegmentType = 'text' | 'code' | 'math' | 'fence';

export interface InlineSegment {
  type: InlineSegmentType;
  value: string;
  language?: string;
}

/**
 * Pure parsing of AI assistant response text into structured segments.
 * Follows SPEC-010 R-k rules:
 * 1. Fenced ``` blocks first.
 * 2. $...$ pairs inside text -> math segment (dollars stripped, content verbatim, no character substitution).
 * 3. `...` backtick spans -> code segment.
 * 4. Unmatched delimiters and empty bodies render literally as text.
 */
export function parseInlineFormat(text: string): InlineSegment[] {
  if (!text) return [];

  const segments: InlineSegment[] = [];

  // 1. Split on ``` fenced blocks first
  // Matches ```lang\n...``` or ```\n...``` or ```...```
  const fenceRegex = /```([a-zA-Z0-9_-]*)\r?\n?([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = fenceRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textBefore = text.slice(lastIndex, match.index);
      segments.push(...parseInlineMathAndCode(textBefore));
    }

    const lang = match[1]?.trim() || undefined;
    const code = match[2];
    segments.push({
      type: 'fence',
      value: code,
      language: lang
    });

    lastIndex = fenceRegex.lastIndex;
  }

  if (lastIndex < text.length) {
    const textRemaining = text.slice(lastIndex);
    segments.push(...parseInlineMathAndCode(textRemaining));
  }

  return segments;
}

/**
 * Parses inline math ($...$) and code (`...`) spans.
 * Unmatched delimiters and empty bodies ($$, ``) remain verbatim text.
 */
function parseInlineMathAndCode(text: string): InlineSegment[] {
  const segments: InlineSegment[] = [];
  // Token regex matches:
  // Group 2: $$...$$ (double math)
  // Group 3: $...$ (inline math, non-empty, non-newline, not surrounded by whitespace)
  // Group 4: `...` (inline code, non-empty, non-newline)
  const tokenRegex = /(\$\$(.+?)\$\$|\$([^\$\s\n](?:[^\$\n]*?[^\$\s\n])?)\$|`([^`\n]+?)`)/g;
  let lastIdx = 0;
  let m: RegExpExecArray | null;

  while ((m = tokenRegex.exec(text)) !== null) {
    if (m.index > lastIdx) {
      segments.push({
        type: 'text',
        value: text.slice(lastIdx, m.index)
      });
    }

    if (m[2] !== undefined) {
      // Double dollar $$...$$
      segments.push({
        type: 'math',
        value: m[2]
      });
    } else if (m[3] !== undefined) {
      // Single dollar $...$
      segments.push({
        type: 'math',
        value: m[3]
      });
    } else if (m[4] !== undefined) {
      // Inline backtick `...`
      segments.push({
        type: 'code',
        value: m[4]
      });
    }

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < text.length) {
    segments.push({
      type: 'text',
      value: text.slice(lastIdx)
    });
  }

  return segments;
}
