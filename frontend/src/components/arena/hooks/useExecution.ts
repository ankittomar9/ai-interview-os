import { useState, useCallback } from 'react';
import type { GenerateQuestionResponse } from '../../../types';
import { executeCode, type ExecutionResultResponse } from '../../../services/api';
import { saveSubmission, type SubmissionRecord, type SubmissionStatus } from '../../../lib/submissions';
import type { ExecutionResult, TestCaseItem } from '../../ide/TestcasePanel';

interface UseExecutionProps {
  sessionId: number;
  activeQuestion: GenerateQuestionResponse;
  onCodeRunRecorded?: () => void;
}

export function useExecution({
  sessionId,
  activeQuestion,
  onCodeRunRecorded
}: UseExecutionProps) {
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [activeExecutionTab, setActiveExecutionTab] = useState<'testcases' | 'submissions'>('testcases');
  const [customInput, setCustomInput] = useState('');
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);

  const runCode = useCallback(async (code: string, language: string) => {
    setIsExecuting(true);
    setExecutionResult(null);

    const slug = activeQuestion.problemSlug || activeQuestion.slug || 'problem';
    try {
      const response: ExecutionResultResponse = await executeCode(sessionId, {
        language,
        codeSnippet: code,
        problemSlug: slug,
        submit: false
      });

      if (response.status === 'ENGINE_UNAVAILABLE') {
        const unavailableResult: ExecutionResult = {
          status: 'error',
          verdictTitle: 'Engine Unavailable',
          executionTimeMs: 0,
          memoryUsedMb: 0,
          passedTests: 0,
          totalTests: response.totalTests || 0,
          cases: [],
          rawOutput: response.stderr || 'The code execution engine is temporarily offline. Your code is not marked wrong — the platform cannot verify it right now. Please try again in a moment.'
        };
        setExecutionResult(unavailableResult);
        return unavailableResult;
      }

      const passed = response.status === 'PASSED' || response.status === 'ACCEPTED';
      let status: 'passed' | 'failed' | 'error' = 'failed';
      let verdictTitle = 'Wrong Answer';

      if (passed) {
        status = 'passed';
        verdictTitle = 'Accepted';
      } else if (response.status === 'COMPILE_ERROR' || response.status === 'SYNTAX_ERROR') {
        status = 'error';
        verdictTitle = 'Compile Error';
      } else if (response.status === 'RUNTIME_ERROR') {
        status = 'error';
        verdictTitle = 'Runtime Error';
      } else if (response.status === 'TIMEOUT') {
        status = 'failed';
        verdictTitle = 'Time Limit Exceeded';
      } else if (response.status === 'MEMORY_EXCEEDED') {
        status = 'failed';
        verdictTitle = 'Memory Limit Exceeded';
      }

      const cases: TestCaseItem[] = (response.testResults || []).map((t, i) => ({
        id: i + 1,
        input: t.input || '',
        expectedOutput: t.expectedOutput || '',
        actualOutput: t.actualOutput || '',
        passed: t.status === 'PASS',
        executionTimeMs: t.durationMs,
        error: t.error
      }));

      const result: ExecutionResult = {
        status,
        verdictTitle,
        executionTimeMs: response.executionTimeMs || 0,
        memoryUsedMb: response.memoryUsedMb || 0,
        passedTests: response.passedTests || 0,
        totalTests: response.totalTests || 0,
        cases,
        rawOutput: response.stdout || response.stderr || response.compilerOutput || ''
      };

      setExecutionResult(result);
      return result;
    } catch (err: any) {
      const failedResult: ExecutionResult = {
        status: 'error',
        executionTimeMs: 0,
        rawOutput: err?.message || 'Execution error'
      };
      setExecutionResult(failedResult);
      return failedResult;
    } finally {
      setIsExecuting(false);
    }
  }, [sessionId, activeQuestion]);

  const submitSolution = useCallback(async (code: string, language: string) => {
    setIsExecuting(true);
    const slug = activeQuestion.problemSlug || activeQuestion.slug || 'problem';

    try {
      const response = await executeCode(sessionId, {
        language,
        codeSnippet: code,
        problemSlug: slug,
        submit: true
      });

      const passed = response.status === 'PASSED' || response.status === 'ACCEPTED';
      let subStatus: SubmissionStatus = 'Wrong Answer';
      if (passed) subStatus = 'Accepted';
      else if (response.status === 'ENGINE_UNAVAILABLE') subStatus = 'Engine Unavailable';
      else if (response.status === 'COMPILE_ERROR' || response.status === 'SYNTAX_ERROR') subStatus = 'Compile Error';
      else if (response.status === 'RUNTIME_ERROR') subStatus = 'Runtime Error';
      else if (response.status === 'TIMEOUT') subStatus = 'Time Limit Exceeded';
      else if (response.status === 'MEMORY_EXCEEDED') subStatus = 'Memory Limit Exceeded';

      const cases = (response.testResults || []).map((t) => ({
        name: t.name,
        passed: t.status === 'PASS',
        input: t.input,
        expectedOutput: t.expectedOutput,
        actualOutput: t.actualOutput,
        error: t.error,
        isHidden: t.isHidden
      }));

      const newSub = saveSubmission(sessionId, slug, {
        type: 'SUBMIT',
        language,
        status: subStatus,
        runtimeMs: response.executionTimeMs || 0,
        memoryMb: response.memoryUsedMb || 0,
        passedTests: response.passedTests || 0,
        totalTests: response.totalTests || 0,
        rawOutput: response.stdout || response.stderr,
        compilerOutput: response.compilerOutput,
        cases
      });

      setSubmissions((prev) => [newSub, ...prev]);
      setActiveExecutionTab('submissions');
      if (onCodeRunRecorded) onCodeRunRecorded();
      return newSub;
    } finally {
      setIsExecuting(false);
    }
  }, [sessionId, activeQuestion, onCodeRunRecorded]);

  const resetExecution = useCallback(() => {
    setExecutionResult(null);
  }, []);

  return {
    isExecuting,
    executionResult,
    activeExecutionTab,
    setActiveExecutionTab,
    customInput,
    setCustomInput,
    submissions,
    setSubmissions,
    runCode,
    submitSolution,
    resetExecution
  };
}
