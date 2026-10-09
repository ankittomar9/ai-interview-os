import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import {
  getNextEditorSize,
  getStoredEditorSize,
  setStoredEditorSize,
  getEditorSizingStorageKey,
  getEditorSizeTooltip,
  getEditorSizeLabel,
  type EditorSize
} from './editorSizing';

describe('SPEC-012 VP-E: Editor Sizing State & Transitions', () => {
  it('cycles through sizes correctly: split -> expanded -> fullscreen -> split', () => {
    assert.strictEqual(getNextEditorSize('split'), 'expanded');
    assert.strictEqual(getNextEditorSize('expanded'), 'fullscreen');
    assert.strictEqual(getNextEditorSize('fullscreen'), 'split');
    assert.strictEqual(getNextEditorSize('unknown' as EditorSize), 'split');
    assert.strictEqual(getNextEditorSize(undefined as unknown as EditorSize), 'split');
  });

  it('provides descriptive tooltips for each editor sizing state', () => {
    assert.ok(getEditorSizeTooltip('split').includes('Expand'));
    assert.ok(getEditorSizeTooltip('expanded').includes('Fullscreen'));
    assert.ok(getEditorSizeTooltip('fullscreen').includes('Restore'));
    assert.strictEqual(getEditorSizeTooltip('invalid' as EditorSize), 'Cycle Editor Size');
  });

  it('provides human-readable labels for each editor sizing state', () => {
    assert.strictEqual(getEditorSizeLabel('split'), 'Split');
    assert.strictEqual(getEditorSizeLabel('expanded'), 'Expanded');
    assert.strictEqual(getEditorSizeLabel('fullscreen'), 'Fullscreen');
    assert.strictEqual(getEditorSizeLabel('unknown' as EditorSize), 'Split');
  });

  it('asserts storage key formatting for DSA and SQL screens', () => {
    assert.strictEqual(getEditorSizingStorageKey('dsa'), 'interviewos.editorSizing.dsa');
    assert.strictEqual(getEditorSizingStorageKey('sql'), 'interviewos.editorSizing.sql');
  });

  it('verifies static source file contains required contract literals', () => {
    const sourcePath = path.resolve(process.cwd(), 'src/components/arena/editorSizing.ts');
    const content = fs.readFileSync(sourcePath, 'utf-8');
    assert.ok(content.includes('interviewos.editorSizing.'), 'Must define interviewos.editorSizing prefix');
    assert.ok(content.includes("'split'"), 'Must define split size');
    assert.ok(content.includes("'expanded'"), 'Must define expanded size');
    assert.ok(content.includes("'fullscreen'"), 'Must define fullscreen size');
  });
});

describe('SPEC-012 VP-E: Storage Persistence & SSR Robustness', () => {
  let mockStore: Record<string, string> = {};

  beforeEach(() => {
    mockStore = {};
    const mockStorage: Storage = {
      getItem: (k: string) => (k in mockStore ? mockStore[k] : null),
      setItem: (k: string, v: string) => {
        mockStore[k] = String(v);
      },
      removeItem: (k: string) => {
        delete mockStore[k];
      },
      clear: () => {
        mockStore = {};
      },
      key: (index: number) => Object.keys(mockStore)[index] ?? null,
      length: 0
    };

    const target = globalThis as unknown as { window?: { localStorage?: Storage } };
    target.window = {
      localStorage: mockStorage
    };
  });

  it('reads fallback "split" when no stored preference exists', () => {
    assert.strictEqual(getStoredEditorSize('dsa'), 'split');
    assert.strictEqual(getStoredEditorSize('sql'), 'split');
  });

  it('persists and restores valid sizes across screens', () => {
    setStoredEditorSize('dsa', 'expanded');
    assert.strictEqual(getStoredEditorSize('dsa'), 'expanded');

    setStoredEditorSize('sql', 'fullscreen');
    assert.strictEqual(getStoredEditorSize('sql'), 'fullscreen');

    setStoredEditorSize('dsa', 'split');
    assert.strictEqual(getStoredEditorSize('dsa'), 'split');
  });

  it('recovers safely to "split" on corrupted or invalid stored values', () => {
    mockStore['interviewos.editorSizing.dsa'] = 'invalid_size';
    assert.strictEqual(getStoredEditorSize('dsa'), 'split');

    mockStore['interviewos.editorSizing.sql'] = '';
    assert.strictEqual(getStoredEditorSize('sql'), 'split');
  });

  it('handles localStorage throwing exceptions gracefully without crashing', () => {
    const errorStorage: Storage = {
      getItem: () => {
        throw new Error('Access denied');
      },
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => {},
      clear: () => {},
      key: () => null,
      length: 0
    };

    const target = globalThis as unknown as { window?: { localStorage?: Storage } };
    target.window = {
      localStorage: errorStorage
    };

    assert.doesNotThrow(() => {
      const size = getStoredEditorSize('dsa');
      assert.strictEqual(size, 'split');
    });

    assert.doesNotThrow(() => {
      setStoredEditorSize('dsa', 'expanded');
    });
  });

  it('handles SSR environment where window is undefined', () => {
    const target = globalThis as unknown as { window?: unknown };
    const origWindow = target.window;
    delete target.window;

    try {
      assert.strictEqual(getStoredEditorSize('dsa'), 'split');
      assert.doesNotThrow(() => {
        setStoredEditorSize('dsa', 'expanded');
      });
    } finally {
      target.window = origWindow;
    }
  });
});
