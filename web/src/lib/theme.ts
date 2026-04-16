import type { Theme } from '@/types';

const KEY = 'diet-auto:theme';

export function getSavedTheme(): Theme {
  const v = typeof localStorage !== 'undefined' ? localStorage.getItem(KEY) : null;
  if (v === 'light' || v === 'dark' || v === 'system') return v;
  return 'system';
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
  const dark = theme === 'dark' || (theme === 'system' && prefersDark);
  root.classList.toggle('dark', dark);
  localStorage.setItem(KEY, theme);
}

/** Applied very early (before React) to prevent flash of wrong theme. */
export function applyInitialTheme() {
  applyTheme(getSavedTheme());
}
