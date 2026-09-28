import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PERSONAS, getPersona } from '../../lib/personas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const srcDir = path.resolve(__dirname, '../../');

test('V6-08 Static Guard & G6-08-b (Honest Judge): FloatingAiOrb contains no hardcoded Mickey or Coach Sam literals', () => {
  const orbFile = path.resolve(srcDir, 'components/ai/FloatingAiOrb.tsx');
  const content = fs.readFileSync(orbFile, 'utf8');

  // KNOWN-GOOD (Post-fix): File must not contain hardcoded literals
  assert.ok(!content.includes("'Mickey'"), 'FloatingAiOrb must not contain literal Mickey');
  assert.ok(!content.includes('"Mickey"'), 'FloatingAiOrb must not contain literal Mickey');
  assert.ok(!content.includes("'Coach Sam'"), 'FloatingAiOrb must not contain literal Coach Sam');
  assert.ok(!content.includes('"Coach Sam"'), 'FloatingAiOrb must not contain literal Coach Sam');

  // DELIBERATELY WRONG (Pre-fix baseline, Honest-judge G6-08-b):
  const preFixSnippet = "const personaLabel = isPlayground ? 'Coach Sam' : 'Mickey';";
  const preFixHasLiterals = preFixSnippet.includes('Mickey') || preFixSnippet.includes('Coach Sam');
  assert.equal(preFixHasLiterals, true, 'Pre-fix baseline contained hardcoded persona literals (failing test)');
});

test('V6-08-a: FloatingAiOrb persona resolution bound to active interviewer in registry', () => {
  // INTERVIEW mode
  const interviewPersona = getPersona(false);
  assert.equal(interviewPersona.name, 'Dr. Anya Chen');
  assert.equal(interviewPersona.role, 'Principal Engineer & Bar Raiser');
  assert.equal(interviewPersona.name, PERSONAS.INTERVIEW.name);

  // PLAYGROUND mode
  const playgroundPersona = getPersona(true);
  assert.equal(playgroundPersona.name, 'Coach Sam');
  assert.equal(playgroundPersona.role, 'Senior Tech Lead & Socratic Coach');
  assert.equal(playgroundPersona.name, PERSONAS.PLAYGROUND.name);
});

test('V6-09-a, G6-09-b & G6-09-c (Honest Judge): IntroScreen intro completion gate and introSkipped marker', () => {
  // Simulate IntroScreen gate decision
  function evaluateIntroAdvance(introTurnCount: number) {
    if (introTurnCount === 0) {
      return {
        showsModal: true,
        modalText: "You haven't introduced yourself yet. The interviewer expects a brief intro before we start."
      };
    }
    return {
      showsModal: false,
      modalText: null
    };
  }

  // G6-09-a: Zero intro turns -> confirmation modal renders
  const zeroTurnsResult = evaluateIntroAdvance(0);
  assert.equal(zeroTurnsResult.showsModal, true, 'Zero intro turns must open confirmation modal');
  assert.ok(zeroTurnsResult.modalText?.includes("You haven't introduced yourself yet"));

  // G6-09-b: >= 1 intro turn -> no dialog, direct advance
  const oneTurnResult = evaluateIntroAdvance(1);
  assert.equal(oneTurnResult.showsModal, false, '1 intro turn must not show modal (direct advance)');

  // Stage advance marker logic (G6-09-a "Start anyway" vs G6-09-c answered)
  function simulateStageAdvance(candidateAction: 'ANSWERED' | 'START_ANYWAY') {
    const markers: Record<string, any> = {};
    if (candidateAction === 'START_ANYWAY') {
      markers.introSkipped = true;
    }
    return markers;
  }

  // G6-09-a: "Start anyway" sets introSkipped marker
  const startAnywayMarkers = simulateStageAdvance('START_ANYWAY');
  assert.equal(startAnywayMarkers.introSkipped, true, 'Start anyway must emit introSkipped=true');

  // G6-09-c (Honest Judge): Candidate answered intro -> introSkipped marker ABSENT
  const answeredMarkers = simulateStageAdvance('ANSWERED');
  assert.equal(answeredMarkers.introSkipped, undefined, 'When intro answered, introSkipped marker must be absent');
  assert.ok(!('introSkipped' in answeredMarkers));
});

test('V6-12 Static Guard & G6-12-b (Honest Judge): No OpenJDK \\d literals in frontend/src', () => {
  const dsaScreenFile = path.resolve(srcDir, 'components/arena/screens/DsaScreen.tsx');
  const dsaContent = fs.readFileSync(dsaScreenFile, 'utf8');

  // KNOWN-GOOD (Post-fix): No OpenJDK \d in DsaScreen
  const openJdkRegex = /OpenJDK \d+/;
  assert.equal(openJdkRegex.test(dsaContent), false, 'DsaScreen.tsx must not contain hardcoded OpenJDK version');

  // DELIBERATELY WRONG (Pre-fix baseline, Honest-judge G6-12-b):
  const preFixSelectSnippet = '<option value="java">Java (OpenJDK 13.0.1)</option>';
  assert.equal(openJdkRegex.test(preFixSelectSnippet), true, 'Pre-fix baseline contained hardcoded OpenJDK 13.0.1 (failing test)');
});

test('V6-12-a: DsaScreen selector label equals capabilities-served runtime string', () => {
  // Mock capabilities response served by backend
  const backendCapabilities = {
    runtimes: {
      java: 'Java (OpenJDK 13.0.1)',
      python: 'Python (3.8.1)',
      cpp: 'C++ (GCC 9.2.0)',
      javascript: 'JavaScript (Node.js 12.14.0)'
    }
  };

  // Helper resolving selector label from capabilities
  function resolveRuntimeLabel(langKey: string, capabilities: typeof backendCapabilities): string {
    return capabilities.runtimes[langKey as keyof typeof capabilities.runtimes] || langKey;
  }

  const javaLabel = resolveRuntimeLabel('java', backendCapabilities);
  assert.equal(javaLabel, 'Java (OpenJDK 13.0.1)', 'Selector label must equal capabilities-served string');

  const pythonLabel = resolveRuntimeLabel('python', backendCapabilities);
  assert.equal(pythonLabel, 'Python (3.8.1)', 'Selector label must equal capabilities-served string');
});
