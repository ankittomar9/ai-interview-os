import { describe, it } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

describe('AI Assistant Panel: Selection and Copy Support', () => {
  const panelPath = path.resolve(process.cwd(), 'src/components/ai/AiAssistantPanel.tsx');
  const panelSrc = fs.readFileSync(panelPath, 'utf-8');

  it('declares select-text on message scroll container and message cards', () => {
    assert.ok(
      panelSrc.includes('flex-1 min-h-0 overflow-y-auto p-3 space-y-3 text-xs select-text'),
      'AiAssistantPanel must declare select-text on the message scroll container'
    );
    assert.ok(
      panelSrc.includes('rounded-lg border text-xs leading-relaxed select-text'),
      'AiAssistantPanel must declare select-text on individual message bubbles'
    );
  });

  it('exports CodeBlock component with 1-click clipboard copy button and Copied! feedback', () => {
    assert.ok(
      panelSrc.includes('export const CodeBlock: React.FC<{ code: string; language?: string }>'),
      'AiAssistantPanel must export CodeBlock component'
    );
    assert.ok(
      panelSrc.includes('navigator.clipboard.writeText(code)'),
      'CodeBlock must copy code via navigator.clipboard.writeText'
    );
    assert.ok(
      panelSrc.includes('fallbackCopy(code)'),
      'CodeBlock must have fallback copy support'
    );
    assert.ok(
      panelSrc.includes('Copied!'),
      'CodeBlock must show Copied! confirmation'
    );
    assert.ok(
      panelSrc.includes('pre className="p-2.5 font-mono text-[11px] overflow-x-auto text-primary-2 whitespace-pre select-text"'),
      'CodeBlock pre element must be explicitly select-text'
    );
  });

  it('wires CodeBlock into AssistantMessageContent for fenced segments', () => {
    assert.ok(
      panelSrc.includes('<CodeBlock') && panelSrc.includes('code={segment.value}'),
      'AssistantMessageContent must render fenced code segments via CodeBlock'
    );
  });
});
