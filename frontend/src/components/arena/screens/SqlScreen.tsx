import React, { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import { Group, Panel, Separator } from 'react-resizable-panels';
import type { GenerateQuestionResponse } from '../../../types';
import { TestcasePanel, type TestCaseItem, type ExecutionResult } from '../../ide/TestcasePanel';
import { StatusBar } from '../../ide/StatusBar';
import { defineMonacoThemes } from '../../../lib/syntax-themes';
import { useTheme } from '../../theme-provider';
import { Database, Play, CheckCircle2, Table2 } from 'lucide-react';
import { Button } from '../../ui/Button';

interface SqlScreenProps {
  sessionId: number;
  question: GenerateQuestionResponse;
  code: string;
  onChangeCode: (val: string) => void;
  onRunCode: () => Promise<void>;
  onSubmitSolution: () => Promise<void>;
  isExecuting: boolean;
  executionResult: ExecutionResult | null;
  isPlayground?: boolean;
  onNextQuestion?: () => void;
  onNextStage?: () => void;
}

export const SqlScreen: React.FC<SqlScreenProps> = ({
  question,
  code,
  onChangeCode,
  onRunCode,
  onSubmitSolution,
  isExecuting,
  executionResult,
  isPlayground,
  onNextQuestion,
  onNextStage
}) => {
  const { resolvedTheme } = useTheme();
  const [cursor, setCursor] = useState({ ln: 1, col: 1 });
  const [activeTab, setActiveTab] = useState<'editor' | 'schema'>('editor');
  const [customCases, setCustomCases] = useState<TestCaseItem[]>([]);

  const sampleTestItems: TestCaseItem[] = useMemo(() => {
    return (question.sampleTests || []).map((t, idx) => ({
      id: idx + 1,
      input: t.input || 'SELECT Query',
      expectedOutput: t.expectedOutput || ''
    }));
  }, [question.sampleTests]);

  const allTestCases = useMemo(() => {
    return [...sampleTestItems, ...customCases];
  }, [sampleTestItems, customCases]);

  const getMonacoTheme = (themeId: string) => {
    if (themeId === 'ide-slate') return 'ide-slate';
    if (themeId === 'ide-paper') return 'ide-paper';
    if (themeId === 'deep-ocean') return 'deep-ocean';
    if (themeId === 'material-oceanic') return 'material-oceanic';
    if (themeId === 'warm-charcoal') return 'warm-charcoal';
    return 'vs-dark';
  };

  return (
    <Group orientation="vertical" id="sql-arena-v" className="h-full w-full flex-1 min-w-0">
      {/* SQL Editor Surface */}
      <Panel defaultSize="60%" minSize="25%" id="sql-editor-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
        <div className="flex flex-col h-full bg-bg overflow-hidden relative">
          {/* SQL Header Bar */}
          <div className="h-9 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-elevated text-xs font-semibold text-text border border-border">
                <Database className="w-3.5 h-3.5 text-primary" />
                <span>Solution.sql</span>
              </div>

              <div className="hidden sm:flex items-center gap-1 text-[11px] font-mono text-text-3 px-1.5 py-0.5 rounded bg-surface border border-border/60">
                <span>PostgreSQL 16</span>
              </div>

              <div className="flex items-center gap-1 ml-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('editor')}
                  className={`px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                    activeTab === 'editor' ? 'bg-elevated text-text font-semibold' : 'text-text-3 hover:text-text'
                  }`}
                >
                  Query Editor
                </button>
                {(question.setupSql || question.schemaMarkdown) && (
                  <button
                    type="button"
                    onClick={() => setActiveTab('schema')}
                    className={`flex items-center gap-1 px-2 py-0.5 text-xs rounded transition-colors cursor-pointer ${
                      activeTab === 'schema' ? 'bg-elevated text-text font-semibold' : 'text-text-3 hover:text-text'
                    }`}
                  >
                    <Table2 className="w-3 h-3 text-primary" />
                    <span>Schema DDL</span>
                  </button>
                )}
              </div>
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
                <span>{isExecuting ? 'Executing…' : 'Run Query'}</span>
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

          {/* Monaco Editor Container / Schema Viewer */}
          <div className="flex-1 relative overflow-hidden bg-surface">
            {activeTab === 'editor' ? (
              <Editor
                height="100%"
                language="sql"
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
                  tabSize: 2,
                  scrollBeyondLastLine: false,
                  lineNumbersMinChars: 3
                }}
              />
            ) : (
              <div className="h-full overflow-y-auto p-4 bg-bg font-mono text-xs text-text space-y-2 select-text">
                <div className="text-xs font-bold text-primary mb-2 flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  <span>Database Schema &amp; Table Definitions</span>
                </div>
                <pre className="p-3 bg-elevated rounded-lg border border-border text-text leading-relaxed overflow-x-auto">
                  {question.setupSql || question.schemaMarkdown || '-- No custom DDL specified for this problem.'}
                </pre>
              </div>
            )}
          </div>

          <StatusBar ln={cursor.ln} col={cursor.col} language="sql" />
        </div>
      </Panel>

      <Separator className="h-1 bg-border/60 hover:bg-primary/60 transition-colors cursor-row-resize relative flex items-center justify-center z-10 select-none">
        <div className="h-0.5 w-6 bg-text-3/40 rounded-full" />
      </Separator>

      {/* SQL Query Result Tables & Execution Result Panel */}
      <Panel defaultSize="40%" minSize="15%" maxSize="75%" id="sql-testcase-panel" className="min-w-0 flex flex-col h-full overflow-hidden">
        {executionResult?.status === 'passed' && (
          <div className="bg-success/15 border-b border-success/30 px-3 py-1.5 flex items-center justify-between gap-2 text-xs shrink-0 select-none animate-in fade-in">
            <div className="flex items-center gap-1.5 font-bold text-success">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span>All tests passed.</span>
            </div>
            <div className="flex items-center gap-2">
              {isPlayground && onNextQuestion && (
                <Button variant="secondary" size="sm" onClick={onNextQuestion} className="h-6 text-[11px] px-2.5">
                  Next Question →
                </Button>
              )}
              {onNextStage && (
                <Button variant="primary" size="sm" onClick={onNextStage} className="h-6 text-[11px] px-2.5 font-bold">
                  Next Stage →
                </Button>
              )}
            </div>
          </div>
        )}
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
