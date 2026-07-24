'use client';

import { useMemo, useState } from 'react';
import {
  Badge,
  BasicThemeEditor,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  ContentBuilderModal,
  VisualUiBuilderThemeProvider,
  getContentComposerProfile,
  type ContentComposerCase,
  type VisualUiBuilderTheme,
} from '../src';

const cases: ContentComposerCase[] = ['email-template', 'survey', 'docs', 'announcement', 'popup-news'];

export function App() {
  const [scope, setScope] = useState<ContentComposerCase>('email-template');
  const [theme, setTheme] = useState<Partial<VisualUiBuilderTheme>>({});
  const [open, setOpen] = useState(false);
  const [html, setHtml] = useState('');
  const profile = useMemo(() => getContentComposerProfile(scope), [scope]);

  return (
    <VisualUiBuilderThemeProvider scope={scope === 'email-template' ? 'email' : scope} theme={theme}>
      <main className="playground-shell">
        <section className="playground-main">
          <div className="playground-heading">
            <div>
              <Badge variant="secondary">Standalone package</Badge>
              <h1>Visual UI Builder</h1>
              <p>{profile.label}</p>
            </div>
            <Button type="button" onClick={() => setOpen(true)}>
              Open Builder
            </Button>
          </div>

          <div className="playground-tabs" role="tablist" aria-label="Builder scope">
            {cases.map((item) => {
              const itemProfile = getContentComposerProfile(item);
              return (
                <Button
                  key={item}
                  type="button"
                  variant={item === scope ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setScope(item)}
                >
                  {itemProfile.label}
                </Button>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>{profile.canvasLabel}</CardTitle>
              <CardDescription>{profile.emptyHint}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="playground-preview" dangerouslySetInnerHTML={{ __html: html || '<p>No saved content yet.</p>' }} />
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

      <ContentBuilderModal
        open={open}
        title={profile.label}
        initialHtml={html}
        onClose={() => setOpen(false)}
        onSave={(nextHtml) => setHtml(nextHtml)}
      />
    </VisualUiBuilderThemeProvider>
  );
}
