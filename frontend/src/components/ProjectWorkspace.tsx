import React, { useState, useMemo } from 'react';
import Editor from '@monaco-editor/react';
import {
  FileCode,
  FileText,
  Lock,
  Play,
  Folder,
  Sparkles,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { Button } from './ui/Button';
import { Chip } from './ui/Chip';
import { TestConsole } from './ui/TestConsole';
import { ResizeHandle } from './ui/ResizeHandle';
import { ActivityBar } from './ide/ActivityBar';
import { BreadcrumbBar } from './ide/BreadcrumbBar';
import { StatusBar } from './ide/StatusBar';
import { executeProject } from '../services/api';
import { useTheme } from './theme-provider';
import { defineMonacoThemes } from '../lib/syntax-themes';

interface Props {
  sessionId: number;
  problemSlug: string;
  starterFiles: Record<string, string>;
  editablePaths: string[];
  onSubmitProject?: (summary: string) => void;
  isMaximized?: boolean;
  onToggleMaximize?: () => void;
  engine?: 'Maven';
  engineReady?: boolean;
  proctorClean?: boolean;
}

export const ProjectWorkspace: React.FC<Props> = ({
  sessionId,
  problemSlug,
  starterFiles,
  editablePaths,
  onSubmitProject,
  isMaximized = false,
  onToggleMaximize,
  engine = 'Maven',
  engineReady = true,
  proctorClean = true
}) => {
  const { resolvedTheme } = useTheme();
  // Candidate project files state: Map of path -> content
  const [files, setFiles] = useState<Record<string, string>>(() => ({ ...starterFiles }));
  
  // Sort files: editable files first, then alphabetical
  const filePaths = useMemo(() => {
    const paths = Object.keys(starterFiles);
    return paths.sort((a, b) => {
      const aEditable = editablePaths.includes(a);
      const bEditable = editablePaths.includes(b);
      if (aEditable && !bEditable) return -1;
      if (!aEditable && bEditable) return 1;
      return a.localeCompare(b);
    });
  }, [starterFiles, editablePaths]);

  // Active open file
  const [activePath, setActivePath] = useState<string>(() => {
    return editablePaths.length > 0 ? editablePaths[0] : filePaths[0] || '';
  });

  // Open tabs
  const [openTabs, setOpenTabs] = useState<string[]>(() => {
    return editablePaths.length > 0 ? [...editablePaths] : filePaths.slice(0, 3);
  });

  // Cursor position
  const [cursor, setCursor] = useState<{ ln: number; col: number }>({ ln: 1, col: 1 });

  // Test execution state
  const [testStatus, setTestStatus] = useState<'idle' | 'running' | 'passed' | 'failed'>('idle');
  const [consoleOutput, setConsoleOutput] = useState<string | null>(null);
  const [isConsoleOpen, setIsConsoleOpen] = useState(false);
  const [consoleHeight, setConsoleHeight] = useState(180);

  const isEditable = (path: string) => editablePaths.includes(path);
  const isModified = (path: string) => files[path] !== starterFiles[path];

  const getLanguage = (path: string) => {
    if (path.endsWith('.xml')) return 'xml';
    if (path.endsWith('.json')) return 'json';
    if (path.endsWith('.yaml') || path.endsWith('.yml')) return 'yaml';
    if (path.endsWith('.py')) return 'python';
    return 'java';
  };

  const getFileIcon = (path: string) => {
    if (path.endsWith('.xml')) return <FileText className="w-3.5 h-3.5 text-amber-400" />;
    return <FileCode className="w-3.5 h-3.5 text-sky-400" />;
  };

  const handleOpenFile = (path: string) => {
    setActivePath(path);
    if (!openTabs.includes(path)) {
      setOpenTabs((prev) => [...prev, path]);
    }
  };

  const handleCloseTab = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newTabs = openTabs.filter((t) => t !== path);
    setOpenTabs(newTabs);
    if (activePath === path && newTabs.length > 0) {
      setActivePath(newTabs[newTabs.length - 1]);
    }
  };

  const handleContentChange = (val: string | undefined) => {
    if (!isEditable(activePath)) return;
    setFiles((prev) => ({
      ...prev,
      [activePath]: val || ''
    }));
  };

  const handleRunTests = async () => {
    setTestStatus('running');
    setIsConsoleOpen(true);
    try {
      const resp = await executeProject(sessionId, {
        problemSlug,
        files
      });

      if (resp.status === 'ENGINE_UNAVAILABLE') {
        setTestStatus('failed');
        setConsoleOutput(
          `🛑 [Execution Engine Offline]\n${resp.stderr || 'Docker execution engine is currently offline or unreachable. Verify Docker daemon is running with socket access to enable LLD sandbox.'}\n\n⚠️ Status: ENGINE_UNAVAILABLE (0 / ${resp.totalTests} Tests Passed)`
        );
      } else if (resp.status === 'COMPILE_ERROR') {
        setTestStatus('failed');
        setConsoleOutput(
          `[Maven Compiler Output] Compilation Failed:\n${resp.compilerOutput || resp.stderr || 'Syntax error during build.'}\n\n❌ Status: COMPILE_ERROR (0 / ${resp.totalTests} Tests Passed)`
        );
      } else if (resp.status === 'PASSED') {
        setTestStatus('passed');
        let out = `[Maven Test Runner] Build Succeeded in ${resp.executionTimeMs.toFixed(1)}ms (Heap: ${resp.memoryUsedMb.toFixed(1)}MB)\n\n`;
        resp.testResults.forEach((t) => {
          out += `✅ ${t.name} ➔ PASS (${t.durationMs.toFixed(1)}ms)\n`;
        });
        out += `\n🎉 Status: ALL ${resp.passedTests} / ${resp.totalTests} JUNIT 5 TESTS PASSED!`;
        setConsoleOutput(out);
      } else if (resp.status === 'TIMEOUT') {
        setTestStatus('failed');
        setConsoleOutput(
          `[Execution Limit] Time Limit Exceeded (${resp.executionTimeMs}ms):\n${resp.stderr || 'Maven build timed out.'}\n\n❌ Status: TIMEOUT`
        );
      } else {
        setTestStatus('failed');
        let out = `[Maven Test Runner] Test Suite Finished in ${resp.executionTimeMs.toFixed(1)}ms (Heap: ${resp.memoryUsedMb.toFixed(1)}MB)\n\n`;
        resp.testResults.forEach((t) => {
          if (t.status === 'PASS') {
            out += `✅ ${t.name} ➔ PASS (${t.durationMs.toFixed(1)}ms)\n`;
          } else {
            out += `❌ ${t.name} ➔ FAILED (${t.durationMs.toFixed(1)}ms)\n   ${t.error || 'Assertion match failed'}\n`;
          }
        });
        out += `\n⚠️ Status: ${resp.passedTests} / ${resp.totalTests} Tests Passed.`;
        setConsoleOutput(out);
      }
    } catch (err: any) {
      console.error('Project test execution failed:', err);
      setTestStatus('failed');
      setConsoleOutput(`[Execution Error] Could not connect to Maven sandbox: ${err.message || 'Unknown network error'}`);
    }
  };

  const handleSubmit = () => {
    if (onSubmitProject) {
      const summary = `I have updated and tested the Spring Boot project files (${editablePaths.join(', ')}).`;
      onSubmitProject(summary);
    }
  };

  const pathSegments = useMemo(() => {
    if (!activePath) return ['OrderService.java'];
    return activePath.split('/');
  }, [activePath]);

  return (
    <div className="flex-1 flex bg-bg overflow-hidden relative h-full">

      {/* 0. SLIM ACTIVITY BAR (40px) */}
      <ActivityBar
        active="explorer"
        onRun={handleRunTests}
        proctorClean={proctorClean}
      />

      {/* WORKSPACE MAIN CONTAINER */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP WORKSPACE TOOLBAR */}
        <div className="h-10 bg-surface border-b border-border flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Folder className="w-4 h-4 text-primary-2" />
              <span>Spring Boot Project Workspace</span>
            </div>
            <Chip variant="primary" size="sm">Maven 3.9 / Java 21</Chip>
            <Chip variant="neutral" size="sm">{editablePaths.length} Editable</Chip>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="primary"
              size="sm"
              icon={<Play className="w-3 h-3 fill-white" />}
              onClick={handleRunTests}
              loading={testStatus === 'running'}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold"
            >
              {testStatus === 'running' ? 'Running Maven Tests...' : 'Run Project Tests'}
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={<Sparkles className="w-3.5 h-3.5 text-white" />}
              onClick={handleSubmit}
            >
              Submit Project
            </Button>

            {onToggleMaximize && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggleMaximize}
                title={isMaximized ? 'Restore Workspace' : 'Maximize Workspace'}
              >
                {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              </Button>
            )}
          </div>
        </div>

        {/* MAIN WORKSPACE BODY: FileTree (Left) + Monaco Editor (Right) */}
        <div className="flex-1 flex overflow-hidden">

          {/* 1. FILE TREE SIDEBAR */}
          <div className="w-60 bg-surface border-r border-border flex flex-col shrink-0 select-none">
            <div className="px-3 py-2 border-b border-border/80 text-[11px] font-bold uppercase tracking-wider text-text-3 flex items-center justify-between">
              <span>Project Explorer</span>
              <span className="text-[10px] text-text-3/70">{filePaths.length} files</span>
            </div>

            <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 text-xs font-mono">
              {filePaths.map((path) => {
                const editable = isEditable(path);
                const modified = isModified(path);
                const isActive = activePath === path;
                const fileName = path.split('/').pop() || path;

                return (
                  <div
                    key={path}
                    onClick={() => handleOpenFile(path)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-primary/20 text-white font-bold border border-primary/40'
                        : 'text-text-2 hover:bg-elevated hover:text-white'
                    }`}
                    title={path}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {getFileIcon(path)}
                      <span className="truncate">{fileName}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {modified && (
                        <span className="w-2 h-2 rounded-full bg-sky-400" title="Modified by candidate" />
                      )}
                      {editable ? (
                        <span className="text-[10px] text-emerald-400 font-sans font-semibold">edit</span>
                      ) : (
                        <span title="Locked by interview specification">
                          <Lock className="w-3 h-3 text-text-3" />
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. MONACO MULTI-TAB EDITOR COLUMN */}
          <div className="flex-1 flex flex-col bg-bg overflow-hidden">

            {/* TAB STRIP */}
            <div className="h-9 bg-surface/90 border-b border-border flex items-center px-2 gap-1 overflow-x-auto select-none">
              {openTabs.map((path) => {
                const isActive = activePath === path;
                const fileName = path.split('/').pop() || path;
                const editable = isEditable(path);

                return (
                  <div
                    key={path}
                    onClick={() => setActivePath(path)}
                    className={`flex items-center gap-2 px-3 py-1 text-xs rounded-t border-t-2 transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-bg text-white font-bold border-primary border-b-transparent'
                        : 'bg-elevated/40 text-text-3 hover:text-text-2 border-transparent'
                    }`}
                  >
                    {getFileIcon(path)}
                    <span className="truncate max-w-36">{fileName}</span>
                    {!editable && <Lock className="w-2.5 h-2.5 text-text-3" />}
                    {openTabs.length > 1 && (
                      <button
                        onClick={(e) => handleCloseTab(path, e)}
                        className="text-text-3 hover:text-white ml-1 text-xs leading-none"
                      >
                        ×
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* BREADCRUMB BAR */}
            <BreadcrumbBar segments={pathSegments} />

            {/* READ-ONLY BANNER IF LOCKED */}
            {!isEditable(activePath) && (
              <div className="bg-amber-500/10 border-b border-amber-500/30 px-3 py-1 flex items-center gap-2 text-xs text-amber-300">
                <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Read-only reference file. Framework interfaces and tests are managed by the platform.</span>
              </div>
            )}

            {/* ACTIVE FILE MONACO INSTANCE */}
            <div className="flex-1 relative overflow-hidden">
              <Editor
                height="100%"
                language={getLanguage(activePath)}
                theme={
                  resolvedTheme === 'intellij-darcula'
                    ? 'intellij-darcula'
                    : resolvedTheme === 'intellij-light'
                    ? 'intellij-light'
                    : resolvedTheme === 'deep-ocean'
                    ? 'deep-ocean'
                    : resolvedTheme === 'material-oceanic'
                    ? 'material-oceanic'
                    : resolvedTheme === 'warm-charcoal'
                    ? 'warm-charcoal'
                    : resolvedTheme === 'light-studio'
                    ? 'vs'
                    : 'vs-dark'
                }
                beforeMount={defineMonacoThemes}
                value={files[activePath] || ''}
                onChange={handleContentChange}
                onMount={(editor) => {
                  editor.onDidChangeCursorPosition((e) => {
                    setCursor({ ln: e.position.lineNumber, col: e.position.column });
                  });
                }}
                options={{
                  fontSize: 14,
                  readOnly: !isEditable(activePath),
                  minimap: { enabled: false },
                  fontFamily: "var(--font-mono), 'Fira Code', monospace",
                  automaticLayout: true,
                  tabSize: 4,
                  scrollBeyondLastLine: false,
                  lineNumbersMinChars: 3
                }}
              />
            </div>

            {/* RESIZE HANDLE FOR BOTTOM CONSOLE */}
            {isConsoleOpen && (
              <ResizeHandle
                direction="vertical"
                onDelta={(delta) => setConsoleHeight((prev) => Math.max(70, Math.min(500, prev - delta)))}
                onDoubleClick={() => setConsoleHeight(180)}
              />
            )}

            {/* BOTTOM TEST RESULTS CONSOLE */}
            {isConsoleOpen && (
              <TestConsole
                status={testStatus}
                output={consoleOutput}
                height={consoleHeight}
                onClear={() => setConsoleOutput(null)}
                onClose={() => setIsConsoleOpen(false)}
                onToggleExpand={() => setConsoleHeight(consoleHeight > 250 ? 120 : 340)}
                isExpanded={consoleHeight > 250}
              />
            )}

            {/* STATUS BAR */}
            <StatusBar
              ln={cursor.ln}
              col={cursor.col}
              language={getLanguage(activePath)}
              engine={engine}
              engineReady={engineReady}
            />

          </div>
        </div>
      </div>
    </div>
  );
};
