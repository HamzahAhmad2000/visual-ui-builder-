'use client';

import React, { useMemo } from 'react';
import {
  createScopedTheme,
  themeToCssVars,
  type VisualUiBuilderScope,
  type VisualUiBuilderTheme,
} from './tokens';

export function VisualUiBuilderThemeProvider({
  scope = 'builder',
  theme,
  className = '',
  style,
  children,
}: {
  scope?: VisualUiBuilderScope;
  theme?: Partial<VisualUiBuilderTheme>;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  const scopedTheme = useMemo(() => createScopedTheme(scope, theme), [scope, theme]);
  return (
    <div
      data-vub-root
      data-vub-scope={scope}
      className={`vub-root ${className}`}
      style={{ ...themeToCssVars(scopedTheme), ...style }}
    >
      {children}
    </div>
  );
}
