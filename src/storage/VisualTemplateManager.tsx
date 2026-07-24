'use client';

import { useMemo, useState } from 'react';
import { Copy, Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { ContentBuilderModal } from '../builder/ContentBuilderModal';
import type { TemplateVariable } from '../builder/VariablePicker';
import { parseDocumentFromHtml } from '../builder/blocks';
import { CONTENT_COMPOSER_PROFILES, type ContentComposerCase } from '../profiles/profiles';
import type { VisualUiBuilderTheme } from '../theme/tokens';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/primitives';
import { useVisualTemplateLibrary } from './useVisualTemplateLibrary';
import type {
  VisualTemplateKind,
  VisualTemplateRecord,
  VisualTemplateStore,
} from './types';

const SCOPES = Object.values(CONTENT_COMPOSER_PROFILES);

export function VisualTemplateManager({
  store,
  scope = 'email-template',
  kind = 'template',
  theme = {},
  variables,
  uploadImage,
}: {
  store?: VisualTemplateStore;
  scope?: ContentComposerCase;
  kind?: VisualTemplateKind;
  theme?: Partial<VisualUiBuilderTheme>;
  variables?: TemplateVariable[];
  uploadImage?: (file: File) => Promise<string>;
}) {
  const [query, setQuery] = useState('');
  const [selectedScope, setSelectedScope] = useState<ContentComposerCase>(scope);
  const [selectedKind, setSelectedKind] = useState<VisualTemplateKind>(kind);
  const [editing, setEditing] = useState<VisualTemplateRecord | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('Untitled');
  const filter = useMemo(
    () => ({ scope: selectedScope, kind: selectedKind, query }),
    [selectedScope, selectedKind, query]
  );
  const { items, loading, error, save, remove, duplicate } = useVisualTemplateLibrary({
    store,
    filter,
  });

  const modalOpen = creating || Boolean(editing);
  const activeName = editing?.name || draftName;

  return (
    <div className="vub-template-manager">
      <div className="vub-template-manager__toolbar">
        <div className="vub-template-manager__search">
          <Search size={15} />
          <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search" />
        </div>
        <Select value={selectedScope} onValueChange={(value) => setSelectedScope(value as ContentComposerCase)}>
          <SelectTrigger className="vub-template-manager__select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SCOPES.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>
                {profile.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedKind} onValueChange={(value) => setSelectedKind(value as VisualTemplateKind)}>
          <SelectTrigger className="vub-template-manager__select">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="template">Templates</SelectItem>
            <SelectItem value="component">Components</SelectItem>
          </SelectContent>
        </Select>
        <Input
          className="vub-template-manager__name"
          value={draftName}
          onChange={(event) => setDraftName(event.target.value)}
          placeholder="Name"
        />
        <Button
          type="button"
          onClick={() => {
            setDraftName(draftName.trim() || `Untitled ${selectedKind}`);
            setCreating(true);
          }}
        >
          <Plus size={15} />
          New
        </Button>
      </div>

      {error && <div className="vub-template-manager__message">{error.message}</div>}
      {loading && <div className="vub-template-manager__message">Loading</div>}
      {!loading && items.length === 0 && <div className="vub-template-manager__message">No saved items</div>}

      <div className="vub-template-manager__grid">
        {items.map((item) => (
          <Card key={item.id} className="vub-template-manager__card">
            <CardHeader>
              <div className="vub-template-manager__card-title">
                <CardTitle>
                  <Input
                    defaultValue={item.name}
                    onBlur={(event) => {
                      const name = event.target.value.trim();
                      if (name && name !== item.name) void save({ ...item, name });
                    }}
                  />
                </CardTitle>
                <Badge variant="outline">{item.kind}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div
                className="vub-template-manager__preview"
                dangerouslySetInnerHTML={{ __html: item.html }}
              />
              <div className="vub-template-manager__actions">
                <Button type="button" size="sm" onClick={() => setEditing(item)}>
                  <Edit3 size={14} />
                  Edit
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => void duplicate(item.id)}>
                  <Copy size={14} />
                </Button>
                <Button type="button" variant="ghost" size="sm" onClick={() => void remove(item.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ContentBuilderModal
        open={modalOpen}
        title={activeName}
        initialHtml={editing?.html}
        variables={variables}
        uploadImage={uploadImage}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSave={(html, plainText) => {
          void save({
            id: editing?.id,
            name: activeName,
            scope: editing?.scope || selectedScope,
            kind: editing?.kind || selectedKind,
            status: editing?.status || 'draft',
            html,
            plainText,
            document: parseDocumentFromHtml(html),
            theme: editing?.theme || theme,
            tags: editing?.tags || [],
            metadata: editing?.metadata || {},
          });
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}
