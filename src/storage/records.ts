import { v4 as uuidv4 } from 'uuid';
import { createBaseProperties, parseDocumentFromHtml, type BuilderDocument } from '../builder';
import {
  getContentComposerProfile,
  serializeComposerDocument,
  type ContentComposerCase,
} from '../profiles/profiles';
import {
  VISUAL_TEMPLATE_SCHEMA_VERSION,
  type VisualTemplateInput,
  type VisualTemplateKind,
  type VisualTemplateListFilter,
  type VisualTemplateRecord,
  type VisualTemplateStatus,
} from './types';

export const normalizeVisualTemplateName = (name: string) => {
  const trimmed = name.trim();
  return trimmed || 'Untitled';
};

export const createEmptyVisualTemplateDocument = (scope: ContentComposerCase): BuilderDocument => ({
  blocks: getContentComposerProfile(scope).defaultBlocks(),
  base: createBaseProperties(),
});

export const createVisualTemplateRecord = (
  input: VisualTemplateInput,
  existing?: VisualTemplateRecord | null
): VisualTemplateRecord => {
  const now = new Date().toISOString();
  const scope = input.scope;
  const document =
    input.document ||
    (input.html ? parseDocumentFromHtml(input.html) : createEmptyVisualTemplateDocument(scope));
  const serialized =
    input.html && input.plainText !== undefined
      ? { html: input.html, plainText: input.plainText }
      : serializeComposerDocument(scope, document.blocks, document.base);

  return {
    id: input.id || existing?.id || uuidv4(),
    name: normalizeVisualTemplateName(input.name || existing?.name || 'Untitled'),
    scope,
    kind: input.kind || existing?.kind || 'template',
    status: input.status || existing?.status || 'draft',
    html: serialized.html,
    plainText: serialized.plainText,
    document,
    theme: input.theme || existing?.theme || {},
    tags: input.tags || existing?.tags || [],
    metadata: input.metadata || existing?.metadata || {},
    createdAt: existing?.createdAt || now,
    updatedAt: now,
    version: VISUAL_TEMPLATE_SCHEMA_VERSION,
  };
};

export const duplicateVisualTemplateRecord = (
  record: VisualTemplateRecord,
  name = `${record.name} Copy`
): VisualTemplateRecord =>
  createVisualTemplateRecord({
    ...record,
    id: undefined,
    name,
    status: 'draft',
  });

export const filterVisualTemplateRecords = (
  records: VisualTemplateRecord[],
  filter: VisualTemplateListFilter = {}
): VisualTemplateRecord[] => {
  const query = filter.query?.trim().toLowerCase();
  return records
    .filter((record) => !filter.scope || filter.scope === 'all' || record.scope === filter.scope)
    .filter((record) => !filter.kind || filter.kind === 'all' || record.kind === filter.kind)
    .filter((record) => !filter.status || filter.status === 'all' || record.status === filter.status)
    .filter((record) => {
      if (!query) return true;
      return (
        record.name.toLowerCase().includes(query) ||
        record.plainText.toLowerCase().includes(query) ||
        record.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    })
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
};

export const isVisualTemplateKind = (value: unknown): value is VisualTemplateKind =>
  value === 'component' || value === 'template';

export const isVisualTemplateStatus = (value: unknown): value is VisualTemplateStatus =>
  value === 'draft' || value === 'published' || value === 'archived';
