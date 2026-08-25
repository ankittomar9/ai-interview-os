import type { Monaco } from '@monaco-editor/react';

export function defineMonacoThemes(monaco: Monaco) {
  // 1. IDE Slate (Modern island dark theme)
  monaco.editor.defineTheme('ide-slate', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'cf8e6d' },
      { token: 'type', foreground: 'bcbec4' },
      { token: 'string', foreground: '6aab73' },
      { token: 'function', foreground: '56a8f5' },
      { token: 'comment', foreground: '7a7e85', fontStyle: 'italic' },
      { token: 'number', foreground: '2aacb8' },
      { token: 'identifier', foreground: 'dfe1e5' },
      { token: 'delimiter', foreground: 'cf8e6d' },
      { token: 'operator', foreground: 'bcbec4' }
    ],
    colors: {
      'editor.background': '#1e1f22',
      'editor.foreground': '#dfe1e5',
      'editor.lineHighlightBackground': '#26282b',
      'editor.selectionBackground': '#2e436e',
      'editorCursor.foreground': '#dfe1e5',
      'editorGutter.background': '#1e1f22',
      'editorLineNumber.foreground': '#7a7e85',
      'editorLineNumber.activeForeground': '#bcbec4'
    }
  });

  // 2. IDE Paper (Clean, high-contrast light theme)
  monaco.editor.defineTheme('ide-paper', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '0033b3' },
      { token: 'type', foreground: '000000' },
      { token: 'string', foreground: '067d17' },
      { token: 'function', foreground: '00627a' },
      { token: 'comment', foreground: '8c8c8c', fontStyle: 'italic' },
      { token: 'number', foreground: '1750eb' }
    ],
    colors: {
      'editor.background': '#ffffff',
      'editor.foreground': '#1e1f22',
      'editor.lineHighlightBackground': '#f0f1f3',
      'editor.selectionBackground': '#d4e2ff',
      'editorGutter.background': '#ffffff',
      'editorLineNumber.foreground': '#818594'
    }
  });

  // 3. Deep Ocean
  monaco.editor.defineTheme('deep-ocean', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '22d3ee' },
      { token: 'type', foreground: '38bdf8' },
      { token: 'string', foreground: '5eead4' },
      { token: 'number', foreground: '67e8f9' },
      { token: 'comment', foreground: '64748b', fontStyle: 'italic' }
    ],
    colors: {
      'editor.background': '#071019',
      'editor.foreground': '#e2e8f0',
      'editor.lineHighlightBackground': '#0c1c27',
      'editor.selectionBackground': '#143240',
      'editorGutter.background': '#071019'
    }
  });

  // 4. Material Oceanic
  monaco.editor.defineTheme('material-oceanic', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'c792ea' },
      { token: 'type', foreground: 'ffcb6b' },
      { token: 'string', foreground: 'c3e88d' },
      { token: 'number', foreground: 'f78c6c' },
      { token: 'comment', foreground: '546e7a', fontStyle: 'italic' }
    ],
    colors: {
      'editor.background': '#0d1321',
      'editor.foreground': '#eeffff',
      'editor.lineHighlightBackground': '#121c2d',
      'editor.selectionBackground': '#1f3a4d',
      'editorGutter.background': '#0d1321'
    }
  });

  // 5. Warm Charcoal
  monaco.editor.defineTheme('warm-charcoal', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'fbbf24' },
      { token: 'type', foreground: 'f59e0b' },
      { token: 'string', foreground: 'a7f3d0' },
      { token: 'number', foreground: 'fcd34d' },
      { token: 'comment', foreground: '78716c', fontStyle: 'italic' }
    ],
    colors: {
      'editor.background': '#17161a',
      'editor.foreground': '#f5f5f4',
      'editor.lineHighlightBackground': '#1f1d23',
      'editor.selectionBackground': '#302d36',
      'editorGutter.background': '#17161a'
    }
  });
}
