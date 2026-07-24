'use client';

import { useState } from 'react';
import { PanelRightClose, PanelRightOpen } from 'lucide-react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/primitives';
import { cn } from '../ui/utils';
import { BasicThemeEditor } from './BasicThemeEditor';
import {
  VISUAL_UI_BUILDER_PALETTES,
  type VisualUiBuilderPalette,
  type VisualUiBuilderTheme,
} from './tokens';

export interface ThemeSidebarProps {
  value: Partial<VisualUiBuilderTheme>;
  onChange: (next: Partial<VisualUiBuilderTheme>) => void;
  palettes?: VisualUiBuilderPalette[];
  title?: string;
  description?: string;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  className?: string;
}

export function ThemeSidebar({
  value,
  onChange,
  palettes = VISUAL_UI_BUILDER_PALETTES,
  title = 'Theme Colors',
  description = 'Basic package-level theme variables.',
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  className,
}: ThemeSidebarProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(defaultCollapsed);
  const isCollapsed = collapsed ?? internalCollapsed;
  const toggleLabel = isCollapsed ? 'Expand theme sidebar' : 'Collapse theme sidebar';

  const setCollapsed = (next: boolean) => {
    if (collapsed === undefined) {
      setInternalCollapsed(next);
    }
    onCollapsedChange?.(next);
  };

  return (
    <Card className={cn('vub-theme-sidebar', isCollapsed && 'vub-theme-sidebar--collapsed', className)}>
      <CardHeader className="vub-theme-sidebar__header">
        {!isCollapsed && (
          <div className="vub-theme-sidebar__copy">
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="vub-theme-sidebar__toggle"
          aria-label={toggleLabel}
          aria-expanded={!isCollapsed}
          title={toggleLabel}
          onClick={() => setCollapsed(!isCollapsed)}
        >
          {isCollapsed ? <PanelRightOpen size={16} /> : <PanelRightClose size={16} />}
        </Button>
      </CardHeader>

      {!isCollapsed && (
        <CardContent>
          <BasicThemeEditor value={value} onChange={onChange} palettes={palettes} />
        </CardContent>
      )}
    </Card>
  );
}
