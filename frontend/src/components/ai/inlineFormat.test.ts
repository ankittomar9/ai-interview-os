import { describe, it } from 'node:test';
import assert from 'node:assert';
import { parseInlineFormat } from './inlineFormat';

describe('SPEC-010 VP-4: Pure Inline Formatting Parser', () => {
  it('parses $O(N)$ into math segment with dollars stripped and verbatim content', () => {
    const segments = parseInlineFormat('The time complexity is $O(N)$ here.');
    assert.strictEqual(segments.length, 3);
    assert.deepStrictEqual(segments[0], { type: 'text', value: 'The time complexity is ' });
    assert.deepStrictEqual(segments[1], { type: 'math', value: 'O(N)' });
    assert.deepStrictEqual(segments[2], { type: 'text', value: ' here.' });
  });

  it('parses `n - 1` and `2` into code segments', () => {
    const segments = parseInlineFormat('Checks from `2` up to `n - 1`.');
    assert.strictEqual(segments.length, 5);
    assert.deepStrictEqual(segments[0], { type: 'text', value: 'Checks from ' });
    assert.deepStrictEqual(segments[1], { type: 'code', value: '2' });
    assert.deepStrictEqual(segments[2], { type: 'text', value: ' up to ' });
    assert.deepStrictEqual(segments[3], { type: 'code', value: 'n - 1' });
    assert.deepStrictEqual(segments[4], { type: 'text', value: '.' });
  });

  it('renders unmatched $ and backtick literally as text', () => {
    const segments = parseInlineFormat('Price is $50 and code has unmatched ` backtick.');
    assert.strictEqual(segments.length, 1);
    assert.strictEqual(segments[0].type, 'text');
    assert.strictEqual(segments[0].value, 'Price is $50 and code has unmatched ` backtick.');
  });

  it('renders empty $$ and `` literally as text', () => {
    const segments = parseInlineFormat('Empty math $$ and empty code `` here.');
    assert.strictEqual(segments.length, 1);
    assert.strictEqual(segments[0].type, 'text');
    assert.strictEqual(segments[0].value, 'Empty math $$ and empty code `` here.');
  });

  it('splits on ``` fenced blocks first and preserves inner newlines', () => {
    const input = 'Before code:\n```java\nint x = 1;\nint y = 2;\n```\nAfter code with $O(1)$ complexity.';
    const segments = parseInlineFormat(input);
    assert.strictEqual(segments.length, 5);
    assert.deepStrictEqual(segments[0], { type: 'text', value: 'Before code:\n' });
    assert.deepStrictEqual(segments[1], {
      type: 'fence',
      value: 'int x = 1;\nint y = 2;\n',
      language: 'java'
    });
    assert.deepStrictEqual(segments[2], { type: 'text', value: '\nAfter code with ' });
    assert.deepStrictEqual(segments[3], { type: 'math', value: 'O(1)' });
    assert.deepStrictEqual(segments[4], { type: 'text', value: ' complexity.' });
  });

  it('preserves exact screenshot text from operator defect report without mangling', () => {
    const screenshotText = 'Right now, your loop checks every number from `2` up to `n - 1`. If $N$ is very large, this takes $O(N)$ time. Is there a mathematical property of factors that allows us to stop checking much earlier than $n$?';
    const segments = parseInlineFormat(screenshotText);

    // Assert segments contain code for `2`, `n - 1`, and math for N, O(N), n
    const mathSegments = segments.filter(s => s.type === 'math');
    const codeSegments = segments.filter(s => s.type === 'code');

    assert.strictEqual(codeSegments.length, 2);
    assert.strictEqual(codeSegments[0].value, '2');
    assert.strictEqual(codeSegments[1].value, 'n - 1');

    assert.strictEqual(mathSegments.length, 3);
    assert.strictEqual(mathSegments[0].value, 'N');
    assert.strictEqual(mathSegments[1].value, 'O(N)');
    assert.strictEqual(mathSegments[2].value, 'n');
  });
});
