'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ThemeSidebar,
  VisualUiBuilderThemeProvider,
  VisualTemplateManager,
  type VisualUiBuilderTheme,
} from '../src';

export function App() {
  const [theme, setTheme] = useState<Partial<VisualUiBuilderTheme>>({});
  const [themeSidebarCollapsed, setThemeSidebarCollapsed] = useState(false);

  return (
    <VisualUiBuilderThemeProvider scope="builder" theme={theme}>
      <main className={`playground-shell${themeSidebarCollapsed ? ' playground-shell--theme-collapsed' : ''}`}>
        <section className="playground-main">
          <div className="playground-heading">
            <div>
              <h1>Visual UI Builder</h1>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Saved Library</CardTitle>
              <CardDescription>Templates and reusable components</CardDescription>
            </CardHeader>
            <CardContent>
              <VisualTemplateManager theme={theme} />
            </CardContent>
          </Card>
        </section>

        <aside className="playground-sidebar">
          <ThemeSidebar
            value={theme}
            onChange={setTheme}
            collapsed={themeSidebarCollapsed}
            onCollapsedChange={setThemeSidebarCollapsed}
          />
        </aside>
      </main>
    </VisualUiBuilderThemeProvider>
  );
}
