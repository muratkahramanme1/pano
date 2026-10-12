import { useColorScheme } from 'react-native';

export const light = {
  dark: false, bg: '#fafaf9', surface: '#ffffff', line: '#e7e5e4', text: '#1c1917', muted: '#78716c',
  accent: '#1c1917', accentText: '#fafaf9', soft: '#f5f5f4', ok: '#15803d', err: '#b91c1c', warn: '#b45309',
  term: '#0c0a09', termText: '#d6d3d1',
};
export const dark = {
  dark: true, bg: '#0c0a09', surface: '#171412', line: '#292524', text: '#f5f5f4', muted: '#a8a29e',
  accent: '#f5f5f4', accentText: '#0c0a09', soft: '#1f1b19', ok: '#4ade80', err: '#f87171', warn: '#fbbf24',
  term: '#080706', termText: '#d6d3d1',
};

export function useTheme() {
  return useColorScheme() === 'dark' ? dark : light;
}
