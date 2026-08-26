import React, { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { GenerateQuestionResponse } from '../../../types';
import { TestcasePanel, type TestCaseItem, type ExecutionResult } from '../../ide/TestcasePanel';
import { StatusBar } from '../../ide/StatusBar';
import { defineMonacoThemes } from '../../../lib/syntax-themes';
import { useTheme } from '../../theme-provider';
import { Code2, Play, CheckCircle2 } from 'lucide-react';
import { Button } from '../../ui/Button';

interface DsaScreenProps {
  sessionId: number;
  question: GenerateQuestionResponse;
  code: string;
  onChangeCode: (val: string) => void;
  language: string;
  onChangeLanguage: (lang: string) => void;
  onRunCode: () => Promise<void>;
  onSubmitSolution: () => Promise<void>;
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  isPlayground?: boolean;
}

export const DsaScreen: React.FC<DsaScreenProps> = ({
  question,
  code,
  onChangeCode,
  language,
  onChangeLanguage,
  onRunCode,
  onSubmitSolution,
  isExecuting,
  executionResult
}) => {
  const { resolvedTheme } = useTheme();
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  const [customCases, setCustomCases] = useState<TestCaseItem[]>([]);

  const sampleTestItems: TestCaseItem[] = useMemo(() => {
    return (question.sampleTests || []).map((t, idx) => ({
      id: idx + 1,
      input: t.input || '',
      expectedOutput: t.expectedOutput || ''
    }));
  }, [question.sampleTests]);

  const allTestCases = useMemo(() => {
    return [...sampleTestItems, ...customCases];
  }, [sampleTestItems, customCases]);

  const monacoLanguage = useMemo(() => {
    const l = language.toLowerCase();
    if (l === 'python') return 'python';
    if (l === 'javascript') return 'javascript';
    if (l === 'cpp') return 'cpp';
    return 'java';
  }, [language]);

  const ext = useMemo(() => {
    if (monacoLanguage === 'python') return 'py';
    if (monacoLanguage === 'javascript') return 'js';
    if (monacoLanguage === 'cpp') return 'cpp';
    return 'java';
  }, [monacoLanguage]);

  const getMonacoTheme = (themeId: string) => {
    if (themeId === 'ide-slate') return 'ide-slate';
    if (themeId === 'ide-paper') return 'ide-paper';
    if (themeId === 'deep-ocean') return 'deep-ocean';
    if (themeId === 'material-oceanic') return 'material-oceanic';
    if (themeId === 'warm-charcoal') return 'warm-charcoal';
    return 'vs-dark';
  };

  return (
    <Group orientation="vertical" id="dsa-arena-v" className="h-full w-full flex-1 min-w-0">
      {/* Code Editor Surface */}
      <Panel defaultSize="62%" minSize="25%" id="dsa-editor-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col h-full bg-bg overflow-hidden relative">
          {/* Editor Header Bar */}
          <div className="h-9 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated text-xs font-semibold text-text border border-border">
                <Code2 className="w-3.5 h-3.5 text-primary" />
                <span>Solution.{ext}</span>
              </div>

              <select
                value={language}
                onChange={(e) => onChangeLanguage(e.target.value)}
                className="bg-surface border border-border rounded px-2 py-0.5 text-xs text-text focus:outline-none focus:border-primary font-mono cursor-pointer"
              >
                <option value="java">Java (OpenJDK 21)</option>
                <option value="python">Python (3.11)</option>
                <option value="cpp">C++ (GCC 13)</option>
                <option value="javascript">JavaScript (Node 20)</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void onRunCode()}
                disabled={isExecuting}
                className="h-7 text-xs px-2.5"
              >
                <Play className="w-3 h-3 mr-1 text-success fill-success" />
                <span>{isExecuting ? 'Running…' : 'Run Tests'}</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => void onSubmitSolution()}
                disabled={isExecuting}
                className="h-7 text-xs px-3"
              >
                <CheckCircle2 className="w-3 h-3 mr-1" />
                <span>Submit</span>
              </Button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 relative overflow-hidden bg-surface">
            <Editor
              height="100%"
              language={monacoLanguage}
              theme={getMonacoTheme(resolvedTheme)}
              beforeMount={defineMonacoThemes}
              value={code}
              onChange={(val) => onChangeCode(val || '')}
              onMount={(editor) => {
                editor.onDidChangeCursorPosition((e) => {
                  setCursor({ ln: e.position.lineNumber, col: e.position.column });
                });
              }}
              options={{
                fontSize: 13.5,
                minimap: { enabled: false },
                fontFamily: "var(--font-mono), 'JetBrains Mono', monospace",
                automaticLayout: true,
                tabSize: 4,
                scrollBeyondLastLine: false,
                lineNumbersMinChars: 3
              }}
            />
          </div>

          <StatusBar ln={cursor.ln} col={cursor.col} language={language} />
        </div>
      </Panel>

      <Separator className="h-1 bg-border/60 hover:bg-primary/60 transition-colors cursor-row-resize relative flex items-center justify-center z-10 select-none">
        <div className="h-0.5 w-6 bg-text-3/40 rounded-full" />
      </Separator>

      {/* Testcase Results & Submissions Panel */}
      <Panel defaultSize="38%" minSize="15%" maxSize="75%" id="dsa-testcase-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
        <TestcasePanel
          testCases={allTestCases}
          executionResult={executionResult}
          onAddCustomCase={(input, expected) => {
            setCustomCases((prev) => [
              ...prev,
              { id: Date.now(), input, expectedOutput: expected }
            ]);
          }}
          onDeleteCase={(idx) => {
            const sampleLen = sampleTestItems.length;
            if (idx >= sampleLen) {
              setCustomCases((prev) => prev.filter((_, i) => i !== idx - sampleLen));
            }
          }}
        />
      </Panel>
    </Group>
  );
};
