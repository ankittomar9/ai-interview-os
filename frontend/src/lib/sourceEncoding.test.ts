import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

test('sourceEncoding: zero mojibake signature prefixes U+00E2 or U+00C2 across frontend/src', () => {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  const srcDir = path.resolve(currentDir, '..');

  // Needles built dynamically from char codes to prevent self-match
  const needleE2 = String.fromCharCode(0xE2);
  const needleC2 = String.fromCharCode(0xC2);

  const violations: { file: string; line: number; char: string; preview: string }[] = [];

  function scanDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');
        lines.forEach((line, index) => {
          if (line.includes(needleE2)) {
            violations.push({
              file: path.relative(srcDir, fullPath),
              line: index + 1,
              char: 'U+00E2',
              preview: line.trim()
            });
          }
          if (line.includes(needleC2)) {
            violations.push({
              file: path.relative(srcDir, fullPath),
              line: index + 1,
              char: 'U+00C2',
              preview: line.trim()
            });
          }
        });
      }
    }
  }

  scanDir(srcDir);

  assert.equal(
    violations.length,
    0,
    `Found ${violations.length} mojibake signature occurrences in frontend/src:\n` +
      violations.map((v) => `  ${v.file}:${v.line} [${v.char}]: ${v.preview}`).join('\n')
  );
});
