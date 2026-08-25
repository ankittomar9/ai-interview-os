import type { Monaco } from '@monaco-editor/react';

export function defineMonacoThemes(monaco: Monaco) {
  // 1. IntelliJ Darcula
  monaco.editor.defineTheme('intellij-darcula', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: 'cc7832' },
      { token: 'type', foreground: 'a9b7c6' },
      { token: 'string', foreground: '6a8759' },
      { token: 'number', foreground: '6897bb' },
      { token: 'comment', foreground: '808080', fontStyle: 'italic' },
      { token: 'identifier', foreground: 'a9b7c6' },
      { token: 'function', foreground: 'ffc66d' },
      { token: 'delimiter', foreground: 'cc7832' },
      { token: 'operator', foreground: 'a9b7c6' }
    ],
    colors: {
      'editor.background': '#2b2b2b',
      'editor.foreground': '#bbbbbb',
      'editor.lineHighlightBackground': '#323232',
      'editor.selectionBackground': '#214283',
      'editorCursor.foreground': '#bbbbbb',
      'editorGutter.background': '#313335',
      'editorLineNumber.foreground': '#606366',
      'editorLineNumber.activeForeground': '#a4a3a3'
    }
  });

  // 2. IntelliJ Light
  monaco.editor.defineTheme('intellij-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'keyword', foreground: '0033b3' },
      { token: 'type', foreground: '000000' },
      { token: 'string', foreground: '067d17' },
      { token: 'number', foreground: '1750eb' },
      { token: 'comment', foreground: '8c8c8c', fontStyle: 'italic' },
      { token: 'function', foreground: '00627a' }
    ],
    colors: {
      'editor.background': '#f7f8fa',
      'editor.foreground': '#000000',
      'editor.lineHighlightBackground': '#f2f3f5',
      'editor.selectionBackground': '#d4e2ff',
      'editorGutter.background': '#f7f8fa',
      'editorLineNumber.foreground': '#adadad'
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
