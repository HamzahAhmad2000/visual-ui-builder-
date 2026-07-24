import type React from 'react';

export type VisualUiBuilderScope =
  | 'builder'
  | 'email'
  | 'survey'
  | 'docs'
  | 'announcement'
  | 'popup-news';

export interface VisualUiBuilderTheme {
  background: string;
  overlay: string;
  surface: string;
  surfaceMuted: string;
  text: string;
  textMuted: string;
  border: string;
  input: string;
  primary: string;
  primaryHover: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
}

export const DEFAULT_VISUAL_UI_BUILDER_THEME: VisualUiBuilderTheme = {
  background: '#FFFFFF',
  overlay: '#FFFFFF',
  surface: '#F8FAFC',
  surfaceMuted: '#F1F5F9',
  text: '#111827',
  textMuted: '#64748B',
  border: '#E5E7EB',
  input: '#D1D5DB',
  primary: '#7C3AED',
  primaryHover: '#6D28D9',
  accent: '#2563EB',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
};

export interface VisualUiBuilderPalette {
  id: string;
  label: string;
  theme: VisualUiBuilderTheme;
}

export const VISUAL_UI_BUILDER_PALETTES: VisualUiBuilderPalette[] = [
  {
    id: 'clean',
    label: 'Clean',
    theme: DEFAULT_VISUAL_UI_BUILDER_THEME,
  },
  {
    id: 'graphite',
    label: 'Graphite',
    theme: {
      background: '#FFFFFF',
      overlay: '#FFFFFF',
      surface: '#F7F7F8',
      surfaceMuted: '#ECEEF0',
      text: '#18181B',
      textMuted: '#71717A',
      border: '#D4D4D8',
      input: '#C8C8CF',
      primary: '#18181B',
      primaryHover: '#27272A',
      accent: '#2563EB',
      success: '#059669',
      warning: '#D97706',
      error: '#DC2626',
    },
  },
  {
    id: 'skyline',
    label: 'Skyline',
    theme: {
      background: '#F8FBFF',
      overlay: '#FFFFFF',
      surface: '#EFF6FF',
      surfaceMuted: '#DBEAFE',
      text: '#0F172A',
      textMuted: '#475569',
      border: '#BFDBFE',
      input: '#93C5FD',
      primary: '#2563EB',
      primaryHover: '#1D4ED8',
      accent: '#06B6D4',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
  },
  {
    id: 'verdant',
    label: 'Verdant',
    theme: {
      background: '#FBFFFC',
      overlay: '#FFFFFF',
      surface: '#ECFDF5',
      surfaceMuted: '#D1FAE5',
      text: '#064E3B',
      textMuted: '#047857',
      border: '#A7F3D0',
      input: '#6EE7B7',
      primary: '#059669',
      primaryHover: '#047857',
      accent: '#0EA5E9',
      success: '#10B981',
      warning: '#D97706',
      error: '#DC2626',
    },
  },
  {
    id: 'orchid',
    label: 'Orchid',
    theme: {
      background: '#FFFBFF',
      overlay: '#FFFFFF',
      surface: '#FAF5FF',
      surfaceMuted: '#F3E8FF',
      text: '#2E1065',
      textMuted: '#6B21A8',
      border: '#DDD6FE',
      input: '#C4B5FD',
      primary: '#7C3AED',
      primaryHover: '#6D28D9',
      accent: '#EC4899',
      success: '#059669',
      warning: '#F59E0B',
      error: '#E11D48',
    },
  },
];

export const SCOPE_THEME_OVERRIDES: Record<VisualUiBuilderScope, Partial<VisualUiBuilderTheme>> = {
  builder: {},
  email: {
    primary: '#111827',
    primaryHover: '#1F2937',
    accent: '#2563EB',
  },
  survey: {
    primary: '#0EA5E9',
    primaryHover: '#0284C7',
    accent: '#10B981',
  },
  docs: {
    primary: '#334155',
    primaryHover: '#1E293B',
    accent: '#7C3AED',
  },
  announcement: {
    primary: '#7C3AED',
    primaryHover: '#6D28D9',
    accent: '#EC4899',
  },
  'popup-news': {
    primary: '#DB2777',
    primaryHover: '#BE185D',
    accent: '#F59E0B',
  },
};

export const createScopedTheme = (
  scope: VisualUiBuilderScope = 'builder',
  theme: Partial<VisualUiBuilderTheme> = {}
): VisualUiBuilderTheme => ({
  ...DEFAULT_VISUAL_UI_BUILDER_THEME,
  ...SCOPE_THEME_OVERRIDES[scope],
  ...theme,
});

export const themeToCssVars = (theme: VisualUiBuilderTheme): React.CSSProperties =>
  ({
    '--vub-background': theme.background,
    '--vub-overlay': theme.overlay,
    '--vub-dropdown-background': theme.overlay,
    '--vub-picker-background': theme.overlay,
    '--vub-surface': theme.surface,
    '--vub-surface-muted': theme.surfaceMuted,
    '--vub-text': theme.text,
    '--vub-text-muted': theme.textMuted,
    '--vub-border': theme.border,
    '--vub-input': theme.input,
    '--vub-primary': theme.primary,
    '--vub-primary-hover': theme.primaryHover,
    '--vub-accent': theme.accent,
    '--vub-success': theme.success,
    '--vub-warning': theme.warning,
    '--vub-error': theme.error,

    // Compatibility aliases used by the extracted production builder.
    '--background': theme.background,
    '--background-secondary': theme.surfaceMuted,
    '--surface': theme.surface,
    '--surface-hover': theme.surfaceMuted,
    '--text-primary': theme.text,
    '--text-secondary': theme.textMuted,
    '--text-muted': theme.textMuted,
    '--border': theme.border,
    '--input': theme.input,
    '--primary': theme.primary,
    '--primary-300': theme.primary,
    '--primary-500': theme.primary,
    '--primary-600': theme.primary,
    '--primary-700': theme.primaryHover,
    '--success-500': theme.success,
    '--warning-500': theme.warning,
    '--error-500': theme.error,
    '--error-600': theme.error,
    '--destructive': theme.error,
    '--popover': theme.surface,
    '--border-radius-sm': '4px',
    '--border-radius-md': '6px',
    '--border-radius-lg': '8px',
    '--border-radius-fields-md': '6px',
    '--border-radius-boxes-sm': '4px',
    '--border-radius-boxes-md': '6px',
  } as React.CSSProperties);
