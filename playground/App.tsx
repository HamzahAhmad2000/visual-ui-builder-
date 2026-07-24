'use client';

import { useState } from 'react';
import {
  BasicThemeEditor,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  VisualUiBuilderThemeProvider,
  VisualTemplateManager,
  type VisualUiBuilderTheme,
} from '../src';

export function App() {
  const [theme, setTheme] = useState<Partial<VisualUiBuilderTheme>>({});

  return (
    <VisualUiBuilderThemeProvider scope="builder" theme={theme}>
      <main className="playground-shell">
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
          <Card>
            <CardHeader>
              <CardTitle>Theme Colors</CardTitle>
              <CardDescription>Basic package-level theme variables.</CardDescription>
            </CardHeader>
            <CardContent>
              <BasicThemeEditor value={theme} onChange={setTheme} />
            </CardContent>
          </Card>
        </aside>
      </main>
    </VisualUiBuilderThemeProvider>
  );
}
