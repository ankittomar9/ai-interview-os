export type ThemeId =
  | 'light-studio'
  | 'graphite-indigo'
  | 'warm-charcoal'
  | 'deep-ocean'
  | 'material-oceanic'
  | 'intellij-darcula'
  | 'intellij-light';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  description: string;
  accent: string;
  background: string;
  panel: string;
  border: string;
  isDark: boolean;
}

export const themes: ThemeDefinition[] = [
  {
    id: 'light-studio',
    name: 'Light Studio',
    description: 'Clean, crisp Scaler light aesthetic',
    accent: '#4f46e5',
    background: '#f8fafc',
    panel: '#ffffff',
    border: '#e2e8f0',
    isDark: false
  },
  {
    id: 'graphite-indigo',
    name: 'Graphite Indigo',
    description: 'GitHub-dark neutral with indigo accent',
    accent: '#6366f1',
    background: '#0d1117',
    panel: '#161b22',
    border: '#262b33',
    isDark: true
  },
  {
    id: 'warm-charcoal',
    name: 'Warm Charcoal',
    description: 'Premium low-strain dark theme with amber',
    accent: '#f59e0b',
    background: '#17161a',
    panel: '#1f1d23',
    border: '#302d36',
    isDark: true
  },
  {
    id: 'deep-ocean',
    name: 'Deep Ocean',
    description: 'Technical cyan instrument theme',
    accent: '#22d3ee',
    background: '#071019',
    panel: '#0c1c27',
    border: '#143240',
    isDark: true
  },
  {
    id: 'material-oceanic',
    name: 'Material Oceanic',
    description: 'Material ocean teal theme',
    accent: '#5fb3b3',
    background: '#0d1321',
    panel: '#121c2d',
    border: '#1f3a4d',
    isDark: true
  },
  {
    id: 'intellij-darcula',
    name: 'IntelliJ Darcula',
    description: 'Stock JetBrains dark IDE',
    accent: '#4a88c7',
    background: '#2b2b2b',
    panel: '#3c3f41',
    border: '#4e5254',
    isDark: true
  },
  {
    id: 'intellij-light',
    name: 'IntelliJ Light',
    description: 'Stock JetBrains light IDE',
    accent: '#3574f0',
    background: '#f7f8fa',
    panel: '#ffffff',
    border: '#dfe1e5',
    isDark: false
  }
];
