import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Maximize2,
  Minimize2,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Code2
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { TestConsole } from '../ui/TestConsole';
import { ResizeHandle } from '../ui/ResizeHandle';
import { ProjectWorkspace } from '../ProjectWorkspace';
import {
  provisionWorkspace,
  executeProject,
  type ExecutionResultResponse
} from '../../services/api';

interface Props {
  sessionId: number;
  problemSlug: string;
  problemTitle?: string;
  starterFiles: Record<string, string>;
  editablePaths: string[];
  onSubmitProject?: (summary: string) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
}

type WorkspaceState = 'provisioning' | 'ready' | 'fallback' | 'error';

export const EmbeddedWorkspace: React.FC<Props> = ({
  sessionId,
  problemSlug,
  problemTitle = 'Spring Boot Microservice',
  starterFiles,
  editablePaths,
  onSubmitProject,
  isMaximized = false,
  onToggleMaximize
}) => {
  const [state, setState] = useState<WorkspaceState>('provisioning');
  const [workspaceUrl, setWorkspaceUrl] = useState<string | null>(null);
  const [volumeName, setVolumeName] = useState<string>(`ws_${sessionId}`);
  const [provisionStep, setProvisionStep] = useState<number>(1);
  const [forceMonaco, setForceMonaco] = useState<boolean>(false);

  // Test execution state
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(200);

  const isProvisionedRef = useRef(false);

  useEffect(() => {
    let isCancelled = false;

    const initWorkspace = async () => {
      if (isProvisionedRef.current) return;
      isProvisionedRef.current = true;
      setState('provisioning');
      setProvisionStep(1);

      try {
        const stepTimer1 = setTimeout(() => !isCancelled && setProvisionStep(2), 600);
        const stepTimer2 = setTimeout(() => !isCancelled && setProvisionStep(3), 1400);

        const response = await Promise.race([
          provisionWorkspace(sessionId, problemSlug),
          new Promise<never>((_, rej) =>
            setTimeout(() => rej(new Error('Workspace provisioning timed out (20s)')), 20000)
          )
        ]);

        clearTimeout(stepTimer1);
        clearTimeout(stepTimer2);

        if (isCancelled) return;

        if (response.status === 'READY' && response.url) {
          setWorkspaceUrl(response.url);
          if (response.volumeName) {
            setVolumeName(response.volumeName);
          }
          setProvisionStep(4);
          setTimeout(() => {
            if (!isCancelled) {
              setState('ready');
            }
          }, 400);
        } else {
          console.warn('Workspace returned fallback status:', response.message);
          setState('fallback');
        }
      } catch (err) {
        console.warn('Failed to provision embedded workspace container:', err);
        if (!isCancelled) {
          setState('fallback');
        }
      }
    };

    void initWorkspace();

    return () => {
      isCancelled = true;
    };
  }, [sessionId, problemSlug]);

  const handleRunWorkspaceTests = async () => {
    setTestStatus('running');
    setIsConsoleOpen(true);
    setConsoleOutput('🚀 [Workspace Mode] Mounting Docker volume & executing Maven test suite in isolated sandbox...\n$ mvn -o -B test\n');

    const startTime = performance.now();

    try {
      const result: ExecutionResultResponse = await executeProject(sessionId, {
        problemSlug,
        source: 'workspace',
        workspaceVolume: volumeName,
        submit: false
      });

      const elapsed = (performance.now() - startTime).toFixed(0);

      if (result.status === 'PASSED') {
        setTestStatus('passed');
        setConsoleOutput(
          `✅ [BUILD SUCCESS] All JUnit tests passed (${result.passedTests}/${result.totalTests}) in ${elapsed}ms\n` +
          `Sandbox Memory: ${result.memoryUsedMb?.toFixed(1) || '384.0'} MB\n\n` +
          (result.stdout || 'Tests executed cleanly with 0 failures.')
        );
      } else if (result.status === 'ENGINE_UNAVAILABLE') {
        setTestStatus('failed');
        setConsoleOutput(
          `❌ [Execution Engine Offline]\n` +
          `${result.stderr || 'Docker daemon unavailable for LLD Maven Runner.'}\n\n` +
          `⚠️ Status: ENGINE_UNAVAILABLE (${result.passedTests} / ${result.totalTests} Tests Passed)`
        );
      } else {
        setTestStatus('failed');
        setConsoleOutput(
          `❌ [TEST FAILURES / ERROR] Status: ${result.status} (${result.passedTests}/${result.totalTests} passed) in ${elapsed}ms\n\n` +
          (result.stderr ? `Errors:\n${result.stderr}\n\n` : '') +
          (result.stdout ? `Surefire Output:\n${result.stdout}` : result.compilerOutput || 'Execution failed.')
        );
      }
    } catch (err: unknown) {
      setTestStatus('failed');
      const msg = err instanceof Error ? err.message : 'Failed connecting to session runner';
      setConsoleOutput(`❌ Execution network error: ${msg}`);
    }
  };

  const handleSubmit = () => {
    if (onSubmitProject) {
      onSubmitProject(`Candidate submitted Spring Boot project from embedded workspace (Volume: ${volumeName}).`);
    }
  };

  // Render Monaco fallback if Docker unavailable or candidate switched
  if (state === 'fallback' || forceMonaco) {
    return (
      <div className="flex flex-col h-full w-full">
        {state === 'fallback' && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20 text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>Container sandbox unavailable. Operating in lightweight Monaco Project Mode.</span>
            </div>
            <button
              type="button"
              onClick={() => {
                isProvisionedRef.current = false;
                setState('provisioning');
                setForceMonaco(false);
              }}
              className="flex items-center gap-1 hover:underline text-amber-200"
            >
              <RotateCcw className="w-3 h-3" /> Retry Container
            </button>
          </div>
        )}
        <ProjectWorkspace
          sessionId={sessionId}
          problemSlug={problemSlug}
          starterFiles={starterFiles}
          editablePaths={editablePaths}
          onSubmitProject={onSubmitProject}
          isMaximized={isMaximized}
          onToggleMaximize={onToggleMaximize}
        />
      </div>
    );
  }

  // Provisioning Splash Screen
  if (state === 'provisioning') {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full bg-[#18181b] text-white p-8 select-none">
        <div className="max-w-md w-full flex flex-col items-center text-center space-y-6">
          <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 shadow-xl shadow-indigo-500/10">
            <Code2 className="w-8 h-8 animate-pulse text-indigo-400" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-surface-elevated border border-indigo-500/40 flex items-center justify-center">
              <Loader2 className="w-3 h-3 animate-spin text-indigo-300" />
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-text-primary tracking-tight">
              Initializing Workspace
            </h3>
            <p className="text-xs text-text-muted mt-1">
              Spinning up an ephemeral VS Code container for {problemTitle}
            </p>
          </div>

          <div className="w-full bg-surface-elevated/60 border border-border-subtle rounded-xl p-4 space-y-3 text-left">
            <div className="flex items-center gap-3 text-xs">
              {provisionStep > 1 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
              )}
              <span className={provisionStep >= 1 ? 'text-text-primary' : 'text-text-muted'}>
                Allocating isolated storage volume (<code>{volumeName}</code>)
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {provisionStep > 2 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : provisionStep === 2 ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-border-subtle flex-shrink-0" />
              )}
              <span className={provisionStep >= 2 ? 'text-text-primary' : 'text-text-muted'}>
                Seeding Spring Boot Maven starter files
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs">
              {provisionStep > 3 ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              ) : provisionStep === 3 ? (
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin flex-shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-border-subtle flex-shrink-0" />
              )}
              <span className={provisionStep >= 3 ? 'text-text-primary' : 'text-text-muted'}>
                Starting locked-down VS Code container (Zero Terminal)
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setForceMonaco(true)}
            className="text-xs text-text-muted hover:text-text-primary transition-colors underline"
          >
            Switch to lightweight Monaco editor instead
          </button>
        </div>
      </div>
    );
  }

  // Ready State: Embedded VS Code Iframe + Host Control Toolbar
  return (
    <div className="flex flex-col h-full w-full bg-[#1e1e1e] overflow-hidden">
      {/* Top Host Control Toolbar (Lives OUTSIDE iframe) */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#18181b] border-b border-border-subtle text-xs select-none">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>VS Code Workspace</span>
          </div>

          <Chip variant="neutral" size="sm" className="hidden sm:inline-flex items-center gap-1 text-[11px] opacity-80">
            <ShieldCheck className="w-3 h-3 text-indigo-400" />
            Sandboxed
          </Chip>

          <span className="text-text-muted hidden md:inline text-[11px]">
            Maven 3.9 / Java 21
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={() => void handleRunWorkspaceTests()}
            disabled={testStatus === 'running'}
            className="h-7 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-sm flex items-center gap-1.5 px-3"
          >
            {testStatus === 'running' ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Running Tests...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Run Project Tests</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="secondary"
            onClick={handleSubmit}
            className="h-7 text-xs text-text-primary border-border-subtle hover:bg-surface-elevated font-medium"
          >
            Submit Project
          </Button>

          {onToggleMaximize && (
            <button
              type="button"
              onClick={onToggleMaximize}
              className="p-1 rounded text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors"
              title={isMaximized ? 'Restore Split View' : 'Full Window'}
            >
              {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* Embedded VS Code Iframe */}
      <div className="relative flex-1 w-full h-full bg-[#1e1e1e]">
        {workspaceUrl ? (
          <iframe
            src={workspaceUrl}
            title="Embedded VS Code Workspace"
            className="w-full h-full border-0 bg-[#1e1e1e]"
            allow="clipboard-read; clipboard-write"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-text-muted">
            Workspace URL unavailable.
          </div>
        )}
      </div>

      {/* Bottom Collapsible Test Console */}
      {isConsoleOpen && (
        <>
          <ResizeHandle
            direction="vertical"
            onDelta={(delta: number) => setConsoleHeight((prev) => Math.max(100, Math.min(prev - delta, 500)))}
          />
          <TestConsole
            status={testStatus}
            output={consoleOutput}
            height={consoleHeight}
            onClear={() => setConsoleOutput(null)}
            onClose={() => setIsConsoleOpen(false)}
            onToggleExpand={() => setConsoleHeight((prev) => (prev > 250 ? 180 : 350))}
            isExpanded={consoleHeight > 250}
          />
        </>
      )}
    </div>
  );
};
