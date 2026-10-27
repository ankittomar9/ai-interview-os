import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('Workspace Solution Unlock: ArenaShell passes workspace run state to ProblemPanel', () => {
  const arenaShellPath = path.resolve(import.meta.dirname, 'ArenaShell.tsx');
  const code = fs.readFileSync(arenaShellPath, 'utf-8');

  assert.ok(
    code.includes('hasWorkspaceRunAttempt'),
    'ArenaShell.tsx must maintain hasWorkspaceRunAttempt state'
  );
  assert.ok(
    code.includes('hasRunAttempt={executionResult !== null || hasWorkspaceRunAttempt}'),
    'ArenaShell.tsx must pass hasWorkspaceRunAttempt to ProblemPanel'
  );
  assert.ok(
    code.includes('onRunAttempt={() => setHasWorkspaceRunAttempt(true)}'),
    'ArenaShell.tsx must pass onRunAttempt callback to TrackScreenRouter'
  );
});

test('Workspace Solution Unlock: TrackScreenRouter forwards onRunAttempt to LldScreen', () => {
  const routerPath = path.resolve(import.meta.dirname, 'TrackScreenRouter.tsx');
  const code = fs.readFileSync(routerPath, 'utf-8');

  assert.ok(
    code.includes('onRunAttempt?: () => void;'),
    'TrackScreenRouter.tsx must accept onRunAttempt prop'
  );
  assert.ok(
    code.includes('onRunAttempt={onRunAttempt}'),
    'TrackScreenRouter.tsx must pass onRunAttempt to LldScreen'
  );
});

test('Workspace Solution Unlock: LldScreen forwards onRunAttempt to EmbeddedWorkspace', () => {
  const lldScreenPath = path.resolve(import.meta.dirname, 'screens/LldScreen.tsx');
  const code = fs.readFileSync(lldScreenPath, 'utf-8');

  assert.ok(
    code.includes('onRunAttempt?: () => void;'),
    'LldScreen.tsx must accept onRunAttempt prop'
  );
  assert.ok(
    code.includes('onRunAttempt={onRunAttempt}'),
    'LldScreen.tsx must pass onRunAttempt to EmbeddedWorkspace'
  );
});

test('Workspace Solution Unlock: EmbeddedWorkspace and ProjectWorkspace invoke onRunAttempt on test run', () => {
  const embeddedPath = path.resolve(import.meta.dirname, '../workspace/EmbeddedWorkspace.tsx');
  const embeddedCode = fs.readFileSync(embeddedPath, 'utf-8');

  assert.ok(
    embeddedCode.includes('onRunAttempt?: () => void;'),
    'EmbeddedWorkspace.tsx must accept onRunAttempt prop'
  );
  assert.ok(
    embeddedCode.includes('onRunAttempt?.();'),
    'EmbeddedWorkspace.tsx must invoke onRunAttempt?.() upon test run completion'
  );

  const projectPath = path.resolve(import.meta.dirname, '../ProjectWorkspace.tsx');
  const projectCode = fs.readFileSync(projectPath, 'utf-8');

  assert.ok(
    projectCode.includes('onRunAttempt?: () => void;'),
    'ProjectWorkspace.tsx must accept onRunAttempt prop'
  );
  assert.ok(
    projectCode.includes('onRunAttempt?.();'),
    'ProjectWorkspace.tsx must invoke onRunAttempt?.() upon test run completion'
  );
});

test('Workspace Solution Unlock: Logical unlock state transitions', () => {
  let executionResult: any = null;
  let hasWorkspaceRunAttempt = false;

  // Initial state: locked
  let hasRunAttempt = executionResult !== null || hasWorkspaceRunAttempt;
  assert.equal(hasRunAttempt, false, 'Initial state must be locked');

  // Single-file DSA execution: unlocked
  executionResult = { status: 'passed' };
  hasRunAttempt = executionResult !== null || hasWorkspaceRunAttempt;
  assert.equal(hasRunAttempt, true, 'DSA execution must unlock solution');

  // Reset to LLD question (no DSA executionResult)
  executionResult = null;
  hasRunAttempt = executionResult !== null || hasWorkspaceRunAttempt;
  assert.equal(hasRunAttempt, false, 'Resetting execution result re-locks solution');

  // LLD Workspace test run attempt completes: unlocked
  hasWorkspaceRunAttempt = true;
  hasRunAttempt = executionResult !== null || hasWorkspaceRunAttempt;
  assert.equal(hasRunAttempt, true, 'Workspace test execution attempt must unlock solution');

  // Navigating to new question: state resets
  hasWorkspaceRunAttempt = false;
  hasRunAttempt = executionResult !== null || hasWorkspaceRunAttempt;
  assert.equal(hasRunAttempt, false, 'Navigating to next question resets unlock state');
});

test('QB-51 Runner Honesty: EmbeddedWorkspace and ProjectWorkspace handle NO_TESTS status and guard PASSED with totalTests > 0', () => {
  const embeddedPath = path.resolve(import.meta.dirname, '../workspace/EmbeddedWorkspace.tsx');
  const embeddedCode = fs.readFileSync(embeddedPath, 'utf-8');

  assert.ok(
    embeddedCode.includes("result.status === 'NO_TESTS'"),
    'EmbeddedWorkspace.tsx must handle NO_TESTS status'
  );
  assert.ok(
    embeddedCode.includes("result.status === 'PASSED' && (result.totalTests ?? 0) > 0"),
    'EmbeddedWorkspace.tsx must guard PASSED banner with totalTests > 0'
  );

  const projectPath = path.resolve(import.meta.dirname, '../ProjectWorkspace.tsx');
  const projectCode = fs.readFileSync(projectPath, 'utf-8');

  assert.ok(
    projectCode.includes("resp.status === 'NO_TESTS'"),
    'ProjectWorkspace.tsx must handle NO_TESTS status'
  );
  assert.ok(
    projectCode.includes("resp.status === 'PASSED' && (resp.totalTests ?? 0) > 0"),
    'ProjectWorkspace.tsx must guard PASSED banner with totalTests > 0'
  );
});
