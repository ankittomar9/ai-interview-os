import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { sanitizeTtsText } from './tts-sanitize';
import { PERSONAS } from './personas';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

test('TTS Sanitizer - strips single trailing emoji', () => {
  const input = 'Welcome! 👋';
  const expected = 'Welcome!';
  assert.equal(sanitizeTtsText(input), expected);
});

test('TTS Sanitizer - strips multiple emojis and pictographs', () => {
  const input = '🎉🚀💪 all stripped';
  const expected = 'all stripped';
  assert.equal(sanitizeTtsText(input), expected);
});

test('TTS Sanitizer - leaves plain text unchanged', () => {
  const input = 'Please explain the time complexity of your approach.';
  const expected = 'Please explain the time complexity of your approach.';
  assert.equal(sanitizeTtsText(input), expected);
});

test('TTS Sanitizer - formats Big-O mathematical notation for natural speech', () => {
  assert.equal(sanitizeTtsText('The solution runs in $O(1)$ time.'), 'The solution runs in O of 1 time.');
  assert.equal(sanitizeTtsText('This merge sort is O(N log N) time complexity.'), 'This merge sort is O of N log N time complexity.');
  assert.equal(sanitizeTtsText('Binary search is O(log N).'), 'Binary search is O of log N.');
});

test('TTS Sanitizer - strips markdown formatting and code blocks', () => {
  const md = '# Overview\nHere is **bold** and *italic* text with `inline code` and a [link](https://example.com).\n```ts\nconst x = 1;\n```';
  const sanitized = sanitizeTtsText(md);
  assert.ok(!sanitized.includes('#'));
  assert.ok(!sanitized.includes('*'));
  assert.ok(!sanitized.includes('`'));
  assert.ok(!sanitized.includes('const x = 1'));
  assert.ok(sanitized.includes('Here is bold and italic text with inline code and a link.'));
});

test('TTS Sanitizer - fixture: personas.ts Dr. Anya Chen greeting', () => {
  const greeting = PERSONAS.INTERVIEW.welcomeMessage;
  const sanitized = sanitizeTtsText(greeting);
  assert.ok(!sanitized.includes('👋'));
  assert.ok(!sanitized.includes('\n\n'));
  assert.equal(
    sanitized,
    "Welcome to your Technical Assessment! I am Dr. Anya Chen, AI Principal Bar Raiser. Let's begin with a brief introduction. Please tell me about your engineering background and recent systems you've built."
  );
});

test('TTS Sanitizer - fixture: personas.ts Coach Sam greeting', () => {
  const greeting = PERSONAS.PLAYGROUND.welcomeMessage;
  const sanitized = sanitizeTtsText(greeting);
  assert.ok(!sanitized.includes('🧪'));
  assert.equal(
    sanitized,
    'Welcome to the Playground Practice Arena! I am Coach Sam, your AI Code & Architecture Coach. Feel free to explore solutions, request hints, or ask me for code explanations at any time.'
  );
});

test('TTS Sanitizer Static Guard - every SpeechSynthesisUtterance callsite is sanitized', () => {
  const filesToCheck = [
    path.resolve(__dirname, 'audio-tts.ts'),
    path.resolve(__dirname, '../components/arena/VoiceCoachIndicator.tsx'),
    path.resolve(__dirname, '../components/behavioral/BehavioralStudio.tsx'),
  ];

  for (const filePath of filesToCheck) {
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('new SpeechSynthesisUtterance('), `Expected ${filePath} to contain SpeechSynthesisUtterance`);
    assert.ok(content.includes('sanitizeTtsText('), `Expected ${filePath} to call sanitizeTtsText`);

    // Verify sanitizeTtsText appears before new SpeechSynthesisUtterance in each file
    const sanitizeIdx = content.indexOf('sanitizeTtsText(');
    const utteranceIdx = content.indexOf('new SpeechSynthesisUtterance(');
    assert.ok(
      sanitizeIdx !== -1 && sanitizeIdx < utteranceIdx,
      `sanitizeTtsText must appear before new SpeechSynthesisUtterance in ${filePath}`
    );
  }
});

test('TTS Sanitizer Gate G6-06-b (Honest Judge) - SpeechSynthesisUtterance text with stock greeting', () => {
  // Pre-fix stock greeting contained emoji
  const legacyStockGreetingWithEmoji = "Welcome to your Technical Assessment! 👋\n\nI am Dr. Anya Chen, AI Principal Bar Raiser. Let's begin with a brief introduction. Please tell me about your engineering background and recent systems you've built.";

  // DELIBERATELY WRONG (pre-fix raw greeting passed directly to SpeechSynthesisUtterance)
  const preFixUtteranceText = legacyStockGreetingWithEmoji;
  const preFixHasEmoji = /\p{Extended_Pictographic}/u.test(preFixUtteranceText);
  // Pre-fix speech path would vocalize the emoji name ("waving hand") -> FAIL
  assert.equal(preFixHasEmoji, true, 'Pre-fix text must contain emoji (honest negative test)');

  // KNOWN-GOOD (sanitized speech path)
  const postFixUtteranceText = sanitizeTtsText(legacyStockGreetingWithEmoji);
  const postFixHasEmoji = /\p{Extended_Pictographic}/u.test(postFixUtteranceText);
  // Post-fix speech path has zero emojis -> PASS
  assert.equal(postFixHasEmoji, false, 'Post-fix speech text must not contain emoji');
  assert.equal(
    postFixUtteranceText,
    "Welcome to your Technical Assessment! I am Dr. Anya Chen, AI Principal Bar Raiser. Let's begin with a brief introduction. Please tell me about your engineering background and recent systems you've built."
  );

  // SOURCE SANITIZATION (V6-06 F6b): Current personas.ts source string must contain ZERO emojis
  assert.equal(
    /\p{Extended_Pictographic}/u.test(PERSONAS.INTERVIEW.welcomeMessage),
    false,
    'Dr. Anya Chen personas.ts source string must not contain emojis'
  );
  assert.equal(
    /\p{Extended_Pictographic}/u.test(PERSONAS.PLAYGROUND.welcomeMessage),
    false,
    'Coach Sam personas.ts source string must not contain emojis'
  );
});
