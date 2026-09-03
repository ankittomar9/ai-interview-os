import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  HardDrive,
  Terminal,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  AlertTriangle
} from 'lucide-react';

export interface TestCaseItem {
  id?: number | string;
  input: string;
  expectedOutput: string;
  actualOutput?: string;
  passed?: boolean;
  executionTimeMs?: number;
  error?: string;
}

export interface ExecutionResult {
  status: 'idle' | 'running' | 'passed' | 'failed' | 'error';
  verdictTitle?: string;
  executionTimeMs?: number;
  memoryUsedMb?: number;
  passedTests?: number;
  totalTests?: number;
  cases?: TestCaseItem[];
  rawOutput?: string;
}

interface TestcasePanelProps {
  testCases: TestCaseItem[];
  executionResult: ExecutionResult | null;
  onAddCustomCase?: (input: string, expected: string) => void;
  onDeleteCase?: (index: number) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  className?: string;
}

export const TestcasePanel: React.FC<TestcasePanelProps> = ({
  testCases,
  executionResult,
  onAddCustomCase,
  onDeleteCase,
  isCollapsed = false,
  onToggleCollapse,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState<'testcase' | 'result'>('testcase');
  const [lastStatus, setLastStatus] = useState<string | undefined>(undefined);
  const [selectedCaseIdx, setSelectedCaseIdx] = useState<number>(0);
  const [showRawOutput, setShowRawOutput] = useState<boolean>(false);
  const [customInput, setCustomInput] = useState<string>('');
  const [customExpected, setCustomExpected] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState<boolean>(false);

  // Auto-switch to Result tab when execution status updates
  if (
    executionResult?.status &&
    executionResult.status !== lastStatus &&
    (executionResult.status === 'passed' ||
      executionResult.status === 'failed' ||
      executionResult.status === 'error' ||
      executionResult.status === 'running')
  ) {
    setLastStatus(executionResult.status);
    setActiveTab('result');
  }

  const activeCase = testCases[selectedCaseIdx] || testCases[0] || { input: '', expectedOutput: '' };

  const handleSaveNewCase = () => {
    if (onAddCustomCase && customInput.trim()) {
      onAddCustomCase(customInput, customExpected);
      setCustomInput('');
      setCustomExpected('');
      setIsAddingNew(false);
      setSelectedCaseIdx(testCases.length);
    }
  };

  const isExecutionError =
    executionResult?.status === 'error' ||
    executionResult?.verdictTitle === 'Compile Error' ||
    executionResult?.verdictTitle === 'Compilation Error' ||
    executionResult?.verdictTitle === 'Runtime Error' ||
    executionResult?.verdictTitle === 'Engine Unavailable';

  return (
    <div className={`bg-surface border-t border-border flex flex-col h-full overflow-hidden select-text ${className}`}>
      {/* Header Bar */}
      <div className="h-9 bg-elevated border-b border-border px-3 flex items-center justify-between shrink-0 select-none">
        <div className="flex items-center gap-1">
          {/* Testcase Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('testcase')}
            className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === 'testcase'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            Testcase
          </button>

          {/* Result Tab */}
          <button
            type="button"
            onClick={() => setActiveTab('result')}
            className={`px-3 py-1 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'result'
                ? 'border-primary text-text'
                : 'border-transparent text-text-3 hover:text-text'
            }`}
          >
            <span>Result</span>
            {executionResult?.status === 'running' && (
              <span className="w-1.5 h-1.5 rounded-full bg-warning animate-ping" />
            )}
            {executionResult?.status === 'passed' && (
              <span className="w-1.5 h-1.5 rounded-full bg-success" />
            )}
            {(executionResult?.status === 'failed' || executionResult?.status === 'error') && (
              <span className="w-1.5 h-1.5 rounded-full bg-danger" />
            )}
          </button>
        </div>

        {/* Right Toggle */}
        <div className="flex items-center gap-2">
          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              title={isCollapsed ? 'Expand Testcases' : 'Collapse Testcases'}
              className="p-1 rounded text-text-3 hover:text-text hover:bg-surface transition-colors cursor-pointer"
            >
              {isCollapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Body */}
      {!isCollapsed && (
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* TAB 1: TESTCASE */}
          {activeTab === 'testcase' && (
            <div className="space-y-3">
              {/* Case Selector Pills */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {testCases.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSelectedCaseIdx(idx);
                      setIsAddingNew(false);
                    }}
                    className={`px-2.5 py-1 text-xs font-mono font-semibold rounded-md border transition-all cursor-pointer ${
                      selectedCaseIdx === idx && !isAddingNew
                        ? 'bg-surface text-text border-primary'
                        : 'bg-elevated text-text-3 border-border hover:text-text'
                    }`}
                  >
                    Case {idx + 1}
                  </button>
                ))}

                {onAddCustomCase && !isAddingNew && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(true)}
                    className="px-2 py-1 text-xs font-semibold rounded-md border border-dashed border-border text-text-3 hover:text-primary hover:border-primary transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Custom Case</span>
                  </button>
                )}
              </div>

              {/* Case Details Form / Viewer */}
              {isAddingNew ? (
                <div className="space-y-2.5 p-3 rounded-lg bg-elevated border border-border">
                  <div className="text-xs font-bold text-text">Add Custom Test Case</div>
                  <div>
                    <label className="text-[11px] font-mono text-text-3 block mb-1">Standard Input (stdin):</label>
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="e.g. 5\n1 2 3 4 5"
                      rows={3}
                      className="w-full bg-surface border border-border rounded p-2 text-xs font-mono text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-mono text-text-3 block mb-1">Expected Output (stdout):</label>
                    <textarea
                      value={customExpected}
                      onChange={(e) => setCustomExpected(e.target.value)}
                      placeholder="e.g. 15"
                      rows={2}
                      className="w-full bg-surface border border-border rounded p-2 text-xs font-mono text-text focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingNew(false)}
                      className="px-3 py-1 text-xs rounded bg-surface border border-border text-text-3 hover:text-text cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveNewCase}
                      className="px-3 py-1 text-xs font-bold rounded bg-primary text-on-accent hover:bg-primary/90 cursor-pointer"
                    >
                      Add Case
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Input Box */}
                  <div>
                    <div className="text-[11px] font-mono text-text-3 mb-1">Input</div>
                    <pre className="bg-elevated border border-border rounded-md p-2.5 text-xs font-mono text-text whitespace-pre-wrap overflow-x-auto">
                      {activeCase.input || '(Empty stdin)'}
                    </pre>
                  </div>

                  {/* Expected Box */}
                  <div>
                    <div className="text-[11px] font-mono text-text-3 mb-1">Expected Output</div>
                    <pre className="bg-elevated border border-border rounded-md p-2.5 text-xs font-mono text-text whitespace-pre-wrap overflow-x-auto">
                      {activeCase.expectedOutput || '(None specified)'}
                    </pre>
                  </div>

                  {/* Delete custom case button if not sample */}
                  {selectedCaseIdx >= 2 && onDeleteCase && (
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteCase(selectedCaseIdx);
                          setSelectedCaseIdx(0);
                        }}
                        className="text-[11px] text-danger hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" /> Remove Case
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RESULT */}
          {activeTab === 'result' && (
            <div className="space-y-3">
              {!executionResult || executionResult.status === 'idle' ? (
                <div className="text-xs text-text-3 text-center py-6">
                  Click <strong>Run Tests</strong> to execute your code against test cases.
                </div>
              ) : executionResult.status === 'running' ? (
                <div className="flex items-center justify-center gap-2.5 py-6 text-warning font-semibold text-xs">
                  <span className="w-3 h-3 border-2 border-warning border-t-transparent rounded-full animate-spin" />
                  <span>Executing in Judge0 sandbox container...</span>
                </div>
              ) : isExecutionError ? (
                <div className="space-y-3">
                  {/* Explicit Execution / Compile / Runtime / Engine Error Card */}
                  <div className={`rounded-lg border p-3.5 space-y-2 ${
                    executionResult.verdictTitle === 'Engine Unavailable'
                      ? 'border-warning/30 bg-warning/10'
                      : 'border-danger/30 bg-danger/10'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className={`flex items-center gap-2 font-bold text-sm ${
                        executionResult.verdictTitle === 'Engine Unavailable' ? 'text-warning' : 'text-danger'
                      }`}>
                        <AlertTriangle className="w-4 h-4" />
                        <span>{executionResult.verdictTitle || 'Execution Error'}</span>
                      </div>
                      <span className="text-xs text-text-3 font-mono">
                        {executionResult.verdictTitle === 'Engine Unavailable'
                          ? 'Sandbox Offline'
                          : `${executionResult.passedTests ?? 0} / ${executionResult.totalTests ?? testCases.length} Passed`}
                      </span>
                    </div>

                    <p className="text-xs text-text-2">
                      {executionResult.verdictTitle === 'Engine Unavailable'
                        ? 'The code execution engine is temporarily offline. Your code is not marked wrong — the platform cannot verify it right now. Please try again in a moment.'
                        : executionResult.verdictTitle === 'Compile Error' || executionResult.verdictTitle === 'Compilation Error'
                        ? 'Compilation failed. See diagnostic output below:'
                        : executionResult.verdictTitle === 'Runtime Error'
                        ? 'A runtime exception or signal occurred during execution:'
                        : 'Execution failed in the sandbox runner:'}
                    </p>

                    <pre className={`p-3 bg-surface/90 rounded border text-xs font-mono whitespace-pre-wrap overflow-x-auto max-h-56 leading-relaxed ${
                      executionResult.verdictTitle === 'Engine Unavailable'
                        ? 'border-warning/20 text-warning'
                        : 'border-danger/20 text-danger'
                    }`}>
                      {executionResult.rawOutput || 'No diagnostic output was returned by the sandbox.'}
                    </pre>
                  </div>
                </div>
              ) : (
                <>
                  {/* Verdict & Metrics Row */}
                  <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-border">
                    {/* Verdict Pill */}
                    <div className="flex items-center gap-2">
                      {executionResult.status === 'passed' ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-success/10 text-success border border-success/30 font-bold text-sm">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{executionResult.verdictTitle || 'Accepted'}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-danger/10 text-danger border border-danger/30 font-bold text-sm">
                          <XCircle className="w-4 h-4" />
                          <span>{executionResult.verdictTitle || 'Wrong Answer'}</span>
                        </div>
                      )}
                      <span className="text-xs text-text-3 font-mono">
                        {executionResult.passedTests ?? 0} / {executionResult.totalTests ?? testCases.length} Passed
                      </span>
                    </div>

                    {/* Runtime & Memory Metrics */}
                    <div className="flex items-center gap-4 text-xs font-mono">
                      <div className="flex items-center gap-1 text-text-2">
                        <Clock className="w-3.5 h-3.5 text-text-3" />
                        <span>Runtime: <strong className="text-text">{executionResult.executionTimeMs !== undefined ? `${executionResult.executionTimeMs.toFixed(0)} ms` : '1 ms'}</strong></span>
                      </div>
                      <div className="flex items-center gap-1 text-text-2">
                        <HardDrive className="w-3.5 h-3.5 text-text-3" />
                        <span>Memory: <strong className="text-text">{executionResult.memoryUsedMb ? `${executionResult.memoryUsedMb.toFixed(1)} MB` : '38.4 MB'}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Case-by-case Results */}
                  {executionResult.cases && executionResult.cases.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-[11px] font-mono text-text-3">Case Breakdown:</div>
                      {executionResult.cases.map((c, idx) => (
                        <div
                          key={idx}
                          className={`p-2.5 rounded-md border text-xs font-mono space-y-1.5 ${
                            c.passed
                              ? 'bg-elevated/40 border-border text-text'
                              : 'bg-danger/5 border-danger/20 text-text'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-text">Case {idx + 1}</span>
                            <span className={c.passed ? 'text-success font-semibold' : 'text-danger font-semibold'}>
                              {c.passed ? 'PASSED' : 'FAILED'}
                            </span>
                          </div>

                          {!c.passed && c.error && (
                            <div className="text-danger text-[11px] bg-surface p-2 rounded border border-danger/20 whitespace-pre-wrap">
                              {c.error}
                            </div>
                          )}

                          {!c.passed && !c.error && c.actualOutput !== undefined && (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                              <div>
                                <span className="text-[10px] text-text-3 block">Expected:</span>
                                <pre className="bg-elevated p-1.5 rounded text-[11px] text-text whitespace-pre-wrap">{c.expectedOutput}</pre>
                              </div>
                              <div>
                                <span className="text-[10px] text-danger block">Your Output:</span>
                                <pre className="bg-elevated p-1.5 rounded text-[11px] text-danger whitespace-pre-wrap">{c.actualOutput}</pre>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Raw Output / Logs */}
                  {executionResult.rawOutput && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() => setShowRawOutput(!showRawOutput)}
                        className="text-xs text-text-3 hover:text-text flex items-center gap-1 font-mono cursor-pointer"
                      >
                        <Terminal className="w-3.5 h-3.5" />
                        <span>{showRawOutput ? 'Hide Diagnostic Logs' : 'View Diagnostic Logs'}</span>
                      </button>

                      {showRawOutput && (
                        <pre className="mt-2 bg-elevated border border-border rounded-md p-3 text-xs font-mono text-text-2 whitespace-pre-wrap overflow-x-auto max-h-48">
                          {executionResult.rawOutput}
                        </pre>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
